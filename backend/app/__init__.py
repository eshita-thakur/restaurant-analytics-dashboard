from flask import Flask
from config import Config
from app.extensions import db, jwt, cors, bcrypt

from app.models.role import Role
from app.models.user import User
from app.models.menu_category import MenuCategory
from app.models.menu_item import MenuItem
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.supplier import Supplier
from app.models.inventory import Inventory
from app.models.stock_transaction import StockTransaction
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.feedback import Feedback
from app.models.coupon import Coupon
from app.models.expense import Expense

from app.routes.auth_routes import auth_bp
from app.routes.menu_routes import menu_bp
from app.routes.customer_routes import customer_bp
from app.routes.employee_routes import employee_bp
from app.routes.inventory_routes import inventory_bp
from app.routes.supplier_routes import supplier_bp
from app.routes.purchase_order_routes import po_bp
from app.routes.order_routes import order_bp
from app.routes.payment_routes import payment_bp
from app.routes.reservation_routes import reservation_bp
from app.routes.feedback_routes import feedback_bp
from app.routes.coupon_routes import coupon_bp
from app.routes.expense_routes import expense_bp
from app.routes.analytics_routes import analytics_bp
from app.routes.report_routes import report_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    bcrypt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(menu_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(employee_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(supplier_bp)
    app.register_blueprint(po_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(reservation_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(coupon_bp)
    app.register_blueprint(expense_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(report_bp)
    @app.route("/")
    def home():
        return {"message": "Restaurant Analytics API is running"}

    return app