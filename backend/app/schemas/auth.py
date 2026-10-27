import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, StringConstraints

from app.models import SocialProvider

# Rules mirror the hints on the join form (frontend/src/lib/site-config.ts)
LOGIN_ID_PATTERN = r"^[a-z0-9]{4,16}$"
MOBILE_PATTERN = r"^01[016789]-\d{3,4}-\d{4}$"

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Mobile = Annotated[str, StringConstraints(pattern=MOBILE_PATTERN)]
Email = Annotated[EmailStr, AfterValidator(str.lower)]


def _check_password(value: str) -> str:
    kinds = sum(
        bool(re.search(pattern, value))
        for pattern in (r"[A-Za-z]", r"\d", r"[^A-Za-z\d\s]")
    )
    if not 10 <= len(value) <= 16 or kinds < 2 or re.search(r"\s", value):
        raise ValueError("비밀번호는 영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10~16자로 입력해 주세요.")
    return value


Password = Annotated[str, AfterValidator(_check_password)]


class AgreementsIn(BaseModel):
    agree_terms: Literal[True]
    agree_privacy: Literal[True]
    is_over_14: Literal[True]
    agree_sms: bool = False
    agree_email: bool = False


class ProfileIn(AgreementsIn):
    name: Name
    email: Email
    mobile: Mobile | None = None


class RegisterIn(ProfileIn):
    login_id: Annotated[str, StringConstraints(pattern=LOGIN_ID_PATTERN)]
    password: Password


class SocialCompleteIn(ProfileIn):
    pass


class LoginIn(BaseModel):
    login_id: str
    password: str


class FindIdIn(BaseModel):
    name: Name
    email: Email


class FoundAccountOut(BaseModel):
    # Partly hidden (ab****); the full id goes to the member's email. None for Kakao/Naver-only members.
    login_id: str | None
    providers: list[SocialProvider]
    created_at: datetime


class PasswordResetRequestIn(BaseModel):
    login_id: str
    email: Email


class PasswordResetIn(BaseModel):
    token: str
    password: Password


class LoginIdAvailableOut(BaseModel):
    available: bool


class SocialPendingOut(BaseModel):
    provider: SocialProvider
    name: str | None
    email: str | None
    mobile: str | None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    login_id: str | None
    name: str
    email: str
    mobile: str | None
    mileage: int
    providers: list[SocialProvider]
