import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Response

from app.config import get_settings
from app.models import Admin, User

settings = get_settings()

SESSION_COOKIE = "session"
OAUTH_STATE_COOKIE = "oauth_state"
SOCIAL_SIGNUP_COOKIE = "social_signup"
# Token purpose for the link in the password-reset mail
PASSWORD_RESET = "password_reset"
ADMIN_SESSION_COOKIE = "admin_session"
# Only sent to the admin API, never to storefront requests
ADMIN_COOKIE_PATH = "/api/admin"

SESSION_TTL = timedelta(days=settings.session_days)
OAUTH_STATE_TTL = timedelta(minutes=10)
SOCIAL_SIGNUP_TTL = timedelta(minutes=30)
PASSWORD_RESET_TTL = timedelta(minutes=30)
ADMIN_SESSION_TTL = timedelta(hours=12)

_hasher = PasswordHasher()
# Checked when the login id doesn't exist, so unknown ids take as long as wrong passwords
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    try:
        _hasher.verify(password_hash or _DUMMY_HASH, password)
    except (VerificationError, InvalidHashError):
        return False
    return password_hash is not None


def password_fingerprint(password_hash: str | None) -> str:
    """Changes whenever the password does. Sessions and reset links carry it, so a
    password change signs out every other device and a used reset link stops working."""
    return hashlib.sha256((password_hash or "").encode()).hexdigest()[:16]


def encode_token(purpose: str, data: dict, ttl: timedelta) -> str:
    payload = {**data, "purpose": purpose, "exp": datetime.now(UTC) + ttl}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_token(token: str | None, purpose: str) -> dict | None:
    """Return the payload, or None if the token is missing, expired, forged or for another purpose."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    return payload if payload.get("purpose") == purpose else None


def set_cookie(
    response: Response, name: str, value: str, ttl: timedelta, path: str = "/"
) -> None:
    response.set_cookie(
        name,
        value,
        max_age=int(ttl.total_seconds()),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=path,
    )


def clear_cookie(response: Response, name: str, path: str = "/") -> None:
    response.delete_cookie(
        name, path=path, httponly=True, secure=settings.cookie_secure, samesite="lax"
    )


def start_session(response: Response, user: User) -> None:
    token = encode_token(
        SESSION_COOKIE, {"sub": str(user.id), "pv": password_fingerprint(user.password_hash)}, SESSION_TTL
    )
    set_cookie(response, SESSION_COOKIE, token, SESSION_TTL)


def start_admin_session(response: Response, admin: Admin) -> None:
    token = encode_token(ADMIN_SESSION_COOKIE, {"sub": str(admin.id)}, ADMIN_SESSION_TTL)
    set_cookie(response, ADMIN_SESSION_COOKIE, token, ADMIN_SESSION_TTL, path=ADMIN_COOKIE_PATH)
