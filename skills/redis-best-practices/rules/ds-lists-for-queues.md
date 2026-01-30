---
title: Use Lists for Queues and Stacks
impact: HIGH
impactDescription: O(1) push and pop operations
tags: data-structures, lists, queues, stacks
---

## Use Lists for Queues and Stacks

Use Redis lists to implement queues (FIFO) or stacks (LIFO). Lists provide O(1) push and pop operations at both ends.

**Incorrect (using sorted sets or manual queue management):**

```python
import redis
import time
r = redis.Redis(decode_responses=True)

# Using sorted set with timestamp as score - overcomplicated
r.zadd("task_queue", {f"task:{1}": time.time()})
r.zadd("task_queue", {f"task:{2}": time.time()})

# Pop requires multiple operations
tasks = r.zrange("task_queue", 0, 0)
if tasks:
    task = tasks[0]
    r.zrem("task_queue", task)
```

**Correct (use lists for queue operations):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Queue pattern (FIFO): push left, pop right
r.lpush("task_queue", "task:1", "task:2", "task:3")

# Process tasks in order received - O(1)
task = r.rpop("task_queue")  # Returns "task:1"

# Stack pattern (LIFO): push left, pop left
r.lpush("undo_stack", "action:1", "action:2")
last_action = r.lpop("undo_stack")  # Returns "action:2"

# Blocking pop - waits for items (great for workers)
# Timeout of 0 means wait forever
task = r.brpop("task_queue", timeout=5)  # Waits up to 5 seconds

# Atomic move between lists (reliable queue pattern)
# Moves item from source to destination atomically
task = r.lmove("pending", "processing", "RIGHT", "LEFT")

# Get queue length - O(1)
queue_length = r.llen("task_queue")

# Capped list - keep only last 100 items
r.lpush("recent_events", "event:new")
r.ltrim("recent_events", 0, 99)  # Keep only first 100
```

Use BRPOP/BLPOP for blocking pops in worker processes instead of polling. Use LMOVE for reliable queue patterns where you need to track in-progress items.

Reference: [Redis Lists](https://redis.io/docs/latest/develop/data-types/lists/)
