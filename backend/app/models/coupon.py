from app.extensions import db

class Coupon(db.Model):
    __tablename__ = "coupons"

    coupon_id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(30), unique=True, nullable=False)
    discount_type = db.Column(db.Enum("percentage", "flat", name="discount_type"), nullable=False)
    discount_value = db.Column(db.Numeric(10, 2), nullable=False)
    valid_from = db.Column(db.Date, nullable=False)
    valid_to = db.Column(db.Date, nullable=False)
    usage_limit = db.Column(db.Integer, nullable=False, default=0)
    times_used = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def __repr__(self):
        return f"<Coupon {self.code}>"