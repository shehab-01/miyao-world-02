"""Kakao / Naver OAuth 2.0 (authorization code flow), done entirely server-side.

Kakao: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
Naver: https://developers.naver.com/docs/login/api/api.md
"""

import re
from dataclasses import dataclass
from urllib.parse import urlencode

import httpx

from app.config import get_settings
from app.models import SocialProvider

settings = get_settings()


class SocialLoginError(Exception):
    pass


@dataclass
class SocialProfile:
    provider: SocialProvider
    provider_user_id: str
    email: str | None
    name: str | None
    mobile: str | None


def _credentials(provider: SocialProvider) -> tuple[str, str]:
    if provider is SocialProvider.kakao:
        return settings.kakao_client_id, settings.kakao_client_secret
    return settings.naver_client_id, settings.naver_client_secret


def is_configured(provider: SocialProvider) -> bool:
    client_id, client_secret = _credentials(provider)
    # Naver always needs the secret; Kakao only when its client secret setting is on
    return bool(client_id and (client_secret or provider is SocialProvider.kakao))


def redirect_uri(provider: SocialProvider) -> str:
    # Must match the URI registered in the provider's developer console exactly
    return f"{settings.public_url}/api/auth/{provider.value}/callback"


def authorize_url(provider: SocialProvider, state: str) -> str:
    client_id, _ = _credentials(provider)
    base = (
        "https://kauth.kakao.com/oauth/authorize"
        if provider is SocialProvider.kakao
        else "https://nid.naver.com/oauth2.0/authorize"
    )
    query = urlencode(
        {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri(provider),
            "state": state,
        }
    )
    return f"{base}?{query}"


def normalize_mobile(raw: str | None) -> str | None:
    """'+82 10-1234-5678' (Kakao) or '010-1234-5678' (Naver) → '010-1234-5678'."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("82"):
        digits = "0" + digits[2:]
    if len(digits) == 11:
        return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
    if len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    return None


async def _kakao_profile(client: httpx.AsyncClient, code: str) -> SocialProfile:
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.kakao_client_id,
        "redirect_uri": redirect_uri(SocialProvider.kakao),
        "code": code,
    }
    if settings.kakao_client_secret:
        data["client_secret"] = settings.kakao_client_secret
    token = (await client.post("https://kauth.kakao.com/oauth/token", data=data)).raise_for_status()
    access_token = token.json()["access_token"]

    me = await client.get(
        "https://kapi.kakao.com/v2/user/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    body = me.raise_for_status().json()
    account = body.get("kakao_account", {})
    # Only trust an email Kakao says is verified and still owned by this account
    email = (
        account.get("email")
        if account.get("is_email_valid") and account.get("is_email_verified")
        else None
    )
    return SocialProfile(
        provider=SocialProvider.kakao,
        provider_user_id=str(body["id"]),
        email=email,
        name=account.get("name") or account.get("profile", {}).get("nickname"),
        mobile=normalize_mobile(account.get("phone_number")),
    )


async def _naver_profile(client: httpx.AsyncClient, code: str, state: str) -> SocialProfile:
    token = await client.post(
        "https://nid.naver.com/oauth2.0/token",
        data={
            "grant_type": "authorization_code",
            "client_id": settings.naver_client_id,
            "client_secret": settings.naver_client_secret,
            "code": code,
            "state": state,
        },
    )
    token_body = token.raise_for_status().json()
    # Naver reports token errors with HTTP 200 and an "error" field
    if "access_token" not in token_body:
        raise SocialLoginError(f"Naver token error: {token_body.get('error_description')}")

    me = await client.get(
        "https://openapi.naver.com/v1/nid/me",
        headers={"Authorization": f"Bearer {token_body['access_token']}"},
    )
    body = me.raise_for_status().json()
    if body.get("resultcode") != "00":
        raise SocialLoginError(f"Naver profile error: {body.get('message')}")
    profile = body["response"]
    return SocialProfile(
        provider=SocialProvider.naver,
        provider_user_id=profile["id"],
        email=profile.get("email"),
        name=profile.get("name") or profile.get("nickname"),
        mobile=normalize_mobile(profile.get("mobile")),
    )


async def fetch_profile(provider: SocialProvider, code: str, state: str) -> SocialProfile:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            if provider is SocialProvider.kakao:
                return await _kakao_profile(client, code)
            return await _naver_profile(client, code, state)
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise SocialLoginError(f"{provider.value} login failed: {exc!r}") from exc
