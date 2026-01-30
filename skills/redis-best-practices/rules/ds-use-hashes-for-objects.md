---
title: Use Hashes for Object Storage
impact: CRITICAL
impactDescription: up to 10x memory savings compared to individual keys
tags: data-structures, hashes, memory, objects
---

## Use Hashes for Object Storage

Store related fields together in a hash rather than as separate string keys. Redis hashes are memory-efficient and provide O(1) access to individual fields.

**Incorrect (separate keys waste memory and require multiple operations):**

```python
import redis
r = redis.Redis()

# Storing user data as separate keys - inefficient
r.set("user:1000:name", "John")
r.set("user:1000:email", "john@example.com")
r.set("user:1000:age", "30")

# Retrieving requires multiple round trips
name = r.get("user:1000:name")
email = r.get("user:1000:email")
age = r.get("user:1000:age")
```

**Correct (use a hash for related fields):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Store all user fields in a single hash - memory efficient
r.hset("user:1000", mapping={
    "name": "John",
    "email": "john@example.com",
    "age": "30"
})

# Retrieve single field - O(1)
name = r.hget("user:1000", "name")

# Retrieve multiple fields in one round trip
user_data = r.hmget("user:1000", ["name", "email", "age"])

# Retrieve all fields
user = r.hgetall("user:1000")
```

Small hashes are encoded using a memory-efficient ziplist/listpack structure, using up to 10x less memory than separate keys. Use HINCRBY for atomic counter updates within hashes.

Reference: [Redis Hashes](https://redis.io/docs/latest/develop/data-types/hashes/)
