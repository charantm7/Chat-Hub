from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class TokenData(BaseModel):

    email: EmailStr


class RefreshToken(BaseModel):

    token: str


class FriendRequestSchema(BaseModel):

    email: EmailStr


class UpdateProfile(BaseModel):

    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    d_o_b: Optional[date] = Field(None, description="User's date of birth")
    about: Optional[str] = None

    @validator("d_o_b")
    def past_d_o_b(cls, v):
        if v is not None and v >= date.today():
            raise ValueError("Date of birth must be in past")
        return v
