from datetime import datetime, timezone
from bson import ObjectId
from backend.db import get_db


def add_subscriber(event_id, phone, name=""):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    existing = db.subscribers.find_one({"event_id": event_id, "phone": phone})
    if existing:
        return existing
    sub = {
        "event_id": event_id,
        "phone": phone,
        "name": name,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.subscribers.insert_one(sub)
    sub["_id"] = result.inserted_id
    return sub


def get_subscribers(event_id):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    return list(db.subscribers.find({"event_id": event_id}))


def remove_subscriber(event_id, phone):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    db.subscribers.delete_one({"event_id": event_id, "phone": phone})
