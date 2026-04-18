from datetime import datetime, timezone
from bson import ObjectId
from backend.db import get_db


def create_question(event_id, author_name, question):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    q = {
        "event_id": event_id,
        "author_name": author_name,
        "question": question,
        "answer": None,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "answered_at": None,
    }
    result = db.questions.insert_one(q)
    q["_id"] = result.inserted_id
    return q


def get_questions_for_event(event_id):
    db = get_db()
    if isinstance(event_id, str):
        event_id = ObjectId(event_id)
    return list(db.questions.find({"event_id": event_id}).sort("created_at", 1))


def get_question_by_id(question_id):
    db = get_db()
    if isinstance(question_id, str):
        question_id = ObjectId(question_id)
    return db.questions.find_one({"_id": question_id})


def answer_question(question_id, answer):
    db = get_db()
    if isinstance(question_id, str):
        question_id = ObjectId(question_id)
    db.questions.update_one(
        {"_id": question_id},
        {"$set": {
            "answer": answer,
            "status": "answered",
            "answered_at": datetime.now(timezone.utc),
        }},
    )
