from app.extensions import db

class MenuCategory(db.Model):
    __tablename__ = "menu_categories"

    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))

    def __repr__(self):
        return f"<MenuCategory {self.name}>"