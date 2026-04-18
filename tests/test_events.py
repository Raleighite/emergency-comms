import pytest


def _create_authenticated_user(client, mock_db, email="user@example.com", name="Test User"):
    """Helper to create a user and return JWT token."""
    client.post("/api/auth/magic-link", json={"email": email})
    token = mock_db.magic_tokens.data[-1]["token"]
    res = client.post("/api/auth/magic-link/verify", json={"token": token, "name": name})
    return res.get_json()["token"], res.get_json()["user"]


class TestCreateEvent:
    def test_create_event(self, client, mock_db):
        jwt, user = _create_authenticated_user(client, mock_db)
        res = client.post("/api/events", json={
            "name": "Dad's Surgery",
            "description": "Scheduled for Monday",
        }, headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 201
        data = res.get_json()
        assert data["name"] == "Dad's Surgery"
        assert data["access_code"]
        assert data["primary_contact_id"] == user["id"]

    def test_create_event_no_name(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        res = client.post("/api/events", json={"name": ""}, headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 400

    def test_create_event_unauthenticated(self, client):
        res = client.post("/api/events", json={"name": "Test"})
        assert res.status_code == 401


class TestGetEvent:
    def test_get_event_public(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        create_res = client.post("/api/events", json={"name": "Test Event"}, headers={"Authorization": f"Bearer {jwt}"})
        access_code = create_res.get_json()["access_code"]

        # No auth needed for viewing
        res = client.get(f"/api/events/{access_code}")
        assert res.status_code == 200
        assert res.get_json()["name"] == "Test Event"
        assert "updates" in res.get_json()

    def test_get_event_not_found(self, client):
        res = client.get("/api/events/nonexistent")
        assert res.status_code == 404


class TestListEvents:
    def test_list_events(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        client.post("/api/events", json={"name": "Event 1"}, headers={"Authorization": f"Bearer {jwt}"})
        client.post("/api/events", json={"name": "Event 2"}, headers={"Authorization": f"Bearer {jwt}"})

        res = client.get("/api/events", headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 200
        assert len(res.get_json()) == 2


class TestPostUpdate:
    def test_post_update(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        create_res = client.post("/api/events", json={"name": "Test"}, headers={"Authorization": f"Bearer {jwt}"})
        access_code = create_res.get_json()["access_code"]

        res = client.post(f"/api/events/{access_code}/updates", json={
            "message": "Surgery went well!",
        }, headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 201
        assert res.get_json()["message"] == "Surgery went well!"

    def test_post_update_not_primary(self, client, mock_db):
        jwt1, _ = _create_authenticated_user(client, mock_db, "user1@example.com", "User 1")
        jwt2, _ = _create_authenticated_user(client, mock_db, "user2@example.com", "User 2")

        create_res = client.post("/api/events", json={"name": "Test"}, headers={"Authorization": f"Bearer {jwt1}"})
        access_code = create_res.get_json()["access_code"]

        # User 2 tries to post — should fail
        res = client.post(f"/api/events/{access_code}/updates", json={
            "message": "Not allowed",
        }, headers={"Authorization": f"Bearer {jwt2}"})
        assert res.status_code == 403

    def test_post_update_empty_message(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        create_res = client.post("/api/events", json={"name": "Test"}, headers={"Authorization": f"Bearer {jwt}"})
        access_code = create_res.get_json()["access_code"]

        res = client.post(f"/api/events/{access_code}/updates", json={
            "message": "",
        }, headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 400


class TestTransferContact:
    def test_transfer_primary_contact(self, client, mock_db):
        jwt1, _ = _create_authenticated_user(client, mock_db, "user1@example.com", "User 1")
        jwt2, user2 = _create_authenticated_user(client, mock_db, "user2@example.com", "User 2")

        create_res = client.post("/api/events", json={"name": "Test"}, headers={"Authorization": f"Bearer {jwt1}"})
        access_code = create_res.get_json()["access_code"]

        res = client.post(f"/api/events/{access_code}/transfer", json={
            "email": "user2@example.com",
        }, headers={"Authorization": f"Bearer {jwt1}"})
        assert res.status_code == 200

        # Verify user2 is now primary
        event_res = client.get(f"/api/events/{access_code}")
        assert event_res.get_json()["primary_contact_id"] == user2["id"]

    def test_transfer_not_primary(self, client, mock_db):
        jwt1, _ = _create_authenticated_user(client, mock_db, "user1@example.com", "User 1")
        jwt2, _ = _create_authenticated_user(client, mock_db, "user2@example.com", "User 2")

        create_res = client.post("/api/events", json={"name": "Test"}, headers={"Authorization": f"Bearer {jwt1}"})
        access_code = create_res.get_json()["access_code"]

        # User 2 can't transfer
        res = client.post(f"/api/events/{access_code}/transfer", json={
            "email": "user1@example.com",
        }, headers={"Authorization": f"Bearer {jwt2}"})
        assert res.status_code == 403

    def test_transfer_to_nonexistent_user(self, client, mock_db):
        jwt, _ = _create_authenticated_user(client, mock_db)
        create_res = client.post("/api/events", json={"name": "Test"}, headers={"Authorization": f"Bearer {jwt}"})
        access_code = create_res.get_json()["access_code"]

        res = client.post(f"/api/events/{access_code}/transfer", json={
            "email": "nobody@example.com",
        }, headers={"Authorization": f"Bearer {jwt}"})
        assert res.status_code == 404
