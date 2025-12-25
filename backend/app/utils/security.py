import secrets
import jwt
from jwt.exceptions import InvalidSignatureError, ExpiredSignatureError
from jose import JWTError
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status, Depends
from authlib.integrations.starlette_client import OAuth
from passlib.context import CryptContext
from requests import Session

from app.core.config import settings
from app.schemas import user_schema
from app.models.user_model import RefreshTokenModel

from app.core.redis_script import redis_manager


ALGORITHM = settings.ALGORITHM
SECRET_KEY = settings.SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.CLIENT_ID,
    client_secret=settings.CLIENT_SECRET_ID,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile',
        'prompt': 'consent'
    }
)

hasing_context = CryptContext(schemes=["bcrypt"], deprecated='auto')


async def create_access_token(data: dict) -> str:

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Data not found!")

    to_endcode = data.copy()
    expire = datetime.now(timezone.utc) + \
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_endcode.update({'exp': expire})

    access_token = jwt.encode(
        payload=to_endcode, key=SECRET_KEY, algorithm=ALGORITHM)

    return access_token


async def create_refresh_token(db:Session, user_id) -> str:
    client = await redis_manager.get_client()

    refresh_token = secrets.token_urlsafe(32)
    
    hashed_refresh_token = hasing_context.hash(refresh_token)

    refresh_db =  RefreshTokenModel(
        user_id = user_id,
        token_hash = hashed_refresh_token,
        expire_at = datetime.now(timezone.utc) + timedelta(days=7)

    )

    db.add(refresh_db)
    db.commit()
    db.refresh(refresh_db)
    await client.setex(f"refresh_session:",
                       REFRESH_TOKEN_EXPIRE_DAYS*24*60*60, hashed_refresh_token)

    return refresh_token


async def validate_refresh_token(token):

    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    if not token:
        raise credential_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get('type') != 'refresh':
            raise credential_exception

        email = payload.get('email')
        if not email:
            raise credential_exception

        expire = datetime.now(timezone.utc) + \
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {'email': email, 'exp': expire}
        access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

        return {'access_token': access_token}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


async def validate_access_token(token):
    client = await redis_manager.get_client()

    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    if not token:
        raise credential_exception

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('email')

        cached_access_token = await client.get(f"access_session:{email}")

        if not cached_access_token or cached_access_token != token:
            raise HTTPException(
                status_code=401, detail="Session expired or invalid")

        if not email:
            raise credential_exception

        user_data = user_schema.TokenData(email=email)

        return user_data

    except ExpiredSignatureError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    except InvalidSignatureError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    except JWTError as e:
        raise credential_exception

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
