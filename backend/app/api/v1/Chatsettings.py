from re import U
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends

from sqlalchemy import and_, case
from app.core.config import settings
from sqlalchemy.orm import Session, aliased
from app.core.psql_connection import get_db
from app.models.user_model import Chats, Message, Users, ChatMembers
from app.services.user_service import get_current_user


router = APIRouter()


@router.get("/chatsettings")
async def chat_restore():
    try:
        # Logic to retrieve chat settings
        settings = {
            "notifications": True,
            "soundEnabled": True,
            "darkMode": False,
            "language": "English",
            "autoSave": True,
            "deleteAfterRestore": 30
        }
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def orm_to_dict(obj):
    return {
        c.name: getattr(obj, c.name)
        for c in obj.__table__.columns
    }


@router.get("/deletedchats")
async def deleted_chats(
    db: Session = Depends(get_db),
    current_user_id: Users = Depends(get_current_user)
):
    try:
        cm1 = aliased(ChatMembers)  # current user
        cm2 = aliased(ChatMembers)  # other user
        OtherUser = aliased(Users)

        query = (
            db.query(
                Chats.id.label("chat_id"),
                case(
                    (Chats.is_group == True, Chats.name),
                    else_=OtherUser.name
                ).label("chat_name")
            )
            # normal joins
            .join(Message, Message.chat_id == Chats.id)
            .join(cm1, cm1.chat_id == Chats.id)

            # join second ChatMembers row to get the other user
            .join(
                cm2,
                and_(
                    cm2.chat_id == Chats.id,
                    cm2.user_id != current_user_id.id  # NOT me
                ),
                isouter=True
            )
            .join(OtherUser, OtherUser.id == cm2.user_id, isouter=True)
            .filter(
                Message.is_deleted == True,
                cm1.user_id == current_user_id.id  # ensure I am part of chat
            )
            .distinct(Chats.id)
        )

        rows = query.all()

        return [
            {"chat_id": str(r.chat_id), "chat_name": r.chat_name}
            for r in rows
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deletedmessages/{chat_id}")
async def get_deleted_messages(chat_id: UUID, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

    q = db.query(Message).filter(Message.chat_id ==
                                 chat_id, Message.is_deleted == True, Message.sender_id == current_user.id).all()

    return q


@router.post("/restoremessage/{message_id}")
async def restore_message(message_id: UUID, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

    message = db.query(Message).filter(
        Message.id == message_id, Message.sender_id == current_user.id).one_or_none()

    if not message:
        raise HTTPException(
            status_code=404, detail="Message not found")

    message.is_deleted = False
    db.commit()

    return {"message": "Message restored successfully"}
