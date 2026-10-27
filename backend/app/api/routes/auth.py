import logging
import secrets
from dataclasses import asdict
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app import social
from app.api.deps import get_optional_user
from app.config import get_settings
from app.db import get_db
from app.models import SocialAccount, SocialProvider, User
from app.schemas.auth import (
    LOGIN_ID_PATTERN,
    LoginIdAvailableOut,
    LoginIn,
    ProfileIn,
    RegisterIn,
    SocialCompleteIn,
    SocialPendingOut,
    UserOut,
)
from app.security import (
    OAUTH_STATE_COOKIE,
    OAUTH_STATE_TTL,
    SESSION_COOKIE,
    SOCIAL_SIGNUP_COOKIE,
    SOCIAL_SIGNUP_TTL,
    clear_cookie,
    decode_token,
    encode_token,
    hash_password,
    set_cookie,
    start_session,
    verify_password,
)

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Auth"])

EMAIL_TAKEN = "이미 가입된 이메일입니다. 기존 계정으로 로그인해 주세요."


async def _email_taken(db: AsyncSession, email: str) -> bool:
    return await db.scalar(select(func.count()).where(User.email == email)) > 0


def _new_member(body: ProfileIn, **fields) -> User:
    now = datetime.now(UTC)
    return User(
        name=body.name,
        email=body.email,
        mobile=body.mobile,
        agree_sms=body.agree_sms,
        agree_email=body.agree_email,
        terms_agreed_at=now,
        privacy_agreed_at=now,
        last_login_at=now,
        **fields,
    )


async def _save_new_member(db: AsyncSession, user: User) -> None:
    db.add(user)
    try:
        # Commit before responding so the next request (/me) already sees the member
        await db.commit()
    except IntegrityError:
        # Lost a race with a simultaneous sign-up using the same id or email
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 가입된 아이디 또는 이메일입니다.")


# --- ID / password ---------------------------------------------------------


@router.get("/login-id-available", response_model=LoginIdAvailableOut)
async def login_id_available(
    login_id: Annotated[str, Query(pattern=LOGIN_ID_PATTERN)],
    db: AsyncSession = Depends(get_db),
):
    taken = await db.scalar(select(func.count()).where(User.login_id == login_id))
    return LoginIdAvailableOut(available=not taken)


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: RegisterIn, response: Response, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(func.count()).where(User.login_id == body.login_id)):
        raise HTTPException(status_code=409, detail="이미 사용 중인 아이디입니다.")
    if await _email_taken(db, body.email):
        raise HTTPException(status_code=409, detail=EMAIL_TAKEN)

    user = _new_member(
        body,
        login_id=body.login_id,
        password_hash=hash_password(body.password),
        social_accounts=[],
    )
    await _save_new_member(db, user)
    start_session(response, user)
    return user


@router.post("/login", response_model=UserOut)
async def login(body: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.login_id == body.login_id.strip().lower()))
    if not verify_password(body.password, user.password_hash if user else None):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 일치하지 않습니다.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="이용이 제한된 계정입니다. 고객센터로 문의해 주세요.")

    user.last_login_at = datetime.now(UTC)
    await db.commit()
    start_session(response, user)
    return user


@router.post("/logout", status_code=204)
async def logout(response: Response):
    clear_cookie(response, SESSION_COOKIE)


@router.get("/me", response_model=UserOut | None)
async def me(user: User | None = Depends(get_optional_user)):
    # 200 with null for guests, so the storefront can ask on every page without errors
    return user


# --- Kakao / Naver -----------------------------------------------------------
# 1. /{provider}/login    → redirect to Kakao/Naver with a CSRF state cookie
# 2. /{provider}/callback → existing member: sign in. New: stash the profile in a
#                           short-lived cookie and send them to /join/social
# 3. /social/pending      → the join page reads the stashed profile to prefill
# 4. /social/complete     → terms agreed, member created, signed in


def _login_error(code: str) -> RedirectResponse:
    response = RedirectResponse(f"{settings.public_url}/login?error={code}", status_code=302)
    clear_cookie(response, OAUTH_STATE_COOKIE)
    return response


def _safe_next(next_path: str) -> str:
    # Only same-site paths, so the login can't be used as an open redirect
    return next_path if next_path.startswith("/") and not next_path.startswith("//") else "/"


@router.get("/social/pending", response_model=SocialPendingOut)
async def social_pending(
    social_signup: Annotated[str | None, Cookie(alias=SOCIAL_SIGNUP_COOKIE)] = None,
):
    pending = decode_token(social_signup, SOCIAL_SIGNUP_COOKIE)
    if pending is None:
        raise HTTPException(status_code=404, detail="가입 정보가 만료되었습니다. 다시 시도해 주세요.")
    return SocialPendingOut(**pending)


@router.post("/social/complete", response_model=UserOut, status_code=201)
async def social_complete(
    body: SocialCompleteIn,
    response: Response,
    social_signup: Annotated[str | None, Cookie(alias=SOCIAL_SIGNUP_COOKIE)] = None,
    db: AsyncSession = Depends(get_db),
):
    pending = decode_token(social_signup, SOCIAL_SIGNUP_COOKIE)
    if pending is None:
        raise HTTPException(status_code=400, detail="가입 정보가 만료되었습니다. 다시 시도해 주세요.")
    provider = SocialProvider(pending["provider"])

    already = await db.scalar(
        select(func.count()).where(
            SocialAccount.provider == provider,
            SocialAccount.provider_user_id == pending["provider_user_id"],
        )
    )
    if already:
        raise HTTPException(status_code=409, detail="이미 가입된 계정입니다. 다시 로그인해 주세요.")
    if await _email_taken(db, body.email):
        raise HTTPException(status_code=409, detail=EMAIL_TAKEN)

    user = _new_member(
        body,
        social_accounts=[
            SocialAccount(
                provider=provider,
                provider_user_id=pending["provider_user_id"],
                email=pending["email"],
            )
        ],
    )
    await _save_new_member(db, user)
    clear_cookie(response, SOCIAL_SIGNUP_COOKIE)
    start_session(response, user)
    return user


@router.get("/{provider}/login")
async def social_login(provider: SocialProvider, next: str = "/"):
    if not social.is_configured(provider):
        return _login_error("not_configured")

    state = secrets.token_urlsafe(24)
    response = RedirectResponse(social.authorize_url(provider, state), status_code=302)
    token = encode_token(
        OAUTH_STATE_COOKIE,
        {"state": state, "provider": provider.value, "next": _safe_next(next)},
        OAUTH_STATE_TTL,
    )
    set_cookie(response, OAUTH_STATE_COOKIE, token, OAUTH_STATE_TTL)
    return response


@router.get("/{provider}/callback")
async def social_callback(
    provider: SocialProvider,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    oauth_state: Annotated[str | None, Cookie(alias=OAUTH_STATE_COOKIE)] = None,
    db: AsyncSession = Depends(get_db),
):
    if error:
        # e.g. the user pressed 취소 on the consent screen
        return _login_error("cancelled")

    saved = decode_token(oauth_state, OAUTH_STATE_COOKIE)
    if (
        saved is None
        or saved["provider"] != provider.value
        or not code
        or not state
        or not secrets.compare_digest(state, saved["state"])
    ):
        return _login_error("expired")

    try:
        profile = await social.fetch_profile(provider, code, state)
    except social.SocialLoginError:
        logger.exception("Social login failed")
        return _login_error("failed")

    account = await db.scalar(
        select(SocialAccount)
        .options(selectinload(SocialAccount.user))
        .where(
            SocialAccount.provider == provider,
            SocialAccount.provider_user_id == profile.provider_user_id,
        )
    )

    if account is None:
        # First visit: collect terms consent before creating the member
        response = RedirectResponse(f"{settings.public_url}/join/social", status_code=302)
        pending = encode_token(
            SOCIAL_SIGNUP_COOKIE,
            {**asdict(profile), "provider": provider.value},
            SOCIAL_SIGNUP_TTL,
        )
        set_cookie(response, SOCIAL_SIGNUP_COOKIE, pending, SOCIAL_SIGNUP_TTL)
    else:
        user = account.user
        if not user.is_active:
            return _login_error("inactive")
        user.last_login_at = datetime.now(UTC)
        await db.commit()
        response = RedirectResponse(f"{settings.public_url}{saved['next']}", status_code=302)
        start_session(response, user)

    clear_cookie(response, OAUTH_STATE_COOKIE)
    return response
