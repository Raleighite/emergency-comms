# Feature: Email Invites + Railway Deployment

## Overview
1. Add email invites as a free invite method alongside link sharing and SMS
2. Add Railway deployment config files

## Plan
- [x] 1. Backend: Add `POST /api/events/<code>/invite-email` route — sends invite email with share link
- [x] 2. Frontend: Add "Invite by Email" box in EventAdmin alongside link and SMS
- [x] 3. Backend: Add gunicorn to requirements, add Procfile, railway.toml, nixpacks.toml for Railway
- [x] 4. Tests for the new route — 4 tests (send, no email, not primary, unauthenticated)
- [x] 5. Verify all tests pass — 40 backend + 9 frontend = 49 total

## Review
**Backend:**
- New `send_invite_email()` in email utility — sends HTML email with event name and share link
- New `POST /api/events/<code>/invite-email` route — primary contact only, includes dev fallback
- Added gunicorn to requirements.txt
- Flask app serves frontend build from `frontend/dist/` in production (single-service deploy)

**Frontend:**
- "Invite by Email" section in EventAdmin between share link and SMS subscribers

**Railway:**
- `Procfile` — gunicorn start command
- `railway.toml` — deploy config with health check
- `nixpacks.toml` — Python 3.11 + Node 20, builds frontend during deploy
