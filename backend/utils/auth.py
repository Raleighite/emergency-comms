from datetime import datetime, timezone, timedelta
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from backend.models.user import get_user_by_id


def generate_jwt(user_id):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def decode_jwt(token):
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
        return payload["user_id"]
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing authorization token"}), 401

        token = auth_header.split(" ", 1)[1]
        user_id = decode_jwt(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        user = get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 401

        request.current_user = user
        return f(*args, **kwargs)
    return decorated
