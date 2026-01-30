---
title: Use Redis for Rate Limiting
impact: HIGH
impactDescription: protects APIs from abuse with atomic counters
tags: use-cases, rate-limiting, throttling, api
---

## Use Redis for Rate Limiting

Use Redis atomic operations for rate limiting. The fixed window, sliding window, and token bucket patterns each have different trade-offs.

**Incorrect (non-atomic rate limiting):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Race condition - concurrent requests can exceed limit
def check_rate_limit(user_id, limit):
    key = f"ratelimit:{user_id}"
    count = r.get(key)
    if count and int(count) >= limit:
        return False
    r.incr(key)  # Another request might have incremented
    return True
```

**Correct (atomic rate limiting patterns):**

```python
import redis
import time
r = redis.Redis(decode_responses=True)

# Fixed Window Rate Limiter
def fixed_window_limit(key, limit, window_seconds):
    """Simple fixed window - resets at window boundary"""
    current = r.incr(key)
    if current == 1:
        r.expire(key, window_seconds)
    return current <= limit

# Usage: 100 requests per minute
allowed = fixed_window_limit(f"api:user:123:{int(time.time() // 60)}", 100, 60)

# Sliding Window with Lua (more accurate)
SLIDING_WINDOW_SCRIPT = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local clear_before = now - window

-- Remove old entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', clear_before)

-- Count current window
local count = redis.call('ZCARD', key)
if count < limit then
    -- Add this request
    redis.call('ZADD', key, now, now .. ':' .. math.random())
    redis.call('EXPIRE', key, window)
    return 1
else
    return 0
end
"""

sliding_limit = r.register_script(SLIDING_WINDOW_SCRIPT)

def sliding_window_limit(user_id, limit, window_seconds):
    """Sliding window - more accurate rate limiting"""
    key = f"ratelimit:sliding:{user_id}"
    now = time.time()
    return sliding_limit(keys=[key], args=[limit, window_seconds, now]) == 1

# Token Bucket with Lua
TOKEN_BUCKET_SCRIPT = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'last_update')
local tokens = tonumber(bucket[1]) or capacity
local last_update = tonumber(bucket[2]) or now

-- Calculate tokens to add based on time elapsed
local elapsed = now - last_update
local new_tokens = math.min(capacity, tokens + (elapsed * refill_rate))

if new_tokens >= requested then
    new_tokens = new_tokens - requested
    redis.call('HMSET', key, 'tokens', new_tokens, 'last_update', now)
    redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)
    return 1
else
    redis.call('HMSET', key, 'tokens', new_tokens, 'last_update', now)
    return 0
end
"""

token_bucket = r.register_script(TOKEN_BUCKET_SCRIPT)

def token_bucket_limit(user_id, capacity=100, refill_rate=10):
    """Token bucket - allows bursts up to capacity"""
    key = f"ratelimit:bucket:{user_id}"
    return token_bucket(keys=[key], args=[capacity, refill_rate, time.time(), 1]) == 1
```

Fixed window is simplest but can allow 2x limit at window boundaries. Sliding window is more accurate. Token bucket allows controlled bursts. Always use atomic Lua scripts for accuracy.

Reference: [Rate Limiting Patterns](https://redis.io/glossary/rate-limiting/)
