from flask import Blueprint, request, jsonify
from backend.models.event import (
    create_event,
    get_event_by_access_code,
    get_events_by_user,
    transfer_primary_contact,
)
from backend.models.update import create_update, get_updates_for_event
from backend.models.subscriber import add_subscriber, get_subscribers, remove_subscriber
from backend.models.user import get_user_by_email, get_user_by_id
from backend.utils.auth import login_required
from backend.utils.sms import send_sms, is_twilio_configured

events_bp = Blueprint("events", __name__)


def _serialize_event(event, include_updates=False):
    result = {
        "id": str(event["_id"]),
        "name": event["name"],
        "description": event.get("description", ""),
        "access_code": event["access_code"],
        "primary_contact_id": str(event["primary_contact_id"]),
        "created_at": event["created_at"].isoformat(),
    }
    primary = get_user_by_id(event["primary_contact_id"])
    if primary:
        result["primary_contact_name"] = primary.get("name", primary.get("email", ""))

    if include_updates:
        updates = get_updates_for_event(event["_id"])
        result["updates"] = []
        for u in updates:
            author = get_user_by_id(u["author_id"])
            result["updates"].append({
                "id": str(u["_id"]),
                "message": u["message"],
                "author_name": author.get("name", author.get("email", "")) if author else "Unknown",
                "created_at": u["created_at"].isoformat(),
            })

    return result


@events_bp.route("", methods=["POST"])
@login_required
def create_event_route():
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Event name is required"}), 400

    description = data.get("description", "").strip()
    user = request.current_user
    event = create_event(name, description, user["_id"])

    return jsonify(_serialize_event(event)), 201


@events_bp.route("", methods=["GET"])
@login_required
def list_events():
    user = request.current_user
    events = get_events_by_user(user["_id"])
    return jsonify([_serialize_event(e) for e in events])


@events_bp.route("/<access_code>", methods=["GET"])
def get_event(access_code):
    event = get_event_by_access_code(access_code)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    return jsonify(_serialize_event(event, include_updates=True))


@events_bp.route("/<access_code>/updates", methods=["POST"])
@login_required
def post_update(access_code):
    event = get_event_by_access_code(access_code)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    user = request.current_user
    if event["primary_contact_id"] != user["_id"]:
        return jsonify({"error": "Only the primary contact can post updates"}), 403

    data = request.get_json()
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"error": "Message is required"}), 400

    update = create_update(event["_id"], user["_id"], message)

    # SMS notification to subscribers (premium)
    if user.get("is_premium") and is_twilio_configured():
        subscribers = get_subscribers(event["_id"])
        for sub in subscribers:
            sms_msg = f"Update on {event['name']}: {message[:140]}"
            send_sms(sub["phone"], sms_msg)

    return jsonify({
        "id": str(update["_id"]),
        "message": update["message"],
        "author_name": user.get("name", user.get("email", "")),
        "created_at": update["created_at"].isoformat(),
    }), 201


@events_bp.route("/<access_code>/subscribers", methods=["GET"])
@login_required
def list_subscribers(access_code):
    event = get_event_by_access_code(access_code)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    user = request.current_user
    if event["primary_contact_id"] != user["_id"]:
        return jsonify({"error": "Only the primary contact can view subscribers"}), 403

    subs = get_subscribers(event["_id"])
    return jsonify([{"phone": s["phone"], "name": s.get("name", "")} for s in subs])


@events_bp.route("/<access_code>/subscribers", methods=["POST"])
@login_required
def add_subscriber_route(access_code):
    event = get_event_by_access_code(access_code)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    user = request.current_user
    if event["primary_contact_id"] != user["_id"]:
        return jsonify({"error": "Only the primary contact can add subscribers"}), 403

    data = request.get_json()
    phone = data.get("phone", "").strip()
    name = data.get("name", "").strip()
    if not phone:
        return jsonify({"error": "Phone number is required"}), 400

    add_subscriber(event["_id"], phone, name)

    if is_twilio_configured():
        frontend_url = request.host_url.rstrip("/")
        link = f"{frontend_url}/e/{event['access_code']}"
        send_sms(phone, f"You've been added to updates for: {event['name']}. View updates: {link}")

    return jsonify({"message": f"Subscriber {phone} added"}), 201


@events_bp.route("/<access_code>/transfer", methods=["POST"])
@login_required
def transfer_contact(access_code):
    event = get_event_by_access_code(access_code)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    user = request.current_user
    if event["primary_contact_id"] != user["_id"]:
        return jsonify({"error": "Only the primary contact can transfer this role"}), 403

    data = request.get_json()
    new_email = data.get("email", "").strip().lower()
    if not new_email:
        return jsonify({"error": "New contact email is required"}), 400

    new_user = get_user_by_email(new_email)
    if not new_user:
        return jsonify({"error": "User not found. They must log in first."}), 404

    transfer_primary_contact(event["_id"], new_user["_id"])
    return jsonify({"message": f"Primary contact transferred to {new_email}"})
