from typing import Optional

from fastapi import HTTPException, status, Depends
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

    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Could not validate credentials", 
        headers={"WWW-Authenticate":"Bearer"}
    )

    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Token not found')

    data = await security.validate_access_token(token=token, credential_exception=credential_exception)
    
    user = await get_user(db=db, email=data.email)

    if not user:
        raise credential_exception

    return user



    

