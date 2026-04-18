from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from backend.models.event import (
    create_event,
    get_event_by_access_code,
    get_events_by_user,
    transfer_primary_contact,
    verify_event_password,
)
from backend.models.update import create_update, get_updates_for_event
from backend.models.contribution import create_contribution, get_contributions_for_event
from backend.models.question import create_question, get_questions_for_event, get_question_by_id, answer_question
from backend.models.subscriber import add_subscriber, get_subscribers, remove_subscriber
from backend.models.user import get_user_by_email, get_user_by_id
from backend.utils.auth import login_required
from backend.utils.email import send_invite_email
from backend.utils.sms import send_sms, is_twilio_configured

events_bp = Blueprint("events", __name__)


def _get_event_or_404(access_code):
    event = get_event_by_access_code(access_code)
    if not event:
        return None, (jsonify({"error": "Event not found"}), 404)
    return event, None


def password_required(f):
    """Decorator that checks X-Event-Password header against the event's password hash."""
    @wraps(f)
    def decorated(access_code, *args, **kwargs):
        event, err = _get_event_or_404(access_code)
        if err:
            return err
        password = request.headers.get("X-Event-Password", "")
        if not password or not verify_event_password(event, password):
            return jsonify({"error": "Invalid event password"}), 403
        request.event = event
        return f(access_code, *args, **kwargs)
    return decorated


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

    password = data.get("password", "").strip()
    if not password:
        return jsonify({"error": "Event password is required"}), 400

    description = data.get("description", "").strip()
    user = request.current_user
    event = create_event(name, description, user["_id"], password)

    return jsonify(_serialize_event(event)), 201


@events_bp.route("", methods=["GET"])
@login_required
def list_events():
    user = request.current_user
    events = get_events_by_user(user["_id"])
    return jsonify([_serialize_event(e) for e in events])


@events_bp.route("/<access_code>/verify-password", methods=["POST"])
def verify_password(access_code):
    event, err = _get_event_or_404(access_code)
    if err:
        return err
    data = request.get_json()
    password = data.get("password", "")
    if not password or not verify_event_password(event, password):
        return jsonify({"valid": False}), 403
    return jsonify({"valid": True, "event_name": event["name"]})


@events_bp.route("/<access_code>", methods=["GET"])
@password_required
def get_event(access_code):
    return jsonify(_serialize_event(request.event, include_updates=True))


@events_bp.route("/<access_code>/updates", methods=["POST"])
@login_required
@password_required
def post_update(access_code):
    event = request.event
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
@password_required
def list_subscribers(access_code):
    event = request.event
    user = request.current_user
    if event["primary_contact_id"] != user["_id"]:
        return jsonify({"error": "Only the primary contact can view subscribers"}), 403

    subs = get_subscribers(event["_id"])
    return jsonify([{"phone": s["phone"], "name": s.get("name", "")} for s in subs])


@events_bp.route("/<access_code>/subscribers", methods=["POST"])
@login_required
@password_required
def add_subscriber_route(access_code):
    event = request.event
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
@password_required
def transfer_contact(access_code):
    event = request.event
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


@events_bp.route("/<access_code>/invite-email", methods=["POST"])
@login_required
@password_required
def invite_by_email(access_code):
    event = request.event
    user = request.current_user
    if event["primary_contact_id"] != user["_id"]:
        return jsonify({"error": "Only the primary contact can send invites"}), 403

    data = request.get_json()
    to_email = data.get("email", "").strip().lower()
    if not to_email:
        return jsonify({"error": "Email is required"}), 400

    password = request.headers.get("X-Event-Password", "")
    frontend_url = current_app.config["FRONTEND_URL"]
    share_link = f"{frontend_url}/e/{event['access_code']}?p={password}"

    sent = send_invite_email(to_email, event["name"], share_link)

    if sent:
        return jsonify({"message": f"Invite sent to {to_email}"})

    if current_app.debug:
        return jsonify({
            "message": f"SMTP not configured. Share this link with {to_email}",
            "share_link": share_link,
        })

    return jsonify({"error": "Email could not be sent. Please share the link manually."}), 503


@events_bp.route("/<access_code>/contributions", methods=["GET"])
@password_required
def list_contributions(access_code):
    contribs = get_contributions_for_event(request.event["_id"])
    return jsonify([{
        "id": str(c["_id"]),
        "author_name": c["author_name"],
        "message": c["message"],
        "created_at": c["created_at"].isoformat(),
    } for c in contribs])


@events_bp.route("/<access_code>/contributions", methods=["POST"])
@password_required
def add_contribution(access_code):
    data = request.get_json()
    author_name = data.get("author_name", "").strip()
    message = data.get("message", "").strip()
    if not author_name:
        return jsonify({"error": "Name is required"}), 400
    if not message:
        return jsonify({"error": "Message is required"}), 400

    contrib = create_contribution(request.event["_id"], author_name, message)
    return jsonify({
        "id": str(contrib["_id"]),
        "author_name": contrib["author_name"],
        "message": contrib["message"],
        "created_at": contrib["created_at"].isoformat(),
    }), 201


@events_bp.route("/<access_code>/questions", methods=["GET"])
@password_required
def list_questions(access_code):
    questions = get_questions_for_event(request.event["_id"])
    total = len(questions)
    answered = sum(1 for q in questions if q["status"] == "answered")
    remaining = total - answered

    return jsonify({
        "queue": {"total": total, "answered": answered, "remaining": remaining},
        "questions": [{
            "id": str(q["_id"]),
            "author_name": q["author_name"],
            "question": q["question"],
            "answer": q.get("answer"),
            "status": q["status"],
            "position": i + 1,
            "created_at": q["created_at"].isoformat(),
            "answered_at": q["answered_at"].isoformat() if q.get("answered_at") else None,
        } for i, q in enumerate(questions)],
    })


@events_bp.route("/<access_code>/questions", methods=["POST"])
@password_required
def ask_question(access_code):
    data = request.get_json()
    author_name = data.get("author_name", "").strip()
    question_text = data.get("question", "").strip()
    if not author_name:
        return jsonify({"error": "Name is required"}), 400
    if not question_text:
        return jsonify({"error": "Question is required"}), 400

    q = create_question(request.event["_id"], author_name, question_text)

    # Calculate position (number of pending questions)
    all_questions = get_questions_for_event(request.event["_id"])
    position = len(all_questions)

    return jsonify({
        "id": str(q["_id"]),
        "author_name": q["author_name"],
        "question": q["question"],
        "status": q["status"],
        "position": position,
        "created_at": q["created_at"].isoformat(),
    }), 201


@events_bp.route("/<access_code>/questions/<question_id>/answer", methods=["POST"])
@login_required
@password_required
def answer_question_route(access_code, question_id):
    event = request.event
    user = request.current_user
    if event["primary_contact_id"] != user["_id"]:
        return jsonify({"error": "Only the primary contact can answer questions"}), 403

    q = get_question_by_id(question_id)
    if not q or str(q["event_id"]) != str(event["_id"]):
        return jsonify({"error": "Question not found"}), 404

    data = request.get_json()
    answer_text = data.get("answer", "").strip()
    if not answer_text:
        return jsonify({"error": "Answer is required"}), 400

    answer_question(question_id, answer_text)
    return jsonify({"message": "Question answered"})
