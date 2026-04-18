import secrets
from datetime import datetime, timezone, timedelta
from backend.db import get_db


def create_sms_code(phone):
    db = get_db()
    code = f"{secrets.randbelow(900000) + 100000}"
    record = {
        "phone": phone,
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "used": False,
    }
    db.sms_codes.insert_one(record)
    return code


def verify_sms_code(phone, code):
    db = get_db()
    record = db.sms_codes.find_one({
        "phone": phone,
        "code": code,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if record:
        db.sms_codes.update_one(
            {"_id": record["_id"]},
            {"$set": {"used": True}},
        )
        return True
    return False
