---
name: redis-best-practices
description: Redis development patterns and best practices. Use when writing, reviewing, or refactoring application code that interacts with Redis. Triggers on tasks involving Redis, caching, session storage, pub/sub, queues, leaderboards, rate limiting, key-value operations, or data structure selection.
license: MIT
metadata:
  author: redis
  version: "1.0.0"
---

# Redis Best Practices

Development patterns and best practices for building applications with Redis. Contains rules across multiple categories, prioritized by impact to guide code generation and review.

## When to Apply

Reference these guidelines when:
- Writing new code that interacts with Redis
- Choosing data structures for your use case
- Designing key naming conventions
- Implementing caching strategies
- Building queues, leaderboards, or rate limiters
- Optimizing connection handling
- Working with pub/sub or streams

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Data Structures | CRITICAL | `ds-` |
| 2 | Key Design | CRITICAL | `key-` |
| 3 | Commands & Patterns | HIGH | `cmd-` |
| 4 | Connection Management | HIGH | `conn-` |
| 5 | Caching Strategies | HIGH | `cache-` |
| 6 | Common Use Cases | MEDIUM-HIGH | `use-` |
| 7 | Pub/Sub & Streams | MEDIUM | `msg-` |
| 8 | JSON & Search | MEDIUM | `stack-` |
| 9 | Memory Optimization | MEDIUM | `memory-` |
| 10 | Error Handling & Resilience | LOW-MEDIUM | `resilience-` |

## Quick Reference

### 1. Data Structures (CRITICAL)

- `ds-use-hashes-for-objects` - Store related fields in hashes for 10x memory savings
- `ds-choose-sets-for-uniqueness` - Use sets for unique collections with O(1) membership
- `ds-sorted-sets-for-rankings` - Use sorted sets for leaderboards and ranked data
- `ds-lists-for-queues` - Use lists for FIFO/LIFO queues
- `ds-strings-for-counters` - Use INCR/DECR for atomic counters
- `ds-use-hyperloglog-for-cardinality` - Count unique items with 12KB fixed memory

### 2. Key Design (CRITICAL)

- `key-use-colons-for-namespacing` - Use colons to namespace keys (e.g., user:1000:profile)
- `key-set-ttl-on-cache-keys` - Always set expiration on cache keys
- `key-avoid-large-keys` - Keep keys under 1KB, values under 100KB
- `key-use-scan-not-keys` - Use SCAN instead of KEYS in production

### 3. Commands & Patterns (HIGH)

- `cmd-use-pipelining-for-bulk` - Pipeline commands to reduce network round trips
- `cmd-use-multi-exec-for-atomicity` - Use MULTI/EXEC for atomic transactions
- `cmd-use-lua-for-complex-atomicity` - Use Lua scripts for complex atomic operations
- `cmd-use-mget-mset-for-batches` - Use MGET/MSET for batch key operations

### 4. Connection Management (HIGH)

- `conn-use-connection-pooling` - Use connection pools to avoid exhaustion
- `conn-configure-timeouts` - Set socket, connect, and command timeouts

### 5. Caching Strategies (HIGH)

- `cache-use-cache-aside-pattern` - Implement cache-aside (lazy loading) pattern
- `cache-prevent-cache-stampede` - Use locking or probabilistic refresh to prevent stampedes

### 6. Common Use Cases (MEDIUM-HIGH)

- `use-distributed-locks-safely` - Implement locks with unique tokens and TTL
- `use-rate-limiting-patterns` - Use sliding window or token bucket algorithms
- `use-sessions-with-expiration` - Store sessions in hashes with TTL

### 7. Pub/Sub & Streams (MEDIUM)

- `msg-use-pubsub-for-broadcast` - Use Pub/Sub for ephemeral fan-out messaging
- `msg-use-streams-for-reliable-messaging` - Use Streams for persistent, reliable queues

### 8. JSON & Search (MEDIUM)

- `stack-use-json-for-documents` - Use RedisJSON for nested document storage
- `stack-use-search-for-queries` - Use Redis Search for secondary indexes and full-text search

### 9. Memory Optimization (MEDIUM)

- `memory-use-efficient-encodings` - Keep data small to use ziplist/listpack encoding
- `memory-monitor-and-set-limits` - Set maxmemory and appropriate eviction policy

### 10. Error Handling & Resilience (LOW-MEDIUM)

- `resilience-handle-connection-errors` - Implement retries with exponential backoff
- `resilience-use-health-checks` - Monitor Redis health with PING and INFO

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/ds-use-hashes-for-objects.md
rules/key-use-colons-for-namespacing.md
rules/conn-use-connection-pooling.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
