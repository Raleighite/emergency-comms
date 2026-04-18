import secrets
from datetime import datetime, timezone, timedelta
from backend.db import get_db


def create_magic_token(email):
    db = get_db()
    token = secrets.token_urlsafe(32)
    record = {
        "email": email.lower().strip(),
        "token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
        "used": False,
    }
    db.magic_tokens.insert_one(record)
    return token


def verify_magic_token(token):
    db = get_db()
    record = db.magic_tokens.find_one({
        "token": token,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if record:
        db.magic_tokens.update_one(
            {"_id": record["_id"]},
            {"$set": {"used": True}},
        )
        return record["email"]
    return None
