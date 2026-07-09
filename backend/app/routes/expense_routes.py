from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.expense import Expense
from app.utils.decorators import role_required

expense_bp = Blueprint("expense", __name__, url_prefix="/api/expenses")


def serialize_expense(e):
    return {
        "expense_id": e.expense_id,
        "category": e.category,
        "description": e.description,
        "amount": float(e.amount),
        "expense_date": e.expense_date.isoformat(),
        "created_by": e.created_by
    }


@expense_bp.route("", methods=["GET"])
@role_required("owner", "manager")
def get_expenses():
    category = request.args.get("category")

    query = Expense.query
    if category:
        query = query.filter_by(category=category)

    expenses = query.order_by(Expense.expense_date.desc()).all()
    return jsonify([serialize_expense(e) for e in expenses]), 200


@expense_bp.route("", methods=["POST"])
@role_required("owner", "manager")
def create_expense():
    data = request.get_json()

    category = data.get("category")
    amount = data.get("amount")
    expense_date = data.get("expense_date")

    if not category or not amount or not expense_date:
        return jsonify({"error": "category, amount and expense_date are required"}), 400

    expense = Expense(
        category=category,
        description=data.get("description"),
        amount=amount,
        expense_date=expense_date,
        created_by=data.get("created_by")
    )
    db.session.add(expense)
    db.session.commit()

    return jsonify({
        "message": "Expense recorded successfully",
        "expense": serialize_expense(expense)
    }), 201


@expense_bp.route("/<int:expense_id>", methods=["DELETE"])
@role_required("owner")
def delete_expense(expense_id):
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    db.session.delete(expense)
    db.session.commit()
    return jsonify({"message": "Expense deleted successfully"}), 200