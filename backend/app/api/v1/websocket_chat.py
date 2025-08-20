from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends

from sqlalchemy.orm import Session
from app.core.psql_connection import get_db
from app.models.user_model import ChatMembers, Message, MessageStatus
from app.services.user_service import get_current_user_ws
from app.services.chat_service import update_read_receipt, find_user_through_message
from app.core.websocket import manager

ws_chat = APIRouter()


@ws_chat.websocket('/{chat_id}')
async def websocket_chat(chat_id: UUID, websocket: WebSocket,  db: Session = Depends(get_db)):

    print("connected")

    current_user = await get_current_user_ws(websocket=websocket, db=db)

    print("authenticated")
    print(current_user)
    member = db.query(ChatMembers).filter(
        ChatMembers.chat_id == chat_id, ChatMembers.user_id == current_user.id).first()

    if not member:
        await websocket.close(code=1008)

        return

    await manager.connect(chat_id=chat_id, websocket=websocket, user_id=member.user_id)

    try:

        while True:

            data = await websocket.receive_json()

            content = data.get('data')
            message_type = data.get('type')

            if message_type == 'message_read':

                message_ids = data.get('message_ids')
                chat_ids = data.get('chat_id')

                if message_ids and isinstance(message_ids, list):
                    print('db- entering')

                    db.query(Message).filter(
                        Message.is_read == False,
                        Message.chat_id == chat_id
                    ).update({Message.is_read: True}, synchronize_session=False)
                    print('entered')

                    db.commit()

                await manager.broadcast(
                    chat_id,
                    {"type": 'message_read',
                     'chat_id': chat_ids,
                     'message_ids': message_ids}
                )

            else:

                new_message = Message(
                    chat_id=chat_id,
                    sender_id=current_user.id,
                    content=content
                )

                db.add(new_message)
                db.commit()
                db.refresh(new_message)

                await manager.broadcast(
                    chat_id,
                    {"type": message_type,
                        "id": str(new_message.id),
                        "sender_id": current_user.id,
                        "sender": current_user.name,
                        "content": content,
                        "sent_at": new_message.sent_at.strftime("%I:%M %p"),
                        "sent_time": new_message.sent_at.strftime("%I:%M %p"),
                        "is_read": new_message.is_read
                     }
                )
    except WebSocketDisconnect:
        await manager.disconnect(
            chat_id=chat_id, websocket=websocket, user_id=member.user_id)
