import asyncio
import json
from typing import Optional
from uuid import UUID
import redis.asyncio as redis


class RedisConnectionManager():

    def __init__(self):
        self._redis = None

    async def connect(self, host="localhost", port=6379, db=0, decode_responses=True):

        if not self._redis:
            self._redis = await redis.from_url(
                f"redis://{host}:{port}/{db}", decode_responses=decode_responses)

            try:
                await self._redis.ping()
                print("Redis connected")
            except Exception as e:
                print(f"Failed to connect to Redis: {e}")
                self._redis = None

        return self._redis

    async def disconnect(self):
        if self._redis:
            await self._redis.close()
            self._redis = None

    async def get_client(self):
        if not self._redis:
            print("Redis is not connected.")
        return self._redis


class RedisPubSubManager():
    def __init__(self):
        self.pubsub = None

    async def connect(self):
        self.redis_connection = await redis_manager.get_client()
        self.pubsub = self.redis_connection.pubsub()
        asyncio.create_task(self.listen_pubsub_message())

    async def listen_pubsub_message(self):
        from app.core.websocket import manager

        async for message in self.pubsub.listen():
            if message["type"] == 'message':
                data = json.loads(message["data"])
                chat_id = data["chat_id"]
                payload = data["payload"]
                await manager._send_to_local(chat_id=chat_id, message=payload)

    async def subscribe(self, chat_id: UUID):
        await self.pubsub.subscribe(str(chat_id))
        return self.pubsub

    async def unsubscribe(self, chat_id: UUID):
        await self.pubsub.unsubscribe(str(chat_id))

    async def publish(self, chat_id: UUID, message: str):
        await self.redis_connection.publish(str(chat_id), message)

    async def disconnect(self):
        await self.redis_connection.close()


redis_manager = RedisConnectionManager()
pubsub_manager = RedisPubSubManager()
