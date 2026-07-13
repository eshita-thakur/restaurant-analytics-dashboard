from flask import Blueprint, jsonify, request
from app.utils.decorators import role_required
from app.services.analytics_service import get_revenue_summary, get_item_performance, get_inventory_turnover

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