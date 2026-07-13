from flask import Blueprint, request, send_file
from app.utils.decorators import role_required
from app.services.report_service import generate_sales_report_excel, generate_profit_report_pdf

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


@report_bp.route("/profit/pdf", methods=["GET"])
@role_required("owner", "manager")
def profit_report_pdf():
    buffer = generate_profit_report_pdf()

    return send_file(
        buffer,
        as_attachment=True,
        download_name="profit_report.pdf",
        mimetype="application/pdf"
    )