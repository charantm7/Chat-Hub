
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict

from app.models.user_model import PaymentStatus, ProPlan


class PaymentsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[UUID] = None
    user_id: Optional[int] = None
    amount: Optional[int] = None
    currency: Optional[str] = None
    status: Optional[PaymentStatus] = None
    payment_gateway: Optional[str] = None
    plan: Optional[ProPlan] = None
    expiry_date: Optional[datetime] = None
    created_at: Optional[datetime] = None


class User(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    about: Optional[str] = None
    picture: Optional[str] = None
    is_verified: Optional[bool] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    is_pro: Optional[bool] = None
    pro_expiry: Optional[datetime] = None
    payments: Optional[List[PaymentsSchema]] = None


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
