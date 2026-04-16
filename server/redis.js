const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('error', (err) => {
  // log but don't crash — Redis is used for caching, not critical path
  console.error('[redis] connection error:', err.message);
});

module.exports = redis;
