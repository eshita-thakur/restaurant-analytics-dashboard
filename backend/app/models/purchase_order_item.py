from app.extensions import db

class PurchaseOrderItem(db.Model):
    __tablename__ = "purchase_order_items"

    po_item_id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey("purchase_orders.po_id"), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.inventory_id"), nullable=False)
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    unit_cost = db.Column(db.Numeric(10, 2), nullable=False)

    purchase_order = db.relationship("PurchaseOrder", backref="items")
    inventory = db.relationship("Inventory")

    def __repr__(self):
        return f"<PurchaseOrderItem po={self.po_id} inv={self.inventory_id}>"