---
title: Use Lua Scripts for Complex Atomic Operations
impact: HIGH
impactDescription: enables server-side atomic logic with conditional operations
tags: commands, lua, scripting, atomicity, eval
---

## Use Lua Scripts for Complex Atomic Operations

Use Lua scripts when you need atomic operations with conditional logic. Scripts execute entirely on the server without interruption, reducing latency and ensuring consistency.

**Incorrect (client-side logic creates race conditions):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Race condition: another client might modify between GET and SET
current = r.get("inventory:item:123")
if current and int(current) > 0:
    r.decr("inventory:item:123")
    r.rpush("orders:pending", "order:456")
```

**Correct (use Lua for atomic conditional logic):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Atomic inventory decrement with order creation
reserve_item_script = """
local inventory = tonumber(redis.call('GET', KEYS[1]) or 0)
if inventory > 0 then
    redis.call('DECR', KEYS[1])
    redis.call('RPUSH', KEYS[2], ARGV[1])
    return 1
end
return 0
"""

# Register script for reuse (caches on server)
reserve_item = r.register_script(reserve_item_script)

# Execute atomically
success = reserve_item(
    keys=["inventory:item:123", "orders:pending"],
    args=["order:456"]
)

# Rate limiting with Lua
rate_limit_script = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = tonumber(redis.call('GET', key) or 0)
if current >= limit then
    return 0
end
redis.call('INCR', key)
if current == 0 then
    redis.call('EXPIRE', key, window)
end
return 1
"""

rate_limiter = r.register_script(rate_limit_script)

# Check rate limit atomically
allowed = rate_limiter(
    keys=["ratelimit:user:1000:api"],
    args=[100, 60]  # 100 requests per 60 seconds
)

# Conditional SET with complex logic
conditional_set_script = """
local current = redis.call('GET', KEYS[1])
if not current or tonumber(ARGV[2]) > tonumber(current) then
    redis.call('SET', KEYS[1], ARGV[1])
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]))
    return 1
end
return 0
"""

# Always pass keys via KEYS array for cluster compatibility
# Use ARGV for values and parameters
```

Always use KEYS array for Redis keys (required for cluster mode). Keep scripts short and focused. Use `register_script()` to cache scripts and execute with EVALSHA for better performance.

Reference: [Redis Lua Scripting](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/)
