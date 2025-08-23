import mimetypes
import os
from uuid import UUID, uuid4
from fastapi import Body, APIRouter, Depends, Form, HTTPException, UploadFile, File, status, BackgroundTasks, Request

from fastapi.responses import FileResponse
from sqlalchemy import desc, exists
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

upload_dir = "uploads"
os.makedirs(upload_dir, exist_ok=True)


@chat.post('/invite/friend')
async def send_request(
    data: FriendRequestSchema,
    backgroundTask: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return await send_friend_request(db=db, current_user=current_user, data=data, backgroundTask=backgroundTask)


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


@chat.post('/markread/{chat_id}')
async def mark_read_messages(chat_id: UUID, current_user: Users = Depends(user_service.get_current_user), db: Session = Depends(get_db)):

    message = db.query(Message).filter(
        Message.chat_id == chat_id,
        Message.sender_id != current_user.id,
        Message.is_read == False

    ).update({"is_read": True})

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='no unread messages')

    db.commit()

    return {'msg': 'marked as read'}


@chat.post('/file/upload')
async def file_upload(request: Request, sender_id: int = Form(...), chat_id: UUID = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):

    max_size = 50 * 1024 * 1024
    size = 0

    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, 'wb') as f:
        while chunk := await file.read(1024*1024):
            size += len(chunk)
            if size > max_size:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail='File is too large!')

            f.write(chunk)

    mime_type, _ = mimetypes.guess_type(file.filename)
    file_url = str(request.url_for('get_file', filename=file_name))
    print(file_url)

    new_message = Message(sender_id=sender_id, chat_id=chat_id,
                          file_url=file_url, file_name=file.filename, unique_name=file_name, file_type=mime_type)

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {
        "url": new_message.file_url,
        "file_type": new_message.file_type,
        "file_name": new_message.file_name,
        "unique_name": new_message.unique_name
    }


@chat.get('/file/{filename}', name='get_file')
async def get_file(filename: str, db: Session = Depends(get_db)):

    exisiting_file = db.query(Message).filter(
        Message.unique_name == filename).first()

    if not exisiting_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="file not found in db")

    file_path = os.path.join(upload_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="file not found in system")

    return FileResponse(file_path)
