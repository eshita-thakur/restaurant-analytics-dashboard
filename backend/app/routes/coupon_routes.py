from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import date
from app.extensions import db
from app.models.coupon import Coupon
from app.utils.decorators import role_required

coupon_bp = Blueprint("coupon", __name__, url_prefix="/api/coupons")


def serialize_coupon(c):
    return {
        "coupon_id": c.coupon_id,
        "code": c.code,
        "discount_type": c.discount_type,
        "discount_value": float(c.discount_value),
        "valid_from": c.valid_from.isoformat(),
        "valid_to": c.valid_to.isoformat(),
        "usage_limit": c.usage_limit,
        "times_used": c.times_used,
        "is_active": c.is_active
    }


@coupon_bp.route("", methods=["GET"])
@role_required("owner", "manager")
def get_coupons():
    coupons = Coupon.query.all()
    return jsonify([serialize_coupon(c) for c in coupons]), 200


@coupon_bp.route("", methods=["POST"])
@role_required("owner", "manager")
def create_coupon():
    data = request.get_json()

    code = data.get("code")
    discount_type = data.get("discount_type")
    discount_value = data.get("discount_value")
    valid_from = data.get("valid_from")
    valid_to = data.get("valid_to")

    if not all([code, discount_type, discount_value, valid_from, valid_to]):
        return jsonify({"error": "code, discount_type, discount_value, valid_from and valid_to are required"}), 400

    if discount_type not in ("percentage", "flat"):
        return jsonify({"error": "discount_type must be 'percentage' or 'flat'"}), 400

    if Coupon.query.filter_by(code=code).first():
        return jsonify({"error": "A coupon with this code already exists"}), 409

    coupon = Coupon(
        code=code,
        discount_type=discount_type,
        discount_value=discount_value,
        valid_from=valid_from,
        valid_to=valid_to,
        usage_limit=data.get("usage_limit", 0),
        is_active=data.get("is_active", True)
    )
    db.session.add(coupon)
    db.session.commit()

    return jsonify({
        "message": "Coupon created successfully",
        "coupon": serialize_coupon(coupon)
    }), 201


@coupon_bp.route("/validate/<string:code>", methods=["GET"])
@jwt_required()
def validate_coupon(code):
    coupon = Coupon.query.filter_by(code=code).first()

    if not coupon:
        return jsonify({"valid": False, "reason": "Coupon not found"}), 404

    today = date.today()

    if not coupon.is_active:
        return jsonify({"valid": False, "reason": "Coupon is inactive"}), 200
    if today < coupon.valid_from or today > coupon.valid_to:
        return jsonify({"valid": False, "reason": "Coupon is expired or not yet active"}), 200
    if coupon.usage_limit and coupon.times_used >= coupon.usage_limit:
        return jsonify({"valid": False, "reason": "Coupon usage limit reached"}), 200

    return jsonify({
        "valid": True,
        "coupon": serialize_coupon(coupon)
    }), 200