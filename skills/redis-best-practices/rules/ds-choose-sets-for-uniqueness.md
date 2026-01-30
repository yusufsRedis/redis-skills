---
title: Use Sets for Unique Collections
impact: CRITICAL
impactDescription: O(1) membership testing vs O(n) for lists
tags: data-structures, sets, uniqueness, membership
---

## Use Sets for Unique Collections

Use sets when you need to store unique items and perform fast membership testing. Sets provide O(1) add, remove, and membership check operations.

**Incorrect (using a list for unique items):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Using a list to track unique visitors - O(n) lookup
r.rpush("visitors", "user:1")
r.rpush("visitors", "user:2")

# Checking membership requires scanning the entire list - O(n)
visitors = r.lrange("visitors", 0, -1)
if "user:1" in visitors:
    print("User already visited")

# Must manually prevent duplicates
if "user:3" not in r.lrange("visitors", 0, -1):
    r.rpush("visitors", "user:3")
```

**Correct (use a set for unique items):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Using a set - duplicates automatically ignored
r.sadd("visitors", "user:1", "user:2", "user:3")
r.sadd("visitors", "user:1")  # No duplicate added

# O(1) membership check
if r.sismember("visitors", "user:1"):
    print("User already visited")

# Check multiple members in one call
results = r.smismember("visitors", ["user:1", "user:4", "user:5"])
# Returns [True, False, False]

# Get count of unique visitors
count = r.scard("visitors")

# Set operations for analysis
r.sadd("buyers", "user:1", "user:4")
visitors_who_bought = r.sinter("visitors", "buyers")
visitors_who_didnt_buy = r.sdiff("visitors", "buyers")
```

Sets also support powerful set operations like SINTER (intersection), SUNION (union), and SDIFF (difference) for analyzing relationships between collections.

Reference: [Redis Sets](https://redis.io/docs/latest/develop/data-types/sets/)
