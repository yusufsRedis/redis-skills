# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Data Structures (ds)

**Impact:** CRITICAL

**Description:** Choosing the correct Redis data structure is fundamental to performance and functionality. Redis offers Strings, Lists, Sets, Sorted Sets, Hashes, Streams, and more. Each has specific time complexities and memory characteristics. Using the wrong type leads to inefficient operations, excessive memory usage, and poor scalability.

---

## 2. Key Design (key)

**Impact:** CRITICAL

**Description:** Well-designed keys improve code readability, enable efficient SCAN operations, prevent key collisions, and support logical data organization. Key naming conventions (like colon-separated namespaces) and TTL strategies directly impact maintainability and memory management.

---

## 3. Commands & Patterns (cmd)

**Impact:** HIGH

**Description:** Using optimal Redis commands and patterns reduces round trips, prevents blocking operations, and leverages Redis's atomic capabilities. Covers pipelining, transactions (MULTI/EXEC), Lua scripting, and batch operations.

---

## 4. Connection Management (conn)

**Impact:** HIGH

**Description:** Redis is single-threaded for command execution, making connection handling critical. Connection pooling, pipelining, proper client configuration, and reconnection strategies prevent resource exhaustion and maximize throughput.

---

## 5. Caching Strategies (cache)

**Impact:** HIGH

**Description:** Effective caching patterns maximize hit rates and minimize stale data. Covers cache-aside (lazy loading), write-through, write-behind, cache invalidation strategies, TTL design, and stampede prevention techniques.

---

## 6. Common Use Cases (use)

**Impact:** MEDIUM-HIGH

**Description:** Redis excels at specific use cases beyond simple key-value storage. Patterns for session management, task queues, leaderboards, rate limiting, counters, and distributed locks.

---

## 7. Pub/Sub & Streams (msg)

**Impact:** MEDIUM

**Description:** Redis provides powerful messaging capabilities. Pub/Sub enables fire-and-forget broadcasting, while Streams offer persistent, replayable event logs with consumer groups for reliable processing.

---

## 8. JSON & Search (stack)

**Impact:** MEDIUM

**Description:** Redis Stack extends core Redis with JSON document support and full-text search. Covers JSONPath operations, indexing strategies, and query patterns for document-oriented use cases.

---

## 9. Memory Optimization (memory)

**Impact:** MEDIUM

**Description:** Redis stores all data in memory, making optimization essential. Techniques include choosing memory-efficient encodings, setting appropriate maxmemory policies, using TTLs effectively, and monitoring fragmentation.

---

## 10. Error Handling & Resilience (resilience)

**Impact:** LOW-MEDIUM

**Description:** Production Redis applications need graceful error handling. Covers retry strategies, circuit breakers, timeout configuration, connection error handling, and degradation patterns when Redis is unavailable.
