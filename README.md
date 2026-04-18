# Emergency Comms

A web app for centralizing communication during emergency situations. When a loved one is in the hospital or facing a crisis, create one place for updates, share a link via text, and keep everyone informed.

## Features

**Free Tier:**
- Create emergency events with a shareable link
- Post updates as the primary contact
- Transfer primary contact role to someone else
- View-only access for anyone with the link (no login needed)
- Magic link email authentication (no passwords)

**Premium Tier (requires Twilio):**
- SMS-based authentication
- SMS notifications to subscribers when updates are posted
- SMS invites to contacts

## Tech Stack

- **Backend:** Python, Flask, MongoDB
- **Frontend:** React (Vite), Tailwind CSS
- **Auth:** Magic link email (free) + Twilio SMS (premium)
- **Infra:** Docker / Docker Compose

## Quick Start

### With Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/Raleighite/emergency-comms.git
cd emergency-comms

# Copy and edit environment variables
cp backend/.env.example .env

# Start everything
docker compose up --build
```

The app will be available at `http://localhost`.

### Local Development

**Backend:**

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp backend/.env.example .env

# Run the backend
PYTHONPATH=. python run.py
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:5000`.

## Configuration

Copy `backend/.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Flask secret key |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT tokens |
| `FRONTEND_URL` | Yes | Frontend URL (for magic link emails) |
| `SMTP_HOST` | For email auth | SMTP server host |
| `SMTP_PORT` | For email auth | SMTP server port |
| `SMTP_USER` | For email auth | SMTP username |
| `SMTP_PASSWORD` | For email auth | SMTP password |
| `SMTP_FROM` | For email auth | From email address |
| `TWILIO_ACCOUNT_SID` | Premium only | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Premium only | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Premium only | Twilio phone number |

## Testing

**Backend:**

```bash
source venv/bin/activate
PYTHONPATH=. python -m pytest tests/ -v
```

**Frontend:**

```bash
cd frontend
npx vitest run
```

## License

Open source. See LICENSE for details.
