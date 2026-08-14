import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

function createRedisClient() {
  const url = process.env.REDIS_URL ?? 'redis://redis.open360.svc.cluster.local:6379'
  return new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 3 })
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
