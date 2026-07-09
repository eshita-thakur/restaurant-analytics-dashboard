from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.inventory import Inventory
from app.models.stock_transaction import StockTransaction
from app.models.supplier import Supplier
from app.utils.decorators import role_required

po_bp = Blueprint("purchase_order", __name__, url_prefix="/api/purchase-orders")


def serialize_po(po):
    return {
        "po_id": po.po_id,
        "supplier_id": po.supplier_id,
        "supplier_name": po.supplier.name,
        "order_date": po.order_date.isoformat(),
        "status": po.status,
        "total_amount": float(po.total_amount),
        "items": [
            {
                "po_item_id": item.po_item_id,
                "inventory_id": item.inventory_id,
                "item_name": item.inventory.item_name,
                "quantity": float(item.quantity),
                "unit_cost": float(item.unit_cost)
            }
            for item in po.items
        ]
    }


@po_bp.route("", methods=["GET"])
@role_required("owner", "manager")
def get_purchase_orders():
    orders = PurchaseOrder.query.order_by(PurchaseOrder.order_date.desc()).all()
    return jsonify([serialize_po(po) for po in orders]), 200


@po_bp.route("/<int:po_id>", methods=["GET"])
@role_required("owner", "manager")
def get_purchase_order(po_id):
    po = PurchaseOrder.query.get(po_id)
    if not po:
        return jsonify({"error": "Purchase order not found"}), 404
    return jsonify(serialize_po(po)), 200


@po_bp.route("", methods=["POST"])
@role_required("owner", "manager")
def create_purchase_order():
    data = request.get_json()

    supplier_id = data.get("supplier_id")
    items_data = data.get("items")

    if not supplier_id or not items_data:
        return jsonify({"error": "supplier_id and items are required"}), 400

    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({"error": "Invalid supplier_id"}), 400

    if not isinstance(items_data, list) or len(items_data) == 0:
        return jsonify({"error": "items must be a non-empty list"}), 400

    total_amount = 0
    validated_items = []

    for entry in items_data:
        inventory_id = entry.get("inventory_id")
        quantity = entry.get("quantity")
        unit_cost = entry.get("unit_cost")

        if not inventory_id or not quantity or unit_cost is None:
            return jsonify({"error": "Each item needs inventory_id, quantity and unit_cost"}), 400

        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item:
            return jsonify({"error": f"Invalid inventory_id: {inventory_id}"}), 400

        total_amount += float(quantity) * float(unit_cost)
        validated_items.append((inventory_id, quantity, unit_cost))

    po = PurchaseOrder(
        supplier_id=supplier_id,
        status="draft",
        total_amount=total_amount
    )
    db.session.add(po)
    db.session.flush()  # assigns po.po_id before we use it below, without ending the transaction

    for inventory_id, quantity, unit_cost in validated_items:
        po_item = PurchaseOrderItem(
            po_id=po.po_id,
            inventory_id=inventory_id,
            quantity=quantity,
            unit_cost=unit_cost
        )
        db.session.add(po_item)

    db.session.commit()

    return jsonify({
        "message": "Purchase order created successfully",
        "purchase_order": serialize_po(po)
    }), 201


@po_bp.route("/<int:po_id>/status", methods=["PUT"])
@role_required("owner", "manager")
def update_po_status(po_id):
    po = PurchaseOrder.query.get(po_id)
    if not po:
        return jsonify({"error": "Purchase order not found"}), 404

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ("draft", "ordered", "received", "cancelled"):
        return jsonify({"error": "Invalid status"}), 400

    if po.status == "received":
        return jsonify({"error": "This purchase order has already been received and cannot be changed"}), 400

    if new_status == "received":
        for item in po.items:
            transaction = StockTransaction(
                inventory_id=item.inventory_id,
                transaction_type="in",
                quantity=item.quantity,
                reference_type="purchase_order",
                reference_id=po.po_id
            )
            db.session.add(transaction)

            item.inventory.quantity_in_stock = float(item.inventory.quantity_in_stock) + float(item.quantity)

    po.status = new_status
    db.session.commit()

    return jsonify({
        "message": f"Purchase order marked as {new_status}",
        "purchase_order": serialize_po(po)
    }), 200


@po_bp.route("/<int:po_id>", methods=["DELETE"])
@role_required("owner")
def delete_purchase_order(po_id):
    po = PurchaseOrder.query.get(po_id)
    if not po:
        return jsonify({"error": "Purchase order not found"}), 404

    if po.status == "received":
        return jsonify({"error": "Cannot delete a received purchase order (would break stock history)"}), 400

    db.session.delete(po)
    db.session.commit()
    return jsonify({"message": "Purchase order deleted successfully"}), 200