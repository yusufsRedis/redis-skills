---
title: Use HyperLogLog for Cardinality Estimation
impact: MEDIUM
impactDescription: counts unique items with minimal memory (12KB max)
tags: data-structures, hyperloglog, cardinality, analytics
---

## Use HyperLogLog for Cardinality Estimation

Use HyperLogLog (HLL) to count unique items when exact counts aren't required. HLL uses only 12KB of memory regardless of the number of items counted.

**Incorrect (storing all unique items):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Using a set - memory grows with unique visitors
def count_unique_visitors(page_id, user_id):
    r.sadd(f"visitors:{page_id}", user_id)

def get_unique_count(page_id):
    return r.scard(f"visitors:{page_id}")
    # With 10M unique visitors = ~400MB+ memory!
```

**Correct (use HyperLogLog for approximate counts):**

```python
import redis
r = redis.Redis(decode_responses=True)

# HyperLogLog - constant 12KB memory, 0.81% standard error
def track_unique_visitor(page_id, user_id):
    """Track unique visitor with HLL"""
    r.pfadd(f"hll:visitors:{page_id}", user_id)

def get_unique_count(page_id):
    """Get approximate unique visitor count"""
    return r.pfcount(f"hll:visitors:{page_id}")
    # 10M unique visitors still only uses 12KB!

# Track daily unique visitors
def track_daily_visitor(user_id):
    today = datetime.now().strftime("%Y-%m-%d")
    r.pfadd(f"hll:daily:{today}", user_id)

# Merge multiple HLLs for combined count
def get_weekly_uniques():
    """Get unique visitors across the week"""
    keys = [
        f"hll:daily:{(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')}"
        for i in range(7)
    ]
    # PFCOUNT with multiple keys returns union count
    return r.pfcount(*keys)

# Merge into a single HLL for storage
def consolidate_weekly_stats():
    """Merge daily HLLs into weekly HLL"""
    today = datetime.now()
    week_key = f"hll:weekly:{today.strftime('%Y-W%W')}"

    daily_keys = [
        f"hll:daily:{(today - timedelta(days=i)).strftime('%Y-%m-%d')}"
        for i in range(7)
    ]

    # Merge all daily HLLs into weekly
    r.pfmerge(week_key, *daily_keys)

    # Set expiration on consolidated key
    r.expire(week_key, 86400 * 90)  # Keep for 90 days

# Use cases for HyperLogLog
# - Unique page visitors
# - Unique search queries
# - Unique IP addresses
# - Unique items viewed per user
# - Daily/weekly/monthly active users

# HyperLogLog with pipeline for high throughput
def track_events_batch(events):
    """Track many events efficiently"""
    pipe = r.pipeline()
    for event in events:
        pipe.pfadd(f"hll:events:{event['type']}", event['user_id'])
    pipe.execute()

# Compare with exact counting when precision matters
class UniqueCounter:
    """Hybrid approach - exact for small counts, HLL for large"""

    def __init__(self, redis_client, key, threshold=10000):
        self.r = redis_client
        self.key = key
        self.threshold = threshold

    def add(self, item):
        # Start with set for exact counting
        set_key = f"set:{self.key}"
        hll_key = f"hll:{self.key}"

        if self.r.exists(hll_key):
            self.r.pfadd(hll_key, item)
        else:
            self.r.sadd(set_key, item)
            if self.r.scard(set_key) >= self.threshold:
                # Migrate to HLL
                members = self.r.smembers(set_key)
                self.r.pfadd(hll_key, *members)
                self.r.delete(set_key)

    def count(self):
        if self.r.exists(f"hll:{self.key}"):
            return self.r.pfcount(f"hll:{self.key}")
        return self.r.scard(f"set:{self.key}")
```

HyperLogLog trades perfect accuracy (~0.81% error) for extreme memory efficiency. Use it for analytics, unique counts, and cardinality estimation where approximate counts are acceptable.

Reference: [HyperLogLog](https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/)
