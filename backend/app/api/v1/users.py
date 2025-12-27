import datetime
from operator import and_, not_, or_
import httpx

from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse
from datetime import datetime, timezone, timedelta
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.utils import security
from app.core.psql_connection import get_db
from app.models.user_model import Users, FriendRequest, RequestStatus, RefreshTokenModel
from app.services import user_service
from app.schemas.user_schema import RefreshToken, UpdateProfile
from app.core.redis_script import redis_manager

router = APIRouter()


@router.get('/login/google')
async def login_with_google(request: Request):
    redirect_uri = f"{settings.REDIRECT_URL}/v1/auth/google/callback"
    return await security.oauth.google.authorize_redirect(request, redirect_uri)


@router.get('/google/callback')
async def google_callback(request: Request, db: Session = Depends(get_db)):

    try:
        token = await security.oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Google authentication Failed: {e}")

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Google account not verified")

    if iss not in ['https://accounts.google.com']:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Google account not found")

    if not id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Google account not found")

    user = await user_service.get_user(db=db, email=email)

    if not user:

        user = Users(name=name, email=email,
                         picture=picture, is_verified=is_verified)
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = await security.create_access_token({"email": email})
    refresh_token = await security.create_refresh_token(db=db, user_id = user.id)

    

    response = RedirectResponse(
        url=f"http://localhost:5173/auth/callback?token={jwt_token}",
        status_code=status.HTTP_303_SEE_OTHER
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60*60*24*7,
        path="/v1/auth"

    )

    return response


@router.get('/refresh')
async def refresh(request: Request, db: Session = Depends(get_db)):

    refresh_token = request.cookies.get('refresh_token')
    

    if not refresh_token:
        print("noo refresh token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found")

    tokens = db.query(RefreshTokenModel).filter(RefreshTokenModel.is_revoked == False, RefreshTokenModel.expire_at > datetime.now(timezone.utc)).all()

    matched_token = None

    if not tokens:
        raise HTTPException(status_code=401, detail="No valid refresh tokens")

    for token in tokens:

        if security.hash_refresh_token(refresh_token) == token.token_hash:
            matched_token = token
            break

    if not matched_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_email = db.query(Users.email).filter(Users.id == matched_token.user_id).scalar()

    
    access_token = await security.create_access_token({"email": user_email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


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

    not_friends = db.query(Users).filter(
        Users.id != current_user.id, ~Users.id.in_(friends_query)).limit(50).all()

    if not not_friends:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not available")

    return not_friends


@router.get("/logout")
async def logout(request: Request, db:Session = Depends(get_db)):

    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        print("no token")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refresh Token not found")

    hashed_token = security.hash_refresh_token(refresh_token)

    token = (
        db.query(RefreshTokenModel).filter(RefreshTokenModel.token_hash == hashed_token).first()

    )

    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refresh Token not found in DB")

    token.is_revoked = True
    db.commit()

    response = JSONResponse({"message":"Logout Successfull"})

    response.delete_cookie(
        key="refresh_token",
        path="/v1/auth/refresh"
    )

    return response



@router.put("/update/my/profile")
async def update_my_profile(user_info: UpdateProfile, db: Session = Depends(get_db), current_user: Users = Depends(user_service.get_current_user)):

    user_query = db.query(Users).filter(Users.id == current_user.id)

    user = user_query.first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = user_info.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key if key != 'd_o_b' else 'date_of_birth', value)

    db.commit()
    db.refresh(user)

    return user
