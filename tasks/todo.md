# Bug Fix: App can't send magic link emails

## Root Cause
Two issues:
1. **No `.env` file** — SMTP credentials aren't configured, so `send_magic_link_email()` hits the `if not smtp_user` guard and returns `False`
2. **Route ignores failure** — `send_magic_link` route (auth.py:23) doesn't check the return value of `send_magic_link_email()`, so it tells the user "a login link has been sent" even when it wasn't

## Fix Plan
- [x] 1. Fix the route to check if email sending failed and return an error to the user
- [x] 2. For local dev without SMTP, fall back to returning the magic link in the API response (debug mode only) + show clickable link in frontend
- [x] 3. Add tests for the failure case (dev fallback + prod 503)

## Review
**Changes made:**
- `backend/routes/auth.py` — Route now checks `send_magic_link_email()` return value. On failure: returns magic link directly in debug mode, returns 503 error in production.
- `frontend/src/pages/Login.jsx` — Login page shows a clickable "Click here to log in" button when the API returns a `magic_link` (dev mode fallback).
- `tests/test_auth.py` — Added 2 new tests: dev fallback returns magic link, prod without SMTP returns 503. All 22 tests pass.
