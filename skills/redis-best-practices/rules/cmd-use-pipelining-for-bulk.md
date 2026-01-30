---
title: Use Pipelining for Bulk Operations
impact: HIGH
impactDescription: reduces network round trips and increases throughput
tags: commands, pipelining, performance, bulk
---

## Use Pipelining for Bulk Operations

Pipeline multiple commands together to reduce network round trips. Pipelining sends multiple commands in a single request and reads all responses at once, dramatically improving throughput.

**Incorrect (one command per round trip):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Each command waits for response - N round trips
for i in range(1000):
    r.set(f"key:{i}", f"value:{i}")

# Also inefficient for reads
values = []
for key in keys:
    values.append(r.get(key))
```

**Correct (batch commands with pipelining):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Pipeline batches commands - single round trip
pipe = r.pipeline(transaction=False)
for i in range(1000):
    pipe.set(f"key:{i}", f"value:{i}")
results = pipe.execute()  # All 1000 commands in one round trip

# Batch reads
pipe = r.pipeline(transaction=False)
for key in keys:
    pipe.get(key)
values = pipe.execute()

# Process in batches for very large operations
def batch_set(redis_client, items, batch_size=500):
    """Set items in batches to manage memory"""
    pipe = redis_client.pipeline(transaction=False)
    for i, (key, value) in enumerate(items):
        pipe.set(key, value)
        if (i + 1) % batch_size == 0:
            pipe.execute()
            pipe = redis_client.pipeline(transaction=False)
    if len(items) % batch_size:
        pipe.execute()

# Mixed operations in a pipeline
pipe = r.pipeline(transaction=False)
pipe.set("user:1:name", "John")
pipe.incr("user:1:visits")
pipe.expire("user:1:session", 3600)
pipe.get("user:1:email")
results = pipe.execute()  # [True, 5, True, "john@example.com"]
```

Pipelining is NOT atomic. Commands may interleave with other clients. Use MULTI/EXEC transactions if you need atomicity. Keep batch sizes reasonable (100-1000) to balance memory usage and performance.

Reference: [Redis Pipelining](https://redis.io/docs/latest/develop/use/pipelining/)
