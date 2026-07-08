from app.extensions import db

class MenuItem(db.Model):
    __tablename__ = "menu_items"

    item_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("menu_categories.category_id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2), nullable=False)
    cost_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    is_available = db.Column(db.Boolean, default=True, nullable=False)
    image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    category = db.relationship("MenuCategory", backref="items")

    def __repr__(self):
        return f"<MenuItem {self.name}>"