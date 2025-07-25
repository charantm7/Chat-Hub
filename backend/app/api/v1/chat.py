from uuid import UUID
from fastapi import websockets, APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session

from app.core.psql_connection import get_db
from app.schemas.user_schema import FriendRequestSchema
from app.models.user_model import Users, FriendRequest, RequestStatus, Chats, ChatMembers
from app.services.user_service import get_current_user


chat = APIRouter()


@chat.post('/invite/friend')
async def create_chat(data: FriendRequestSchema, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):

    target_user = db.query(Users).filter(Users.email == data.email).first()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can not send request to your self")

    existing_request = db.query(FriendRequest).filter_by(from_user_id=current_user.id, to_user_id=target_user.id).first()

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


    
