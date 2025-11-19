import json
import pytz
import os
import mimetypes
from datetime import datetime, timezone
from uuid import UUID, uuid4
from fastapi import HTTPException, status, Request
from fastapi.responses import FileResponse

from fastapi.encoders import jsonable_encoder
from sqlalchemy import Null, desc, func, or_
from sqlalchemy.orm import aliased, Session

from app.schemas.chat_schema import FriendRequestValidate
from app.schemas.user_schema import User
from backend.app.core.redis_script import redis_manager
from app.core.websocket import manager
from app.models.user_model import (
    Users,
    FriendRequest,
    RequestStatus,
    Chats,
    ChatMembers,
    Message
)

upload_dir = "uploads"
os.makedirs(upload_dir, exist_ok=True)


async def send_friend_request(db: Session, data, current_user, backgroundTask):

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

    cached_existing_request = await client.get(f'friend_request:{target_user.id}-{current_user.id}')
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

    if existing_request:

        existing_request = FriendRequestValidate.model_validate(
            existing_request)

        await client.set(f'friend_request:{target_user.id}-{current_user.id}', json.dumps(existing_request.model_dump(mode='json')))

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Request already sent")

    request_data = {
        'from_user_id': current_user.id,
        'to_user_id': target_user.id,
        'status': 'pending'
    }

    await client.set(f'friend_request:{target_user.id}-{current_user.id}', json.dumps(request_data))
    print(datetime.now())
    backgroundTask.add_task(save_friend_request_to_db,
                            db, current_user.id, target_user.id)

    # new_request = FriendRequest(
    #     from_user_id=current_user.id, to_user_id=target_user.id)
    # db.add(new_request)
    # db.commit()
    # db.refresh(new_request)

    # request = FriendRequestValidate.model_validate(new_request)

    # await client.set(f'friend_request:{target_user.id}-{current_user.id}', json.dumps(request.model_dump(mode='json')))

    return {
        "success": True,
        "message": "Friend request sent successfully"
    }


def save_friend_request_to_db(db: Session, from_user: int, to_user: int):

    new_request = FriendRequest(
        from_user_id=from_user, to_user_id=to_user)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    print(datetime.now())


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


async def get_accepted_friends(db: Session, current_user):

    accepted_friends = db.query(FriendRequest).filter(
        FriendRequest.status == RequestStatus.accepted,
        or_(
            FriendRequest.from_user_id == current_user.id,
            FriendRequest.to_user_id == current_user.id
        )
    ).all()

    groups = db.query(Chats).join(ChatMembers, Chats.id == ChatMembers.chat_id).filter(
        ChatMembers.user_id == current_user.id, Chats.is_group == True).all()

    friends = []

    if groups:

        for group in groups:

            unread = db.query(Message).filter(
                Message.chat_id == group.id,
                Message.sender_id != current_user.id,
                Message.is_read == False

            ).count()
            if not unread:
                unread = 0

            friends.append({
                "chat_id": group.id,
                "name": group.name,
                "last_message_time": datetime(1970, 1, 1, tzinfo=timezone.utc),
                "unread": unread,
                "is_group": True
            })

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
            "unread": unread,
            "is_group": False
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

    formatted_messages = []

    for m in messages:

        base_data = {
            "id": m.id,
            "chat_id": m.chat_id,
            "sender_id": m.sender_id,
            "content": m.content,
            "sent_at": m.sent_at.isoformat(),
            "sent_time": m.sent_at.astimezone(ist).strftime("%I:%M %p"),
            "is_read": m.is_read,
            "sender": m.sender,
            "is_deleted": m.is_deleted,
            "is_group": m.is_group,


        }
        if m.file_name is None:
            base_data["content"] = m.content
        else:
            base_data.update(
                {
                    "file_name": m.file_name,
                    "file_url": m.file_url,
                    "file_type": m.file_type,
                    "size": m.file_size
                }
            )

        if m.reply_to != None:

            reply_message = db.query(Message).filter(
                Message.id == m.reply_to).one_or_none()

            if reply_message:
                base_data.update({
                    "reply_to": m.reply_to,
                    "reply_content": reply_message.content,
                    "reply_file_name": reply_message.file_name,
                    "reply_file_url": reply_message.file_url,
                    "reply_file_type": reply_message.file_type,
                    "reply_sender": {
                        "id": reply_message.sender.id,
                        "name": reply_message.sender.name,
                    }
                })

        formatted_messages.append(base_data)

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


async def delete_messages(message_id, db, current_user):

    message_query = db.query(Message).filter(
        Message.id == message_id, Message.sender_id == current_user.id)

    message = message_query.one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    message_query.delete(synchronize_session=False)
    db.commit()

    return {'msg': 'Message deleted'}


async def mark_read_messages_service(
        chat_id,
        current_user,
        db
):

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


class ChatService:
    def __init__(self, db, current_user=None):
        self.db = db
        self.current_user = current_user

    async def send_friend_request(self, data, backgroundTask):

        client = await redis_manager.get_client()

        target_user = await client.get(f'user:{data.email}')
        if target_user:
            target_user = json.loads(target_user)
            target_user = User(**target_user)
        else:
            result = self.db.query(Users).filter(Users.email == data.email)
            target_user = result.one_or_none()

            if not target_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

            user_data = User.model_validate(target_user)

            await client.set(f"user:{data.email}", json.dumps(user_data.model_dump(mode='json')))

        if target_user.id == self.current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="You can not send request to your self")

        cached_existing_request = await client.get(f'friend_request:{target_user.id}-{self.current_user.id}')
        if cached_existing_request:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Request already sent")

        existing_request = self.db.query(FriendRequest).filter(
            FriendRequest.from_user_id == self.current_user.id,
            FriendRequest.to_user_id == target_user.id,
            or_(
                FriendRequest.status == RequestStatus.pending,
                FriendRequest.status == RequestStatus.accepted
            )
        ).first()

        if existing_request:

            existing_request = FriendRequestValidate.model_validate(
                existing_request)

            await client.set(f'friend_request:{target_user.id}-{self.current_user.id}', json.dumps(existing_request.model_dump(mode='json')))

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Request already sent")

        request_data = {
            'from_user_id': self.current_user.id,
            'to_user_id': target_user.id,
            'status': 'pending'
        }

        await client.set(f'friend_request:{target_user.id}-{self.current_user.id}', json.dumps(request_data))
        print(datetime.now())
        backgroundTask.add_task(save_friend_request_to_db,
                                self.db, self.current_user.id, target_user.id)

        # new_request = FriendRequest(
        #     from_user_id=current_user.id, to_user_id=target_user.id)
        # db.add(new_request)
        # db.commit()
        # db.refresh(new_request)

        # request = FriendRequestValidate.model_validate(new_request)

        # await client.set(f'friend_request:{target_user.id}-{current_user.id}', json.dumps(request.model_dump(mode='json')))

        return {
            "success": True,
            "message": "Friend request sent successfully"
        }

    async def incomming_friend_request(self):

        FR = aliased(FriendRequest)
        requests = (
            self.db.query(Users, FR.id.label('request_id'))
            .join(FR, FR.from_user_id == Users.id)
            .filter(FR.to_user_id == self.current_user.id, FR.status == RequestStatus.pending).all()
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

    async def accept_friend_request(self, id):

        request = self.db.query(FriendRequest).filter(
            FriendRequest.id == id,
            FriendRequest.to_user_id == self.current_user.id,
            FriendRequest.status == RequestStatus.pending
        ).one_or_none()

        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pending friend request found"
            )

        request.status = RequestStatus.accepted
        self.db.commit()

        new_chat = Chats()
        self.db.add(new_chat)
        self.db.flush()

        self.db.add_all([
            ChatMembers(user_id=self.current_user.id, chat_id=new_chat.id),
            ChatMembers(user_id=request.from_user_id, chat_id=new_chat.id)
        ])

        self.db.commit()

        return {
            "success": True,
            "message": "Friend request accepted successfully",
            "data": {
                "request_id": id,
                "chat_id": new_chat.id,
                "created_at": new_chat.created_at,
                "current_user": self.current_user.id,
                "friend": request.from_user_id
            }
        }

    async def reject_friend_request(self, id):

        request = self.db.query(FriendRequest).filter(
            FriendRequest.id == id,
            FriendRequest.to_user_id == self.current_user.id,
            FriendRequest.status == RequestStatus.pending
        ).one_or_none()

        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found"
            )

        request.status = RequestStatus.rejected
        self.db.commit()

        return {
            "success": True,
            "message": "Friend reuqest rejected",
            "data": {
                "request_id": id,
                "current_user": self.current_user.id,
                "not_friend": request.from_user_id,
            }
        }

    async def get_accepted_friends(self):

        accepted_friends = self.db.query(FriendRequest).filter(
            FriendRequest.status == RequestStatus.accepted,
            or_(
                FriendRequest.from_user_id == self.current_user.id,
                FriendRequest.to_user_id == self.current_user.id
            )
        ).all()

        groups = self.db.query(Chats).join(ChatMembers, Chats.id == ChatMembers.chat_id).filter(
            ChatMembers.user_id == self.current_user.id, Chats.is_group == True).all()

        friends = []

        if groups:

            for group in groups:

                unread = self.db.query(Message).filter(
                    Message.chat_id == group.id,
                    Message.sender_id != self.current_user.id,
                    Message.is_read == False

                ).count()
                if not unread:
                    unread = 0

                friends.append({
                    "chat_id": group.id,
                    "name": group.name,
                    "last_message_time": datetime(1970, 1, 1, tzinfo=timezone.utc),
                    "unread": unread,
                    "is_group": True
                })

        chat_member_1 = aliased(ChatMembers)
        chat_member_2 = aliased(ChatMembers)

        for req in accepted_friends:

            friend = req.to_user if req.from_user_id == self.current_user.id else req.from_user

            chat = (
                self.db.query(Chats)
                .join(chat_member_1, Chats.id == chat_member_1.chat_id)
                .filter(chat_member_1.user_id == friend.id)
                .join(chat_member_2, Chats.id == chat_member_2.chat_id)
                .filter(chat_member_2.user_id == self.current_user.id)
                .first()
            )

            last_message_time = None
            last_message = None
            unread = None
            if chat:

                last_message = (
                    self.db.query(Message).filter(
                        Message.chat_id == chat.id,
                        Message.sender_id != self.current_user.id,
                    ).order_by(desc(Message.sent_at)).first()
                )
                if last_message:
                    last_message_time = last_message.sent_at
                    last_message = last_message.content

                unread = self.db.query(Message).filter(
                    Message.chat_id == chat.id,
                    Message.sender_id != self.current_user.id,
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
                "unread": unread,
                "is_group": False
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

    async def send_messages(self, chat_id, content):

        chat = self.db.query(Chats).filter(Chats.id == chat_id).first()

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found!")

        chat_members = self.db.query(ChatMembers).filter(
            ChatMembers.chat_id == chat.id).all()

        friend = []
        for member in chat_members:

            if member.user_id == self.current_user.id:
                continue

            else:
                friend.append({'to_user': member.user_id})

        new_message = Message(
            chat_id=chat.id, sender_id=self.current_user.id, content=content.get('content'))
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)

        return {
            "success": True,
            "message": "Message sent successfully",
            "data": {
                "chat_id": chat_id,
                "content": content,
                "from_user": self.current_user.id,
                "to_user": friend[0]['to_user'],
                "sent_at": new_message.sent_at
            }
        }

    async def get_messages(self, chat_id):

        chat = self.db.query(Chats).filter(Chats.id == chat_id).first()

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="chat not found")

        messages = self.db.query(Message).filter(
            Message.chat_id == chat.id
        ).order_by(desc(Message.sent_at)).all()

        if not messages:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        ist = pytz.timezone("Asia/Kolkata")  # if you want IST time

        formatted_messages = []

        for m in messages:

            base_data = {
                "id": m.id,
                "chat_id": m.chat_id,
                "sender_id": m.sender_id,
                "content": m.content,
                "sent_at": m.sent_at.isoformat(),
                "sent_time": m.sent_at.astimezone(ist).strftime("%I:%M %p"),
                "is_read": m.is_read,
                "sender": m.sender,
                "is_deleted": m.is_deleted,
                "is_group": m.is_group,


            }
            if m.file_name is None:
                base_data["content"] = m.content
            else:
                base_data.update(
                    {
                        "file_name": m.file_name,
                        "file_url": m.file_url,
                        "file_type": m.file_type,
                        "size": m.file_size
                    }
                )

            if m.reply_to != None:

                reply_message = self.db.query(Message).filter(
                    Message.id == m.reply_to).one_or_none()

                if reply_message:
                    base_data.update({
                        "reply_to": m.reply_to,
                        "reply_content": reply_message.content,
                        "reply_file_name": reply_message.file_name,
                        "reply_file_url": reply_message.file_url,
                        "reply_file_type": reply_message.file_type,
                        "reply_sender": {
                            "id": reply_message.sender.id,
                            "name": reply_message.sender.name,
                        }
                    })

            formatted_messages.append(base_data)

        return {
            "success": True,
            "messages": formatted_messages,

        }

    async def delete_messages(self, message_id):

        message_query = self.db.query(Message).filter(
            Message.id == message_id, Message.sender_id == self.current_user.id)

        message = message_query.one_or_none()

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        message_query.delete(synchronize_session=False)
        self.db.commit()

        return {'msg': 'Message deleted'}

    async def mark_read_messages_service(self, chat_id):

        message = self.db.query(Message).filter(
            Message.chat_id == chat_id,
            Message.sender_id != self.current_user.id,
            Message.is_read == False

        ).update({"is_read": True})

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail='no unread messages')

        self.db.commit()

        return {'msg': 'marked as read'}

    async def file_upload_service(self, request, sender_id, chat_id, is_group, file):

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

        new_message = Message(sender_id=sender_id, chat_id=chat_id,
                              file_url=file_url, file_name=file.filename, file_size=size, unique_name=file_name, file_type=mime_type, is_group=is_group)

        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)

        return {
            "url": new_message.file_url,
            "file_type": new_message.file_type,
            "file_name": new_message.file_name,
            "unique_name": new_message.unique_name,
            "size": new_message.file_size,
            "is_group": new_message.is_group,
            "sender": new_message.sender
        }

    async def get_file_service(self, filename):

        exisiting_file = self.db.query(Message).filter(
            Message.unique_name == filename).first()

        if not exisiting_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="file not found in db")

        file_path = os.path.join(upload_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="file not found in system")

        return FileResponse(file_path)

    async def create_group_service(self, name, member_ids):

        if not name:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail='name not provided')

        new_group = Chats(name=name, is_group=True)
        self.db.add(new_group)
        self.db.commit()
        self.db.refresh(new_group)

        member_ids.append(self.current_user.id)
        for id in member_ids:
            self.db.add(ChatMembers(user_id=id, chat_id=new_group.id))
        self.db.commit()

        return {"chat_id": str(new_group.id), "name": new_group.name}


class ChatOnWebsocket:
    def __init__(self, db):
        self.db = db

    async def delete_msg_tosocket(self, message_id):

        message = self.db.query(Message).filter(
            Message.id == message_id).one_or_none()

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        message.is_deleted = True
        self.db.commit()

        await manager.broadcast(message.chat_id, {
            'type': "delete_message",
            'message_id': str(message_id),
            'chat_id': str(message.chat_id)
        })

        return {'message': 'Message deleted successfully'}

    async def edit_message_tosocket(self, message_id, content):

        message = self.db.query(Message).filter(
            Message.id == message_id).one_or_none()

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        message.content = content
        self.db.commit()

        await manager.broadcast(message.chat_id, {
            "type": "message_edit",
            "message_id": str(message_id),
            "chat_id": str(message.chat_id),
            "content": message.content

        })

        return {"message": "Message edited successfully"}
