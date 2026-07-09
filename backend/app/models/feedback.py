from app.extensions import db

class Feedback(db.Model):
    __tablename__ = "feedback"

    feedback_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id"), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id"), nullable=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    customer = db.relationship("Customer", backref="feedback_entries")
    order = db.relationship("Order", backref="feedback_entries")

    def __repr__(self):
        return f"<Feedback {self.feedback_id} - {self.rating}★>"