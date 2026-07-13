import io
import pandas as pd
from app.services.analytics_service import _orders_dataframe
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from app.extensions import db
from app.models.expense import Expense

def generate_sales_report_excel(period="monthly"):
    df = _orders_dataframe()

    if df.empty:
        df_out = pd.DataFrame(columns=["period", "revenue", "order_count"])
    else:
        if period == "daily":
            grouped = df.groupby(df["order_date"].dt.date)
        elif period == "weekly":
            grouped = df.groupby(df["order_date"].dt.to_period("W").astype(str))
        else:
            grouped = df.groupby(df["order_date"].dt.to_period("M").astype(str))

        df_out = (
            grouped.agg(revenue=("total_amount", "sum"), order_count=("order_id", "count"))
            .reset_index()
            .rename(columns={"order_date": "period"})
        )
        df_out.columns = ["period", "revenue", "order_count"]
        df_out["revenue"] = df_out["revenue"].round(2)

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df_out.to_excel(writer, index=False, sheet_name="Sales Report")

    buffer.seek(0)
    return buffer
def generate_profit_report_pdf():
    orders_df = _orders_dataframe()

    expense_rows = db.session.query(Expense.expense_date, Expense.amount).all()
    expenses_df = pd.DataFrame(expense_rows, columns=["expense_date", "amount"])

    total_revenue = orders_df["total_amount"].sum() if not orders_df.empty else 0
    total_expenses = expenses_df["amount"].astype(float).sum() if not expenses_df.empty else 0
    net_profit = total_revenue - total_expenses

    # --- Build a chart image with Matplotlib ---
    fig, ax = plt.subplots(figsize=(6, 3))
    ax.bar(["Revenue", "Expenses", "Net Profit"], [total_revenue, total_expenses, net_profit],
           color=["#9FC9E8", "#E8A9C4", "#B79FDB"])
    ax.set_title("Revenue vs Expenses vs Profit")
    ax.set_ylabel("Amount (₹)")
    fig.tight_layout()

    chart_buffer = io.BytesIO()
    fig.savefig(chart_buffer, format="png", dpi=150)
    plt.close(fig)
    chart_buffer.seek(0)

    # --- Build the PDF document ---
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Profit Report", styles["Title"]))
    elements.append(Spacer(1, 12))

    summary_data = [
        ["Metric", "Amount (₹)"],
        ["Total Revenue", f"{total_revenue:,.2f}"],
        ["Total Expenses", f"{total_expenses:,.2f}"],
        ["Net Profit", f"{net_profit:,.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[250, 150])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B2340")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F6F1E7")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    elements.append(Image(chart_buffer, width=5.5 * inch, height=2.75 * inch))

    doc.build(elements)
    pdf_buffer.seek(0)
    return pdf_buffer