from fastapi import APIRouter

from .v1.users import router as user_router


api_router = APIRouter()

api_router.include_router(
    user_router,
    prefix='/v1/auth',
    tags=['Authentication']
)


__all__ = ['api_router']