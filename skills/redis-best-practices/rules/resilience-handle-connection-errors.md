---
title: Handle Connection Errors Gracefully
impact: CRITICAL
impactDescription: prevents application failures during Redis outages
tags: resilience, errors, retry, fault-tolerance
---

## Handle Connection Errors Gracefully

Implement proper error handling and retry logic for Redis operations. Applications should degrade gracefully when Redis is unavailable.

**Incorrect (unhandled errors crash application):**

```python
import redis
r = redis.Redis()

def get_user(user_id):
    # No error handling - application crashes if Redis is down
    return r.get(f"user:{user_id}")
```

**Correct (graceful error handling with retries):**

```python
import redis
from redis.retry import Retry
from redis.backoff import ExponentialBackoff
import functools
import logging

log = logging.getLogger(__name__)

# Configure client with retry logic
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    socket_timeout=5.0,
    socket_connect_timeout=5.0,
    retry_on_timeout=True,
    retry=Retry(ExponentialBackoff(cap=10, base=0.1), 3),
    health_check_interval=30,
)

r = redis.Redis(connection_pool=pool, decode_responses=True)

# Decorator for graceful degradation
def redis_fallback(fallback_value=None, fallback_func=None):
    """Decorator that catches Redis errors and returns fallback"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except redis.ConnectionError as e:
                log.warning(f"Redis connection error in {func.__name__}: {e}")
                if fallback_func:
                    return fallback_func(*args, **kwargs)
                return fallback_value
            except redis.TimeoutError as e:
                log.warning(f"Redis timeout in {func.__name__}: {e}")
                if fallback_func:
                    return fallback_func(*args, **kwargs)
                return fallback_value
            except redis.RedisError as e:
                log.error(f"Redis error in {func.__name__}: {e}")
                raise
        return wrapper
    return decorator

# Usage with fallback value
@redis_fallback(fallback_value=None)
def get_cached_user(user_id):
    return r.get(f"cache:user:{user_id}")

# Usage with fallback function
def fetch_from_db(user_id):
    return db.query("SELECT * FROM users WHERE id = ?", user_id)

@redis_fallback(fallback_func=fetch_from_db)
def get_user(user_id):
    cached = r.get(f"cache:user:{user_id}")
    if cached:
        return json.loads(cached)
    return fetch_from_db(user_id)

# Circuit breaker pattern
class CircuitBreaker:
    def __init__(self, failure_threshold=5, reset_timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.last_failure_time = 0
        self.state = "closed"  # closed, open, half-open

    def call(self, func, *args, **kwargs):
        if self.state == "open":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "half-open"
            else:
                raise Exception("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            if self.state == "half-open":
                self.state = "closed"
                self.failure_count = 0
            return result
        except (redis.ConnectionError, redis.TimeoutError) as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "open"
            raise

# Write-behind pattern for critical writes
def write_with_fallback(key, value, ttl=3600):
    """Try Redis first, fall back to async queue"""
    try:
        r.set(key, value, ex=ttl)
    except redis.RedisError:
        # Queue for later sync
        background_queue.enqueue("redis_write", key, value, ttl)
        log.warning(f"Queued write for {key} due to Redis error")
```

Use exponential backoff for retries. Implement circuit breakers to prevent cascade failures. Always have a fallback strategy for cache operations. Log errors for monitoring.

Reference: [Redis Error Handling](https://redis.io/docs/latest/develop/clients/error-handling/)
