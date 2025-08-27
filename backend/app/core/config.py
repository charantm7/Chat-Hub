from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # database
    DB_NAME: str
    DB_HOST: str
    DB_PORT: int
    DB_PASS: str
    DB_USER: str

    # Jwt token
    ALGORITHM: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    # Google Oauth
    CLIENT_SECRET_ID: str
    CLIENT_ID: str
    REDIRECT_URL: str

    # payment
    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str

    class Config:

        env_file = '.env'
        extra = 'ignore'


settings = Settings()
