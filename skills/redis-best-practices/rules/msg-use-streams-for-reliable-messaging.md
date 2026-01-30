---
title: Use Streams for Reliable Messaging
impact: HIGH
impactDescription: provides persistent, replayable message queues
tags: messaging, streams, queues, reliability
---

## Use Streams for Reliable Messaging

Use Redis Streams instead of Pub/Sub when you need message persistence, replay capability, or consumer groups. Streams store messages and support acknowledgments.

**Incorrect (Pub/Sub for critical messages):**

```python
import redis
r = redis.Redis(decode_responses=True)

# Pub/Sub messages are lost if no subscribers are listening
r.publish("orders", "order:123")

# No way to replay missed messages
# No acknowledgment mechanism
```

**Correct (Streams with consumer groups):**

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

Reference: [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)
