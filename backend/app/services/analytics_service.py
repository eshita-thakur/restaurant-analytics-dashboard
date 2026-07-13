import pandas as pd
from app.extensions import db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.menu_item import MenuItem
from app.models.inventory import Inventory
from app.models.stock_transaction import StockTransaction


def _orders_dataframe(start_date=None, end_date=None):
    query = db.session.query(
        Order.order_id,
        Order.order_date,
        Order.total_amount,
        Order.status
    ).filter(Order.status != "cancelled")

    if start_date:
        query = query.filter(Order.order_date >= start_date)
    if end_date:
        query = query.filter(Order.order_date <= end_date)

    rows = query.all()

    df = pd.DataFrame(rows, columns=["order_id", "order_date", "total_amount", "status"])

    if df.empty:
        return df

    df["order_date"] = pd.to_datetime(df["order_date"])
    df["total_amount"] = df["total_amount"].astype(float)
    return df


def get_revenue_summary():
    df = _orders_dataframe()

    if df.empty:
        return {
            "daily": [],
            "monthly": [],
            "yearly": [],
            "total_revenue": 0,
            "total_orders": 0,
            "average_order_value": 0,
        }

    daily = (
        df.groupby(df["order_date"].dt.date)["total_amount"]
        .sum()
        .reset_index()
        .rename(columns={"order_date": "date", "total_amount": "revenue"})
    )

    monthly = (
        df.groupby(df["order_date"].dt.to_period("M"))["total_amount"]
        .sum()
        .reset_index()
        .rename(columns={"order_date": "month", "total_amount": "revenue"})
    )
    monthly["month"] = monthly["month"].astype(str)

    yearly = (
        df.groupby(df["order_date"].dt.year)["total_amount"]
        .sum()
        .reset_index()
        .rename(columns={"order_date": "year", "total_amount": "revenue"})
    )

    return {
        "daily": [
            {"date": str(row["date"]), "revenue": round(row["revenue"], 2)}
            for _, row in daily.iterrows()
        ],
        "monthly": [
            {"month": row["month"], "revenue": round(row["revenue"], 2)}
            for _, row in monthly.iterrows()
        ],
        "yearly": [
            {"year": int(row["year"]), "revenue": round(row["revenue"], 2)}
            for _, row in yearly.iterrows()
        ],
        "total_revenue": round(df["total_amount"].sum(), 2),
        "total_orders": int(len(df)),
        "average_order_value": round(df["total_amount"].mean(), 2),
    }


def get_item_performance(limit=5):
    rows = (
        db.session.query(
            OrderItem.item_id,
            MenuItem.name,
            OrderItem.quantity,
            OrderItem.unit_price,
            Order.status
        )
        .join(Order, Order.order_id == OrderItem.order_id)
        .join(MenuItem, MenuItem.item_id == OrderItem.item_id)
        .filter(Order.status != "cancelled")
        .all()
    )

    df = pd.DataFrame(rows, columns=["item_id", "name", "quantity", "unit_price", "status"])

    if df.empty:
        return {"top_selling": [], "least_selling": []}

    df["quantity"] = df["quantity"].astype(int)
    df["unit_price"] = df["unit_price"].astype(float)
    df["revenue"] = df["quantity"] * df["unit_price"]

    summary = (
        df.groupby(["item_id", "name"])
        .agg(total_quantity=("quantity", "sum"), total_revenue=("revenue", "sum"))
        .reset_index()
        .sort_values("total_quantity", ascending=False)
    )

    top = summary.head(limit)
    least = summary.tail(limit).sort_values("total_quantity")

    def to_records(sub_df):
        return [
            {
                "item_id": int(row["item_id"]),
                "name": row["name"],
                "total_quantity": int(row["total_quantity"]),
                "total_revenue": round(row["total_revenue"], 2),
            }
            for _, row in sub_df.iterrows()
        ]

    return {
        "top_selling": to_records(top),
        "least_selling": to_records(least),
    }


def get_inventory_turnover():
    rows = (
        db.session.query(
            Inventory.inventory_id,
            Inventory.item_name,
            Inventory.quantity_in_stock,
            Inventory.unit,
            StockTransaction.transaction_type,
            StockTransaction.quantity
        )
        .join(StockTransaction, StockTransaction.inventory_id == Inventory.inventory_id, isouter=True)
        .all()
    )

    df = pd.DataFrame(rows, columns=[
        "inventory_id", "item_name", "quantity_in_stock", "unit", "transaction_type", "quantity"
    ])

    if df.empty:
        return {"items": []}

    df["quantity_in_stock"] = df["quantity_in_stock"].astype(float)
    df["quantity"] = df["quantity"].fillna(0).astype(float)

    used = (
        df[df["transaction_type"].isin(["out", "waste"])]
        .groupby(["inventory_id", "item_name", "unit", "quantity_in_stock"])["quantity"]
        .sum()
        .reset_index()
        .rename(columns={"quantity": "total_used"})
    )

    all_items = (
        df[["inventory_id", "item_name", "unit", "quantity_in_stock"]]
        .drop_duplicates()
        .merge(used[["inventory_id", "total_used"]], on="inventory_id", how="left")
    )
    all_items["total_used"] = all_items["total_used"].fillna(0)

    def turnover_rate(row):
        if row["quantity_in_stock"] == 0:
            return 0
        return round(row["total_used"] / row["quantity_in_stock"], 2)

    all_items["turnover_rate"] = all_items.apply(turnover_rate, axis=1)
    all_items = all_items.sort_values("turnover_rate", ascending=False)

    return {
        "items": [
            {
                "inventory_id": int(row["inventory_id"]),
                "item_name": row["item_name"],
                "unit": row["unit"],
                "current_stock": row["quantity_in_stock"],
                "total_used": row["total_used"],
                "turnover_rate": row["turnover_rate"],
            }
            for _, row in all_items.iterrows()
        ]
    }