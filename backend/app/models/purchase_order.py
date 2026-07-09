from app.extensions import db

class PurchaseOrder(db.Model):
    __tablename__ = "purchase_orders"

    po_id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.supplier_id"), nullable=False)
    order_date = db.Column(db.DateTime, server_default=db.func.now())
    status = db.Column(
        db.Enum("draft", "ordered", "received", "cancelled", name="po_status"),
        nullable=False,
        default="draft"
    )
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)

    supplier = db.relationship("Supplier", backref="purchase_orders")

    def __repr__(self):
        return f"<PurchaseOrder {self.po_id} - {self.status}>"