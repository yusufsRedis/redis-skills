---
title: Use Strings with INCR for Atomic Counters
impact: HIGH
impactDescription: thread-safe counters without race conditions
tags: data-structures, strings, counters, atomic
---

## Use Strings with INCR for Atomic Counters

Use INCR and INCRBY commands for counters instead of GET/SET patterns. These commands are atomic and prevent race conditions in concurrent environments.

**Incorrect (read-modify-write pattern causes race conditions):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Race condition: two clients might read same value
current = r.get("page_views")
if current is None:
    current = 0
new_value = int(current) + 1
r.set("page_views", new_value)

# With multiple concurrent requests, counts will be lost
```

**Correct (use INCR for atomic increment):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Atomic increment - no race conditions
# If key doesn't exist, it's initialized to 0 first
views = r.incr("page_views")  # Returns new value

# Increment by specific amount
r.incrby("page_views", 10)  # Add 10

# Decrement
r.decr("page_views")
r.decrby("page_views", 5)

# Floating point increment
r.incrbyfloat("temperature", 0.5)

# Set initial value with expiration for rate limiting
r.set("api_calls:user:123", 0, ex=3600)  # Expires in 1 hour
r.incr("api_calls:user:123")

# Multiple counters in a hash (for related metrics)
r.hincrby("stats:page:home", "views", 1)
r.hincrby("stats:page:home", "clicks", 1)
r.hincrby("stats:page:home", "shares", 1)
```

INCR operations are atomic even across multiple Redis clients. For multiple related counters, use HINCRBY with hashes to group them together.

Reference: [Redis Strings](https://redis.io/docs/latest/develop/data-types/strings/)
