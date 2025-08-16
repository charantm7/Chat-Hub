import json
from datetime import datetime, tzinfo, timezone
import pytz
from fastapi import HTTPException, status

from fastapi.encoders import jsonable_encoder
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import aliased, Session

from app.schemas.user_schema import User
from app.core.redis_script import redis_manager
from app.models.user_model import (
    Users,
    FriendRequest,
    RequestStatus,
    Chats,
    ChatMembers,
    Message
)


async def send_friend_request(db: Session, data, current_user):

    client = await redis_manager.get_client()

    target_user = await client.get(f'user:{data.email}')
    if target_user:
        target_user = json.loads(target_user)
        target_user = User(**target_user)
    else:
        result = db.query(Users).filter(Users.email == data.email)
        target_user = result.one_or_none()

        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user_data = User.model_validate(target_user)

        await client.set(f"user:{data.email}", json.dumps(user_data.model_dump(mode='json')))

    if target_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="You can not send request to your self")

    cached_existing_request = await client(f'friend_request:{target_user.id}-{current_user.id}')
    if cached_existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Request already sent")

    existing_request = db.query(FriendRequest).filter(
        FriendRequest.from_user_id == current_user.id,
        FriendRequest.to_user_id == target_user.id,
        or_(
            FriendRequest.status == RequestStatus.pending,
            FriendRequest.status == RequestStatus.accepted
        )
    ).first()
    await client.set(f'friend_request:{target_user.id}-{current_user.id}', json.dumps)

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Request already sent")

    new_request = FriendRequest(
        from_user_id=current_user.id, to_user_id=target_user.id)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "success": True,
        "message": "Friend request sent successfully",
        "data": {
            "request_id": new_request.id,
            "status": new_request.status,
            "to_user": {
                "id": target_user.id,
                "name": target_user.name,
                "email": target_user.email,
            },
            "created_at": new_request.created_at.isoformat()
        }

    }


async def incomming_friend_request(db, current_user):
    FR = aliased(FriendRequest)
    requests = (
        db.query(Users, FR.id.label('request_id'))
        .join(FR, FR.from_user_id == Users.id)
        .filter(FR.to_user_id == current_user.id, FR.status == RequestStatus.pending).all()
    )

    if not requests:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No request found')

    response = [
        {
            'request_id': request_id,
            'user': jsonable_encoder(user)
        }
        for user, request_id in requests
    ]
    return response


async def accept_friend_request(db, current_user, id):

    request = db.query(FriendRequest).filter(
        FriendRequest.id == id,
        FriendRequest.to_user_id == current_user.id,
        FriendRequest.status == RequestStatus.pending
    ).one_or_none()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending friend request found"
        )

    request.status = RequestStatus.accepted
    db.commit()

    new_chat = Chats()
    db.add(new_chat)
    db.flush()

    db.add_all([
        ChatMembers(user_id=current_user.id, chat_id=new_chat.id),
        ChatMembers(user_id=request.from_user_id, chat_id=new_chat.id)
    ])

    db.commit()

    return {
        "success": True,
        "message": "Friend request accepted successfully",
        "data": {
            "request_id": id,
            "chat_id": new_chat.id,
            "created_at": new_chat.created_at,
            "current_user": current_user.id,
            "friend": request.from_user_id
        }
    }


async def reject_friend_request(db, current_user, id):

    request = db.query(FriendRequest).filter(
        FriendRequest.id == id,
        FriendRequest.to_user_id == current_user.id,
        FriendRequest.status == RequestStatus.pending
    ).one_or_none()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found"
        )

    request.status = RequestStatus.rejected
    db.commit()

    return {
        "success": True,
        "message": "Friend reuqest rejected",
        "data": {
            "request_id": id,
            "current_user": current_user.id,
            "not_friend": request.from_user_id,
        }
    }


async def get_accepted_friends(db, current_user):

    accepted_friends = db.query(FriendRequest).filter(
        FriendRequest.status == RequestStatus.accepted,
        or_(
            FriendRequest.from_user_id == current_user.id,
            FriendRequest.to_user_id == current_user.id
        )
    ).all()

    friends = []

    chat_member_1 = aliased(ChatMembers)
    chat_member_2 = aliased(ChatMembers)

    for req in accepted_friends:

        friend = req.to_user if req.from_user_id == current_user.id else req.from_user

        chat = (
            db.query(Chats)
            .join(chat_member_1, Chats.id == chat_member_1.chat_id)
            .filter(chat_member_1.user_id == friend.id)
            .join(chat_member_2, Chats.id == chat_member_2.chat_id)
            .filter(chat_member_2.user_id == current_user.id)
            .first()
        )

        last_message_time = None
        last_message = None
        unread = None
        if chat:

            last_message = (
                db.query(Message).filter(
                    Message.chat_id == chat.id,
                    Message.sender_id != current_user.id,
                ).order_by(desc(Message.sent_at)).first()
            )
            if last_message:
                last_message_time = last_message.sent_at
                last_message = last_message.content

            unread = db.query(Message).filter(
                Message.chat_id == chat.id,
                Message.sender_id != current_user.id,
                Message.is_read == False

            ).count()

        friends.append({
            "id": friend.id,
            "name": friend.name,
            "first_name": friend.first_name,
            "about": friend.about,
            "last_name": friend.last_name,
            "d_o_b": friend.date_of_birth,
            "email": friend.email,
            "picture": friend.picture,
            "chat_id": chat.id if chat else None,
            "last_message_time": last_message_time,
            "last_message": last_message,
            "unread": unread
        })

        friends.sort(
            key=lambda f: (
                f["last_message_time"].replace(tzinfo=timezone.utc) if isinstance(f["last_message_time"], datetime) and f["last_message_time"].tzinfo is None
                else f["last_message_time"] or datetime(1970, 1, 1, tzinfo=timezone.utc)
            ),
            reverse=True
        )
    print(friends)
    return friends


async def send_messages(db, chat_id, content, current_user):

    chat = db.query(Chats).filter(Chats.id == chat_id).first()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found!")

    chat_members = db.query(ChatMembers).filter(
        ChatMembers.chat_id == chat.id).all()

    friend = []
    for member in chat_members:

        if member.user_id == current_user.id:
            continue

        else:
            friend.append({'to_user': member.user_id})

    new_message = Message(
        chat_id=chat.id, sender_id=current_user.id, content=content.get('content'))
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {
        "success": True,
        "message": "Message sent successfully",
        "data": {
            "chat_id": chat_id,
            "content": content,
            "from_user": current_user.id,
            "to_user": friend[0]['to_user'],
            "sent_at": new_message.sent_at
        }
    }


async def get_messages(db, chat_id):

    chat = db.query(Chats).filter(Chats.id == chat_id).first()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="chat not found")

    messages = db.query(Message).filter(
        Message.chat_id == chat.id
    ).order_by(desc(Message.sent_at)).all()

    if not messages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    ist = pytz.timezone("Asia/Kolkata")  # if you want IST time
    formatted_messages = [
        {
            "id": m.id,
            "chat_id": m.chat_id,
            "sender_id": m.sender_id,
            "content": m.content,
            "sent_at": m.sent_at.isoformat(),
            "sent_time": m.sent_at.astimezone(ist).strftime("%I:%M %p")

        }
        for m in messages
    ]

    return {
        "success": True,
        "messages": formatted_messages,

    }


async def update_read_receipt(db, message_id, status):

    message = db.query(Message).filter(Message.id == message_id).one_or_none()

    if not message:
        raise HTTPException(
            status_code=404, detail="message not found to update read receipt")
    message.status = status
    db.commit()
    return 'Updated'


async def find_user_through_message(db, message_id):

    user = db.query(Message).filter(Message.id == message_id).one_or_none()

    if not user:
        raise HTTPException(
            status_code=404, detail="user not found with message id")

    return user.sender_id
