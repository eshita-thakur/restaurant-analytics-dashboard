from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.menu_category import MenuCategory
from app.models.menu_item import MenuItem

menu_bp = Blueprint("menu", __name__, url_prefix="/api/menu")


# ---------- CATEGORIES ----------

@menu_bp.route("/categories", methods=["GET"])
def get_categories():
    categories = MenuCategory.query.all()
    result = [
        {"category_id": c.category_id, "name": c.name, "description": c.description}
        for c in categories
    ]
    return jsonify(result), 200


@menu_bp.route("/categories", methods=["POST"])
@jwt_required()
def create_category():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")

    if not name:
        return jsonify({"error": "name is required"}), 400

    existing = MenuCategory.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Category already exists"}), 409

    category = MenuCategory(name=name, description=description)
    db.session.add(category)
    db.session.commit()

    return jsonify({
        "message": "Category created successfully",
        "category": {
            "category_id": category.category_id,
            "name": category.name,
            "description": category.description
        }
    }), 201


@menu_bp.route("/categories/<int:category_id>", methods=["PUT"])
@jwt_required()
def update_category(category_id):
    category = MenuCategory.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404

    data = request.get_json()
    category.name = data.get("name", category.name)
    category.description = data.get("description", category.description)

    db.session.commit()
    return jsonify({"message": "Category updated successfully"}), 200


@menu_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@jwt_required()
def delete_category(category_id):
    category = MenuCategory.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404

    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted successfully"}), 200


# ---------- MENU ITEMS ----------

@menu_bp.route("/items", methods=["GET"])
def get_items():
    category_id = request.args.get("category_id", type=int)

    query = MenuItem.query
    if category_id:
        query = query.filter_by(category_id=category_id)

    items = query.all()

    result = [
        {
            "item_id": i.item_id,
            "name": i.name,
            "description": i.description,
            "price": float(i.price),
            "cost_price": float(i.cost_price),
            "is_available": i.is_available,
            "image_url": i.image_url,
            "category": i.category.name
        }
        for i in items
    ]
    return jsonify(result), 200


@menu_bp.route("/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    item = MenuItem.query.get(item_id)
    if not item:
        return jsonify({"error": "Menu item not found"}), 404

    return jsonify({
        "item_id": item.item_id,
        "name": item.name,
        "description": item.description,
        "price": float(item.price),
        "cost_price": float(item.cost_price),
        "is_available": item.is_available,
        "image_url": item.image_url,
        "category": item.category.name
    }), 200


@menu_bp.route("/items", methods=["POST"])
@jwt_required()
def create_item():
    data = request.get_json()

    name = data.get("name")
    price = data.get("price")
    category_id = data.get("category_id")

    if not name or price is None or not category_id:
        return jsonify({"error": "name, price and category_id are required"}), 400

    category = MenuCategory.query.get(category_id)
    if not category:
        return jsonify({"error": "Invalid category_id"}), 400

    item = MenuItem(
        name=name,
        description=data.get("description"),
        price=price,
        cost_price=data.get("cost_price", 0.00),
        is_available=data.get("is_available", True),
        image_url=data.get("image_url"),
        category_id=category_id
    )

    db.session.add(item)
    db.session.commit()

    return jsonify({
        "message": "Menu item created successfully",
        "item": {
            "item_id": item.item_id,
            "name": item.name,
            "price": float(item.price),
            "category": category.name
        }
    }), 201


@menu_bp.route("/items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_item(item_id):
    item = MenuItem.query.get(item_id)
    if not item:
        return jsonify({"error": "Menu item not found"}), 404

    data = request.get_json()

    item.name = data.get("name", item.name)
    item.description = data.get("description", item.description)
    item.price = data.get("price", item.price)
    item.cost_price = data.get("cost_price", item.cost_price)
    item.is_available = data.get("is_available", item.is_available)
    item.image_url = data.get("image_url", item.image_url)

    if "category_id" in data:
        category = MenuCategory.query.get(data["category_id"])
        if not category:
            return jsonify({"error": "Invalid category_id"}), 400
        item.category_id = data["category_id"]

    db.session.commit()
    return jsonify({"message": "Menu item updated successfully"}), 200


@menu_bp.route("/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    item = MenuItem.query.get(item_id)
    if not item:
        return jsonify({"error": "Menu item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Menu item deleted successfully"}), 200