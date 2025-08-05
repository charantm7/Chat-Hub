from uuid import UUID
from fastapi import Body, APIRouter, Depends, HTTPException, status

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.psql_connection import get_db
from app.schemas.user_schema import FriendRequestSchema
from app.models.user_model import Users, Chats, ChatMembers, Message
from app.services.user_service import get_current_user
from app.services.chat_service import (
    send_friend_request,
    incomming_friend_request,
    accept_friend_request,
    reject_friend_request,
    get_accepted_friends,
    send_messages,
    get_messages,
)


chat = APIRouter()


@chat.post('/invite/friend')
async def send_request(
    data: FriendRequestSchema,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await send_friend_request(db=db, current_user=current_user, data=data)


@chat.get('/friend-requests')
async def incomming_request(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await incomming_friend_request(db=db, current_user=current_user)


@chat.post('/friend-requests/{id}/accept')
async def accept_request(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await accept_friend_request(db=db, current_user=current_user, id=id)


@chat.post('/friend-requests/{id}/reject')
async def reject_request(
    id: UUID,
    db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    return await reject_friend_request(db=db, current_user=current_user, id=id)


@chat.get('/friends')
async def get_friends(
    db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    return await get_accepted_friends(db=db, current_user=current_user)


@chat.post('/{chat_id}/message')
async def send_message(
    chat_id: UUID,
    content: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await send_messages(
        db=db, chat_id=chat_id,
        content=content, current_user=current_user
    )


@chat.get('/{chat_id}/message')
async def get_message(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await get_messages(db=db, chat_id=chat_id)
