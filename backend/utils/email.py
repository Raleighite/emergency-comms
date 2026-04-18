import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


def send_magic_link_email(to_email, magic_link):
    if current_app.config["TESTING"]:
        return True

    smtp_host = current_app.config["SMTP_HOST"]
    smtp_port = current_app.config["SMTP_PORT"]
    smtp_user = current_app.config["SMTP_USER"]
    smtp_password = current_app.config["SMTP_PASSWORD"]
    from_email = current_app.config["SMTP_FROM"]

    if not smtp_user:
        current_app.logger.warning("SMTP not configured — magic link: %s", magic_link)
        return False

    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = "Your Emergency Comms Login Link"

    body = f"""
    <html>
    <body style="font-family: sans-serif; padding: 20px;">
        <h2>Emergency Comms Login</h2>
        <p>Click the link below to log in. This link expires in 15 minutes.</p>
        <p><a href="{magic_link}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Log In</a></p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
    </body>
    </html>
    """
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

    return True
