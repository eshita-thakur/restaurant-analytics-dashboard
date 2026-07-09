from app.extensions import db

class Inventory(db.Model):
    __tablename__ = "inventory"

    inventory_id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(120), nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    quantity_in_stock = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    reorder_level = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    unit_cost = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.supplier_id"), nullable=True)

    supplier = db.relationship("Supplier", backref="inventory_items")

    def __repr__(self):
        return f"<Inventory {self.item_name}>"