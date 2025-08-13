import enum
from uuid import uuid4
from sqlalchemy import TIMESTAMP, Boolean, Column, ForeignKey, String, Integer, UUID, Text, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import text

from app.core.psql_connection import Base


class RequestStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class MessageStatus(str, enum.Enum):
    sent = "sent"
    received = "received"
    read = "read"


class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    picture = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True),
                        server_default=text('now()'), nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    about = Column(String, nullable=True)

    messages = relationship('Message', back_populates='sender')


class Chats(Base):
    __tablename__ = 'chats'

    id = Column(UUID, primary_key=True, default=uuid4, unique=True)
    name = Column(String, nullable=True)
    is_group = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True),
                        server_default=text('now()'), nullable=False)


class ChatMembers(Base):
    __tablename__ = 'chatmembers'

    id = Column(UUID, primary_key=True, default=uuid4, unique=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'))
    chat_id = Column(UUID, ForeignKey('chats.id'))
    joined_at = Column(TIMESTAMP(timezone=True),
                       server_default=text('now()'), nullable=False)


class Message(Base):
    __tablename__ = 'messages'

    id = Column(UUID, primary_key=True, default=uuid4, unique=True)
    chat_id = Column(UUID, ForeignKey("chats.id"))
    sender_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'))
    content = Column(Text)
    sent_at = Column(TIMESTAMP(timezone=True),
                     server_default=text('now()'), nullable=False)
    is_read = Column(Boolean, default=False)
    status = Column(
        Enum(MessageStatus, name="messagestatus"), default=MessageStatus.sent)
    sender = relationship('Users', back_populates='messages')


class FriendRequest(Base):
    __tablename__ = "friendrequest"

    id = Column(UUID, primary_key=True, default=uuid4, unique=True)

    from_user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'))
    to_user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'))

    status = Column(Enum(RequestStatus), default=RequestStatus.pending)
    created_at = Column(TIMESTAMP(timezone=True),
                        server_default=text('now()'), nullable=False)

    from_user = relationship("Users", foreign_keys=[from_user_id])
    to_user = relationship("Users", foreign_keys=[to_user_id])
