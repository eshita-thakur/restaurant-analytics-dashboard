from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.supplier import Supplier
from app.utils.decorators import role_required

supplier_bp = Blueprint("supplier", __name__, url_prefix="/api/suppliers")


def serialize_supplier(s):
    return {
        "supplier_id": s.supplier_id,
        "name": s.name,
        "contact_person": s.contact_person,
        "phone": s.phone,
        "email": s.email,
        "address": s.address
    }


@supplier_bp.route("", methods=["GET"])
@role_required("owner", "manager")
def get_suppliers():
    suppliers = Supplier.query.all()
    return jsonify([serialize_supplier(s) for s in suppliers]), 200


@supplier_bp.route("/<int:supplier_id>", methods=["GET"])
@role_required("owner", "manager")
def get_supplier(supplier_id):
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404
    return jsonify(serialize_supplier(supplier)), 200


@supplier_bp.route("", methods=["POST"])
@role_required("owner", "manager")
def create_supplier():
    data = request.get_json()

    name = data.get("name")
    if not name:
        return jsonify({"error": "name is required"}), 400

    supplier = Supplier(
        name=name,
        contact_person=data.get("contact_person"),
        phone=data.get("phone"),
        email=data.get("email"),
        address=data.get("address")
    )

    db.session.add(supplier)
    db.session.commit()

    return jsonify({
        "message": "Supplier created successfully",
        "supplier": serialize_supplier(supplier)
    }), 201


@supplier_bp.route("/<int:supplier_id>", methods=["PUT"])
@role_required("owner", "manager")
def update_supplier(supplier_id):
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404

    data = request.get_json()

    supplier.name = data.get("name", supplier.name)
    supplier.contact_person = data.get("contact_person", supplier.contact_person)
    supplier.phone = data.get("phone", supplier.phone)
    supplier.email = data.get("email", supplier.email)
    supplier.address = data.get("address", supplier.address)

    db.session.commit()
    return jsonify({"message": "Supplier updated successfully"}), 200


@supplier_bp.route("/<int:supplier_id>", methods=["DELETE"])
@role_required("owner")
def delete_supplier(supplier_id):
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404

    db.session.delete(supplier)
    db.session.commit()
    return jsonify({"message": "Supplier deleted successfully"}), 200