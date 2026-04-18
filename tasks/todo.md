# Emergency Comms App - Implementation Plan

## Overview
An open-source web app that lets a primary contact centralize emergency updates (e.g., loved one in hospital) for friends and family. Shared via a link — viewers don't need to log in.

## Architecture

**Tech Stack:**
- **Backend:** Python 3.11+, Flask (REST API), MongoDB (PyMongo)
- **Frontend:** React (Vite), Tailwind CSS
- **Auth:** Magic link email (free) + Twilio SMS (premium)
- **Infra:** Docker / Docker Compose

**Tiers:**
- **Free:** Magic link email auth, create events, post updates, transfer primary contact, shareable view-only link
- **Premium:** Twilio SMS auth, SMS notifications to contacts when updates are posted, SMS invites

**Data Models:**
- **User** — `_id`, `email`, `phone` (optional), `name`, `created_at`, `is_premium`
- **Event** — `_id`, `name`, `description`, `created_at`, `access_code` (public slug), `primary_contact_id` (User ref), `created_by` (User ref)
- **Update** — `_id`, `event_id`, `author_id`, `message`, `created_at`
- **MagicToken** — `_id`, `email`, `token`, `expires_at`, `used`

**Auth Flow:**
- **Free (Magic Link):** Enter email → receive email with login link → click link → authenticated (JWT stored in browser)
- **Premium (Twilio SMS):** Enter phone → receive SMS code → enter code → authenticated (JWT stored in browser)
- **View-only:** No auth — anyone with the event link can see updates

**API Routes:**
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/magic-link` | POST | No | Send magic link email |
| `/api/auth/magic-link/verify` | POST | No | Verify magic link token, return JWT |
| `/api/auth/sms/send` | POST | No | Send SMS code (premium) |
| `/api/auth/sms/verify` | POST | No | Verify SMS code, return JWT |
| `/api/auth/sms/available` | GET | No | Check if SMS auth is configured |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/events` | POST | Yes | Create new event |
| `/api/events` | GET | Yes | List user's events |
| `/api/events/<access_code>` | GET | No | Get event + updates (public) |
| `/api/events/<access_code>/updates` | POST | Yes | Post update (primary contact only) |
| `/api/events/<access_code>/subscribers` | GET | Yes | List SMS subscribers |
| `/api/events/<access_code>/subscribers` | POST | Yes | Add SMS subscriber |
| `/api/events/<access_code>/transfer` | POST | Yes | Transfer primary contact role |

**Frontend Pages:**
| Page | Path | Auth Required |
|------|------|---------------|
| Landing / Home | `/` | No |
| Login (email + phone options) | `/login` | No |
| Auth Verify (magic link callback) | `/auth/verify` | No |
| Dashboard (my events) | `/dashboard` | Yes |
| Create Event | `/create` | Yes |
| Event View (public) | `/e/:accessCode` | No |
| Event Admin | `/e/:accessCode/admin` | Yes (primary contact) |

## Todo

### Phase 1: Project Setup
- [x] 1. Project scaffolding — backend (Flask, venv, requirements.txt) + frontend (Vite/React, Tailwind) + .gitignore
- [x] 2. Docker setup — Dockerfile for backend, Dockerfile for frontend, docker-compose.yml (Flask + React + MongoDB)

### Phase 2: Backend Core
- [x] 3. MongoDB connection + config management (env vars)
- [x] 4. Data models + database helper functions (User, Event, Update, MagicToken, SmsCode, Subscriber)
- [x] 5. Auth system — magic link (email) + JWT token generation/validation
- [x] 6. Auth system — Twilio SMS (premium, behind feature flag)
- [x] 7. Event API routes — create, read, list, post updates, transfer primary contact, subscribers
- [x] 8. SMS notification on new update (premium)

### Phase 3: Frontend
- [x] 9. App shell — routing, layout, Tailwind config, auth context
- [x] 10. Login page — email magic link + phone SMS option
- [x] 11. Dashboard page — list user's events
- [x] 12. Create Event page
- [x] 13. Public Event View page — auto-refresh every 30s
- [x] 14. Admin Event View — post updates, transfer contact, manage SMS subscribers

### Phase 4: Testing & CI
- [x] 15. Backend unit tests — 21 tests covering auth, events, updates, transfer logic
- [x] 16. Frontend unit tests — 9 tests covering App shell, Home page, Login page
- [x] 17. GitHub Actions CI — backend tests + frontend tests + build on push/PR

### Phase 5: Polish & Deploy
- [x] 18. Mobile responsiveness pass
- [x] 19. README with setup, usage, and deployment instructions
- [ ] 20. Push to GitHub

## Review

### Summary of Changes

**Backend (Python/Flask):**
- Flask REST API with 14 endpoints for auth and event management
- MongoDB via PyMongo with 6 collections: users, events, updates, magic_tokens, sms_codes, subscribers
- Magic link email auth (free) — sends login link via SMTP, verifies token, returns JWT
- Twilio SMS auth (premium) — sends 6-digit code, verifies, returns JWT
- JWT-based session management with 7-day expiry
- Primary contact enforcement — only the primary contact can post updates and transfer the role
- SMS notifications to subscribers on new updates (premium feature)
- In-memory mock DB for testing (no MongoDB needed for tests)

**Frontend (React/Vite/Tailwind):**
- 7 pages: Home, Login, AuthVerify, Dashboard, CreateEvent, EventView, EventAdmin
- Auth context with localStorage persistence
- Axios API client with JWT interceptor and auto-logout on 401
- Public event view auto-refreshes every 30 seconds
- Admin view: post updates, copy share link, manage SMS subscribers, transfer primary contact
- Login page dynamically shows SMS option only when Twilio is configured
- Mobile-responsive Tailwind CSS throughout

**Infrastructure:**
- Docker Compose with 3 services: MongoDB, Flask backend, React frontend (nginx)
- Frontend nginx config proxies /api/ to backend
- GitHub Actions CI runs backend + frontend tests on push/PR

**Testing:**
- 21 backend tests (pytest) — auth flows, event CRUD, update posting, transfer logic, edge cases
- 9 frontend tests (Vitest + React Testing Library) — component rendering, nav state, form elements
