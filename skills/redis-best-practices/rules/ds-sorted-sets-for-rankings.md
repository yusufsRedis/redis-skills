---
title: Use Sorted Sets for Rankings and Leaderboards
impact: CRITICAL
impactDescription: O(log n) ranking operations with automatic ordering
tags: data-structures, sorted-sets, leaderboards, rankings
---

## Use Sorted Sets for Rankings and Leaderboards

Use sorted sets when you need ordered data with scores. They maintain automatic ordering and provide O(log N) operations for adding, removing, and ranking.

**Incorrect (manually sorting data):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Storing scores in a hash and sorting manually - inefficient
r.hset("scores", "player:1", 100)
r.hset("scores", "player:2", 250)
r.hset("scores", "player:3", 175)

# Getting rankings requires fetching all and sorting - O(n log n)
all_scores = r.hgetall("scores")
sorted_scores = sorted(all_scores.items(), key=lambda x: int(x[1]), reverse=True)
top_10 = sorted_scores[:10]
```

**Correct (use sorted sets for automatic ordering):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Add players with scores - O(log N)
r.zadd("leaderboard", {"player:1": 100, "player:2": 250, "player:3": 175})

# Get top 10 players - already sorted, O(log N + M)
top_10 = r.zrevrange("leaderboard", 0, 9, withscores=True)
# Returns: [('player:2', 250.0), ('player:3', 175.0), ('player:1', 100.0)]

# Get a player's rank (0-indexed from top) - O(log N)
rank = r.zrevrank("leaderboard", "player:1")  # Returns 2

# Atomically increment a score - O(log N)
r.zincrby("leaderboard", 50, "player:1")  # player:1 now has 150

# Get players within a score range
mid_tier = r.zrangebyscore("leaderboard", 100, 200, withscores=True)

# Get player's score
score = r.zscore("leaderboard", "player:2")  # Returns 250.0
```

Sorted sets use a skip list internally, so there's no sorting overhead when retrieving data. ZINCRBY provides atomic score updates for real-time leaderboards.

Reference: [Redis Sorted Sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
