---
title: Use RedisJSON for Complex Documents
impact: MEDIUM
impactDescription: enables efficient nested document storage and querying
tags: redis-stack, json, documents, nested-data
---

## Use RedisJSON for Complex Documents

Use RedisJSON for storing and querying complex nested documents. It provides atomic operations on nested paths and integrates with Redis Search for indexing.

**Incorrect (serializing JSON to strings):**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Storing as string requires full read-modify-write
user = {"name": "John", "address": {"city": "NYC", "zip": "10001"}}
r.set("user:1", json.dumps(user))

# To update nested field, must read entire document
data = json.loads(r.get("user:1"))
data["address"]["city"] = "LA"
r.set("user:1", json.dumps(data))  # Race condition!
```

**Correct (use RedisJSON for document operations):**

```python
import redis
from redis.commands.json.path import Path
r = redis.Redis(decode_responses=True)

# Store document as JSON type
user = {
    "name": "John",
    "email": "john@example.com",
    "age": 30,
    "address": {
        "city": "NYC",
        "zip": "10001",
        "coords": {"lat": 40.7128, "lng": -74.0060}
    },
    "tags": ["premium", "verified"],
    "orders": []
}

r.json().set("user:1", "$", user)

# Read specific nested paths (efficient)
city = r.json().get("user:1", "$.address.city")  # ["NYC"]
coords = r.json().get("user:1", "$.address.coords")

# Update nested field atomically
r.json().set("user:1", "$.address.city", "LA")

# Increment numeric values atomically
r.json().numincrby("user:1", "$.age", 1)

# Array operations
r.json().arrappend("user:1", "$.tags", "loyal")
r.json().arrappend("user:1", "$.orders", {
    "id": "order:123",
    "total": 99.99,
    "date": "2024-01-15"
})

# Get multiple paths in one call
result = r.json().get("user:1", "$.name", "$.email", "$.address.city")

# String operations on nested values
r.json().strappend("user:1", "$.name", " Doe")
length = r.json().strlen("user:1", "$.name")

# Query with JSONPath filters
r.json().get("user:1", "$..orders[?(@.total > 50)]")

# Delete nested elements
r.json().delete("user:1", "$.address.coords")

# Check type of nested element
type_info = r.json().type("user:1", "$.tags")  # ["array"]

# Merge/update partial documents (Redis 7.4+)
r.json().merge("user:1", "$", {"status": "active", "address": {"country": "USA"}})
```

RedisJSON is part of Redis Stack. For simple flat objects, use hashes instead. Use JSONPath for efficient partial reads and updates. Combine with Redis Search to create indexes on JSON fields.

Reference: [RedisJSON](https://redis.io/docs/latest/develop/data-types/json/)
