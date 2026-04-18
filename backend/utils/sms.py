from flask import current_app


def send_sms(to_phone, message):
    if current_app.config["TESTING"]:
        return True

    account_sid = current_app.config["TWILIO_ACCOUNT_SID"]
    auth_token = current_app.config["TWILIO_AUTH_TOKEN"]
    from_phone = current_app.config["TWILIO_PHONE_NUMBER"]

    if not account_sid or not auth_token:
        current_app.logger.warning("Twilio not configured — SMS to %s: %s", to_phone, message)
        return False

    from twilio.rest import Client
    client = Client(account_sid, auth_token)
    client.messages.create(body=message, from_=from_phone, to=to_phone)
    return True


def is_twilio_configured():
    return bool(current_app.config.get("TWILIO_ACCOUNT_SID"))
