from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.schemas.auth import Mobile, Name


class AddressIn(BaseModel):
    label: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
    recipient_name: Name
    recipient_mobile: Mobile
    postal_code: Annotated[str, StringConstraints(pattern=r"^\d{5}$")]
    address1: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
    address2: Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)] | None = None
    # Make this the default. Unticking it on the current default does nothing: one always is.
    is_default: bool = False


class AddressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    recipient_name: str
    recipient_mobile: str
    postal_code: str
    address1: str
    address2: str | None
    is_default: bool
