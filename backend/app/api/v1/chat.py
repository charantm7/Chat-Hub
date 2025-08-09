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
from backend.app.services import user_service


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


@chat.delete('/delete/{message_id}')
async def delete_message(message_id: UUID, db: Session = Depends(get_db), current_user: Users = Depends(user_service.get_current_user)):

    message_query = db.query(Message).filter(
        Message.id == message_id, Message.sender_id == current_user.id)

    message = message_query.one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    message_query.delete(synchronize_session=False)
    db.commit()

    return {'msg': 'Message deleted'}


@chat.get('/unread/{chat_id}')
async def get_unread_messages(chat_id: UUID, current_user: Users = Depends(user_service.get_current_user), db: Session = Depends(get_db)):

    messages = db.query(Message).filter(
        Message.chat_id == chat_id,
        Message.sender_id != current_user.id,
        Message.is_read == False

    ).count()

    if not messages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='no unread messages')

    return messages
