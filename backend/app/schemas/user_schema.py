from pydantic import BaseModel, EmailStr


class TokenData(BaseModel):

    email: EmailStr
    

class RefreshToken(BaseModel):

    token: str

class FriendRequestSchema(BaseModel):

    email: EmailStr