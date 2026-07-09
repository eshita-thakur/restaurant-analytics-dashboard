from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from app.extensions import db
from app.models.reservation import Reservation
from app.models.customer import Customer

reservation_bp = Blueprint("reservation", __name__, url_prefix="/api/reservations")


def serialize_reservation(r):
    return {
        "reservation_id": r.reservation_id,
        "customer_id": r.customer_id,
        "customer_name": f"{r.customer.first_name} {r.customer.last_name}",
        "table_number": r.table_number,
        "reservation_time": r.reservation_time.isoformat(),
        "party_size": r.party_size,
        "status": r.status
    }


@reservation_bp.route("", methods=["GET"])
@jwt_required()
def get_reservations():
    date_filter = request.args.get("date")  # e.g. "2026-07-10"

    query = Reservation.query
    if date_filter:
        try:
            day = datetime.strptime(date_filter, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400
        query = query.filter(db.func.date(Reservation.reservation_time) == day)

    reservations = query.order_by(Reservation.reservation_time).all()
    return jsonify([serialize_reservation(r) for r in reservations]), 200


@reservation_bp.route("", methods=["POST"])
@jwt_required()
def create_reservation():
    data = request.get_json()

    customer_id = data.get("customer_id")
    table_number = data.get("table_number")
    reservation_time = data.get("reservation_time")
    party_size = data.get("party_size")

    if not all([customer_id, table_number, reservation_time, party_size]):
        return jsonify({"error": "customer_id, table_number, reservation_time and party_size are required"}), 400

    if not Customer.query.get(customer_id):
        return jsonify({"error": "Invalid customer_id"}), 400

    try:
        parsed_time = datetime.fromisoformat(reservation_time)
    except ValueError:
        return jsonify({"error": "reservation_time must be in ISO format, e.g. 2026-07-10T19:30:00"}), 400

    reservation = Reservation(
        customer_id=customer_id,
        table_number=table_number,
        reservation_time=parsed_time,
        party_size=party_size,
        status="booked"
    )
    db.session.add(reservation)
    db.session.commit()

    return jsonify({
        "message": "Reservation created successfully",
        "reservation": serialize_reservation(reservation)
    }), 201


@reservation_bp.route("/<int:reservation_id>/status", methods=["PUT"])
@jwt_required()
def update_reservation_status(reservation_id):
    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({"error": "Reservation not found"}), 404

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ("booked", "seated", "cancelled", "no_show"):
        return jsonify({"error": "Invalid status"}), 400

    reservation.status = new_status
    db.session.commit()

    return jsonify({"message": f"Reservation marked as {new_status}"}), 200