---
title: Use Colons for Key Namespacing
impact: CRITICAL
impactDescription: enables organized keyspace and efficient scanning
tags: keys, naming, namespacing, conventions
---

## Use Colons for Key Namespacing

Use colon-separated hierarchical key names to organize your keyspace. This convention is widely adopted and enables efficient key scanning and management.

**Incorrect (inconsistent or flat naming):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Flat, inconsistent naming - hard to manage
r.set("user1name", "John")
r.set("user_1_email", "john@example.com")
r.set("1-user-age", "30")
r.set("sessionabc123", "data")

# No way to efficiently find all user keys
# KEYS * would return everything
```

**Correct (hierarchical colon-separated naming):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Consistent hierarchical naming: object-type:id:field
r.set("user:1000:name", "John")
r.set("user:1000:email", "john@example.com")
r.hset("user:1000:profile", mapping={"age": "30", "city": "NYC"})

# Session keys with clear namespace
r.set("session:abc123:data", "session_data")
r.set("session:abc123:user_id", "1000")

# Cache keys with clear purpose
r.set("cache:api:users:list", cached_response)
r.set("cache:db:query:hash123", cached_result)

# Rate limiting keys
r.set("ratelimit:api:user:1000", "5")

# Scan for all user keys efficiently
cursor = 0
while True:
    cursor, keys = r.scan(cursor, match="user:*", count=100)
    for key in keys:
        print(key)
    if cursor == 0:
        break

# Scan for all sessions
for key in r.scan_iter(match="session:*"):
    print(key)
```

The colon convention is not enforced by Redis but is a widely adopted standard. It makes keys self-documenting and enables pattern-based operations with SCAN.

Reference: [Redis Keys](https://redis.io/docs/latest/develop/use/keyspace/)
