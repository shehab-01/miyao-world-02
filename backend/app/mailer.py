"""Outgoing email. Without SMTP settings (local dev) the message is logged instead."""

import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger(__name__)


def send_mail(to: str, subject: str, body: str) -> None:
    """Send a plain-text mail. Blocking — call it from a background task.

    Failures are logged, not raised: the request that triggered the mail has
    already been answered by then.
    """
    settings = get_settings()
    if not settings.smtp_host:
        logger.warning("SMTP not configured; mail not sent.\nTo: %s\nSubject: %s\n\n%s", to, subject, body)
        return

    message = EmailMessage()
    message["From"] = settings.mail_from or settings.smtp_user
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError):
        logger.exception("Failed to send mail to %s (%s)", to, subject)
