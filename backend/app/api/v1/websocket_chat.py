from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends

from sqlalchemy.orm import Session
from app.core.psql_connection import get_db
from app.models.user_model import ChatMembers, Message, MessageStatus
from app.services.user_service import get_current_user_ws
from app.services.chat_service import update_read_receipt, find_user_through_message
from app.core.websocket import manager

ws_chat = APIRouter()


@ws_chat.websocket('/{current_user_id}')
async def websocket_chat(current_user_id: int, websocket: WebSocket,  db: Session = Depends(get_db)):

    print("connected")

    current_user = await get_current_user_ws(websocket=websocket, db=db)

    print("authenticated")

    if current_user.id != current_user_id:
        await websocket.close(code=1008)

        return

    await manager.connect(chat_id=current_user_id, websocket=websocket, user_id=current_user_id)

    try:

        while True:

            data = await websocket.receive_json()

            content = data.get('data')
            message_type = data.get('type')
            chat_id = data.get('chat_id')
            members = db.query(ChatMembers.user_id).filter(
                ChatMembers.chat_id == chat_id).all()
            user_ids = [m.user_id for m in members]
            print(data)
            if message_type == 'message_read':

                message_ids = data.get('message_ids')
                chat_ids = data.get('chat_id')

                if message_ids and isinstance(message_ids, list):

                    db.query(Message).filter(
                        Message.is_read == False,
                        Message.chat_id == chat_id
                    ).update({Message.is_read: True}, synchronize_session=False)

                    db.commit()

                await manager.broadcast(
                    chat_id,
                    user_ids,
                    {"type": 'message_read',
                     'chat_id': chat_ids,
                     'message_ids': message_ids}
                )

            elif message_type == 'typing':

                sender_id = data.get('sender_id')
                isTyping = data.get('isTyping')

                await manager.broadcast(
                    chat_id,
                    user_ids,

                    {
                        'type': 'typing',
                        'sender_id': sender_id,
                        'isTyping': isTyping
                    }
                )

            elif message_type == 'file':

                sender_id = data.get('sender_id')
                content = data.get('data')
                file_name = content['file_name']
                file_url = content['file_url']
                file_type = content['file_type']
                unique_name = content['unique_name']
                size = content['size']
                is_group = data.get("is_group")
                sender = content['sender']

                file_message = db.query(Message).filter(
                    Message.unique_name == unique_name).one_or_none()

                if file_message:

                    await manager.broadcast(
                        chat_id,
                        user_ids,
                        {"type": message_type,
                            "id": str(file_message.id),
                            "sender_id": current_user.id,
                            "sender_name": current_user.name,
                            "sender": {
                                "name": sender['name'],
                                "picture": sender['picture']
                            },
                            "file_name": file_name,
                            "file_url": file_url,
                            "size": size,
                            "file_type": file_type,
                            "sent_at": file_message.sent_at.strftime("%I:%M %p"),
                            "sent_time": file_message.sent_at.strftime("%I:%M %p"),
                            "is_read": file_message.is_read,
                            "is_group": is_group
                         }
                    )

            else:

                reply_to = data.get('reply_to')
                is_group = data.get("is_group")
                brodcast_message = {}
                if reply_to:
                    new_message = Message(
                        chat_id=chat_id,
                        sender_id=current_user.id,
                        content=content,
                        reply_to=reply_to,
                        is_group=is_group
                    )

                    db.add(new_message)
                    db.commit()
                    db.refresh(new_message)

                    reply_message = db.query(Message).filter(
                        Message.id == reply_to).one_or_none()

                    if reply_message:
                        brodcast_message.update({
                            "type": message_type,
                            "id": str(new_message.id),
                            "sender_id": current_user.id,
                            "sender_name": current_user.name,
                            "sender": {
                                "name": new_message.sender.name,
                                "picture": new_message.sender.picture
                            },
                            "content": content,
                            "sent_at": new_message.sent_at.strftime("%I:%M %p"),
                            "sent_time": new_message.sent_at.strftime("%I:%M %p"),
                            "is_read": new_message.is_read,
                            "is_deleted": new_message.is_deleted,
                            "reply_to": str(new_message.reply_to),
                            "reply_content": reply_message.content,
                            "reply_file_name": reply_message.file_name,
                            "reply_file_url": reply_message.file_url,
                            "reply_file_type": reply_message.file_type,
                            "is_group": is_group,
                            "reply_sender": {
                                "id": reply_message.sender.id,
                                "name": reply_message.sender.name,
                            }
                        })
                else:
                    new_message = Message(
                        chat_id=chat_id,
                        sender_id=current_user.id,
                        content=content,
                        is_group=is_group
                    )
                    db.add(new_message)
                    db.commit()
                    db.refresh(new_message)

                    brodcast_message.update({
                        "type": message_type,
                        "id": str(new_message.id),
                        "chat_id": str(chat_id),
                        "sender_id": current_user.id,
                        "sender_name": current_user.name,
                        "sender": {
                            "name": new_message.sender.name,
                            "picture": new_message.sender.picture
                        },
                        "content": content,
                        "sent_at": new_message.sent_at.strftime("%I:%M %p"),
                        "sent_time": new_message.sent_at.astimezone().strftime("%I:%M %p"),
                        "is_read": new_message.is_read,
                        "is_deleted": new_message.is_deleted,
                        "is_group": is_group
                    })

                db.add(new_message)
                db.commit()
                db.refresh(new_message)
                print(f"user ids to broadcast", user_ids)
                await manager.broadcast(
                    chat_id,
                    user_ids,
                    brodcast_message
                )
    except WebSocketDisconnect:
        await manager.disconnect(
            chat_id=chat_id, websocket=websocket, user_id=current_user_id)
