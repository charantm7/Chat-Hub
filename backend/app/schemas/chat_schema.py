from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from app.models.user_model import RequestStatus


class FriendRequestValidate(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: Optional[UUID] = None
    from_user_id: Optional[int] = None
    to_user_id: Optional[int] = None
    status: RequestStatus = None
