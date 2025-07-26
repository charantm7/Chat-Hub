from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends

from sqlalchemy.orm import Session

from app.core.psql_connection import get_db
from app.models.user_model import ChatMembers, Message
from app.services.user_service import get_current_user_ws
from app.core.websocket import manager

ws_chat = APIRouter()


@ws_chat.websocket('/{chat_id}')
async def websocket_chat(chat_id: UUID, websocket: WebSocket,  db: Session = Depends(get_db)):

    print("connected")

    current_user = await get_current_user_ws(websocket=websocket, db=db)

    print("authenticated")

    member = db.query(ChatMembers).filter(ChatMembers.chat_id == chat_id, ChatMembers.user_id == current_user.id).first()

    if not member:
        await websocket.close(code=1008)

        return

    await manager.connect(chat_id=chat_id, websocket=websocket)

    try:

        while True:

            data = await websocket.receive_json()
            content = data.get('data')

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
                    "sender": current_user.name,
                    "message": content,
                    "timestamp": new_message.sent_at.isoformat()
                }
            )
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)