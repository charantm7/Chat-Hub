from redis import Redis

redis_client = Redis | None = None


async def redis_startup():
    global redis_client
    redis_client = Redis(host='locahost', port=6379, decode_responses=True)
    print('Redis connection established')


async def redis_shutdown():
    global redis_client
    if redis_client:
        redis_client.close()
        print("Redis connection closed")
