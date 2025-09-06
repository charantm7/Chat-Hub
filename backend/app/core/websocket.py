import asyncio
from typing import Dict, List
from uuid import UUID
from fastapi import WebSocket
import json
import uuid

from app.core.redis_script import pubsub_manager, redis_manager


class ConnectionManager:

    def __init__(self):

        self.local_connections: Dict[int, List[WebSocket]] = {}
        self.pubsub = pubsub_manager
        self.server_id = str(uuid.uuid4())
        self.redis = None

    async def connect(self, chat_id: int, user_id: int, websocket: WebSocket):

        await websocket.accept()

        if user_id not in self.local_connections:
            self.local_connections[user_id] = []

        self.local_connections[user_id].append(websocket)
        if self.redis is None:
            self.redis = await redis_manager.get_client()
        await self.redis.sadd(f"chat:{chat_id}:connections",
                              f"{self.server_id}:{user_id}")

        await self.pubsub.subscribe(chat_id=chat_id)

        await websocket.send_json({"Message": "Connected to chat"})

    async def disconnect(self, chat_id: int, user_id: int, websocket: WebSocket):

        if user_id in self.local_connections:
            self.local_connections[user_id].remove(websocket)

            if not self.local_connections[user_id]:
                del self.local_connections[user_id]
                await self.pubsub.unsubscribe(chat_id=chat_id)

        await self.redis.srem(f"chat:{chat_id}:connections",
                              f"{self.server_id}:{user_id}")

    async def broadcast(self, chat_id: int, user_ids: List[int], message: dict):

        await self._send_to_local(user_ids=user_ids, message=message)

        await self.pubsub.publish(chat_id=chat_id, message=json.dumps({
            "chat_id": str(chat_id),
            "payload": message
        }))

    async def _send_to_local(self, user_ids: List[int], message: dict):

        for uid in user_ids:

            if uid in self.local_connections:

                for connection in list(self.local_connections[uid]):

                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"Error: {e}")

                        self.local_connections[uid].remove(connection)


manager = ConnectionManager()
