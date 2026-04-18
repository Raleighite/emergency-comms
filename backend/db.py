from pymongo import MongoClient

_client = None
_db = None


def get_db(uri=None):
    global _client, _db
    if _db is None:
        from flask import current_app
        mongo_uri = uri or current_app.config["MONGO_URI"]
        _client = MongoClient(mongo_uri)
        try:
            _db = _client.get_default_database()
        except Exception:
            _db = _client["emergency_comms"]
    return _db


def close_db():
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
