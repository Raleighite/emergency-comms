from datetime import datetime, timezone
from bson import ObjectId
from backend.db import get_db


def create_contribution(event_id, author_name, message):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    contrib = {
        "event_id": event_id,
        "author_name": author_name,
        "message": message,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.contributions.insert_one(contrib)
    contrib["_id"] = result.inserted_id
    return contrib


def get_contributions_for_event(event_id):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    return list(db.contributions.find({"event_id": event_id}).sort("created_at", -1))
