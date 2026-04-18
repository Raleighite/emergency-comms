import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


def create_app(testing=False):
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/emergency_comms")
    app.config["JWT_SECRET"] = os.getenv("JWT_SECRET", "jwt-secret-change-me")
    app.config["FRONTEND_URL"] = os.getenv("FRONTEND_URL", "http://localhost:5173")
    app.config["TWILIO_ACCOUNT_SID"] = os.getenv("TWILIO_ACCOUNT_SID", "")
    app.config["TWILIO_AUTH_TOKEN"] = os.getenv("TWILIO_AUTH_TOKEN", "")
    app.config["TWILIO_PHONE_NUMBER"] = os.getenv("TWILIO_PHONE_NUMBER", "")
    app.config["SMTP_HOST"] = os.getenv("SMTP_HOST", "localhost")
    app.config["SMTP_PORT"] = int(os.getenv("SMTP_PORT", "587"))
    app.config["SMTP_USER"] = os.getenv("SMTP_USER", "")
    app.config["SMTP_PASSWORD"] = os.getenv("SMTP_PASSWORD", "")
    app.config["SMTP_FROM"] = os.getenv("SMTP_FROM", "noreply@emergency-comms.app")
    app.config["TESTING"] = testing

    CORS(app, origins=[app.config["FRONTEND_URL"]])

    from backend.routes.auth import auth_bp
    from backend.routes.events import events_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(events_bp, url_prefix="/api/events")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    # Serve frontend build in production
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
    if os.path.isdir(frontend_dist):
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            file_path = os.path.join(frontend_dist, path)
            if path and os.path.isfile(file_path):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, "index.html")

    return app
