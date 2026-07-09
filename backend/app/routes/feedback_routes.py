from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.feedback import Feedback
from app.models.customer import Customer
from app.models.order import Order

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/feedback")


def serialize_feedback(f):
    return {
        "feedback_id": f.feedback_id,
        "customer_id": f.customer_id,
        "customer_name": f"{f.customer.first_name} {f.customer.last_name}",
        "order_id": f.order_id,
        "rating": f.rating,
        "comment": f.comment,
        "created_at": f.created_at.isoformat()
    }


@feedback_bp.route("", methods=["GET"])
@jwt_required()
def get_feedback():
    feedback_entries = Feedback.query.order_by(Feedback.created_at.desc()).all()
    return jsonify([serialize_feedback(f) for f in feedback_entries]), 200


@feedback_bp.route("", methods=["POST"])
def create_feedback():
    data = request.get_json()

    customer_id = data.get("customer_id")
    rating = data.get("rating")

    if not customer_id or rating is None:
        return jsonify({"error": "customer_id and rating are required"}), 400

    if not Customer.query.get(customer_id):
        return jsonify({"error": "Invalid customer_id"}), 400

    if not (1 <= int(rating) <= 5):
        return jsonify({"error": "rating must be between 1 and 5"}), 400

    order_id = data.get("order_id")
    if order_id and not Order.query.get(order_id):
        return jsonify({"error": "Invalid order_id"}), 400

    feedback = Feedback(
        customer_id=customer_id,
        order_id=order_id,
        rating=rating,
        comment=data.get("comment")
    )
    db.session.add(feedback)
    db.session.commit()

    return jsonify({
        "message": "Feedback submitted successfully",
        "feedback": serialize_feedback(feedback)
    }), 201