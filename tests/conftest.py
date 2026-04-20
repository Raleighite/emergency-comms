import pytest
from unittest.mock import MagicMock, patch
from bson import ObjectId
from backend.app import create_app
import backend.db as db_module


@pytest.fixture
def app():
    app = create_app(testing=True)
    app.config["JWT_SECRET"] = "test-secret"
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def mock_db():
    """Create a mock MongoDB that stores data in memory for testing."""
    collections = {}

    class MockCollection:
        def __init__(self, name):
            self.name = name
            self.data = []

        def insert_one(self, doc):
            doc = dict(doc)
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            self.data.append(doc)
            result = MagicMock()
            result.inserted_id = doc["_id"]
            return result

        def find_one(self, query):
            for doc in self.data:
                if self._matches(doc, query):
                    return dict(doc)
            return None

        def find(self, query=None):
            query = query or {}
            results = [dict(d) for d in self.data if self._matches(d, query)]
            return MockCursor(results)

        def update_one(self, query, update):
            for doc in self.data:
                if self._matches(doc, query):
                    if "$set" in update:
                        doc.update(update["$set"])
                    return MagicMock(modified_count=1)
            return MagicMock(modified_count=0)

        def delete_one(self, query):
            for i, doc in enumerate(self.data):
                if self._matches(doc, query):
                    self.data.pop(i)
                    return MagicMock(deleted_count=1)
            return MagicMock(deleted_count=0)

        def _matches(self, doc, query):
            for key, value in query.items():
                if key == "$or":
                    if not any(self._matches(doc, cond) for cond in value):
                        return False
                elif isinstance(value, dict):
                    if "$gt" in value:
                        if doc.get(key) is None or doc.get(key) <= value["$gt"]:
                            return False
                    else:
                        if doc.get(key) != value:
                            return False
                else:
                    if doc.get(key) != value:
                        return False
            return True

    class MockCursor:
        def __init__(self, data):
            self._data = data

        def sort(self, key, direction):
            self._data.sort(key=lambda x: x.get(key, ""), reverse=(direction == -1))
            return self

        def __iter__(self):
            return iter(self._data)

        def __list__(self):
            return self._data

    class MockDB:
        def __getattr__(self, name):
            if name not in collections:
                collections[name] = MockCollection(name)
            return collections[name]

        def __getitem__(self, name):
            return self.__getattr__(name)

    return MockDB()


@pytest.fixture(autouse=True)
def patch_db(app, mock_db):
    """Patch get_db globally so all model imports use the mock."""
    original_db = db_module._db

    def fake_get_db(uri=None):
        return mock_db

    with app.app_context():
        # Patch the function in the db module and in every module that imported it
        with patch("backend.db.get_db", side_effect=fake_get_db), \
             patch("backend.models.user.get_db", side_effect=fake_get_db), \
             patch("backend.models.event.get_db", side_effect=fake_get_db), \
             patch("backend.models.update.get_db", side_effect=fake_get_db), \
             patch("backend.models.magic_token.get_db", side_effect=fake_get_db), \
             patch("backend.models.sms_code.get_db", side_effect=fake_get_db), \
             patch("backend.models.subscriber.get_db", side_effect=fake_get_db), \
             patch("backend.models.contribution.get_db", side_effect=fake_get_db), \
             patch("backend.models.question.get_db", side_effect=fake_get_db), \
             patch("backend.models.attachment.get_db", side_effect=fake_get_db):
            yield mock_db

    db_module._db = original_db
