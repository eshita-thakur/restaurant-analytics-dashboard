from app.extensions import db

class Payment(db.Model):
    __tablename__ = "payments"

    payment_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id"), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(
        db.Enum("cash", "card", "upi", "wallet", name="payment_method"),
        nullable=False
    )
    payment_status = db.Column(
        db.Enum("pending", "success", "failed", "refunded", name="payment_status"),
        nullable=False,
        default="pending"
    )
    transaction_ref = db.Column(db.String(100))
    paid_at = db.Column(db.DateTime, server_default=db.func.now())

    order = db.relationship("Order", backref="payments")

    def __repr__(self):
        return f"<Payment {self.payment_id} - {self.payment_status}>"