from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.inventory import Inventory
from app.models.stock_transaction import StockTransaction
from app.utils.decorators import role_required

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


def serialize_inventory(i):
    return {
        "inventory_id": i.inventory_id,
        "item_name": i.item_name,
        "unit": i.unit,
        "quantity_in_stock": float(i.quantity_in_stock),
        "reorder_level": float(i.reorder_level),
        "unit_cost": float(i.unit_cost),
        "supplier_id": i.supplier_id,
        "low_stock": float(i.quantity_in_stock) <= float(i.reorder_level)
    }


@inventory_bp.route("", methods=["GET"])
@role_required("owner", "manager")
def get_inventory():
    low_stock_only = request.args.get("low_stock")

    items = Inventory.query.all()
    result = [serialize_inventory(i) for i in items]

    if low_stock_only == "true":
        result = [i for i in result if i["low_stock"]]

    return jsonify(result), 200


@inventory_bp.route("/<int:inventory_id>", methods=["GET"])
@role_required("owner", "manager")
def get_inventory_item(inventory_id):
    item = Inventory.query.get(inventory_id)
    if not item:
        return jsonify({"error": "Inventory item not found"}), 404
    return jsonify(serialize_inventory(item)), 200


@inventory_bp.route("", methods=["POST"])
@role_required("owner", "manager")
def create_inventory_item():
    data = request.get_json()

    item_name = data.get("item_name")
    unit = data.get("unit")

    if not item_name or not unit:
        return jsonify({"error": "item_name and unit are required"}), 400

    item = Inventory(
        item_name=item_name,
        unit=unit,
        quantity_in_stock=data.get("quantity_in_stock", 0),
        reorder_level=data.get("reorder_level", 0),
        unit_cost=data.get("unit_cost", 0),
        supplier_id=data.get("supplier_id")
    )

    db.session.add(item)
    db.session.commit()

    return jsonify({
        "message": "Inventory item created successfully",
        "item": serialize_inventory(item)
    }), 201


@inventory_bp.route("/<int:inventory_id>", methods=["PUT"])
@role_required("owner", "manager")
def update_inventory_item(inventory_id):
    item = Inventory.query.get(inventory_id)
    if not item:
        return jsonify({"error": "Inventory item not found"}), 404

    data = request.get_json()

    item.item_name = data.get("item_name", item.item_name)
    item.unit = data.get("unit", item.unit)
    item.reorder_level = data.get("reorder_level", item.reorder_level)
    item.unit_cost = data.get("unit_cost", item.unit_cost)
    item.supplier_id = data.get("supplier_id", item.supplier_id)
    # Note: quantity_in_stock is intentionally NOT editable here — use stock-in/stock-out instead

    db.session.commit()
    return jsonify({"message": "Inventory item updated successfully"}), 200


@inventory_bp.route("/<int:inventory_id>", methods=["DELETE"])
@role_required("owner")
def delete_inventory_item(inventory_id):
    item = Inventory.query.get(inventory_id)
    if not item:
        return jsonify({"error": "Inventory item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Inventory item deleted successfully"}), 200


@inventory_bp.route("/<int:inventory_id>/stock-in", methods=["POST"])
@role_required("owner", "manager")
def stock_in(inventory_id):
    item = Inventory.query.get(inventory_id)
    if not item:
        return jsonify({"error": "Inventory item not found"}), 404

    data = request.get_json()
    quantity = data.get("quantity")

    if not quantity or quantity <= 0:
        return jsonify({"error": "quantity must be a positive number"}), 400

    transaction = StockTransaction(
        inventory_id=inventory_id,
        transaction_type="in",
        quantity=quantity,
        reference_type=data.get("reference_type", "manual"),
        reference_id=data.get("reference_id")
    )
    db.session.add(transaction)

    item.quantity_in_stock = float(item.quantity_in_stock) + float(quantity)

    db.session.commit()

    return jsonify({
        "message": "Stock added successfully",
        "item": serialize_inventory(item)
    }), 200


@inventory_bp.route("/<int:inventory_id>/stock-out", methods=["POST"])
@role_required("owner", "manager")
def stock_out(inventory_id):
    item = Inventory.query.get(inventory_id)
    if not item:
        return jsonify({"error": "Inventory item not found"}), 404

    data = request.get_json()
    quantity = data.get("quantity")
    transaction_type = data.get("transaction_type", "out")

    if not quantity or quantity <= 0:
        return jsonify({"error": "quantity must be a positive number"}), 400

    if transaction_type not in ("out", "waste", "adjustment"):
        return jsonify({"error": "transaction_type must be 'out', 'waste' or 'adjustment'"}), 400

    if float(quantity) > float(item.quantity_in_stock):
        return jsonify({"error": "Not enough stock available"}), 400

    transaction = StockTransaction(
        inventory_id=inventory_id,
        transaction_type=transaction_type,
        quantity=quantity,
        reference_type=data.get("reference_type", "manual"),
        reference_id=data.get("reference_id")
    )
    db.session.add(transaction)

    item.quantity_in_stock = float(item.quantity_in_stock) - float(quantity)

    db.session.commit()

    return jsonify({
        "message": "Stock removed successfully",
        "item": serialize_inventory(item)
    }), 200


@inventory_bp.route("/<int:inventory_id>/transactions", methods=["GET"])
@role_required("owner", "manager")
def get_transactions(inventory_id):
    item = Inventory.query.get(inventory_id)
    if not item:
        return jsonify({"error": "Inventory item not found"}), 404

    transactions = StockTransaction.query.filter_by(inventory_id=inventory_id) \
    .order_by(StockTransaction.created_at.desc(), StockTransaction.transaction_id.desc()).all()

    result = [
        {
            "transaction_id": t.transaction_id,
            "transaction_type": t.transaction_type,
            "quantity": float(t.quantity),
            "reference_type": t.reference_type,
            "reference_id": t.reference_id,
            "created_at": t.created_at.isoformat()
        }
        for t in transactions
    ]
    return jsonify(result), 200