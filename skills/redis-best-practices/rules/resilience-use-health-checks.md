---
title: Implement Redis Health Checks
impact: HIGH
impactDescription: enables proactive monitoring and fast failure detection
tags: resilience, health-check, monitoring, operations
---

## Implement Redis Health Checks

Implement health checks to detect Redis issues before they impact users. Use PING for basic connectivity and INFO for detailed diagnostics.

**Incorrect (no health monitoring):**

```python
import redis
r = redis.Redis()

# No health checks - issues discovered only when operations fail
def get_data(key):
    return r.get(key)
```

**Correct (proactive health monitoring):**

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

Reference: [Redis PING Command](https://redis.io/docs/latest/commands/ping/)
