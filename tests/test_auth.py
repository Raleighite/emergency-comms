import pytest
from unittest.mock import patch


class TestMagicLink:
    def test_send_magic_link_dev_fallback(self, client, app):
        """When SMTP is not configured and debug=True, returns the magic link directly."""
        app.config["TESTING"] = False
        app.debug = True
        res = client.post("/api/auth/magic-link", json={"email": "test@example.com"})
        assert res.status_code == 200
        data = res.get_json()
        assert "magic_link" in data
        assert "/auth/verify?token=" in data["magic_link"]
        app.config["TESTING"] = True

    def test_send_magic_link_prod_no_smtp_returns_503(self, client, app):
        """When SMTP is not configured and debug=False, returns 503."""
        app.config["TESTING"] = False
        app.debug = False
        res = client.post("/api/auth/magic-link", json={"email": "test@example.com"})
        assert res.status_code == 503
        assert "error" in res.get_json()
        app.config["TESTING"] = True

    def test_send_magic_link_no_email(self, client):
        res = client.post("/api/auth/magic-link", json={"email": ""})
        assert res.status_code == 400

    def test_verify_magic_link(self, client, mock_db):
        # Send magic link first
        client.post("/api/auth/magic-link", json={"email": "test@example.com"})

        # Get the token from the mock DB
        token_record = mock_db.magic_tokens.data[0]
        token = token_record["token"]

        # Verify it
        res = client.post("/api/auth/magic-link/verify", json={
            "token": token,
            "name": "Test User",
        })
        assert res.status_code == 200
        data = res.get_json()
        assert "token" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"

    def test_verify_invalid_token(self, client):
        res = client.post("/api/auth/magic-link/verify", json={"token": "invalid"})
        assert res.status_code == 401

    def test_verify_used_token(self, client, mock_db):
        client.post("/api/auth/magic-link", json={"email": "test@example.com"})
        token = mock_db.magic_tokens.data[0]["token"]

        # Use it once
        client.post("/api/auth/magic-link/verify", json={"token": token})
        # Try again
        res = client.post("/api/auth/magic-link/verify", json={"token": token})
        assert res.status_code == 401


class TestAuthMe:
    def test_get_me_authenticated(self, client, mock_db):
        # Create user and get token
        client.post("/api/auth/magic-link", json={"email": "me@example.com"})
        token = mock_db.magic_tokens.data[0]["token"]
        verify_res = client.post("/api/auth/magic-link/verify", json={
            "token": token,
            "name": "Me",
        })
        jwt_token = verify_res.get_json()["token"]

        # Get me
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {jwt_token}"})
        assert res.status_code == 200
        assert res.get_json()["email"] == "me@example.com"

    def test_get_me_no_token(self, client):
        res = client.get("/api/auth/me")
        assert res.status_code == 401

    def test_get_me_bad_token(self, client):
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer bad-token"})
        assert res.status_code == 401


class TestSmsAvailable:
    def test_sms_not_available(self, client):
        res = client.get("/api/auth/sms/available")
        assert res.status_code == 200
        assert res.get_json()["available"] is False
