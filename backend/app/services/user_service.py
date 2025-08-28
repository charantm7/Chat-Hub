import json
from typing import Optional

from fastapi import HTTPException, status, Depends, WebSocket
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.schemas.user_schema import User
from app.models.user_model import Users
from app.utils import security
from app.core.psql_connection import get_db
from app.core.redis_script import redis_manager

oauth_scheme = OAuth2PasswordBearer(tokenUrl='/v1/auth/google/callback')


async def get_user(db: Session, email: Optional[str] = None) -> Optional[Users]:

    client = await redis_manager.get_client()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")

    cached_user = await client.get(f"user:{email}")

    if cached_user:
        user_data = json.loads(cached_user)
        return User(**user_data)

    result = db.query(Users).filter(Users.email == email)
    user = result.one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_data = User.model_validate(user)
    await client.set(f"user:{email}", json.dumps(user_data.model_dump(mode='json')), ex=3600)

    return user_data


async def get_current_user(token: str = Depends(oauth_scheme), db: Session = Depends(get_db)) -> Users | None:

    client = await redis_manager.get_client()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='Token not found')

    data = await security.validate_access_token(token=token)

    cached_current_user = await client.get(f'current_user:{token}')

    if cached_current_user:
        user_data = json.loads(cached_current_user)
        return User(**user_data)

    user = await get_user(db=db, email=data.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await client.set(f'current_user:{token}', json.dumps(user.model_dump(mode='json')))
    print(user)
    return user


async def get_current_user_ws(websocket: WebSocket, db):

    token = websocket.query_params.get('token')

    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    try:
        data = await security.validate_access_token(token=token)
    except Exception:
        await websocket.close(code=1008)
        return None

    user = await get_user(email=data.email, db=db)

    if not user:
        await websocket.close(code=1008)
        return None

    return user
