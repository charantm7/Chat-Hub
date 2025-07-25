from sqlalchemy import TIMESTAMP, Boolean, Column, String, Integer
from sqlalchemy.sql.expression import text

from app.core.psql_connection import Base


class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True )
    picture = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'), nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)