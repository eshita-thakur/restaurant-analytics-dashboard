from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.payment import Payment
from app.models.order import Order

payment_bp = Blueprint("payment", __name__, url_prefix="/api/payments")


def serialize_payment(p):
    return {
        "payment_id": p.payment_id,
        "order_id": p.order_id,
        "amount": float(p.amount),
        "payment_method": p.payment_method,
        "payment_status": p.payment_status,
        "transaction_ref": p.transaction_ref,
        "paid_at": p.paid_at.isoformat()
    }


def total_paid_for_order(order_id):
    successful_payments = Payment.query.filter_by(order_id=order_id, payment_status="success").all()
    return sum(float(p.amount) for p in successful_payments)


@payment_bp.route("/order/<int:order_id>", methods=["GET"])
@jwt_required()
def get_payments_for_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    payments = Payment.query.filter_by(order_id=order_id).order_by(Payment.paid_at.desc()).all()

    return jsonify({
        "order_id": order_id,
        "order_total": float(order.total_amount),
        "total_paid": total_paid_for_order(order_id),
        "balance_due": float(order.total_amount) - total_paid_for_order(order_id),
        "payments": [serialize_payment(p) for p in payments]
    }), 200


@payment_bp.route("", methods=["POST"])
@jwt_required()
def create_payment():
    data = request.get_json()

    order_id = data.get("order_id")
    amount = data.get("amount")
    payment_method = data.get("payment_method")

    if not order_id or not amount or not payment_method:
        return jsonify({"error": "order_id, amount and payment_method are required"}), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Invalid order_id"}), 400

    if order.status == "cancelled":
        return jsonify({"error": "Cannot record a payment for a cancelled order"}), 400

    if payment_method not in ("cash", "card", "upi", "wallet"):
        return jsonify({"error": "Invalid payment_method"}), 400

    already_paid = total_paid_for_order(order_id)
    remaining = float(order.total_amount) - already_paid

    if float(amount) > remaining:
        return jsonify({
            "error": f"Amount exceeds remaining balance. Remaining balance is {remaining:.2f}"
        }), 400

    payment = Payment(
        order_id=order_id,
        amount=amount,
        payment_method=payment_method,
        payment_status=data.get("payment_status", "success"),
        transaction_ref=data.get("transaction_ref")
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "message": "Payment recorded successfully",
        "payment": serialize_payment(payment),
        "balance_due": remaining - float(amount) if payment.payment_status == "success" else remaining
    }), 201


@payment_bp.route("/<int:payment_id>/refund", methods=["PUT"])
@jwt_required()
def refund_payment(payment_id):
    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({"error": "Payment not found"}), 404

    if payment.payment_status != "success":
        return jsonify({"error": "Only successful payments can be refunded"}), 400

    payment.payment_status = "refunded"
    db.session.commit()

    return jsonify({
        "message": "Payment refunded successfully",
        "payment": serialize_payment(payment)
    }), 200