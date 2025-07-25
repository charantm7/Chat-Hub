import httpx

from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.utils import security
from app.core.psql_connection import get_db
from app.models.user_model import Users
from app.services import user_service

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


    user = user_service.get_user(db=db, email=email)

    if not user:

        new_user = Users(name=name, email=email, picture=picture, is_verified=is_verified )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    jwt_token = await security.create_access_token({"email":email})

    return {'access_token':jwt_token, 'token_type':'Bearer'}



