import jwt
from jwt.exceptions import InvalidSignatureError, ExpiredSignatureError
from jose import JWTError
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas import user_schema


ALGORITHM=settings.ALGORITHM
SECRET_KEY=settings.SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS=settings.REFRESH_TOKEN_EXPIRE_DAYS

oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.CLIENT_ID,
    client_secret=settings.CLIENT_SECRET_ID,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs = {
        'scope': 'openid email profile',
        'prompt': 'consent'
    }
)


async def create_access_token(data: dict) -> str:

    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data not found!")

    to_endcode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_endcode.update({'exp':expire})

    access_token = jwt.encode(to_endcode, SECRET_KEY, algorithm=ALGORITHM)

    return access_token



async def validate_access_token(token):

    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Could not validate credentials", 
        headers={"WWW-Authenticate":"Bearer"}
    )

    if not token:
        raise credential_exception

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('email')

        if not email:
            raise credential_exception

        user_data = user_schema.TokenData(email=email)

        return user_data
    
    except ExpiredSignatureError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    except InvalidSignatureError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    
    except JWTError as e:
        raise credential_exception

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))