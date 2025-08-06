from datetime import date
from pydantic import BaseModel, EmailStr, Field, validator


class TokenData(BaseModel):

    email: EmailStr


class RefreshToken(BaseModel):

    token: str


class FriendRequestSchema(BaseModel):

    email: EmailStr


class UpdateProfile(BaseModel):

    first_name: str
    last_name: str
    d_o_b: date = Field(..., description="User's date of birth")
    about: str

    @validator("d_o_b")
    def past_d_o_b(cls, v):
        if v >= date.today():
            raise ValueError("Date of birth must be in past")
        return v
