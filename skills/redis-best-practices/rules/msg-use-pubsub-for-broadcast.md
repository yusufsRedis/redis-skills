---
title: Use Pub/Sub for Real-Time Broadcasting
impact: MEDIUM
impactDescription: enables fire-and-forget notifications to multiple subscribers
tags: messaging, pubsub, broadcast, realtime
---

## Use Pub/Sub for Real-Time Broadcasting

Use Redis Pub/Sub for fire-and-forget broadcasting to multiple subscribers. Pub/Sub is ideal for real-time notifications where message loss is acceptable.

**When to use Pub/Sub vs Streams:**

- **Pub/Sub**: Real-time notifications, cache invalidation, live updates where missing a message is OK
- **Streams**: Task queues, event sourcing, audit logs where every message must be processed

**Incorrect (using Pub/Sub for critical messages):**

```python
import redis
r = redis.Redis(decode_responses=True)

# DON'T use Pub/Sub for messages that must not be lost
r.publish("payment:completed", "order:123")  # Lost if no subscribers
```

**Correct (Pub/Sub for appropriate use cases):**

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

Reference: [Redis Pub/Sub](https://redis.io/docs/latest/develop/interact/pubsub/)
