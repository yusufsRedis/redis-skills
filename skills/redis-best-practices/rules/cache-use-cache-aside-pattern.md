---
title: Use Cache-Aside Pattern for Reading
impact: HIGH
impactDescription: provides simple and effective caching with lazy loading
tags: caching, cache-aside, patterns, lazy-loading
---

## Use Cache-Aside Pattern for Reading

Implement the cache-aside (lazy-loading) pattern where your application checks the cache first, and only queries the database on cache miss. This is the most common and straightforward caching pattern.

**Incorrect (always hitting the database):**

```python
import redis
r = redis.Redis(decode_responses=True)

def get_user(user_id):
    # Always queries database, ignores cache
    return db.query("SELECT * FROM users WHERE id = ?", user_id)
```

**Correct (cache-aside with TTL):**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

def get_user(user_id):
    """Cache-aside pattern with expiration"""
    cache_key = f"cache:user:{user_id}"

    # 1. Check cache first
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # 2. Cache miss - query database
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    if user is None:
        return None

    # 3. Populate cache with TTL
    r.set(cache_key, json.dumps(user), ex=3600)  # 1 hour TTL

    return user

def update_user(user_id, data):
    """Invalidate cache on write"""
    # Update database first
    db.update("UPDATE users SET ... WHERE id = ?", data, user_id)

    # Then invalidate cache
    r.delete(f"cache:user:{user_id}")

# With explicit None caching to prevent repeated misses
def get_user_with_null_caching(user_id):
    cache_key = f"cache:user:{user_id}"
    cached = r.get(cache_key)

    if cached is not None:
        if cached == "__NULL__":
            return None  # Cached negative result
        return json.loads(cached)

    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    if user is None:
        # Cache the miss with short TTL
        r.set(cache_key, "__NULL__", ex=300)  # 5 min for nulls
    else:
        r.set(cache_key, json.dumps(user), ex=3600)

    return user

# Batch cache-aside for multiple items
def get_users(user_ids):
    cache_keys = [f"cache:user:{uid}" for uid in user_ids]
    cached_values = r.mget(cache_keys)

    results = {}
    missing_ids = []

    for uid, cached in zip(user_ids, cached_values):
        if cached:
            results[uid] = json.loads(cached)
        else:
            missing_ids.append(uid)

    # Fetch missing from database
    if missing_ids:
        db_users = db.query_many(missing_ids)
        pipe = r.pipeline()
        for user in db_users:
            results[user['id']] = user
            pipe.set(f"cache:user:{user['id']}", json.dumps(user), ex=3600)
        pipe.execute()

    return results
```

Always set TTL on cache entries. Invalidate cache on writes. Consider caching null results with shorter TTL to prevent cache stampede on non-existent items.

Reference: [Redis Caching Patterns](https://redis.io/docs/latest/develop/use/patterns/)
