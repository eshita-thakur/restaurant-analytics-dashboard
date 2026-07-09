from flask import Flask
from config import Config
from app.extensions import db, jwt, cors, bcrypt
from app.models.role import Role
from app.models.user import User
from app.models.menu_category import MenuCategory
from app.models.menu_item import MenuItem
from app.models.customer import Customer
from app.models.employee import Employee
from app.routes.auth_routes import auth_bp
from app.routes.menu_routes import menu_bp
from app.routes.customer_routes import customer_bp
from app.routes.employee_routes import employee_bp

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

    @app.route("/")
    def home():
        return {"message": "Restaurant Analytics API is running"}

    return app