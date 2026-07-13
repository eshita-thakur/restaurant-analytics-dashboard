from flask import Blueprint, jsonify, request
from app.utils.decorators import role_required
from app.services.analytics_service import (
    get_revenue_summary, get_item_performance, get_inventory_turnover,
    get_sales_growth, get_peak_hours, get_customer_retention,
    get_employee_performance, get_food_waste
)

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.route("/revenue", methods=["GET"])
@role_required("owner", "manager")
def revenue():
    return jsonify(get_revenue_summary()), 200


@analytics_bp.route("/item-performance", methods=["GET"])
@role_required("owner", "manager")
def item_performance():
    limit = request.args.get("limit", default=5, type=int)
    return jsonify(get_item_performance(limit)), 200


@analytics_bp.route("/inventory-turnover", methods=["GET"])
@role_required("owner", "manager")
def inventory_turnover():
    return jsonify(get_inventory_turnover()), 200


@analytics_bp.route("/sales-growth", methods=["GET"])
@role_required("owner", "manager")
def sales_growth():
    return jsonify(get_sales_growth()), 200


@analytics_bp.route("/peak-hours", methods=["GET"])
@role_required("owner", "manager")
def peak_hours():
    return jsonify(get_peak_hours()), 200


@analytics_bp.route("/customer-retention", methods=["GET"])
@role_required("owner", "manager")
def customer_retention():
    return jsonify(get_customer_retention()), 200


@analytics_bp.route("/employee-performance", methods=["GET"])
@role_required("owner", "manager")
def employee_performance():
    return jsonify(get_employee_performance()), 200


@analytics_bp.route("/food-waste", methods=["GET"])
@role_required("owner", "manager")
def food_waste():
    return jsonify(get_food_waste()), 200