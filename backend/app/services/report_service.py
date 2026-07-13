import io
import pandas as pd
from app.services.analytics_service import _orders_dataframe


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