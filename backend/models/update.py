from datetime import datetime, timezone
from bson import ObjectId
from backend.db import get_db


def create_update(event_id, author_id, message):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    if isinstance(author_id, str):
        author_id = ObjectId(author_id)
    update = {
        "event_id": event_id,
        "author_id": author_id,
        "message": message,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.updates.insert_one(update)
    update["_id"] = result.inserted_id
    return update


def get_updates_for_event(event_id):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    return list(db.updates.find({"event_id": event_id}).sort("created_at", -1))
