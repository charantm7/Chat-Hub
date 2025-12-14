from fastapi import APIRouter

from .v1.users import router as user_router
from .v1.chat import chat as chat_router
from .v1.websocket_chat import ws_chat
from .v1.payment import payment
from .v1.Chatsettings import router

# 
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

api_router.include_router(
    payment,
    prefix='/v1/payment',
    tags=['Payment']
)

api_router.include_router(
    router,
    prefix="/v1/settings",
    tags=['Settings']

)


__all__ = ['api_router']
