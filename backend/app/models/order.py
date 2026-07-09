from app.extensions import db

class Order(db.Model):
    __tablename__ = "orders"

    order_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id"), nullable=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.employee_id"), nullable=False)
    coupon_id = db.Column(db.Integer, nullable=True)
    order_type = db.Column(
        db.Enum("dine_in", "takeaway", "delivery", name="order_type"),
        nullable=False,
        default="dine_in"
    )
    status = db.Column(
        db.Enum("pending", "preparing", "served", "completed", "cancelled", name="order_status"),
        nullable=False,
        default="pending"
    )
    table_number = db.Column(db.String(10))
    order_date = db.Column(db.DateTime, server_default=db.func.now())
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)

    customer = db.relationship("Customer", backref="orders")
    employee = db.relationship("Employee", backref="orders")

    def __repr__(self):
        return f"<Order {self.order_id} - {self.status}>"