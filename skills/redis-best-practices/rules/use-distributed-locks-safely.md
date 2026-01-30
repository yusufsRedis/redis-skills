---
title: Implement Distributed Locks Safely
impact: CRITICAL
impactDescription: prevents race conditions in distributed systems
tags: use-cases, locking, distributed, concurrency
---

## Implement Distributed Locks Safely

Use Redis for distributed locks with proper safeguards: unique lock values, TTL expiration, and atomic unlock operations to prevent deadlocks and race conditions.

**Incorrect (unsafe locking patterns):**

```python
import redis
r = redis.Redis(decode_responses=True)

# WRONG: No expiration - deadlock if process crashes
r.set("lock:resource", "locked")

# WRONG: Race condition in unlock
if r.get("lock:resource"):
    r.delete("lock:resource")  # May delete another client's lock

# WRONG: Using SETNX without TTL
r.setnx("lock:resource", "1")
```

**Correct (safe distributed lock implementation):**

```python
import redis
import uuid
import time
r = redis.Redis(decode_responses=True)

# Atomic unlock script - only delete if we own the lock
UNLOCK_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""

class DistributedLock:
    def __init__(self, redis_client, name, timeout=10):
        self.redis = redis_client
        self.name = f"lock:{name}"
        self.timeout = timeout
        self.token = None
        self._unlock = redis_client.register_script(UNLOCK_SCRIPT)

    def acquire(self, blocking=True, blocking_timeout=None):
        """Acquire lock with unique token"""
        self.token = str(uuid.uuid4())
        end_time = time.time() + (blocking_timeout or self.timeout)

        while True:
            # SET with NX (only if not exists) and EX (expiration)
            if self.redis.set(self.name, self.token, nx=True, ex=self.timeout):
                return True

            if not blocking:
                return False

            if time.time() >= end_time:
                return False

            time.sleep(0.1)

    def release(self):
        """Release lock only if we own it"""
        if self.token:
            self._unlock(keys=[self.name], args=[self.token])
            self.token = None

    def extend(self, additional_time):
        """Extend lock TTL if we still own it"""
        extend_script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("expire", KEYS[1], ARGV[2])
        else
            return 0
        end
        """
        return self.redis.eval(
            extend_script, 1, self.name, self.token, additional_time
        )

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()

# Usage with context manager
with DistributedLock(r, "resource:123", timeout=30) as lock:
    # Critical section - only one process executes this
    process_resource("123")

# Manual usage with timeout
lock = DistributedLock(r, "payment:order:456", timeout=60)
if lock.acquire(blocking_timeout=5):
    try:
        process_payment("456")
    finally:
        lock.release()
else:
    raise Exception("Could not acquire lock")
```

Always use unique tokens (UUID) to identify lock ownership. Always set TTL to prevent deadlocks. Use Lua scripts for atomic check-and-delete. Consider Redlock algorithm for multi-instance Redis.

Reference: [Distributed Locks](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/)
