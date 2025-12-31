from pydantic import BaseModel


class AccessTokenSchema(BaseModel):

    access_token: str
    token_type: str

class LogoutResponseSchema(BaseModel):
    success: bool
    message: str