from flask import Blueprint, request, send_file
from app.utils.decorators import role_required
from app.services.report_service import generate_sales_report_excel

report_bp = Blueprint("report", __name__, url_prefix="/api/reports")


@report_bp.route("/sales/excel", methods=["GET"])
@role_required("owner", "manager")
def sales_report_excel():
    period = request.args.get("period", default="monthly")
    buffer = generate_sales_report_excel(period)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"sales_report_{period}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )