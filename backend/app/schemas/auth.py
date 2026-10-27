import re
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, StringConstraints, field_validator

from app.models import SocialProvider

# Rules mirror the hints on the join form (frontend/src/lib/site-config.ts)
LOGIN_ID_PATTERN = r"^[a-z0-9]{4,16}$"
MOBILE_PATTERN = r"^01[016789]-\d{3,4}-\d{4}$"

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Mobile = Annotated[str, StringConstraints(pattern=MOBILE_PATTERN)]


class AgreementsIn(BaseModel):
    agree_terms: Literal[True]
    agree_privacy: Literal[True]
    is_over_14: Literal[True]
    agree_sms: bool = False
    agree_email: bool = False


class ProfileIn(AgreementsIn):
    name: Name
    email: EmailStr
    mobile: Mobile | None = None

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()


class RegisterIn(ProfileIn):
    login_id: Annotated[str, StringConstraints(pattern=LOGIN_ID_PATTERN)]
    password: str

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        kinds = sum(
            bool(re.search(pattern, value))
            for pattern in (r"[A-Za-z]", r"\d", r"[^A-Za-z\d\s]")
        )
        if not 10 <= len(value) <= 16 or kinds < 2 or re.search(r"\s", value):
            raise ValueError("비밀번호는 영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10~16자로 입력해 주세요.")
        return value


class SocialCompleteIn(ProfileIn):
    pass


class LoginIn(BaseModel):
    login_id: str
    password: str


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
