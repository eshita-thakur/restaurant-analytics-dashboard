from app.extensions import db

class Customer(db.Model):
    __tablename__ = "customers"

    customer_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(60), nullable=False)
    last_name = db.Column(db.String(60), nullable=False)
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(20), unique=True)
    address = db.Column(db.String(255))
    loyalty_points = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def __repr__(self):
        return f"<Customer {self.first_name} {self.last_name}>"