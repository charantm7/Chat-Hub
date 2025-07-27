from operator import and_, or_
from uuid import UUID
from fastapi import Body, websockets, APIRouter, Depends, HTTPException, status

from sqlalchemy import desc
from sqlalchemy.orm import Session, aliased

from app.core.psql_connection import get_db
from app.schemas.user_schema import FriendRequestSchema
from app.models.user_model import Users, FriendRequest, RequestStatus, Chats, ChatMembers, Message
from app.services.user_service import get_current_user
from app.core.websocket import manager


chat = APIRouter()


@chat.post('/invite/friend')
async def send_request(data: FriendRequestSchema, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):

    target_user = db.query(Users).filter(Users.email == data.email).first()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can not send request to your self")

    existing_request = db.query(FriendRequest).filter(
        FriendRequest.from_user_id == current_user.id, 
        FriendRequest.to_user_id == target_user.id,
        or_(
            FriendRequest.status == RequestStatus.pending,
            FriendRequest.status == RequestStatus.accepted
        )
    ).first()

    if existing_request:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request already sent")

    new_request = FriendRequest(from_user_id= current_user.id, to_user_id=target_user.id)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {'message':'Friend Resquest sent'}


@chat.get('/friend-requests')
async def incomming_request(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

    requests = db.query(FriendRequest).filter_by(to_user_id=current_user.id, status=RequestStatus.pending).all()

    if not requests:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='No request found')
    
    return requests


@chat.post('/friend-requests/{id}/accept')
async def accept_request(id: UUID, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

    request = db.query(FriendRequest).filter(FriendRequest.id == id, FriendRequest.to_user_id == current_user.id, FriendRequest.status==RequestStatus.pending).first()

    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found")

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
    
    
    return {'message':"Friend request accepted"}


    
@chat.post('/friend-requests/{id}/reject')
async def reject_request(id: UUID, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

    request = db.query(FriendRequest).filter_by(id=id, to_user_id=current_user.id, status=RequestStatus.pending).first()

    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found")
    
    request.status = RequestStatus.rejected
    db.commit()

    return {'message':"Friend request rejected"}


@chat.get('/friends')
async def get_friends(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

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

        friends.append({
            "id":friend.id,
            "name":friend.name,
            "email":friend.email,
            "picture":friend.picture,
            "chat_id":chat.id if chat else None
        })

    return friends


@chat.post('/{chat_id}/message')
async def send_message(chat_id: UUID, content: dict = Body(...), db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

    chat = db.query(Chats).filter(Chats.id == chat_id).first()

    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found!")

    chat_members = db.query(ChatMembers).filter(ChatMembers.chat_id == chat.id).all()

    friend = []
    for members in chat_members:

        if members.user_id == current_user.id:
            continue
        
        else:
            friend.append({'to_user':members.user_id})

    new_message = Message(chat_id=chat.id, sender_id=current_user.id, content=content.get('content'))
    db.add(new_message)
    db.commit()
    db.refresh(new_message)


    return {'message':f'Message {content} sent to {friend[0]['to_user']}'}


@chat.get('/{chat_id}/message')
async def get_messages(chat_id: UUID, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

    chat = db.query(Chats).filter(Chats.id == chat_id).first()

    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="chat not found")

    messages = db.query(Message).filter(Message.chat_id == chat.id).order_by(desc(Message.sent_at)).all()

    if not messages:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    return messages



