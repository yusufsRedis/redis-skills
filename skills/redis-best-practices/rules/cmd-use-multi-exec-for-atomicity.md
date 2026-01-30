---
title: Use MULTI/EXEC for Atomic Operations
impact: HIGH
impactDescription: ensures all-or-nothing execution without interleaving
tags: commands, transactions, multi, exec, atomicity
---

## Use MULTI/EXEC for Atomic Operations

Use Redis transactions with MULTI/EXEC when you need multiple commands to execute atomically without interruption from other clients.

**Incorrect (non-atomic operations can interleave):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Another client could modify balance between these commands
balance = int(r.get("account:1:balance") or 0)
if balance >= 100:
    r.decrby("account:1:balance", 100)
    r.incrby("account:2:balance", 100)
```

**Correct (use MULTI/EXEC for atomicity):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Commands between MULTI and EXEC run atomically
pipe = r.pipeline()  # transaction=True by default
pipe.multi()
pipe.decrby("account:1:balance", 100)
pipe.incrby("account:2:balance", 100)
pipe.execute()  # Both execute atomically

# Using WATCH for optimistic locking (check-and-set)
def transfer_funds(from_account, to_account, amount):
    """Transfer with optimistic locking"""
    from_key = f"account:{from_account}:balance"
    to_key = f"account:{to_account}:balance"

    with r.pipeline() as pipe:
        while True:
            try:
                # Watch for changes
                pipe.watch(from_key)
                balance = int(pipe.get(from_key) or 0)

                if balance < amount:
                    pipe.unwatch()
                    return False

                # Start transaction
                pipe.multi()
                pipe.decrby(from_key, amount)
                pipe.incrby(to_key, amount)
                pipe.execute()
                return True

            except redis.WatchError:
                # Key was modified, retry
                continue

# Simple transaction without WATCH
def increment_multiple(keys):
    """Atomically increment multiple keys"""
    pipe = r.pipeline()
    for key in keys:
        pipe.incr(key)
    return pipe.execute()
```

WATCH monitors keys and aborts the transaction if they change before EXEC. This provides optimistic locking for read-modify-write patterns. Use Lua scripts for complex atomic logic.

Reference: [Redis Transactions](https://redis.io/docs/latest/develop/interact/transactions/)
