from app.extensions import db

class Expense(db.Model):
    __tablename__ = "expenses"

    expense_id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(60), nullable=False)
    description = db.Column(db.String(255))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("employees.employee_id"), nullable=True)

    employee = db.relationship("Employee", backref="expenses_created")

    def __repr__(self):
        return f"<Expense {self.category} - {self.amount}>"