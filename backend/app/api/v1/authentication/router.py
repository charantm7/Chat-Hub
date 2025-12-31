from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from app.core.psql_connection import get_db
from .service import google_login, google_callback_route, refresh_token, logout_route

auth_router = APIRouter()


@auth_router.get('/login/google')
async def login_with_google(request: Request):
    return await google_login(request=request)
    


@auth_router.get('/google/callback')
async def google_callback(request: Request, db: Session = Depends(get_db)):

    return await google_callback_route(request=request, db=db)
    

@auth_router.get('/refresh')
async def refresh(request: Request, db: Session = Depends(get_db)):

    return await refresh_token(request=request, db=db)


@auth_router.get("/logout")
async def logout(request: Request, db:Session = Depends(get_db)):

    return await logout_route(request=request, db=db)