import asyncio
from typing import Optional
from uuid import UUID
from redis.asyncio import Redis
import aioredis


class RedisConnectionManager():

    def __init__(self):
        self._redis = Optional[Redis] = None

    async def connect(self, host="localhost", port=6379, db=0, decode_responses=True):

        if not self._redis:
            self._redis = aioredis.from_url(
                f"redis://{host}:{port}/{db}", decode_responses=decode_responses)

        return self._redis

    async def disconnect(self):
        if self._redis:
            await self._redis.close()
            self._redis = None

    async def get_client(self) -> Redis:
        if not self._redis:
            print("Redis is not connected.")
        return self._redis


redis_manager = RedisConnectionManager()


class RedisPubSubManager():
    def __init__(self):
        self.pubsub = None

    async def connect(self):
        self.redis_connection = await redis_manager.get_client()
        self.pubsub = self.redis_connection.pubsub()
        asyncio.create_task(self.listen_pubsub_message())

    async def listen_pubsub_message(self):

        # async for message in self.pubsub.listen():
        pass

    async def subscribe(self, chat_id: UUID):
        self.pubsub.subscribe(chat_id)
        return self.pubsub

    async def unsubscribe(self, chat_id: UUID):
        self.pubsub.unsubscribe(chat_id)

    async def publish(self, chat_id: UUID, message: str):
        self.redis_connection.publish(chat_id, message)

    async def disconnect(self):
        await self.redis_connection.close()
