---
title: Use Memory-Efficient Data Structures
impact: HIGH
impactDescription: reduces memory usage by 5-10x for small objects
tags: memory, optimization, encoding, efficiency
---

## Use Memory-Efficient Data Structures

Redis automatically uses memory-efficient encodings for small data structures. Understand these thresholds and design your data to benefit from them.

**Incorrect (inefficient memory patterns):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Separate keys for related data - high overhead per key
r.set("user:1:name", "John")
r.set("user:1:email", "john@example.com")
r.set("user:1:age", "30")
# Each key has ~50 bytes overhead regardless of value size

# Very long values in hash fields (exceeds ziplist threshold)
r.hset("user:1", "biography", "A" * 1000)  # Forces dict encoding
```

**Correct (leverage efficient encodings):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Group related data in hashes (uses ziplist for small hashes)
# Up to 512 entries with values under 64 bytes uses efficient encoding
r.hset("user:1", mapping={
    "name": "John",
    "email": "john@example.com",
    "age": "30",
    "city": "NYC"
})

# Check memory usage
memory_usage = r.memory_usage("user:1")
print(f"Memory: {memory_usage} bytes")

# For many small key-value pairs, use hash bucketing
def memory_efficient_set(r, key, value):
    """Store key-value in hash bucket for memory efficiency"""
    # Split key into bucket and field
    bucket = key[:2]  # First 2 chars as bucket
    r.hset(f"kv:{bucket}", key, value)

def memory_efficient_get(r, key):
    bucket = key[:2]
    return r.hget(f"kv:{bucket}", key)

# Integer sets - very efficient for numeric IDs
# Uses intset encoding for sets of integers under threshold
r.sadd("user:followers:1", 100, 200, 300, 400, 500)

# Check encoding type
encoding = r.object("encoding", "user:followers:1")
print(f"Encoding: {encoding}")  # "intset" for small integer sets

# Keep list elements small for listpack encoding
r.rpush("events:recent", *[
    f"{ts}:{event_type}:{short_data}"
    for ts, event_type, short_data in events
])

# For large binary data, consider compression
import zlib
large_data = get_large_response()
compressed = zlib.compress(large_data.encode())
r.set("cache:large", compressed)

# Decompress on read
cached = r.get("cache:large")
if cached:
    data = zlib.decompress(cached).decode()

# Use SCAN with TYPE filter to audit memory usage
def audit_memory_by_type(r, sample_size=1000):
    """Sample keys and check memory usage by type"""
    stats = {}
    cursor = 0
    count = 0

    while count < sample_size:
        cursor, keys = r.scan(cursor, count=100)
        for key in keys:
            key_type = r.type(key)
            memory = r.memory_usage(key) or 0

            if key_type not in stats:
                stats[key_type] = {"count": 0, "memory": 0}
            stats[key_type]["count"] += 1
            stats[key_type]["memory"] += memory
            count += 1

        if cursor == 0:
            break

    return stats
```

Redis 7+ uses listpack encoding (replaces ziplist). Keep hash entries under 512 with values under 64 bytes for optimal encoding. Use integer sets when storing numeric IDs. Consider compression for large values.

Reference: [Memory Optimization](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/)
