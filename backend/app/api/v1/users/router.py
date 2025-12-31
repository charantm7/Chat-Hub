from operator import and_, or_

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.psql_connection import get_db
from app.models.user_model import Users, FriendRequest, RequestStatus
from app.services import user_service
from app.schemas.user_schema import  UpdateProfile
from app.core.logging_config import get_logger


logger = get_logger(__name__)

user_router = APIRouter()

@user_router.get("/get-users")
async def get_users(db: Session = Depends(get_db), current_user: Users = Depends(user_service.get_current_user)):

    friends_query = db.query(FriendRequest.to_user_id).filter(
        and_(
            or_(FriendRequest.status == RequestStatus.accepted,
                FriendRequest.status == RequestStatus.pending),
            FriendRequest.from_user_id == current_user.id
        )

    ).union(
        db.query(FriendRequest.from_user_id).filter(
            and_(
                or_(FriendRequest.status == RequestStatus.accepted,
                    FriendRequest.status == RequestStatus.pending),

                FriendRequest.to_user_id == current_user.id
            )
        )
    )

    not_friends = db.query(Users).filter(
        Users.id != current_user.id, ~Users.id.in_(friends_query)).limit(50).all()

    if not not_friends:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not available")

    return not_friends



@user_router.put("/update/my/profile")
async def update_my_profile(user_info: UpdateProfile, db: Session = Depends(get_db), current_user: Users = Depends(user_service.get_current_user)):

    user_query = db.query(Users).filter(Users.id == current_user.id)

    user = user_query.first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = user_info.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key if key != 'd_o_b' else 'date_of_birth', value)

    db.commit()
    db.refresh(user)

    return user
