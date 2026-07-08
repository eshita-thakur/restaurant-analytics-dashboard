from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.customer import Customer

customer_bp = Blueprint("customer", __name__, url_prefix="/api/customers")


@customer_bp.route("", methods=["GET"])
@jwt_required()
def get_customers():
    search = request.args.get("search")

    query = Customer.query
    if search:
        query = query.filter(
            (Customer.first_name.ilike(f"%{search}%")) |
            (Customer.last_name.ilike(f"%{search}%")) |
            (Customer.email.ilike(f"%{search}%")) |
            (Customer.phone.ilike(f"%{search}%"))
        )

    customers = query.all()

    result = [
        {
            "customer_id": c.customer_id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone,
            "address": c.address,
            "loyalty_points": c.loyalty_points
        }
        for c in customers
    ]
    return jsonify(result), 200


@customer_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    return jsonify({
        "customer_id": customer.customer_id,
        "first_name": customer.first_name,
        "last_name": customer.last_name,
        "email": customer.email,
        "phone": customer.phone,
        "address": customer.address,
        "loyalty_points": customer.loyalty_points
    }), 200


@customer_bp.route("", methods=["POST"])
@jwt_required()
def create_customer():
    data = request.get_json()

    first_name = data.get("first_name")
    last_name = data.get("last_name")

    if not first_name or not last_name:
        return jsonify({"error": "first_name and last_name are required"}), 400

    email = data.get("email")
    phone = data.get("phone")

    if email and Customer.query.filter_by(email=email).first():
        return jsonify({"error": "A customer with this email already exists"}), 409

    if phone and Customer.query.filter_by(phone=phone).first():
        return jsonify({"error": "A customer with this phone already exists"}), 409

    customer = Customer(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        address=data.get("address"),
        loyalty_points=data.get("loyalty_points", 0)
    )

    db.session.add(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer created successfully",
        "customer": {
            "customer_id": customer.customer_id,
            "first_name": customer.first_name,
            "last_name": customer.last_name
        }
    }), 201


@customer_bp.route("/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    data = request.get_json()

    customer.first_name = data.get("first_name", customer.first_name)
    customer.last_name = data.get("last_name", customer.last_name)
    customer.email = data.get("email", customer.email)
    customer.phone = data.get("phone", customer.phone)
    customer.address = data.get("address", customer.address)
    customer.loyalty_points = data.get("loyalty_points", customer.loyalty_points)

    db.session.commit()
    return jsonify({"message": "Customer updated successfully"}), 200


@customer_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": "Customer deleted successfully"}), 200