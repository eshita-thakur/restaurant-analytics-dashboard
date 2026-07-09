from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User


def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))

            if not user:
                return jsonify({"error": "User not found"}), 404

            if user.role.role_name not in allowed_roles:
                return jsonify({"error": "You do not have permission to perform this action"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator