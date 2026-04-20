from datetime import datetime, timezone
from bson import ObjectId
from backend.db import get_db


def create_attachment(event_id, filename, content_type, data, uploaded_by):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    attachment = {
        "event_id": event_id,
        "filename": filename,
        "content_type": content_type,
        "data": data,
        "uploaded_by": uploaded_by,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.attachments.insert_one(attachment)
    attachment["_id"] = result.inserted_id
    return attachment


def get_attachments_for_event(event_id):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    return list(db.attachments.find({"event_id": event_id}).sort("created_at", -1))
