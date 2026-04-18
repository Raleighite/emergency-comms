import pytest

TEST_PASSWORD = "testpass123"


def _create_authenticated_user(client, mock_db, email="user@example.com", name="Test User"):
    """Helper to create a user and return JWT token."""
    client.post("/api/auth/magic-link", json={"email": email})
    token = mock_db.magic_tokens.data[-1]["token"]
    res = client.post("/api/auth/magic-link/verify", json={"token": token, "name": name})
    return res.get_json()["token"], res.get_json()["user"]


def _create_event(client, jwt, password=TEST_PASSWORD):
    """Helper to create an event and return the response data."""
    res = client.post("/api/events", json={
        "name": "Test Event",
        "description": "Test",
        "password": password,
    }, headers={"Authorization": f"Bearer {jwt}"})
    return res.get_json()


def _pw_headers(jwt=None):
    """Helper to build headers with event password and optional JWT."""
    h = {"X-Event-Password": TEST_PASSWORD}
    if jwt:
        h["Authorization"] = f"Bearer {jwt}"
    return h


class TestCreateEvent:
    def test_create_event(self, client, mock_db):
        jwt, user = _create_authenticated_user(client, mock_db)
        res = client.post("/api/events", json={
            "name": "Dad's Surgery",
            "description": "Scheduled for Monday",
            "password": TEST_PASSWORD,
        }, headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 201
        data = res.get_json()
        assert data["name"] == "Dad's Surgery"
        assert data["access_code"]
        assert data["primary_contact_id"] == user["id"]

    def test_create_event_no_name(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        res = client.post("/api/events", json={"name": "", "password": TEST_PASSWORD}, headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 400

    def test_create_event_no_password(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        res = client.post("/api/events", json={"name": "Test"}, headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 400

    def test_create_event_unauthenticated(self, client):
        res = client.post("/api/events", json={"name": "Test", "password": TEST_PASSWORD})
        assert res.status_code == 401


class TestEventPassword:
    def test_verify_correct_password(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/verify-password", json={"password": TEST_PASSWORD})
        assert res.status_code == 200
        assert res.get_json()["valid"] is True

    def test_verify_wrong_password(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/verify-password", json={"password": "wrong"})
        assert res.status_code == 403

    def test_get_event_without_password_fails(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.get(f"/api/events/{event['access_code']}")
        assert res.status_code == 403

    def test_get_event_with_password(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.get(f"/api/events/{event['access_code']}", headers=_pw_headers())
        assert res.status_code == 200
        assert res.get_json()["name"] == "Test Event"


class TestGetEvent:
    def test_get_event_with_updates(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.get(f"/api/events/{event['access_code']}", headers=_pw_headers())
        assert res.status_code == 200
        assert "updates" in res.get_json()

    def test_get_event_not_found(self, client):
        res = client.get("/api/events/nonexistent", headers=_pw_headers())
        assert res.status_code == 404


class TestListEvents:
    def test_list_events(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        _create_event(client, jwt)
        _create_event(client, jwt)
        res = client.get("/api/events", headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 200
        assert len(res.get_json()) == 2


class TestPostUpdate:
    def test_post_update(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/updates", json={
            "message": "Surgery went well!",
        }, headers=_pw_headers(jwt))
        assert res.status_code == 201
        assert res.get_json()["message"] == "Surgery went well!"

    def test_post_update_not_primary(self, client, mock_db):
        jwt1, _ = _create_authenticated_user(client, mock_db, "user1@example.com", "User 1")
        jwt2, _ = _create_authenticated_user(client, mock_db, "user2@example.com", "User 2")
        event = _create_event(client, jwt1)
        res = client.post(f"/api/events/{event['access_code']}/updates", json={
            "message": "Not allowed",
        }, headers=_pw_headers(jwt2))
        assert res.status_code == 403

    def test_post_update_empty_message(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/updates", json={
            "message": "",
        }, headers=_pw_headers(jwt))
        assert res.status_code == 400


class TestTransferContact:
    def test_transfer_primary_contact(self, client, mock_db):
        jwt1, _ = _create_authenticated_user(client, mock_db, "user1@example.com", "User 1")
        jwt2, user2 = _create_authenticated_user(client, mock_db, "user2@example.com", "User 2")
        event = _create_event(client, jwt1)
        res = client.post(f"/api/events/{event['access_code']}/transfer", json={
            "email": "user2@example.com",
        }, headers=_pw_headers(jwt1))
        assert res.status_code == 200
        event_res = client.get(f"/api/events/{event['access_code']}", headers=_pw_headers())
        assert event_res.get_json()["primary_contact_id"] == user2["id"]

    def test_transfer_not_primary(self, client, mock_db):
        jwt1, _ = _create_authenticated_user(client, mock_db, "user1@example.com", "User 1")
        jwt2, _ = _create_authenticated_user(client, mock_db, "user2@example.com", "User 2")
        event = _create_event(client, jwt1)
        res = client.post(f"/api/events/{event['access_code']}/transfer", json={
            "email": "user1@example.com",
        }, headers=_pw_headers(jwt2))
        assert res.status_code == 403

    def test_transfer_to_nonexistent_user(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/transfer", json={
            "email": "nobody@example.com",
        }, headers=_pw_headers(jwt))
        assert res.status_code == 404


class TestContributions:
    def test_add_contribution(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/contributions", json={
            "author_name": "Aunt Jane",
            "message": "I can bring dinner tonight",
        }, headers=_pw_headers())
        assert res.status_code == 201
        assert res.get_json()["author_name"] == "Aunt Jane"

    def test_list_contributions(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        client.post(f"/api/events/{event['access_code']}/contributions", json={
            "author_name": "Jane", "message": "Bringing food",
        }, headers=_pw_headers())
        client.post(f"/api/events/{event['access_code']}/contributions", json={
            "author_name": "Bob", "message": "I can drive",
        }, headers=_pw_headers())
        res = client.get(f"/api/events/{event['access_code']}/contributions", headers=_pw_headers())
        assert res.status_code == 200
        assert len(res.get_json()) == 2

    def test_contribution_no_name(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/contributions", json={
            "author_name": "", "message": "test",
        }, headers=_pw_headers())
        assert res.status_code == 400

    def test_contribution_requires_password(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/contributions", json={
            "author_name": "Jane", "message": "test",
        })
        assert res.status_code == 403


class TestQuestions:
    def test_ask_question(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/questions", json={
            "author_name": "Uncle Bob",
            "question": "What room is he in?",
        }, headers=_pw_headers())
        assert res.status_code == 201
        assert res.get_json()["status"] == "pending"
        assert res.get_json()["position"] == 1

    def test_list_questions_with_queue(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        client.post(f"/api/events/{event['access_code']}/questions", json={
            "author_name": "Bob", "question": "Q1",
        }, headers=_pw_headers())
        client.post(f"/api/events/{event['access_code']}/questions", json={
            "author_name": "Jane", "question": "Q2",
        }, headers=_pw_headers())
        res = client.get(f"/api/events/{event['access_code']}/questions", headers=_pw_headers())
        assert res.status_code == 200
        data = res.get_json()
        assert data["queue"]["total"] == 2
        assert data["queue"]["answered"] == 0
        assert data["queue"]["remaining"] == 2
        assert len(data["questions"]) == 2

    def test_answer_question(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        q_res = client.post(f"/api/events/{event['access_code']}/questions", json={
            "author_name": "Bob", "question": "What room?",
        }, headers=_pw_headers())
        q_id = q_res.get_json()["id"]

        res = client.post(f"/api/events/{event['access_code']}/questions/{q_id}/answer", json={
            "answer": "Room 302",
        }, headers=_pw_headers(jwt))
        assert res.status_code == 200

        # Verify queue updated
        list_res = client.get(f"/api/events/{event['access_code']}/questions", headers=_pw_headers())
        data = list_res.get_json()
        assert data["queue"]["answered"] == 1
        assert data["queue"]["remaining"] == 0

    def test_answer_question_not_primary(self, client, mock_db):
        jwt1, _ = _create_authenticated_user(client, mock_db, "user1@example.com", "User 1")
        jwt2, _ = _create_authenticated_user(client, mock_db, "user2@example.com", "User 2")
        event = _create_event(client, jwt1)
        q_res = client.post(f"/api/events/{event['access_code']}/questions", json={
            "author_name": "Bob", "question": "What room?",
        }, headers=_pw_headers())
        q_id = q_res.get_json()["id"]

        res = client.post(f"/api/events/{event['access_code']}/questions/{q_id}/answer", json={
            "answer": "Room 302",
        }, headers=_pw_headers(jwt2))
        assert res.status_code == 403

    def test_question_requires_password(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        event = _create_event(client, jwt)
        res = client.post(f"/api/events/{event['access_code']}/questions", json={
            "author_name": "Bob", "question": "test?",
        })
        assert res.status_code == 403
