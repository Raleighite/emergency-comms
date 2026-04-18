from datetime import datetime, timezone
from bson import ObjectId
from backend.db import get_db


def create_user(email, name="", phone=""):
    db = get_db()
    user = {
        "email": email.lower().strip(),
        "name": name,
        "phone": phone,
        "is_premium": False,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.users.insert_one(user)
    user["_id"] = result.inserted_id
    return user


def get_user_by_email(email):
    db = get_db()
    return db.users.find_one({"email": email.lower().strip()})


def get_user_by_id(user_id):
    db = get_db()
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    return db.users.find_one({"_id": user_id})


def get_user_by_phone(phone):
    db = get_db()
    return db.users.find_one({"phone": phone})


def update_user(user_id, updates):
    db = get_db()
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    db.users.update_one({"_id": user_id}, {"$set": updates})


def get_or_create_user(email, name=""):
    user = get_user_by_email(email)
    if not user:
        user = create_user(email, name)
    return user
