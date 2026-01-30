---
name: redis-infrastructure
description: Patterns for deploying, securing, and managing Redis in production. Use when setting up Redis clusters, configuring security, implementing high availability, or monitoring Redis systems. Triggers on tasks involving Redis deployment, Redis Cloud, Redis Software, Redis Kubernetes, clustering, replication, security, or monitoring.
license: MIT
metadata:
  author: redis
  version: "1.0.0"
---

# Redis Infrastructure

Patterns and best practices for deploying, securing, and operating Redis in production environments. Covers all Redis products: Cloud, Software, Kubernetes, and Open Source.

## When to Apply

Reference these guidelines when:
- Deploying Redis (Cloud, Software, Kubernetes, or OSS)
- Configuring Redis security (ACLs, TLS, authentication)
- Setting up high availability and failover
- Scaling Redis with clustering or replication
- Configuring persistence and durability
- Monitoring Redis performance and health
- Setting up backups and disaster recovery
- Integrating data with RDI (Redis Data Integration)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Deployment | CRITICAL | `deploy-` |
| 2 | Configuration | CRITICAL | `config-` |
| 3 | Security | CRITICAL | `security-` |
| 4 | High Availability | HIGH | `ha-` |
| 5 | Clustering & Scaling | HIGH | `cluster-` |
| 6 | Replication | HIGH | `replication-` |
| 7 | Persistence | MEDIUM-HIGH | `persist-` |
| 8 | Monitoring | MEDIUM | `monitor-` |
| 9 | Backup & Recovery | MEDIUM | `backup-` |
| 10 | Data Integration | LOW-MEDIUM | `rdi-` |

## Products Covered

- **Redis Cloud** - Fully managed database-as-a-service
- **Redis Software** - Self-managed enterprise Redis
- **Redis for Kubernetes** - Container-native deployment
- **Redis Open Source** - Community edition
- **RDI** - Redis Data Integration for CDC pipelines

## Quick Reference

### 1. Deployment (CRITICAL)

Installation and provisioning across all Redis products.

### 2. Configuration (CRITICAL)

Settings, tuning, and runtime configuration.

### 3. Security (CRITICAL)

ACLs, TLS, authentication, RBAC, and network security.

### 4. High Availability (HIGH)

Sentinel, automatic failover, and zone awareness.

### 5. Clustering & Scaling (HIGH)

Redis Cluster setup, sharding, and horizontal scaling.

### 6. Replication (HIGH)

Master-replica setup, read replicas, and Active-Active geo-distribution.

### 7. Persistence (MEDIUM-HIGH)

RDB snapshots, AOF, and durability configuration.

### 8. Monitoring (MEDIUM)

Metrics, SLOWLOG, Prometheus/Grafana, and alerting.

### 9. Backup & Recovery (MEDIUM)

Backup strategies, disaster recovery, and data import/export.

### 10. Data Integration (LOW-MEDIUM)

RDI pipelines, CDC from source databases, and data transformation.

## How to Use

Read individual rule files for detailed explanations and examples:

```
rules/deploy-cloud-provision.md
rules/security-acl-users.md
rules/ha-sentinel-setup.md
```

Each rule file contains:
- Brief explanation of why it matters
- Configuration examples or commands
- Product-specific notes where applicable
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
