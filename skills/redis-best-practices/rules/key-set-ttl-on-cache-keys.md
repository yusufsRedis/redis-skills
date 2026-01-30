---
title: Always Set TTL on Cache Keys
impact: CRITICAL
impactDescription: prevents unbounded memory growth
tags: keys, ttl, expiration, cache, memory
---

## Always Set TTL on Cache Keys

Set expiration times on cache keys to prevent unbounded memory growth. Keys without TTL will persist until manually deleted or evicted.

**Incorrect (cache keys without expiration):**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Cache without TTL - memory grows unbounded
def get_user(user_id):
    cache_key = f"cache:user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    user = fetch_user_from_db(user_id)
    r.set(cache_key, json.dumps(user))  # No TTL!
    return user

# These keys will never expire
r.set("cache:api:response:123", data)
r.hset("cache:product:456", mapping=product_data)
```

**Correct (always set appropriate TTL):**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Set TTL when caching
def get_user(user_id):
    cache_key = f"cache:user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    user = fetch_user_from_db(user_id)
    # Cache for 1 hour (3600 seconds)
    r.set(cache_key, json.dumps(user), ex=3600)
    return user

# Different TTLs for different data types
r.set("cache:session:abc", session_data, ex=1800)     # 30 min for sessions
r.set("cache:api:users", response, ex=300)            # 5 min for API responses
r.set("cache:config:settings", config, ex=86400)      # 24 hours for config

# Use setex for clarity (seconds)
r.setex("cache:token:xyz", 3600, token_value)

# Use psetex for milliseconds precision
r.psetex("cache:realtime:data", 5000, data)  # 5 seconds

# Add TTL to existing key
r.set("mykey", "value")
r.expire("mykey", 3600)  # Add 1 hour TTL

# Conditional TTL updates (Redis 7.0+)
r.expire("mykey", 3600, nx=True)  # Only if no TTL exists
r.expire("mykey", 7200, gt=True)  # Only if new TTL is greater

# Check remaining TTL
ttl = r.ttl("cache:user:1000")  # Returns seconds, -1 if no TTL, -2 if key doesn't exist
```

Use shorter TTLs for frequently changing data and longer TTLs for stable data. Monitor memory usage with INFO memory command.

Reference: [EXPIRE Command](https://redis.io/docs/latest/commands/expire/)
