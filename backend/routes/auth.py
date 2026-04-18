from flask import Blueprint, request, jsonify, current_app
from backend.models.magic_token import create_magic_token, verify_magic_token
from backend.models.sms_code import create_sms_code, verify_sms_code
from backend.models.user import get_or_create_user, get_user_by_id, get_user_by_phone, create_user
from backend.utils.auth import generate_jwt, login_required
from backend.utils.email import send_magic_link_email
from backend.utils.sms import send_sms, is_twilio_configured

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/magic-link", methods=["POST"])
def send_magic_link():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    token = create_magic_token(email)
    frontend_url = current_app.config["FRONTEND_URL"]
    magic_link = f"{frontend_url}/auth/verify?token={token}"

    send_magic_link_email(email, magic_link)

    return jsonify({"message": "If that email is valid, a login link has been sent."})


@auth_bp.route("/magic-link/verify", methods=["POST"])
def verify_magic_link_route():
    data = request.get_json()
    token = data.get("token", "")
    if not token:
        return jsonify({"error": "Token is required"}), 400

    email = verify_magic_token(token)
    if not email:
        return jsonify({"error": "Invalid or expired token"}), 401

    name = data.get("name", "")
    user = get_or_create_user(email, name)
    jwt_token = generate_jwt(user["_id"])

    return jsonify({
        "token": jwt_token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "is_premium": user.get("is_premium", False),
        },
    })


@auth_bp.route("/sms/send", methods=["POST"])
def send_sms_code():
    if not is_twilio_configured():
        return jsonify({"error": "SMS authentication is not available"}), 503

    data = request.get_json()
    phone = data.get("phone", "").strip()
    if not phone:
        return jsonify({"error": "Phone number is required"}), 400

    code = create_sms_code(phone)
    send_sms(phone, f"Your Emergency Comms login code is: {code}")

    return jsonify({"message": "If that number is valid, a code has been sent."})


@auth_bp.route("/sms/verify", methods=["POST"])
def verify_sms_code_route():
    data = request.get_json()
    phone = data.get("phone", "").strip()
    code = data.get("code", "").strip()
    if not phone or not code:
        return jsonify({"error": "Phone and code are required"}), 400

    if not verify_sms_code(phone, code):
        return jsonify({"error": "Invalid or expired code"}), 401

    user = get_user_by_phone(phone)
    if not user:
        email = data.get("email", "")
        name = data.get("name", "")
        user = create_user(email=email, name=name, phone=phone)

    jwt_token = generate_jwt(user["_id"])
    return jsonify({
        "token": jwt_token,
        "user": {
            "id": str(user["_id"]),
            "email": user.get("email", ""),
            "name": user.get("name", ""),
            "is_premium": user.get("is_premium", False),
        },
    })


@auth_bp.route("/sms/available", methods=["GET"])
def sms_available():
    return jsonify({"available": is_twilio_configured()})


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_me():
    user = request.current_user
    return jsonify({
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "phone": user.get("phone", ""),
        "is_premium": user.get("is_premium", False),
    })
