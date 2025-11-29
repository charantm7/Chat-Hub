import mimetypes
import os
from uuid import UUID, uuid4
from fastapi import (
    Body,
    APIRouter,
    Depends,
    Form,
    HTTPException,
    UploadFile,
    File,
    status,
    BackgroundTasks,
    Request)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session


from app.core.psql_connection import get_db
from app.schemas.user_schema import FriendRequestSchema
from app.models.user_model import Users, Chats, ChatMembers, Message
from app.services.user_service import get_current_user
from .service import (

    ChatService,
    ChatOnWebsocket
)
from backend.app.services import user_service
from app.core.websocket import manager


chat = APIRouter()

upload_dir = "uploads"
os.makedirs(upload_dir, exist_ok=True)


@chat.post('/invite/friend')
async def send_request(
    data: FriendRequestSchema,
    backgroundTask: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await ChatService(db=db, current_user=current_user).send_friend_request(data=data, backgroundTask=backgroundTask)


@chat.get('/friend-requests')
async def incomming_request(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await ChatService(db=db, current_user=current_user).incomming_friend_request()


@chat.post('/friend-requests/{id}/accept')
async def accept_request(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await ChatService(db=db, current_user=current_user).accept_friend_request(id=id)


@chat.post('/friend-requests/{id}/reject')
async def reject_request(
    id: UUID,
    db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    return await ChatService(db=db, current_user=current_user).reject_friend_request(id=id)


@chat.get('/friends')
async def get_friends(
    db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    return await ChatService(db=db, current_user=current_user).get_accepted_friends()


@chat.post('/{chat_id}/message')
async def send_message(
    chat_id: UUID,
    content: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await ChatService(current_user=current_user, db=db).send_messages(
        chat_id=chat_id,
        content=content
    )


@chat.get('/{chat_id}/message')
async def get_message(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await ChatService(db=db, current_user=current_user).get_messages(chat_id=chat_id)


@chat.delete('/delete/{message_id}')
async def delete_message(
        message_id: UUID,
        db: Session = Depends(get_db),
        current_user: Users = Depends(user_service.get_current_user)):
    return await ChatService(db=db, current_user=current_user).delete_messages(message_id=message_id)


@chat.post('/markread/{chat_id}')
async def mark_read_messages(
        chat_id: UUID,
        current_user: Users = Depends(user_service.get_current_user),
        db: Session = Depends(get_db)):

    return await ChatService(db=db, current_user=current_user).mark_read_messages_service(chat_id=chat_id, )


@chat.post('/file/upload')
async def file_upload(
        request: Request,
        sender_id: int = Form(...),
        chat_id: UUID = Form(...),
        is_group: bool = Form(...),
        file: UploadFile = File(...),
        db: Session = Depends(get_db)):

    return await ChatService(db=db).file_upload_service(request=request, sender_id=sender_id, chat_id=chat_id, is_group=is_group, file=file)


@chat.get('/file/{filename}', name='get_file')
async def get_file(
        filename: str,
        db: Session = Depends(get_db)):

    return await ChatService(db=db).get_file_service(filename=filename)


@chat.post("/delete/{message_id}")
async def delete_msg(
        message_id: UUID,
        db: Session = Depends(get_db)):

    return await ChatOnWebsocket(db=db).delete_msg_tosocket(message_id=message_id)


@chat.put('/edit/message/{message_id}')
async def edit_message(
        message_id: UUID,
        content: str = Form(...),
        db: Session = Depends(get_db)):

    return await ChatOnWebsocket(db=db).edit_message_tosocket(message_id=message_id, content=content)


@chat.post('/create/group')
async def create_group(
        name: str = Form(...),
        member_ids: list[int] = Form(...),
        db: Session = Depends(get_db),
        current_user: Users = Depends(user_service.get_current_user)):

    return await ChatService(db=db, current_user=current_user).create_group_service(name=name, member_ids=member_ids)
