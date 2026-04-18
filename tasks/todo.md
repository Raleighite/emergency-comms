# Feature: Event Password, Onboarding Flow, Contributions & Question Queue

## Overview
1. Events need a password so strangers can't view private emergency info
2. Friends/family arriving via link need onboarding, contribution, and question features

## Design

**Event Password:**
- Primary contact sets a password when creating an event
- Password is baked into the share link as a query param: `/e/a3f8b2?p=familydog123`
- When visiting without the password (or wrong password), show a password prompt page
- Once correct password is entered, store it in localStorage so they don't have to re-enter
- All API routes for event data (`GET /events/<code>`, contributions, questions) require the password
- The password is stored as a bcrypt hash in the DB — never in plain text

**Onboarding (first visit):**
- After password verification, show a brief welcome overlay on first visit
- 3 quick steps: (1) what this page is, (2) bookmark/save it, (3) how to contribute & ask questions
- "Got it" button dismisses — stores in localStorage so it only shows once per event
- No login required

**Contributions:**
- Visitors can post info for the group (e.g., "Grandma is on her way", "I brought food to the house")
- Separate section from official primary contact updates — clearly labeled as community contributions
- Requires a name (stored in localStorage for convenience) — no login needed

**Questions:**
- Visitors can submit questions to the primary contact
- Each question has a status: `pending` or `answered`
- Queue display shows: total questions, answered count, remaining count, your position in queue
- Primary contact answers questions from the admin view
- Answered questions (with answers) are visible to everyone

**Updated Data Models:**
- **Event** — add `password_hash` field
- **Contribution** — `_id`, `event_id`, `author_name`, `message`, `created_at`
- **Question** — `_id`, `event_id`, `author_name`, `question`, `answer` (null until answered), `status` (pending/answered), `created_at`, `answered_at`

**New/Updated API Routes:**
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/events/<code>` | GET | Password | Get event + updates (now requires password) |
| `/api/events/<code>/verify-password` | POST | No | Verify event password, returns success/fail |
| `/api/events/<code>/contributions` | GET | Password | List contributions |
| `/api/events/<code>/contributions` | POST | Password | Add a contribution (name required) |
| `/api/events/<code>/questions` | GET | Password | List questions + queue stats |
| `/api/events/<code>/questions` | POST | Password | Ask a question (name required) |
| `/api/events/<code>/questions/<id>/answer` | POST | JWT + Password | Answer a question (primary contact only) |

Password is passed via `X-Event-Password` header on all requests.

## Todo

- [x] 1. Backend: Add password_hash to Event model, update create_event, add verify password route
- [x] 2. Backend: Add password check middleware for event routes
- [x] 3. Backend: Contribution model + API routes (GET/POST)
- [x] 4. Backend: Question model + API routes (GET/POST/answer)
- [x] 5. Frontend: Update CreateEvent to include password field
- [x] 6. Frontend: Password prompt page + localStorage caching + bake into share link
- [x] 7. Frontend: Onboarding overlay component for first-time visitors
- [x] 8. Frontend: Contributions section on EventView page
- [x] 9. Frontend: Questions section on EventView page with queue display
- [x] 10. Frontend: Answer questions UI on EventAdmin page
- [x] 11. Tests for all new backend routes
- [x] 12. Verify all tests pass — 36 backend + 9 frontend = 45 total

## Review
**Backend changes:**
- Event model: added `password_hash` field (bcrypt), `verify_event_password()` function
- `password_required` decorator on all event data routes — checks `X-Event-Password` header
- New `verify-password` endpoint for frontend to validate before storing
- New Contribution model + GET/POST routes (no login needed, password only)
- New Question model + GET/POST/answer routes with queue stats (total/answered/remaining)

**Frontend changes:**
- CreateEvent: new password field, stored in localStorage after creation
- PasswordGate: shown when accessing event without valid password
- Password extracted from URL `?p=` param (from share link) and cached in localStorage
- Onboarding: 3-step overlay on first visit (welcome, bookmark, contribute/questions)
- EventView: contributions section, questions section with queue stats (Asked/Answered/In Queue)
- EventAdmin: "Questions to Answer" section with inline answer UI, share link now includes `?p=password`
- `eventApi()` helper auto-attaches `X-Event-Password` header to all event requests
