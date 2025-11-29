from fastapi import APIRouter

from .v1.users import router as user_router
from .v1.websocket_chat import ws_chat
from .v1.chats.router import chat as chat_router


api_router = APIRouter()

api_router.include_router(
    user_router,
    prefix='/v1/auth',
    tags=['Authentication']
)

api_router.include_router(
    chat_router,
    prefix='/v1/chat',
    tags=['Chat']
)

api_router.include_router(
    ws_chat,
    prefix='/v1/ws',
    tags=['Websockets']
)


__all__ = ['api_router']
