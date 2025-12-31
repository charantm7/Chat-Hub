
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.psql_connection import get_db
from app.models.user_model import Users
from app.services import user_service
from app.schemas.user_schema import  UpdateProfile
from app.core.logging_config import get_logger
from .service import get_users_not_friends, update_profile_route


logger = get_logger(__name__)

user_router = APIRouter()

@user_router.get("/get-users")
async def get_users(db: Session = Depends(get_db), current_user: Users = Depends(user_service.get_current_user)):
    return await get_users_not_friends(db=db, current_user=current_user)



@user_router.put("/update/my/profile")
async def update_profile(user_info: UpdateProfile, db: Session = Depends(get_db), current_user: Users = Depends(user_service.get_current_user)):

    return await update_profile_route(user_info=user_info, db=db, current_user=current_user)