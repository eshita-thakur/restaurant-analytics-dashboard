from app.extensions import db

class StockTransaction(db.Model):
    __tablename__ = "stock_transactions"

    transaction_id = db.Column(db.Integer, primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.inventory_id"), nullable=False)
    transaction_type = db.Column(
        db.Enum("in", "out", "waste", "adjustment", name="transaction_type"),
        nullable=False
    )
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    reference_type = db.Column(db.String(30))
    reference_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    inventory = db.relationship("Inventory", backref="transactions")

    def __repr__(self):
        return f"<StockTransaction {self.transaction_type} {self.quantity}>"