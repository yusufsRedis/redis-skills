---
title: Use Connection Pooling
impact: CRITICAL
impactDescription: prevents connection exhaustion and improves performance
tags: connection, pooling, performance, resources
---

## Use Connection Pooling

Always use connection pooling instead of creating new connections for each operation. Creating connections is expensive and can exhaust server resources.

**Incorrect (creating connections per request):**

```python
import redis

def get_user(user_id):
    # BAD: Creates new connection for every request
    r = redis.Redis(decode_responses=True)
    return r.get(f"user:{user_id}")

# Each call opens a new connection, never closes it
for user_id in user_ids:
    get_user(user_id)
```

**Correct (use connection pool):**

```python
import redis

# Create pool once at application startup
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    db=0,
    max_connections=50,  # Set based on expected concurrency
    decode_responses=True,
    socket_timeout=5.0,
    socket_connect_timeout=5.0,
    retry_on_timeout=True
)

# Reuse pool across all operations
def get_redis():
    return redis.Redis(connection_pool=pool)

def get_user(user_id):
    r = get_redis()
    return r.get(f"user:{user_id}")

# Or use a singleton pattern
class RedisClient:
    _pool = None

    @classmethod
    def get_pool(cls):
        if cls._pool is None:
            cls._pool = redis.ConnectionPool(
                host='localhost',
                port=6379,
                max_connections=50,
                decode_responses=True
            )
        return cls._pool

    @classmethod
    def get_client(cls):
        return redis.Redis(connection_pool=cls.get_pool())

# With context manager for explicit connection handling
with redis.Redis(connection_pool=pool) as r:
    r.set("key", "value")
    value = r.get("key")
```

Set `max_connections` based on your application's concurrency needs. For web servers, match it to your worker count. Always configure timeouts to prevent hanging connections.

Reference: [Redis Connection Pooling](https://redis.io/docs/latest/develop/clients/pools-and-muxing/)
