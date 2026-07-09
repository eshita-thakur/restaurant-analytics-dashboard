from app.extensions import db

class Employee(db.Model):
    __tablename__ = "employees"

    employee_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)
    first_name = db.Column(db.String(60), nullable=False)
    last_name = db.Column(db.String(60), nullable=False)
    phone = db.Column(db.String(20))
    position = db.Column(db.String(60), nullable=False)
    salary = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    hire_date = db.Column(db.Date, nullable=False)
    status = db.Column(
        db.Enum("active", "on_leave", "terminated", name="employee_status"),
        nullable=False,
        default="active"
    )

    user = db.relationship("User", backref="employee", uselist=False)

    def __repr__(self):
        return f"<Employee {self.first_name} {self.last_name}>"