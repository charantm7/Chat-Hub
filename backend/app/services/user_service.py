from typing import Optional

from fastapi import HTTPException, status, Depends, WebSocket
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.models.user_model import Users
from app.utils import security
from app.core.psql_connection import get_db

oauth_scheme = OAuth2PasswordBearer(tokenUrl='/v1/auth/google/callback')

async def get_user(db: Session, email: Optional[str] = None) -> Optional[Users]:

    if not email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")

    return db.query(Users).filter(Users.email == email).first()

async def get_current_user(token:str = Depends(oauth_scheme), db: Session = Depends(get_db)) -> Users | None:


    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Token not found')

    data = await security.validate_access_token(token=token)
    
    user = await get_user(db=db, email=data.email)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

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

   