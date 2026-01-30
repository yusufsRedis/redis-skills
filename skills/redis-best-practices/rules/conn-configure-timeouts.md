---
title: Configure Connection Timeouts
impact: HIGH
impactDescription: prevents application hangs during Redis failures
tags: connection, timeout, reliability, resilience
---

## Configure Connection Timeouts

Always configure connection and socket timeouts to prevent your application from hanging indefinitely when Redis is unavailable or slow.

**Incorrect (no timeouts - can hang forever):**

```python
import redis

# No timeouts configured - dangerous in production
r = redis.Redis(host='localhost', port=6379)

# If Redis is down or slow, this hangs indefinitely
value = r.get("key")
```

**Correct (explicit timeout configuration):**

```python
import redis
from redis.retry import Retry
from redis.backoff import ExponentialBackoff

# Configure all relevant timeouts
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True,

    # Connection timeout - time to establish connection
    socket_connect_timeout=5.0,

    # Socket timeout - time to wait for response
    socket_timeout=5.0,

    # Retry configuration
    retry_on_timeout=True,
    retry=Retry(ExponentialBackoff(), 3),
)

r = redis.Redis(connection_pool=pool)

# For blocking commands, use command-specific timeouts
# BLPOP with 30 second timeout (returns None if timeout)
result = r.blpop("queue:tasks", timeout=30)

# BRPOP with timeout
item = r.brpop(["queue:high", "queue:low"], timeout=10)

# Client with all timeout options
r = redis.Redis(
    host='localhost',
    port=6379,
    socket_timeout=5.0,
    socket_connect_timeout=5.0,
    socket_keepalive=True,
    socket_keepalive_options={},
    health_check_interval=30,  # Periodic health checks
    retry_on_error=[redis.ConnectionError, redis.TimeoutError],
)

# Handling timeout errors gracefully
try:
    value = r.get("key")
except redis.TimeoutError:
    # Handle timeout - use fallback or retry
    value = get_from_fallback()
except redis.ConnectionError:
    # Handle connection failure
    log.error("Redis connection failed")
    raise
```

Set `socket_timeout` shorter than your application's request timeout. Use `health_check_interval` to detect stale connections. Configure retry logic for transient failures.

Reference: [Redis Client Error Handling](https://redis.io/docs/latest/develop/clients/error-handling/)
