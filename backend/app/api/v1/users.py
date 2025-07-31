from operator import and_, not_, or_
import httpx

from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.utils import security
from app.core.psql_connection import get_db
from app.models.user_model import Users, FriendRequest, RequestStatus
from app.services import user_service
from app.schemas.user_schema import RefreshToken

router = APIRouter()



@router.get('/login/google')
async def login_with_google(request: Request):
    redirect_uri = f"{settings.REDIRECT_URL}v1/auth/google/callback"
    return await security.oauth.google.authorize_redirect(request, redirect_uri)

@router.get('/google/callback')
async def google_callback(request: Request,db: Session = Depends(get_db)):

    try:
        token = await security.oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Google authentication Failed {e}")

    access_token = token.get('access_token')
    userinfo = token.get('userinfo')
    iss = userinfo['iss']
    
    async with httpx.AsyncClient() as client:

        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={'Authorization': f"Bearer {access_token}"}
        )

    user_info = response.json()
    name = user_info['name']
    email = user_info['email']
    picture = user_info['picture']
    id = user_info['id']
    is_verified = user_info['verified_email']

    if not is_verified:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goole account not verified")

    if iss not in ['https://accounts.google.com']:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google account not found")

    if not id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google account not found")


    user = await user_service.get_user(db=db, email=email)

    if not user:

        new_user = Users(name=name, email=email, picture=picture, is_verified=is_verified )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    jwt_token = await security.create_access_token({"email":email})
    refresh_token = await security.create_refresh_token({'email':email})
    print('refresh')
    frontend_url = f"http://localhost:5173/auth/callback?token={jwt_token}&refresh={refresh_token}"

    return RedirectResponse(url=frontend_url)

@router.post('/refresh')
async def refresh(token: RefreshToken):
    print(token.token)
    return await security.validate_refresh_token(token=token.token)

@router.get("/get-users")
async def get_users(db: Session = Depends(get_db), current_user: Users = Depends(user_service.get_current_user)):

    friends_query = db.query(FriendRequest.to_user_id).filter(
        and_(
            or_(FriendRequest.status == RequestStatus.accepted, 
            FriendRequest.status == RequestStatus.pending),
            FriendRequest.from_user_id == current_user.id
        )
        
    ).union(
        db.query(FriendRequest.from_user_id).filter(
            and_(
                or_(FriendRequest.status == RequestStatus.accepted,
                FriendRequest.status == RequestStatus.pending),
            
                FriendRequest.to_user_id == current_user.id
            )
        )
    )

    not_friends = db.query(Users).filter(Users.id != current_user.id, ~Users.id.in_(friends_query)).limit(50).all()
    
    if not not_friends:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not available")

    return not_friends


