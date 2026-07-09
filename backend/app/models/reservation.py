from app.extensions import db

class Reservation(db.Model):
    __tablename__ = "reservations"

    reservation_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id"), nullable=False)
    table_number = db.Column(db.String(10), nullable=False)
    reservation_time = db.Column(db.DateTime, nullable=False)
    party_size = db.Column(db.Integer, nullable=False)
    status = db.Column(
        db.Enum("booked", "seated", "cancelled", "no_show", name="reservation_status"),
        nullable=False,
        default="booked"
    )

    customer = db.relationship("Customer", backref="reservations")

    def __repr__(self):
        return f"<Reservation {self.reservation_id} - {self.status}>"