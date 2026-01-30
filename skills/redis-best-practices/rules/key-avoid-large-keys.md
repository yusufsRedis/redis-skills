---
title: Avoid Very Large Keys and Values
impact: HIGH
impactDescription: prevents memory spikes and slow operations
tags: keys, memory, performance, sizing
---

## Avoid Very Large Keys and Values

Keep individual keys and values reasonably sized. Large values can cause memory spikes, slow operations, and network bottlenecks.

**Incorrect (storing very large values):**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Storing entire large datasets in single keys
all_users = fetch_all_users()  # 100,000 users
r.set("cache:all_users", json.dumps(all_users))  # Huge value!

# Large list that grows unbounded
for event in event_stream:
    r.rpush("events:all", json.dumps(event))  # Grows forever

# Serializing large objects
large_report = generate_large_report()  # 50MB
r.set("report:monthly", large_report)  # Too large!
```

**Correct (chunk data and use appropriate structures):**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Store individual items, not entire collections
for user in users:
    r.hset(f"user:{user['id']}", mapping=user)

# Use sorted set for paginated access
for i, user in enumerate(users):
    r.zadd("users:by_created", {f"user:{user['id']}": user['created_at']})

# Paginate large lists
page = r.zrange("users:by_created", 0, 99)  # First 100

# Cap lists to prevent unbounded growth
r.lpush("events:recent", json.dumps(event))
r.ltrim("events:recent", 0, 9999)  # Keep only last 10,000

# For large binary data, consider external storage
# Store reference in Redis, data in S3/blob storage
r.hset("report:monthly:meta", mapping={
    "s3_key": "reports/2024/january.pdf",
    "size": "52428800",
    "generated_at": "2024-01-31T00:00:00Z"
})

# Check memory usage of a key
memory_bytes = r.memory_usage("user:1000")
print(f"Key uses {memory_bytes} bytes")

# For strings, Redis max is 512MB but keep values under 1MB ideally
# For collections, avoid more than 10,000 elements if possible
```

Use MEMORY USAGE command to check key sizes. Consider breaking large objects into smaller keys or using external storage for very large binary data.

Reference: [Redis Memory Optimization](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/)
