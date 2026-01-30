---
title: Store Sessions with Automatic Expiration
impact: HIGH
impactDescription: provides fast session access with automatic cleanup
tags: use-cases, sessions, authentication, expiration
---

## Store Sessions with Automatic Expiration

Use Redis for session storage with automatic TTL expiration. Sessions are ideal for Redis: they require fast access, automatic cleanup, and often need to be shared across application instances.

**Incorrect (sessions without proper expiration):**

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

**Correct (sessions with TTL and refresh):**

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

Reference: [Redis for Session Management](https://redis.io/solutions/session-management/)
