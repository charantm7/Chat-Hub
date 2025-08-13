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
            print("Received from client:", data)
            content = data.get('data')
            data_type = data.get('type')

            if data_type == 'read_receipt':

                message_id = data.get('message_id')
                if not message_id:
                    await websocket.send_json({
                        "type": "error",

                    })
                    continue

                await update_read_receipt(db=db, message_id=message_id, status=MessageStatus.read)

                sender_id = await find_user_through_message(db=db, message_id=message_id)

                await manager.broadcast(chat_id, {
                    'type': "message_read",
                    'message_id': message_id,
                    'sender_id': sender_id
                })

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
                {
                    "id": str(new_message.id),
                    "sender_id": current_user.id,
                    "sender": current_user.name,
                    "content": content,
                    "sent_at": new_message.sent_at.strftime("%I:%M %p"),
                    "sent_time": new_message.sent_at.strftime("%I:%M %p")
                }
            )
    except WebSocketDisconnect:
        await manager.disconnect(
            chat_id=chat_id, websocket=websocket, user_id=member.user_id)
