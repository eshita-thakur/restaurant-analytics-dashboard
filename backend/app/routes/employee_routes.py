from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.employee import Employee
from app.utils.decorators import role_required

employee_bp = Blueprint("employee", __name__, url_prefix="/api/employees")


def serialize_employee(e):
    return {
        "employee_id": e.employee_id,
        "first_name": e.first_name,
        "last_name": e.last_name,
        "phone": e.phone,
        "position": e.position,
        "salary": float(e.salary),
        "hire_date": e.hire_date.isoformat(),
        "status": e.status,
        "linked_user_id": e.user_id
    }


@employee_bp.route("", methods=["GET"])
@role_required("owner", "manager")
def get_employees():
    employees = Employee.query.all()
    return jsonify([serialize_employee(e) for e in employees]), 200


@employee_bp.route("/<int:employee_id>", methods=["GET"])
@role_required("owner", "manager")
def get_employee(employee_id):
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    return jsonify(serialize_employee(employee)), 200


@employee_bp.route("", methods=["POST"])
@role_required("owner", "manager")
def create_employee():
    data = request.get_json()

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    position = data.get("position")
    hire_date = data.get("hire_date")

    if not first_name or not last_name or not position or not hire_date:
        return jsonify({"error": "first_name, last_name, position and hire_date are required"}), 400

    employee = Employee(
        first_name=first_name,
        last_name=last_name,
        phone=data.get("phone"),
        position=position,
        salary=data.get("salary", 0.00),
        hire_date=hire_date,
        status=data.get("status", "active"),
        user_id=data.get("user_id")
    )

    db.session.add(employee)
    db.session.commit()

    return jsonify({
        "message": "Employee created successfully",
        "employee": serialize_employee(employee)
    }), 201


@employee_bp.route("/<int:employee_id>", methods=["PUT"])
@role_required("owner", "manager")
def update_employee(employee_id):
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json()

    employee.first_name = data.get("first_name", employee.first_name)
    employee.last_name = data.get("last_name", employee.last_name)
    employee.phone = data.get("phone", employee.phone)
    employee.position = data.get("position", employee.position)
    employee.salary = data.get("salary", employee.salary)
    employee.status = data.get("status", employee.status)
    employee.user_id = data.get("user_id", employee.user_id)

    db.session.commit()
    return jsonify({"message": "Employee updated successfully"}), 200


@employee_bp.route("/<int:employee_id>", methods=["DELETE"])
@role_required("owner")
def delete_employee(employee_id):
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    db.session.delete(employee)
    db.session.commit()
    return jsonify({"message": "Employee deleted successfully"}), 200