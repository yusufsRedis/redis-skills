# Redis Best Practices

**Version 1.0.0**  
Redis  
January 2026

> **Note:**  
> This document is mainly for agents and LLMs to follow when maintaining,  
> generating, or refactoring Redis applications. Humans  
> may also find it useful, but guidance here is optimized for automation  
> and consistency by AI-assisted workflows.

---

## Abstract

Development patterns and best practices for building applications with Redis. Covers data structure selection, key design, caching strategies, connection management, common use cases, and error handling. Each rule includes detailed explanations with incorrect vs. correct code examples.

---

## Table of Contents

1. [Data Structures](#1-data-structures) — **CRITICAL**
   - 1.1 [Use Hashes for Object Storage](#11-use-hashes-for-object-storage)
   - 1.2 [Use HyperLogLog for Cardinality Estimation](#12-use-hyperloglog-for-cardinality-estimation)
   - 1.3 [Use Lists for Queues and Stacks](#13-use-lists-for-queues-and-stacks)
   - 1.4 [Use Sets for Unique Collections](#14-use-sets-for-unique-collections)
   - 1.5 [Use Sorted Sets for Rankings and Leaderboards](#15-use-sorted-sets-for-rankings-and-leaderboards)
   - 1.6 [Use Strings with INCR for Atomic Counters](#16-use-strings-with-incr-for-atomic-counters)
2. [Key Design](#2-key-design) — **CRITICAL**
   - 2.1 [Always Set TTL on Cache Keys](#21-always-set-ttl-on-cache-keys)
   - 2.2 [Avoid Very Large Keys and Values](#22-avoid-very-large-keys-and-values)
   - 2.3 [Use Colons for Key Namespacing](#23-use-colons-for-key-namespacing)
   - 2.4 [Use SCAN Instead of KEYS in Production](#24-use-scan-instead-of-keys-in-production)
3. [Commands & Patterns](#3-commands--patterns) — **HIGH**
   - 3.1 [Use Lua Scripts for Complex Atomic Operations](#31-use-lua-scripts-for-complex-atomic-operations)
   - 3.2 [Use MGET/MSET for Batch Key Operations](#32-use-mgetmset-for-batch-key-operations)
   - 3.3 [Use MULTI/EXEC for Atomic Operations](#33-use-multiexec-for-atomic-operations)
   - 3.4 [Use Pipelining for Bulk Operations](#34-use-pipelining-for-bulk-operations)
4. [Connection Management](#4-connection-management) — **HIGH**
   - 4.1 [Configure Connection Timeouts](#41-configure-connection-timeouts)
   - 4.2 [Use Connection Pooling](#42-use-connection-pooling)
5. [Caching Strategies](#5-caching-strategies) — **HIGH**
   - 5.1 [Prevent Cache Stampede](#51-prevent-cache-stampede)
   - 5.2 [Use Cache-Aside Pattern for Reading](#52-use-cache-aside-pattern-for-reading)
6. [Common Use Cases](#6-common-use-cases) — **MEDIUM-HIGH**
   - 6.1 [Implement Distributed Locks Safely](#61-implement-distributed-locks-safely)
   - 6.2 [Store Sessions with Automatic Expiration](#62-store-sessions-with-automatic-expiration)
   - 6.3 [Use Redis for Rate Limiting](#63-use-redis-for-rate-limiting)
7. [Pub/Sub & Streams](#7-pub/sub--streams) — **MEDIUM**
   - 7.1 [Use Pub/Sub for Real-Time Broadcasting](#71-use-pubsub-for-real-time-broadcasting)
   - 7.2 [Use Streams for Reliable Messaging](#72-use-streams-for-reliable-messaging)
8. [JSON & Search](#8-json--search) — **MEDIUM**
   - 8.1 [Use Redis Search for Complex Queries](#81-use-redis-search-for-complex-queries)
   - 8.2 [Use RedisJSON for Complex Documents](#82-use-redisjson-for-complex-documents)
9. [Memory Optimization](#9-memory-optimization) — **MEDIUM**
   - 9.1 [Monitor Memory and Set Limits](#91-monitor-memory-and-set-limits)
   - 9.2 [Use Memory-Efficient Data Structures](#92-use-memory-efficient-data-structures)
10. [Error Handling & Resilience](#10-error-handling--resilience) — **LOW-MEDIUM**
   - 10.1 [Handle Connection Errors Gracefully](#101-handle-connection-errors-gracefully)
   - 10.2 [Implement Redis Health Checks](#102-implement-redis-health-checks)

---

## 1. Data Structures

**Impact: CRITICAL**

Choosing the correct Redis data structure is fundamental to performance and functionality. Redis offers Strings, Lists, Sets, Sorted Sets, Hashes, Streams, and more. Each has specific time complexities and memory characteristics. Using the wrong type leads to inefficient operations, excessive memory usage, and poor scalability.

---

### 1.1 Use Hashes for Object Storage

**Impact: CRITICAL (up to 10x memory savings compared to individual keys)**

Store related fields together in a hash rather than as separate string keys. Redis hashes are memory-efficient and provide O(1) access to individual fields.

**Incorrect: separate keys waste memory and require multiple operations**

```python
import redis
r = redis.Redis()

# Storing user data as separate keys - inefficient
r.set("user:1000:name", "John")
r.set("user:1000:email", "john@example.com")
r.set("user:1000:age", "30")

# Retrieving requires multiple round trips
name = r.get("user:1000:name")
email = r.get("user:1000:email")
age = r.get("user:1000:age")
```

**Correct: use a hash for related fields**

```python
import redis
r = redis.Redis(decode_responses=True)

# Store all user fields in a single hash - memory efficient
r.hset("user:1000", mapping={
    "name": "John",
    "email": "john@example.com",
    "age": "30"
})

# Retrieve single field - O(1)
name = r.hget("user:1000", "name")

# Retrieve multiple fields in one round trip
user_data = r.hmget("user:1000", ["name", "email", "age"])

# Retrieve all fields
user = r.hgetall("user:1000")
```

Small hashes are encoded using a memory-efficient ziplist/listpack structure, using up to 10x less memory than separate keys. Use HINCRBY for atomic counter updates within hashes.

Reference: [https://redis.io/docs/latest/develop/data-types/hashes/](https://redis.io/docs/latest/develop/data-types/hashes/)

### 1.2 Use HyperLogLog for Cardinality Estimation

**Impact: MEDIUM (counts unique items with minimal memory (12KB max))**

Use HyperLogLog (HLL) to count unique items when exact counts aren't required. HLL uses only 12KB of memory regardless of the number of items counted.

**Incorrect: storing all unique items**

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

**Correct: use HyperLogLog for approximate counts**

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

Reference: [https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/](https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/)

### 1.3 Use Lists for Queues and Stacks

**Impact: HIGH (O(1) push and pop operations)**

Use Redis lists to implement queues (FIFO) or stacks (LIFO). Lists provide O(1) push and pop operations at both ends.

**Incorrect: using sorted sets or manual queue management**

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

**Correct: use lists for queue operations**

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

Reference: [https://redis.io/docs/latest/develop/data-types/lists/](https://redis.io/docs/latest/develop/data-types/lists/)

### 1.4 Use Sets for Unique Collections

**Impact: CRITICAL (O(1) membership testing vs O(n) for lists)**

Use sets when you need to store unique items and perform fast membership testing. Sets provide O(1) add, remove, and membership check operations.

**Incorrect: using a list for unique items**

```python
import redis
r = redis.Redis(decode_responses=True)

# Using a list to track unique visitors - O(n) lookup
r.rpush("visitors", "user:1")
r.rpush("visitors", "user:2")

# Checking membership requires scanning the entire list - O(n)
visitors = r.lrange("visitors", 0, -1)
if "user:1" in visitors:
    print("User already visited")

# Must manually prevent duplicates
if "user:3" not in r.lrange("visitors", 0, -1):
    r.rpush("visitors", "user:3")
```

**Correct: use a set for unique items**

```python
import redis
r = redis.Redis(decode_responses=True)

# Using a set - duplicates automatically ignored
r.sadd("visitors", "user:1", "user:2", "user:3")
r.sadd("visitors", "user:1")  # No duplicate added

# O(1) membership check
if r.sismember("visitors", "user:1"):
    print("User already visited")

# Check multiple members in one call
results = r.smismember("visitors", ["user:1", "user:4", "user:5"])
# Returns [True, False, False]

# Get count of unique visitors
count = r.scard("visitors")

# Set operations for analysis
r.sadd("buyers", "user:1", "user:4")
visitors_who_bought = r.sinter("visitors", "buyers")
visitors_who_didnt_buy = r.sdiff("visitors", "buyers")
```

Sets also support powerful set operations like SINTER (intersection), SUNION (union), and SDIFF (difference) for analyzing relationships between collections.

Reference: [https://redis.io/docs/latest/develop/data-types/sets/](https://redis.io/docs/latest/develop/data-types/sets/)

### 1.5 Use Sorted Sets for Rankings and Leaderboards

**Impact: CRITICAL (O(log n) ranking operations with automatic ordering)**

Use sorted sets when you need ordered data with scores. They maintain automatic ordering and provide O(log N) operations for adding, removing, and ranking.

**Incorrect: manually sorting data**

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

**Correct: use sorted sets for automatic ordering**

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

Reference: [https://redis.io/docs/latest/develop/data-types/sorted-sets/](https://redis.io/docs/latest/develop/data-types/sorted-sets/)

### 1.6 Use Strings with INCR for Atomic Counters

**Impact: HIGH (thread-safe counters without race conditions)**

Use INCR and INCRBY commands for counters instead of GET/SET patterns. These commands are atomic and prevent race conditions in concurrent environments.

**Incorrect: read-modify-write pattern causes race conditions**

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

**Correct: use INCR for atomic increment**

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

Reference: [https://redis.io/docs/latest/develop/data-types/strings/](https://redis.io/docs/latest/develop/data-types/strings/)

---

## 2. Key Design

**Impact: CRITICAL**

Well-designed keys improve code readability, enable efficient SCAN operations, prevent key collisions, and support logical data organization. Key naming conventions (like colon-separated namespaces) and TTL strategies directly impact maintainability and memory management.

---

### 2.1 Always Set TTL on Cache Keys

**Impact: CRITICAL (prevents unbounded memory growth)**

Set expiration times on cache keys to prevent unbounded memory growth. Keys without TTL will persist until manually deleted or evicted.

**Incorrect: cache keys without expiration**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Cache without TTL - memory grows unbounded
def get_user(user_id):
    cache_key = f"cache:user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    user = fetch_user_from_db(user_id)
    r.set(cache_key, json.dumps(user))  # No TTL!
    return user

# These keys will never expire
r.set("cache:api:response:123", data)
r.hset("cache:product:456", mapping=product_data)
```

**Correct: always set appropriate TTL**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Set TTL when caching
def get_user(user_id):
    cache_key = f"cache:user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    user = fetch_user_from_db(user_id)
    # Cache for 1 hour (3600 seconds)
    r.set(cache_key, json.dumps(user), ex=3600)
    return user

# Different TTLs for different data types
r.set("cache:session:abc", session_data, ex=1800)     # 30 min for sessions
r.set("cache:api:users", response, ex=300)            # 5 min for API responses
r.set("cache:config:settings", config, ex=86400)      # 24 hours for config

# Use setex for clarity (seconds)
r.setex("cache:token:xyz", 3600, token_value)

# Use psetex for milliseconds precision
r.psetex("cache:realtime:data", 5000, data)  # 5 seconds

# Add TTL to existing key
r.set("mykey", "value")
r.expire("mykey", 3600)  # Add 1 hour TTL

# Conditional TTL updates (Redis 7.0+)
r.expire("mykey", 3600, nx=True)  # Only if no TTL exists
r.expire("mykey", 7200, gt=True)  # Only if new TTL is greater

# Check remaining TTL
ttl = r.ttl("cache:user:1000")  # Returns seconds, -1 if no TTL, -2 if key doesn't exist
```

Use shorter TTLs for frequently changing data and longer TTLs for stable data. Monitor memory usage with INFO memory command.

Reference: [https://redis.io/docs/latest/commands/expire/](https://redis.io/docs/latest/commands/expire/)

### 2.2 Avoid Very Large Keys and Values

**Impact: HIGH (prevents memory spikes and slow operations)**

Keep individual keys and values reasonably sized. Large values can cause memory spikes, slow operations, and network bottlenecks.

**Incorrect: storing very large values**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Storing entire large datasets in single keys
all_users = fetch_all_users()  # 100,000 users
r.set("cache:all_users", json.dumps(all_users))  # Huge value!

# Large list that grows unbounded
for event in event_stream:
    r.rpush("events:all", json.dumps(event))  # Grows forever

# Serializing large objects
large_report = generate_large_report()  # 50MB
r.set("report:monthly", large_report)  # Too large!
```

**Correct: chunk data and use appropriate structures**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Store individual items, not entire collections
for user in users:
    r.hset(f"user:{user['id']}", mapping=user)

# Use sorted set for paginated access
for i, user in enumerate(users):
    r.zadd("users:by_created", {f"user:{user['id']}": user['created_at']})

# Paginate large lists
page = r.zrange("users:by_created", 0, 99)  # First 100

# Cap lists to prevent unbounded growth
r.lpush("events:recent", json.dumps(event))
r.ltrim("events:recent", 0, 9999)  # Keep only last 10,000

# For large binary data, consider external storage
# Store reference in Redis, data in S3/blob storage
r.hset("report:monthly:meta", mapping={
    "s3_key": "reports/2024/january.pdf",
    "size": "52428800",
    "generated_at": "2024-01-31T00:00:00Z"
})

# Check memory usage of a key
memory_bytes = r.memory_usage("user:1000")
print(f"Key uses {memory_bytes} bytes")

# For strings, Redis max is 512MB but keep values under 1MB ideally
# For collections, avoid more than 10,000 elements if possible
```

Use MEMORY USAGE command to check key sizes. Consider breaking large objects into smaller keys or using external storage for very large binary data.

Reference: [https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/)

### 2.3 Use Colons for Key Namespacing

**Impact: CRITICAL (enables organized keyspace and efficient scanning)**

Use colon-separated hierarchical key names to organize your keyspace. This convention is widely adopted and enables efficient key scanning and management.

**Incorrect: inconsistent or flat naming**

```python
import redis
r = redis.Redis(decode_responses=True)

# Flat, inconsistent naming - hard to manage
r.set("user1name", "John")
r.set("user_1_email", "john@example.com")
r.set("1-user-age", "30")
r.set("sessionabc123", "data")

# No way to efficiently find all user keys
# KEYS * would return everything
```

**Correct: hierarchical colon-separated naming**

```python
import redis
r = redis.Redis(decode_responses=True)

# Consistent hierarchical naming: object-type:id:field
r.set("user:1000:name", "John")
r.set("user:1000:email", "john@example.com")
r.hset("user:1000:profile", mapping={"age": "30", "city": "NYC"})

# Session keys with clear namespace
r.set("session:abc123:data", "session_data")
r.set("session:abc123:user_id", "1000")

# Cache keys with clear purpose
r.set("cache:api:users:list", cached_response)
r.set("cache:db:query:hash123", cached_result)

# Rate limiting keys
r.set("ratelimit:api:user:1000", "5")

# Scan for all user keys efficiently
cursor = 0
while True:
    cursor, keys = r.scan(cursor, match="user:*", count=100)
    for key in keys:
        print(key)
    if cursor == 0:
        break

# Scan for all sessions
for key in r.scan_iter(match="session:*"):
    print(key)
```

The colon convention is not enforced by Redis but is a widely adopted standard. It makes keys self-documenting and enables pattern-based operations with SCAN.

Reference: [https://redis.io/docs/latest/develop/use/keyspace/](https://redis.io/docs/latest/develop/use/keyspace/)

### 2.4 Use SCAN Instead of KEYS in Production

**Impact: CRITICAL (KEYS blocks the server and can cause outages)**

Never use the KEYS command in production. It blocks Redis while scanning the entire keyspace. Use SCAN for incremental iteration instead.

**Incorrect: KEYS blocks the entire server**

```python
import redis
r = redis.Redis(decode_responses=True)

# DANGER: KEYS blocks Redis until complete
# With millions of keys, this can take seconds and block all clients
all_user_keys = r.keys("user:*")

# This pattern in a request handler can cause outages
def get_all_active_users():
    keys = r.keys("session:*")  # Blocks entire Redis!
    return [r.get(k) for k in keys]

# Even with a specific pattern, KEYS scans everything
cache_keys = r.keys("cache:api:*")
```

**Correct: use SCAN for non-blocking iteration**

```python
import redis
r = redis.Redis(decode_responses=True)

# SCAN iterates incrementally without blocking
def get_keys_by_pattern(pattern, count=100):
    """Non-blocking key iteration"""
    keys = []
    cursor = 0
    while True:
        cursor, batch = r.scan(cursor, match=pattern, count=count)
        keys.extend(batch)
        if cursor == 0:
            break
    return keys

# Using scan_iter helper (handles cursor automatically)
for key in r.scan_iter(match="user:*", count=100):
    process_key(key)

# Type-specific scan commands
for field, value in r.hscan_iter("myhash"):
    print(f"{field}: {value}")

for member in r.sscan_iter("myset"):
    print(member)

for member, score in r.zscan_iter("myzset"):
    print(f"{member}: {score}")

# Batch processing with SCAN
def delete_keys_by_pattern(pattern, batch_size=100):
    """Safely delete keys matching pattern"""
    cursor = 0
    deleted = 0
    while True:
        cursor, keys = r.scan(cursor, match=pattern, count=batch_size)
        if keys:
            r.delete(*keys)
            deleted += len(keys)
        if cursor == 0:
            break
    return deleted

# COUNT hint suggests batch size (not a guarantee)
# Larger COUNT = fewer round trips but longer per-call blocking
cursor, keys = r.scan(0, match="cache:*", count=1000)
```

SCAN may return duplicate keys across iterations and doesn't guarantee consistency if keys are modified during scanning. Handle duplicates in your application code.

Reference: [https://redis.io/docs/latest/commands/scan/](https://redis.io/docs/latest/commands/scan/)

---

## 3. Commands & Patterns

**Impact: HIGH**

Using optimal Redis commands and patterns reduces round trips, prevents blocking operations, and leverages Redis's atomic capabilities. Covers pipelining, transactions (MULTI/EXEC), Lua scripting, and batch operations.

---

### 3.1 Use Lua Scripts for Complex Atomic Operations

**Impact: HIGH (enables server-side atomic logic with conditional operations)**

Use Lua scripts when you need atomic operations with conditional logic. Scripts execute entirely on the server without interruption, reducing latency and ensuring consistency.

**Incorrect: client-side logic creates race conditions**

```python
import redis
r = redis.Redis(decode_responses=True)

# Race condition: another client might modify between GET and SET
current = r.get("inventory:item:123")
if current and int(current) > 0:
    r.decr("inventory:item:123")
    r.rpush("orders:pending", "order:456")
```

**Correct: use Lua for atomic conditional logic**

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

Reference: [https://redis.io/docs/latest/develop/interact/programmability/eval-intro/](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/)

### 3.2 Use MGET/MSET for Batch Key Operations

**Impact: MEDIUM (reduces round trips for multiple key operations)**

Use MGET and MSET commands instead of multiple GET/SET calls when operating on multiple keys. These commands reduce network round trips and are more efficient.

**Incorrect: multiple round trips**

```python
import redis
r = redis.Redis(decode_responses=True)

# Each GET is a separate round trip
user_name = r.get("user:1:name")
user_email = r.get("user:1:email")
user_status = r.get("user:1:status")

# Each SET is a separate round trip
r.set("config:timeout", "30")
r.set("config:retries", "3")
r.set("config:debug", "false")
```

**Correct: single round trip with MGET/MSET**

```python
import redis
r = redis.Redis(decode_responses=True)

# Get multiple keys in one call
values = r.mget("user:1:name", "user:1:email", "user:1:status")
name, email, status = values

# Set multiple keys in one call
r.mset({
    "config:timeout": "30",
    "config:retries": "3",
    "config:debug": "false"
})

# MSETNX - set only if none of the keys exist
success = r.msetnx({
    "lock:resource:1": "owner:abc",
    "lock:resource:2": "owner:abc"
})

# Combine with key pattern for bulk operations
def get_user_fields(user_id, fields):
    """Get multiple user fields efficiently"""
    keys = [f"user:{user_id}:{field}" for field in fields]
    values = r.mget(keys)
    return dict(zip(fields, values))

user_data = get_user_fields(1000, ["name", "email", "created_at"])
```

MGET returns None for keys that don't exist, maintaining position in the result list. For related data, consider using hashes with HMGET/HMSET instead of separate string keys.

Reference: [https://redis.io/docs/latest/commands/mget/](https://redis.io/docs/latest/commands/mget/)

### 3.3 Use MULTI/EXEC for Atomic Operations

**Impact: HIGH (ensures all-or-nothing execution without interleaving)**

Use Redis transactions with MULTI/EXEC when you need multiple commands to execute atomically without interruption from other clients.

**Incorrect: non-atomic operations can interleave**

```python
import redis
r = redis.Redis(decode_responses=True)

# Another client could modify balance between these commands
balance = int(r.get("account:1:balance") or 0)
if balance >= 100:
    r.decrby("account:1:balance", 100)
    r.incrby("account:2:balance", 100)
```

**Correct: use MULTI/EXEC for atomicity**

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

Reference: [https://redis.io/docs/latest/develop/interact/transactions/](https://redis.io/docs/latest/develop/interact/transactions/)

### 3.4 Use Pipelining for Bulk Operations

**Impact: HIGH (reduces network round trips and increases throughput)**

Pipeline multiple commands together to reduce network round trips. Pipelining sends multiple commands in a single request and reads all responses at once, dramatically improving throughput.

**Incorrect: one command per round trip**

```python
import redis
r = redis.Redis(decode_responses=True)

# Each command waits for response - N round trips
for i in range(1000):
    r.set(f"key:{i}", f"value:{i}")

# Also inefficient for reads
values = []
for key in keys:
    values.append(r.get(key))
```

**Correct: batch commands with pipelining**

```python
import redis
r = redis.Redis(decode_responses=True)

# Pipeline batches commands - single round trip
pipe = r.pipeline(transaction=False)
for i in range(1000):
    pipe.set(f"key:{i}", f"value:{i}")
results = pipe.execute()  # All 1000 commands in one round trip

# Batch reads
pipe = r.pipeline(transaction=False)
for key in keys:
    pipe.get(key)
values = pipe.execute()

# Process in batches for very large operations
def batch_set(redis_client, items, batch_size=500):
    """Set items in batches to manage memory"""
    pipe = redis_client.pipeline(transaction=False)
    for i, (key, value) in enumerate(items):
        pipe.set(key, value)
        if (i + 1) % batch_size == 0:
            pipe.execute()
            pipe = redis_client.pipeline(transaction=False)
    if len(items) % batch_size:
        pipe.execute()

# Mixed operations in a pipeline
pipe = r.pipeline(transaction=False)
pipe.set("user:1:name", "John")
pipe.incr("user:1:visits")
pipe.expire("user:1:session", 3600)
pipe.get("user:1:email")
results = pipe.execute()  # [True, 5, True, "john@example.com"]
```

Pipelining is NOT atomic. Commands may interleave with other clients. Use MULTI/EXEC transactions if you need atomicity. Keep batch sizes reasonable (100-1000) to balance memory usage and performance.

Reference: [https://redis.io/docs/latest/develop/use/pipelining/](https://redis.io/docs/latest/develop/use/pipelining/)

---

## 4. Connection Management

**Impact: HIGH**

Redis is single-threaded for command execution, making connection handling critical. Connection pooling, pipelining, proper client configuration, and reconnection strategies prevent resource exhaustion and maximize throughput.

---

### 4.1 Configure Connection Timeouts

**Impact: HIGH (prevents application hangs during Redis failures)**

Always configure connection and socket timeouts to prevent your application from hanging indefinitely when Redis is unavailable or slow.

**Incorrect: no timeouts - can hang forever**

```python
import redis

# No timeouts configured - dangerous in production
r = redis.Redis(host='localhost', port=6379)

# If Redis is down or slow, this hangs indefinitely
value = r.get("key")
```

**Correct: explicit timeout configuration**

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

Reference: [https://redis.io/docs/latest/develop/clients/error-handling/](https://redis.io/docs/latest/develop/clients/error-handling/)

### 4.2 Use Connection Pooling

**Impact: CRITICAL (prevents connection exhaustion and improves performance)**

Always use connection pooling instead of creating new connections for each operation. Creating connections is expensive and can exhaust server resources.

**Incorrect: creating connections per request**

```python
import redis

def get_user(user_id):
    # BAD: Creates new connection for every request
    r = redis.Redis(decode_responses=True)
    return r.get(f"user:{user_id}")

# Each call opens a new connection, never closes it
for user_id in user_ids:
    get_user(user_id)
```

**Correct: use connection pool**

```python
import redis

# Create pool once at application startup
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    db=0,
    max_connections=50,  # Set based on expected concurrency
    decode_responses=True,
    socket_timeout=5.0,
    socket_connect_timeout=5.0,
    retry_on_timeout=True
)

# Reuse pool across all operations
def get_redis():
    return redis.Redis(connection_pool=pool)

def get_user(user_id):
    r = get_redis()
    return r.get(f"user:{user_id}")

# Or use a singleton pattern
class RedisClient:
    _pool = None

    @classmethod
    def get_pool(cls):
        if cls._pool is None:
            cls._pool = redis.ConnectionPool(
                host='localhost',
                port=6379,
                max_connections=50,
                decode_responses=True
            )
        return cls._pool

    @classmethod
    def get_client(cls):
        return redis.Redis(connection_pool=cls.get_pool())

# With context manager for explicit connection handling
with redis.Redis(connection_pool=pool) as r:
    r.set("key", "value")
    value = r.get("key")
```

Set `max_connections` based on your application's concurrency needs. For web servers, match it to your worker count. Always configure timeouts to prevent hanging connections.

Reference: [https://redis.io/docs/latest/develop/clients/pools-and-muxing/](https://redis.io/docs/latest/develop/clients/pools-and-muxing/)

---

## 5. Caching Strategies

**Impact: HIGH**

Effective caching patterns maximize hit rates and minimize stale data. Covers cache-aside (lazy loading), write-through, write-behind, cache invalidation strategies, TTL design, and stampede prevention techniques.

---

### 5.1 Prevent Cache Stampede

**Impact: HIGH (avoids database overload when cache expires)**

Prevent cache stampede (thundering herd) when a popular cache key expires and many requests simultaneously try to regenerate it. Use locking or probabilistic early expiration.

**Incorrect: all requests hit database on expiration**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

def get_popular_data():
    cached = r.get("cache:popular")
    if cached:
        return json.loads(cached)

    # When cache expires, ALL concurrent requests hit the database
    data = expensive_database_query()
    r.set("cache:popular", json.dumps(data), ex=300)
    return data
```

**Correct: use distributed lock for cache rebuild**

```python
import redis
import json
import time
import random
r = redis.Redis(decode_responses=True)

def get_with_lock(cache_key, ttl, fetch_func):
    """Cache-aside with lock to prevent stampede"""
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    lock_key = f"lock:{cache_key}"

    # Try to acquire lock
    if r.set(lock_key, "1", nx=True, ex=30):  # 30s lock timeout
        try:
            # We have the lock - fetch and cache
            data = fetch_func()
            r.set(cache_key, json.dumps(data), ex=ttl)
            return data
        finally:
            r.delete(lock_key)
    else:
        # Another process is rebuilding - wait and retry
        for _ in range(10):
            time.sleep(0.1)
            cached = r.get(cache_key)
            if cached:
                return json.loads(cached)

        # Fallback: fetch anyway if lock holder failed
        return fetch_func()

# Probabilistic early expiration (XFetch algorithm)
def get_with_early_expiration(cache_key, ttl, fetch_func, beta=1.0):
    """Refresh cache before expiration probabilistically"""
    cached = r.get(cache_key)
    remaining_ttl = r.ttl(cache_key)

    if cached and remaining_ttl > 0:
        # Probabilistic early recompute
        # Higher probability as expiration approaches
        delta = ttl - remaining_ttl
        should_recompute = random.random() < (delta / ttl) * beta

        if not should_recompute:
            return json.loads(cached)

    # Recompute and cache
    data = fetch_func()
    r.set(cache_key, json.dumps(data), ex=ttl)
    return data

# Background refresh pattern
def get_with_background_refresh(cache_key, ttl, stale_threshold, fetch_func):
    """Serve stale data while refreshing in background"""
    cached = r.get(cache_key)
    remaining_ttl = r.ttl(cache_key)

    if cached:
        data = json.loads(cached)

        # If approaching expiration, trigger background refresh
        if remaining_ttl < stale_threshold:
            trigger_background_refresh(cache_key, ttl, fetch_func)

        return data

    # No cache - must fetch synchronously
    data = fetch_func()
    r.set(cache_key, json.dumps(data), ex=ttl)
    return data
```

For high-traffic cache keys, use distributed locking so only one request regenerates the cache. Probabilistic early expiration spreads regeneration over time instead of at exact expiration.

Reference: [https://redis.io/glossary/cache-stampede/](https://redis.io/glossary/cache-stampede/)

### 5.2 Use Cache-Aside Pattern for Reading

**Impact: HIGH (provides simple and effective caching with lazy loading)**

Implement the cache-aside (lazy-loading) pattern where your application checks the cache first, and only queries the database on cache miss. This is the most common and straightforward caching pattern.

**Incorrect: always hitting the database**

```python
import redis
r = redis.Redis(decode_responses=True)

def get_user(user_id):
    # Always queries database, ignores cache
    return db.query("SELECT * FROM users WHERE id = ?", user_id)
```

**Correct: cache-aside with TTL**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

def get_user(user_id):
    """Cache-aside pattern with expiration"""
    cache_key = f"cache:user:{user_id}"

    # 1. Check cache first
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # 2. Cache miss - query database
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    if user is None:
        return None

    # 3. Populate cache with TTL
    r.set(cache_key, json.dumps(user), ex=3600)  # 1 hour TTL

    return user

def update_user(user_id, data):
    """Invalidate cache on write"""
    # Update database first
    db.update("UPDATE users SET ... WHERE id = ?", data, user_id)

    # Then invalidate cache
    r.delete(f"cache:user:{user_id}")

# With explicit None caching to prevent repeated misses
def get_user_with_null_caching(user_id):
    cache_key = f"cache:user:{user_id}"
    cached = r.get(cache_key)

    if cached is not None:
        if cached == "__NULL__":
            return None  # Cached negative result
        return json.loads(cached)

    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    if user is None:
        # Cache the miss with short TTL
        r.set(cache_key, "__NULL__", ex=300)  # 5 min for nulls
    else:
        r.set(cache_key, json.dumps(user), ex=3600)

    return user

# Batch cache-aside for multiple items
def get_users(user_ids):
    cache_keys = [f"cache:user:{uid}" for uid in user_ids]
    cached_values = r.mget(cache_keys)

    results = {}
    missing_ids = []

    for uid, cached in zip(user_ids, cached_values):
        if cached:
            results[uid] = json.loads(cached)
        else:
            missing_ids.append(uid)

    # Fetch missing from database
    if missing_ids:
        db_users = db.query_many(missing_ids)
        pipe = r.pipeline()
        for user in db_users:
            results[user['id']] = user
            pipe.set(f"cache:user:{user['id']}", json.dumps(user), ex=3600)
        pipe.execute()

    return results
```

Always set TTL on cache entries. Invalidate cache on writes. Consider caching null results with shorter TTL to prevent cache stampede on non-existent items.

Reference: [https://redis.io/docs/latest/develop/use/patterns/](https://redis.io/docs/latest/develop/use/patterns/)

---

## 6. Common Use Cases

**Impact: MEDIUM-HIGH**

Redis excels at specific use cases beyond simple key-value storage. Patterns for session management, task queues, leaderboards, rate limiting, counters, and distributed locks.

---

### 6.1 Implement Distributed Locks Safely

**Impact: CRITICAL (prevents race conditions in distributed systems)**

Use Redis for distributed locks with proper safeguards: unique lock values, TTL expiration, and atomic unlock operations to prevent deadlocks and race conditions.

**Incorrect: unsafe locking patterns**

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

**Correct: safe distributed lock implementation**

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

Reference: [https://redis.io/docs/latest/develop/use/patterns/distributed-locks/](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/)

### 6.2 Store Sessions with Automatic Expiration

**Impact: HIGH (provides fast session access with automatic cleanup)**

Use Redis for session storage with automatic TTL expiration. Sessions are ideal for Redis: they require fast access, automatic cleanup, and often need to be shared across application instances.

**Incorrect: sessions without proper expiration**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# No expiration - sessions never cleaned up
def create_session(session_id, user_data):
    r.set(f"session:{session_id}", json.dumps(user_data))

# Manual cleanup required - error-prone
def cleanup_old_sessions():
    # This doesn't scale and requires tracking creation time
    pass
```

**Correct: sessions with TTL and refresh**

```python
import redis
import json
import uuid
import hashlib
r = redis.Redis(decode_responses=True)

SESSION_TTL = 1800  # 30 minutes
SESSION_REFRESH_THRESHOLD = 300  # Refresh if less than 5 min left

def create_session(user_id, user_data):
    """Create new session with TTL"""
    session_id = str(uuid.uuid4())

    session_data = {
        "user_id": user_id,
        "created_at": time.time(),
        **user_data
    }

    r.set(
        f"session:{session_id}",
        json.dumps(session_data),
        ex=SESSION_TTL
    )

    # Optional: track user's active sessions
    r.sadd(f"user:{user_id}:sessions", session_id)
    r.expire(f"user:{user_id}:sessions", SESSION_TTL * 2)

    return session_id

def get_session(session_id, refresh=True):
    """Get session and optionally refresh TTL on access"""
    key = f"session:{session_id}"
    data = r.get(key)

    if not data:
        return None

    # Refresh TTL if approaching expiration (sliding expiration)
    if refresh:
        ttl = r.ttl(key)
        if ttl < SESSION_REFRESH_THRESHOLD:
            r.expire(key, SESSION_TTL)

    return json.loads(data)

def update_session(session_id, updates):
    """Update session data and refresh TTL"""
    key = f"session:{session_id}"
    data = r.get(key)

    if not data:
        return False

    session = json.loads(data)
    session.update(updates)

    r.set(key, json.dumps(session), ex=SESSION_TTL)
    return True

def destroy_session(session_id):
    """Explicitly destroy session"""
    key = f"session:{session_id}"
    data = r.get(key)

    if data:
        session = json.loads(data)
        user_id = session.get("user_id")
        if user_id:
            r.srem(f"user:{user_id}:sessions", session_id)

    r.delete(key)

def destroy_all_user_sessions(user_id):
    """Logout user from all devices"""
    session_ids = r.smembers(f"user:{user_id}:sessions")
    if session_ids:
        keys = [f"session:{sid}" for sid in session_ids]
        r.delete(*keys)
    r.delete(f"user:{user_id}:sessions")

# Using hash for session data (more efficient for partial updates)
def create_session_hash(user_id, user_data):
    session_id = str(uuid.uuid4())
    key = f"session:{session_id}"

    r.hset(key, mapping={"user_id": user_id, **user_data})
    r.expire(key, SESSION_TTL)

    return session_id
```

Use sliding expiration to keep active sessions alive. Consider hashes for sessions if you frequently update individual fields. Always set TTL to prevent memory leaks.

Reference: [https://redis.io/solutions/session-management/](https://redis.io/solutions/session-management/)

### 6.3 Use Redis for Rate Limiting

**Impact: HIGH (protects APIs from abuse with atomic counters)**

Use Redis atomic operations for rate limiting. The fixed window, sliding window, and token bucket patterns each have different trade-offs.

**Incorrect: non-atomic rate limiting**

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

**Correct: atomic rate limiting patterns**

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

Reference: [https://redis.io/glossary/rate-limiting/](https://redis.io/glossary/rate-limiting/)

---

## 7. Pub/Sub & Streams

**Impact: MEDIUM**

Redis provides powerful messaging capabilities. Pub/Sub enables fire-and-forget broadcasting, while Streams offer persistent, replayable event logs with consumer groups for reliable processing.

---

### 7.1 Use Pub/Sub for Real-Time Broadcasting

**Impact: MEDIUM (enables fire-and-forget notifications to multiple subscribers)**

Use Redis Pub/Sub for fire-and-forget broadcasting to multiple subscribers. Pub/Sub is ideal for real-time notifications where message loss is acceptable.

**When to use Pub/Sub vs Streams:**

- **Pub/Sub**: Real-time notifications, cache invalidation, live updates where missing a message is OK

- **Streams**: Task queues, event sourcing, audit logs where every message must be processed

**Incorrect: using Pub/Sub for critical messages**

```python
import redis
r = redis.Redis(decode_responses=True)

# DON'T use Pub/Sub for messages that must not be lost
r.publish("payment:completed", "order:123")  # Lost if no subscribers
```

**Correct: Pub/Sub for appropriate use cases**

```python
import redis
import json
import threading
r = redis.Redis(decode_responses=True)

# Publisher: Broadcast cache invalidation
def invalidate_cache(entity_type, entity_id):
    """Notify all app instances to invalidate local cache"""
    r.publish(f"cache:invalidate:{entity_type}", entity_id)

# Publisher: Live activity updates
def broadcast_user_activity(user_id, activity):
    """Real-time activity feed updates"""
    r.publish("activity:live", json.dumps({
        "user_id": user_id,
        "activity": activity,
        "timestamp": time.time()
    }))

# Subscriber: Listen for cache invalidation
def cache_invalidation_listener():
    """Subscribe to cache invalidation events"""
    pubsub = r.pubsub()

    # Subscribe to pattern for all entity types
    pubsub.psubscribe("cache:invalidate:*")

    for message in pubsub.listen():
        if message["type"] == "pmessage":
            pattern = message["pattern"]
            channel = message["channel"]
            entity_id = message["data"]

            # Extract entity type from channel
            entity_type = channel.split(":")[-1]
            local_cache.invalidate(entity_type, entity_id)

# Subscriber: Handle live updates with reconnection
class RobustSubscriber:
    def __init__(self, redis_client, channels):
        self.redis = redis_client
        self.channels = channels
        self.pubsub = None
        self.running = False

    def start(self):
        self.running = True
        while self.running:
            try:
                self.pubsub = self.redis.pubsub()
                self.pubsub.subscribe(*self.channels)

                for message in self.pubsub.listen():
                    if not self.running:
                        break
                    if message["type"] == "message":
                        self.handle_message(message)

            except redis.ConnectionError:
                time.sleep(1)  # Reconnect after delay
                continue

    def handle_message(self, message):
        # Override in subclass
        print(f"Received: {message['data']}")

    def stop(self):
        self.running = False
        if self.pubsub:
            self.pubsub.unsubscribe()
            self.pubsub.close()

# Run subscriber in background thread
subscriber = RobustSubscriber(r, ["notifications:live"])
thread = threading.Thread(target=subscriber.start, daemon=True)
thread.start()
```

Pub/Sub has no persistence - messages sent when no subscribers are listening are lost. Handle connection failures and implement reconnection logic. Use pattern subscriptions (PSUBSCRIBE) carefully as they can impact performance.

Reference: [https://redis.io/docs/latest/develop/interact/pubsub/](https://redis.io/docs/latest/develop/interact/pubsub/)

### 7.2 Use Streams for Reliable Messaging

**Impact: HIGH (provides persistent, replayable message queues)**

Use Redis Streams instead of Pub/Sub when you need message persistence, replay capability, or consumer groups. Streams store messages and support acknowledgments.

**Incorrect: Pub/Sub for critical messages**

```python
import redis
r = redis.Redis(decode_responses=True)

# Pub/Sub messages are lost if no subscribers are listening
r.publish("orders", "order:123")

# No way to replay missed messages
# No acknowledgment mechanism
```

**Correct: Streams with consumer groups**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Add message to stream with auto-generated ID
message_id = r.xadd("orders:stream", {
    "order_id": "123",
    "user_id": "456",
    "total": "99.99",
    "status": "pending"
})

# Add with capped stream (keep last 10000 messages)
r.xadd(
    "orders:stream",
    {"order_id": "124", "status": "pending"},
    maxlen=10000,
    approximate=True  # Use ~ for efficiency
)

# Create consumer group (run once during setup)
try:
    r.xgroup_create("orders:stream", "order-processors", id="0", mkstream=True)
except redis.ResponseError as e:
    if "BUSYGROUP" not in str(e):
        raise

# Consumer: Read and process messages
def process_orders(consumer_name, batch_size=10):
    """Process orders with acknowledgment"""
    while True:
        # Read new messages for this consumer
        messages = r.xreadgroup(
            "order-processors",  # Group name
            consumer_name,        # Consumer name
            {"orders:stream": ">"},  # ">" = only new messages
            count=batch_size,
            block=5000  # Block for 5 seconds if no messages
        )

        if not messages:
            continue

        for stream, entries in messages:
            for message_id, fields in entries:
                try:
                    process_order(fields)
                    # Acknowledge successful processing
                    r.xack("orders:stream", "order-processors", message_id)
                except Exception as e:
                    # Don't ack - message will be retried
                    log.error(f"Failed to process {message_id}: {e}")

# Claim and retry pending messages (handle failed consumers)
def retry_pending_messages(consumer_name, min_idle_time=60000):
    """Claim messages that have been pending too long"""
    # Get pending messages
    pending = r.xpending_range(
        "orders:stream",
        "order-processors",
        min="-",
        max="+",
        count=10
    )

    for entry in pending:
        message_id = entry["message_id"]
        idle_time = entry["time_since_delivered"]

        if idle_time > min_idle_time:
            # Claim the message
            claimed = r.xclaim(
                "orders:stream",
                "order-processors",
                consumer_name,
                min_idle_time,
                [message_id]
            )
            for msg_id, fields in claimed:
                process_order(fields)
                r.xack("orders:stream", "order-processors", msg_id)

# Read stream history (replay)
def get_order_history(since_id="0", count=100):
    """Read historical messages"""
    return r.xrange("orders:stream", min=since_id, count=count)
```

Streams persist messages until explicitly deleted. Use consumer groups for competing consumers. Always acknowledge processed messages. Use XCLAIM to handle failed consumers.

Reference: [https://redis.io/docs/latest/develop/data-types/streams/](https://redis.io/docs/latest/develop/data-types/streams/)

---

## 8. JSON & Search

**Impact: MEDIUM**

Redis Stack extends core Redis with JSON document support and full-text search. Covers JSONPath operations, indexing strategies, and query patterns for document-oriented use cases.

---

### 8.1 Use Redis Search for Complex Queries

**Impact: MEDIUM (enables full-text search and secondary indexes)**

Use Redis Search (RediSearch) for full-text search, filtering, and aggregations instead of scanning keys. It provides secondary indexes for fast lookups on any field.

**Incorrect: scanning and filtering in application**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Scanning all keys to find matches - very slow
def find_users_by_city(city):
    results = []
    for key in r.scan_iter(match="user:*"):
        data = r.hgetall(key)
        if data.get("city") == city:
            results.append(data)
    return results
```

**Correct: use Redis Search indexes**

```python
import redis
from redis.commands.search.field import TextField, NumericField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from redis.commands.search.aggregation import AggregateRequest, Asc

r = redis.Redis(decode_responses=True)

# Create index on hash keys (run once during setup)
def create_user_index():
    try:
        # Define schema
        schema = (
            TextField("name", weight=2.0),  # Higher weight for name matches
            TextField("email"),
            TagField("city"),  # Tag for exact matches
            NumericField("age"),
            NumericField("created_at", sortable=True),
        )

        # Create index on keys matching "user:*"
        r.ft("idx:users").create_index(
            schema,
            definition=IndexDefinition(
                prefix=["user:"],
                index_type=IndexType.HASH
            )
        )
    except redis.ResponseError as e:
        if "Index already exists" not in str(e):
            raise

# Store users as hashes (automatically indexed)
r.hset("user:1", mapping={
    "name": "John Doe",
    "email": "john@example.com",
    "city": "NYC",
    "age": 30,
    "created_at": 1704067200
})

# Search by city (exact match with tag)
def find_users_by_city(city):
    query = Query(f"@city:{{{city}}}")
    return r.ft("idx:users").search(query)

# Full-text search in name
def search_users_by_name(name_query):
    query = Query(f"@name:{name_query}*")  # Prefix search
    return r.ft("idx:users").search(query)

# Complex query with multiple conditions
def find_users(city=None, min_age=None, max_age=None, search_text=None):
    query_parts = []

    if city:
        query_parts.append(f"@city:{{{city}}}")
    if min_age is not None:
        query_parts.append(f"@age:[{min_age} +inf]")
    if max_age is not None:
        query_parts.append(f"@age:[-inf {max_age}]")
    if search_text:
        query_parts.append(f"@name|email:{search_text}")

    query_string = " ".join(query_parts) if query_parts else "*"
    query = Query(query_string).paging(0, 100)

    return r.ft("idx:users").search(query)

# Aggregation example
def count_users_by_city():
    """Count users grouped by city"""
    request = AggregateRequest("*").group_by(
        "@city",
        reducers=[
            r.ft("idx:users").aggregation().count().alias("count")
        ]
    )
    return r.ft("idx:users").aggregate(request)

# Sorting and pagination
def list_users_paginated(page=0, page_size=20, sort_by="created_at"):
    query = Query("*").sort_by(sort_by, asc=False).paging(
        page * page_size, page_size
    )
    return r.ft("idx:users").search(query)

# JSON document search (with RedisJSON)
def create_product_index():
    """Index JSON documents"""
    schema = (
        TextField("$.name", as_name="name"),
        NumericField("$.price", as_name="price"),
        TagField("$.category", as_name="category"),
    )

    r.ft("idx:products").create_index(
        schema,
        definition=IndexDefinition(
            prefix=["product:"],
            index_type=IndexType.JSON
        )
    )
```

Create indexes on fields you query frequently. Use TagField for exact matches, TextField for full-text search, NumericField for ranges. Indexes update automatically when data changes.

Reference: [https://redis.io/docs/latest/develop/interact/search-and-query/](https://redis.io/docs/latest/develop/interact/search-and-query/)

### 8.2 Use RedisJSON for Complex Documents

**Impact: MEDIUM (enables efficient nested document storage and querying)**

Use RedisJSON for storing and querying complex nested documents. It provides atomic operations on nested paths and integrates with Redis Search for indexing.

**Incorrect: serializing JSON to strings**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Storing as string requires full read-modify-write
user = {"name": "John", "address": {"city": "NYC", "zip": "10001"}}
r.set("user:1", json.dumps(user))

# To update nested field, must read entire document
data = json.loads(r.get("user:1"))
data["address"]["city"] = "LA"
r.set("user:1", json.dumps(data))  # Race condition!
```

**Correct: use RedisJSON for document operations**

```python
import redis
from redis.commands.json.path import Path
r = redis.Redis(decode_responses=True)

# Store document as JSON type
user = {
    "name": "John",
    "email": "john@example.com",
    "age": 30,
    "address": {
        "city": "NYC",
        "zip": "10001",
        "coords": {"lat": 40.7128, "lng": -74.0060}
    },
    "tags": ["premium", "verified"],
    "orders": []
}

r.json().set("user:1", "$", user)

# Read specific nested paths (efficient)
city = r.json().get("user:1", "$.address.city")  # ["NYC"]
coords = r.json().get("user:1", "$.address.coords")

# Update nested field atomically
r.json().set("user:1", "$.address.city", "LA")

# Increment numeric values atomically
r.json().numincrby("user:1", "$.age", 1)

# Array operations
r.json().arrappend("user:1", "$.tags", "loyal")
r.json().arrappend("user:1", "$.orders", {
    "id": "order:123",
    "total": 99.99,
    "date": "2024-01-15"
})

# Get multiple paths in one call
result = r.json().get("user:1", "$.name", "$.email", "$.address.city")

# String operations on nested values
r.json().strappend("user:1", "$.name", " Doe")
length = r.json().strlen("user:1", "$.name")

# Query with JSONPath filters
r.json().get("user:1", "$..orders[?(@.total > 50)]")

# Delete nested elements
r.json().delete("user:1", "$.address.coords")

# Check type of nested element
type_info = r.json().type("user:1", "$.tags")  # ["array"]

# Merge/update partial documents (Redis 7.4+)
r.json().merge("user:1", "$", {"status": "active", "address": {"country": "USA"}})
```

RedisJSON is part of Redis Stack. For simple flat objects, use hashes instead. Use JSONPath for efficient partial reads and updates. Combine with Redis Search to create indexes on JSON fields.

Reference: [https://redis.io/docs/latest/develop/data-types/json/](https://redis.io/docs/latest/develop/data-types/json/)

---

## 9. Memory Optimization

**Impact: MEDIUM**

Redis stores all data in memory, making optimization essential. Techniques include choosing memory-efficient encodings, setting appropriate maxmemory policies, using TTLs effectively, and monitoring fragmentation.

---

### 9.1 Monitor Memory and Set Limits

**Impact: CRITICAL (prevents out-of-memory crashes and performance degradation)**

Always configure maxmemory and an eviction policy in production. Monitor memory usage to prevent OOM errors and performance issues.

**Incorrect: no memory limits**

```python
# No maxmemory configured - Redis uses all available memory
# Application crashes when system runs out of memory
```

**Correct: configure limits and monitor**

```python
import redis
r = redis.Redis(decode_responses=True)

# Check current memory configuration
info = r.info("memory")
print(f"Used memory: {info['used_memory_human']}")
print(f"Peak memory: {info['used_memory_peak_human']}")
print(f"Max memory: {info.get('maxmemory_human', 'not set')}")
print(f"Eviction policy: {info.get('maxmemory_policy', 'noeviction')}")

# Memory monitoring function
def check_memory_health(r, warning_threshold=0.8, critical_threshold=0.95):
    """Check Redis memory status"""
    info = r.info("memory")

    used = info["used_memory"]
    max_mem = info.get("maxmemory", 0)

    if max_mem == 0:
        return {"status": "warning", "message": "maxmemory not configured"}

    ratio = used / max_mem

    if ratio > critical_threshold:
        return {
            "status": "critical",
            "message": f"Memory at {ratio:.1%} of limit",
            "used": used,
            "max": max_mem
        }
    elif ratio > warning_threshold:
        return {
            "status": "warning",
            "message": f"Memory at {ratio:.1%} of limit"
        }
    else:
        return {"status": "ok", "ratio": ratio}

# Check for evicted keys
def check_eviction_rate(r):
    """Monitor key eviction"""
    stats = r.info("stats")
    evicted = stats.get("evicted_keys", 0)

    if evicted > 0:
        return {
            "status": "warning",
            "evicted_keys": evicted,
            "message": "Keys are being evicted - consider increasing memory"
        }
    return {"status": "ok", "evicted_keys": 0}

# Find large keys consuming memory
def find_large_keys(r, sample_size=1000, top_n=10):
    """Sample keys and find largest by memory usage"""
    large_keys = []
    cursor = 0
    sampled = 0

    while sampled < sample_size:
        cursor, keys = r.scan(cursor, count=100)
        for key in keys:
            memory = r.memory_usage(key)
            if memory:
                large_keys.append((key, memory))
            sampled += 1
        if cursor == 0:
            break

    # Sort by memory usage descending
    large_keys.sort(key=lambda x: x[1], reverse=True)
    return large_keys[:top_n]

# Memory usage by key pattern
def memory_by_pattern(r, patterns, sample_per_pattern=100):
    """Estimate memory usage by key pattern"""
    results = {}

    for pattern in patterns:
        total_memory = 0
        count = 0

        for key in r.scan_iter(match=pattern, count=100):
            memory = r.memory_usage(key) or 0
            total_memory += memory
            count += 1
            if count >= sample_per_pattern:
                break

        results[pattern] = {
            "sampled_count": count,
            "total_memory": total_memory,
            "avg_per_key": total_memory / count if count > 0 else 0
        }

    return results

# Example: Check memory health
health = check_memory_health(r)
if health["status"] != "ok":
    print(f"Memory alert: {health['message']}")
    large = find_large_keys(r)
    print(f"Largest keys: {large}")
```

Configure `maxmemory` to leave headroom for OS and other processes. Choose appropriate eviction policy: `volatile-lru` for cache with TTLs, `allkeys-lru` for pure cache, `noeviction` for persistent data.

Reference: [https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/)

### 9.2 Use Memory-Efficient Data Structures

**Impact: HIGH (reduces memory usage by 5-10x for small objects)**

Redis automatically uses memory-efficient encodings for small data structures. Understand these thresholds and design your data to benefit from them.

**Incorrect: inefficient memory patterns**

```python
import redis
r = redis.Redis(decode_responses=True)

# Separate keys for related data - high overhead per key
r.set("user:1:name", "John")
r.set("user:1:email", "john@example.com")
r.set("user:1:age", "30")
# Each key has ~50 bytes overhead regardless of value size

# Very long values in hash fields (exceeds ziplist threshold)
r.hset("user:1", "biography", "A" * 1000)  # Forces dict encoding
```

**Correct: leverage efficient encodings**

```python
import redis
r = redis.Redis(decode_responses=True)

# Group related data in hashes (uses ziplist for small hashes)
# Up to 512 entries with values under 64 bytes uses efficient encoding
r.hset("user:1", mapping={
    "name": "John",
    "email": "john@example.com",
    "age": "30",
    "city": "NYC"
})

# Check memory usage
memory_usage = r.memory_usage("user:1")
print(f"Memory: {memory_usage} bytes")

# For many small key-value pairs, use hash bucketing
def memory_efficient_set(r, key, value):
    """Store key-value in hash bucket for memory efficiency"""
    # Split key into bucket and field
    bucket = key[:2]  # First 2 chars as bucket
    r.hset(f"kv:{bucket}", key, value)

def memory_efficient_get(r, key):
    bucket = key[:2]
    return r.hget(f"kv:{bucket}", key)

# Integer sets - very efficient for numeric IDs
# Uses intset encoding for sets of integers under threshold
r.sadd("user:followers:1", 100, 200, 300, 400, 500)

# Check encoding type
encoding = r.object("encoding", "user:followers:1")
print(f"Encoding: {encoding}")  # "intset" for small integer sets

# Keep list elements small for listpack encoding
r.rpush("events:recent", *[
    f"{ts}:{event_type}:{short_data}"
    for ts, event_type, short_data in events
])

# For large binary data, consider compression
import zlib
large_data = get_large_response()
compressed = zlib.compress(large_data.encode())
r.set("cache:large", compressed)

# Decompress on read
cached = r.get("cache:large")
if cached:
    data = zlib.decompress(cached).decode()

# Use SCAN with TYPE filter to audit memory usage
def audit_memory_by_type(r, sample_size=1000):
    """Sample keys and check memory usage by type"""
    stats = {}
    cursor = 0
    count = 0

    while count < sample_size:
        cursor, keys = r.scan(cursor, count=100)
        for key in keys:
            key_type = r.type(key)
            memory = r.memory_usage(key) or 0

            if key_type not in stats:
                stats[key_type] = {"count": 0, "memory": 0}
            stats[key_type]["count"] += 1
            stats[key_type]["memory"] += memory
            count += 1

        if cursor == 0:
            break

    return stats
```

Redis 7+ uses listpack encoding (replaces ziplist). Keep hash entries under 512 with values under 64 bytes for optimal encoding. Use integer sets when storing numeric IDs. Consider compression for large values.

Reference: [https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/)

---

## 10. Error Handling & Resilience

**Impact: LOW-MEDIUM**

Production Redis applications need graceful error handling. Covers retry strategies, circuit breakers, timeout configuration, connection error handling, and degradation patterns when Redis is unavailable.

### 10.1 Handle Connection Errors Gracefully

**Impact: CRITICAL (prevents application failures during Redis outages)**

Implement proper error handling and retry logic for Redis operations. Applications should degrade gracefully when Redis is unavailable.

**Incorrect: unhandled errors crash application**

```python
import redis
r = redis.Redis()

def get_user(user_id):
    # No error handling - application crashes if Redis is down
    return r.get(f"user:{user_id}")
```

**Correct: graceful error handling with retries**

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

Reference: [https://redis.io/docs/latest/develop/clients/error-handling/](https://redis.io/docs/latest/develop/clients/error-handling/)

### 10.2 Implement Redis Health Checks

**Impact: HIGH (enables proactive monitoring and fast failure detection)**

Implement health checks to detect Redis issues before they impact users. Use PING for basic connectivity and INFO for detailed diagnostics.

**Incorrect: no health monitoring**

```python
import redis
r = redis.Redis()

# No health checks - issues discovered only when operations fail
def get_data(key):
    return r.get(key)
```

**Correct: proactive health monitoring**

```python
import redis
import time
from dataclasses import dataclass
from typing import Optional, Dict, Any

r = redis.Redis(decode_responses=True)

@dataclass
class HealthStatus:
    healthy: bool
    latency_ms: float
    details: Dict[str, Any]
    error: Optional[str] = None

def check_redis_health(timeout_ms=100) -> HealthStatus:
    """Comprehensive Redis health check"""
    start = time.time()

    try:
        # Basic connectivity check
        pong = r.ping()
        latency = (time.time() - start) * 1000

        if not pong:
            return HealthStatus(
                healthy=False,
                latency_ms=latency,
                details={},
                error="PING returned False"
            )

        # Get server info
        info = r.info()

        # Check key metrics
        details = {
            "version": info.get("redis_version"),
            "uptime_seconds": info.get("uptime_in_seconds"),
            "connected_clients": info.get("connected_clients"),
            "used_memory_human": info.get("used_memory_human"),
            "used_memory_peak_human": info.get("used_memory_peak_human"),
            "maxmemory_human": info.get("maxmemory_human", "not set"),
            "evicted_keys": info.get("evicted_keys", 0),
            "rejected_connections": info.get("rejected_connections", 0),
            "role": info.get("role"),
        }

        # Check for warning conditions
        warnings = []

        # Memory usage check
        if info.get("maxmemory", 0) > 0:
            memory_ratio = info["used_memory"] / info["maxmemory"]
            details["memory_usage_percent"] = round(memory_ratio * 100, 1)
            if memory_ratio > 0.9:
                warnings.append("Memory usage above 90%")

        # Eviction check
        if info.get("evicted_keys", 0) > 0:
            warnings.append(f"Keys being evicted: {info['evicted_keys']}")

        # Connection rejection check
        if info.get("rejected_connections", 0) > 0:
            warnings.append(f"Connections rejected: {info['rejected_connections']}")

        # Latency check
        if latency > timeout_ms:
            warnings.append(f"High latency: {latency:.1f}ms")

        details["warnings"] = warnings

        return HealthStatus(
            healthy=len(warnings) == 0 or latency <= timeout_ms,
            latency_ms=latency,
            details=details
        )

    except redis.ConnectionError as e:
        return HealthStatus(
            healthy=False,
            latency_ms=(time.time() - start) * 1000,
            details={},
            error=f"Connection error: {e}"
        )
    except redis.TimeoutError as e:
        return HealthStatus(
            healthy=False,
            latency_ms=(time.time() - start) * 1000,
            details={},
            error=f"Timeout: {e}"
        )

# Endpoint for load balancer health checks
def health_endpoint():
    """HTTP health check endpoint"""
    status = check_redis_health()

    if status.healthy:
        return {"status": "healthy", "latency_ms": status.latency_ms}, 200
    else:
        return {
            "status": "unhealthy",
            "error": status.error,
            "details": status.details
        }, 503

# Background health monitor
class RedisHealthMonitor:
    def __init__(self, check_interval=10):
        self.check_interval = check_interval
        self.last_status = None
        self.consecutive_failures = 0

    def run(self):
        while True:
            status = check_redis_health()
            self.last_status = status

            if not status.healthy:
                self.consecutive_failures += 1
                log.warning(f"Redis unhealthy: {status.error}")
                if self.consecutive_failures >= 3:
                    self.alert("Redis unhealthy for 3+ checks")
            else:
                if self.consecutive_failures > 0:
                    log.info("Redis recovered")
                self.consecutive_failures = 0

            time.sleep(self.check_interval)

    def alert(self, message):
        # Send to monitoring system
        pass
```

Use health check results for load balancer configuration. Set appropriate timeout thresholds. Monitor trends in latency and memory usage. Alert on consecutive failures, not single events.

Reference: [https://redis.io/docs/latest/commands/ping/](https://redis.io/docs/latest/commands/ping/)

---

## References

1. [https://redis.io/docs/latest/develop/](https://redis.io/docs/latest/develop/)
2. [https://redis.io/docs/latest/develop/data-types/](https://redis.io/docs/latest/develop/data-types/)
3. [https://redis.io/docs/latest/develop/use/](https://redis.io/docs/latest/develop/use/)
4. [https://redis.io/docs/latest/develop/clients/](https://redis.io/docs/latest/develop/clients/)
