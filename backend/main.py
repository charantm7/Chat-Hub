from fastapi import FastAPI, Response,status, Depends
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api import api_router
from app.core.config import settings
from app.services.user_service import get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):

    """This handles the server starting and shutdown, loads before the app instance"""
    print('Server starting...')
    yield 
    print('Server shutdown...')


app = FastAPI(
    name='Chat Hub',
    version='1.0',
    lifespan=lifespan
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_headers = ["*"],
    allow_methods = ["*"]
)

app.include_router(api_router)

@app.get('/favicon.ico')
async def favicon():
    """Prevents from the favicon 404 logs"""
    return Response(status_code=status.HTTP_200_OK)

@app.get('/')
async def health(current_user: int = Depends(get_current_user)):
    return current_user
