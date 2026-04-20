import secrets
import string
from datetime import datetime, timezone
import bcrypt
from bson import ObjectId
from backend.db import get_db


def _generate_code(length=8):
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_event(name, description, primary_contact_id, password, template="general"):
    db = get_db()
    if isinstance(primary_contact_id, str):
        primary_contact_id = ObjectId(primary_contact_id)
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    event = {
        "name": name,
        "description": description,
        "access_code": _generate_code(),
        "password_hash": password_hash,
        "template": template,
        "details": {},
        "primary_contact_id": primary_contact_id,
        "created_by": primary_contact_id,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.events.insert_one(event)
    event["_id"] = result.inserted_id
    return event


def update_event_details(event_id, details):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    db.events.update_one(
        {"_id": event_id},
        {"$set": {"details": details}},
    )


def verify_event_password(event, password):
    return bcrypt.checkpw(password.encode("utf-8"), event["password_hash"].encode("utf-8"))


def get_event_by_access_code(access_code):
    db = get_db()
    return db.events.find_one({"access_code": access_code})


def get_events_by_user(user_id):
    db = get_db()
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    return list(db.events.find({
        "$or": [
            {"primary_contact_id": user_id},
            {"created_by": user_id},
        ]
    }).sort("created_at", -1))


def transfer_primary_contact(event_id, new_primary_id):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    if isinstance(new_primary_id, str):
        new_primary_id = ObjectId(new_primary_id)
    db.events.update_one(
        {"_id": event_id},
        {"$set": {"primary_contact_id": new_primary_id}},
    )
