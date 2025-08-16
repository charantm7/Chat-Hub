import jwt
from jwt.exceptions import InvalidSignatureError, ExpiredSignatureError
from jose import JWTError
from datetime import datetime, timedelta

from fastapi import HTTPException, status, Depends
from authlib.integrations.starlette_client import OAuth


from app.core.config import settings
from app.schemas import user_schema
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


async def create_access_token(data: dict) -> str:
    client = await redis_manager.get_client()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Data not found!")

    to_endcode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_endcode.update({'exp': expire})

    access_token = jwt.encode(to_endcode, SECRET_KEY, algorithm=ALGORITHM)

    await client.setex(f"access_session:{data['email']}",
                       ACCESS_TOKEN_EXPIRE_MINUTES*60, access_token)
    print(access_token)
    return access_token


async def create_refresh_token(data: dict) -> str:
    client = await redis_manager.get_client()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Data not found!")

    to_encode = data.copy()
    expire_time = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({'exp': expire_time, 'type': 'refresh'})

    refresh_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    await client.setex(f"refresh_session:{data['email']}",
                       REFRESH_TOKEN_EXPIRE_DAYS*60*60*60, refresh_token)

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

        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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
