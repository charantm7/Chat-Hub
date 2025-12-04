import asyncio
from typing import Dict, List, Set
from uuid import UUID
from fastapi import WebSocket
import json
import uuid


from backend.app.core.redis_script import pubsub_manager, redis_manager
from backend.app.core.logging_config import get_logger
logger = get_logger(__name__)


class ConnectionManager:

    def __init__(self):

        self.local_connections: Dict[UUID, List[WebSocket]] = {}
        self.pubsub = pubsub_manager
        self.server_id = str(uuid.uuid4())
        self.redis = None
        self.subscribed_chat: Set[UUID] = set()
        self.users_in_chat: Dict[int, Set[UUID]] = {}

        logger.info(
            f"ConnectionManager initialized with server ID {self.server_id}")

    # -----------------------------
    # Websocket Connection functionapp.log
    # -----------------------------

    async def connect(self, chat_id: UUID, user_id: int, websocket: WebSocket):

        logger.info(f"Connecting user {user_id} to chat {chat_id}")

        await websocket.accept()

        if chat_id not in self.local_connections:
            logger.debug(
                f"Creating new Local connection list for chat {chat_id}")
            self.local_connections[chat_id] = []

        self.local_connections[chat_id].append(websocket)

        # Redis client initialization
        if self.redis is None:
            self.redis = await redis_manager.get_client()
            logger.debug(
                "Redis client initialized for the connection maneger.")

        # store the user presence in redis
        await self.redis.sadd(f"chat:{chat_id}:connections",
                              f"{self.server_id}:{user_id}")

        # the current user subscribe to the chat throught the chat id
        if chat_id not in self.subscribed_chat:
            self.subscribed_chat.add(chat_id)
            await self.pubsub.subscribe(chat_id=chat_id)
            logger.debug(
                f"Subscribed to pubsub channel to the chat_id ={chat_id}")

        # maping user with the chat which he is connected
        if user_id not in self.users_in_chat:
            # Intialization of the set to the userid
            self.users_in_chat[user_id] = set()

        # mapping the user to the connected chat
        self.users_in_chat[user_id].add(chat_id)

        logger.info(
            f"User: {user_id} connected to chat: {chat_id}"
            f"local_clients={len(self.local_connections[chat_id])}"
        )
        await websocket.send_json({"Message": "Connected to chat"})

    # -----------------------------
    # websocket disconnect function
    # -----------------------------

    async def disconnect(self, chat_id: UUID, user_id: int, websocket: WebSocket):

        logger.info(
            f"Disconnecting websocket conn with user: {user_id} on chat_id: {chat_id}")

        if chat_id in self.local_connections:
            self.local_connections[chat_id].remove(websocket)

            if not self.local_connections[chat_id]:
                del self.local_connections[chat_id]
                self.subscribed_chat.remove(chat_id)
                await self.pubsub.unsubscribe(chat_id=chat_id)
                logger.debug(
                    "Unsubscribe to the pubsub channel to the chat  {chat_id}")

        # connection removed from the redis
        await self.redis.srem(f"chat:{chat_id}:connections",
                              f"{self.server_id}:{user_id}")

        if user_id in self.users_in_chat:
            self.users_in_chat[user_id].remove(chat_id)

            if not self.users_in_chat[user_id]:
                del self.users_in_chat[user_id]

    # ------------------------------------------------------
    # websocket broadcast function while saving to the redis
    # ------------------------------------------------------

    async def broadcast(self, chat_id: UUID, message: dict):

        await self._send_to_local(chat_id=chat_id, message=message)

        await self.pubsub.publish(chat_id=chat_id, message=json.dumps({
            "chat_id": str(chat_id),
            "payload": message
        }))

    # ---------------------------------------
    # send the message to the connected chats
    # ---------------------------------------
    async def _send_to_local(self, chat_id: UUID, message: dict):

        if chat_id in self.local_connections:

            for connection in list(self.local_connections[chat_id]):

                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error: {e}")

                    self.local_connections[chat_id].remove(connection)


manager = ConnectionManager()
