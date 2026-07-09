from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.menu_item import MenuItem
from app.models.customer import Customer
from app.models.employee import Employee

order_bp = Blueprint("order", __name__, url_prefix="/api/orders")


def serialize_order(order):
    return {
        "order_id": order.order_id,
        "customer_id": order.customer_id,
        "customer_name": f"{order.customer.first_name} {order.customer.last_name}" if order.customer else None,
        "employee_id": order.employee_id,
        "employee_name": f"{order.employee.first_name} {order.employee.last_name}",
        "order_type": order.order_type,
        "status": order.status,
        "table_number": order.table_number,
        "order_date": order.order_date.isoformat(),
        "total_amount": float(order.total_amount),
        "items": [
            {
                "order_item_id": i.order_item_id,
                "item_id": i.item_id,
                "item_name": i.menu_item.name,
                "quantity": i.quantity,
                "unit_price": float(i.unit_price),
                "subtotal": float(i.unit_price) * i.quantity
            }
            for i in order.items
        ]
    }


@order_bp.route("", methods=["GET"])
@jwt_required()
def get_orders():
    status = request.args.get("status")
    customer_id = request.args.get("customer_id", type=int)

    query = Order.query
    if status:
        query = query.filter_by(status=status)
    if customer_id:
        query = query.filter_by(customer_id=customer_id)

    orders = query.order_by(Order.order_date.desc()).all()
    return jsonify([serialize_order(o) for o in orders]), 200


@order_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(serialize_order(order)), 200


@order_bp.route("", methods=["POST"])
@jwt_required()
def create_order():
    data = request.get_json()

    employee_id = data.get("employee_id")
    items_data = data.get("items")

    if not employee_id or not items_data:
        return jsonify({"error": "employee_id and items are required"}), 400

    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"error": "Invalid employee_id"}), 400

    customer_id = data.get("customer_id")
    if customer_id and not Customer.query.get(customer_id):
        return jsonify({"error": "Invalid customer_id"}), 400

    if not isinstance(items_data, list) or len(items_data) == 0:
        return jsonify({"error": "items must be a non-empty list"}), 400

    total_amount = 0
    validated_items = []

    for entry in items_data:
        item_id = entry.get("item_id")
        quantity = entry.get("quantity")

        if not item_id or not quantity or quantity <= 0:
            return jsonify({"error": "Each item needs a valid item_id and quantity"}), 400

        menu_item = MenuItem.query.get(item_id)
        if not menu_item:
            return jsonify({"error": f"Invalid item_id: {item_id}"}), 400

        if not menu_item.is_available:
            return jsonify({"error": f"'{menu_item.name}' is currently unavailable"}), 400

        unit_price = float(menu_item.price)
        total_amount += unit_price * quantity
        validated_items.append((item_id, quantity, unit_price))

    order = Order(
        customer_id=customer_id,
        employee_id=employee_id,
        order_type=data.get("order_type", "dine_in"),
        table_number=data.get("table_number"),
        status="pending",
        total_amount=total_amount
    )
    db.session.add(order)
    db.session.flush()

    for item_id, quantity, unit_price in validated_items:
        order_item = OrderItem(
            order_id=order.order_id,
            item_id=item_id,
            quantity=quantity,
            unit_price=unit_price
        )
        db.session.add(order_item)

    db.session.commit()

    return jsonify({
        "message": "Order created successfully",
        "order": serialize_order(order)
    }), 201


@order_bp.route("/<int:order_id>/status", methods=["PUT"])
@jwt_required()
def update_order_status(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    data = request.get_json()
    new_status = data.get("status")

    valid_statuses = ("pending", "preparing", "served", "completed", "cancelled")
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400

    if order.status in ("completed", "cancelled"):
        return jsonify({"error": f"Order is already {order.status} and cannot be changed"}), 400

    order.status = new_status
    db.session.commit()

    return jsonify({
        "message": f"Order marked as {new_status}",
        "order": serialize_order(order)
    }), 200