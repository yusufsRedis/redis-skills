# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Deployment (deploy)

**Impact:** CRITICAL

**Description:** Proper deployment is the foundation of reliable Redis infrastructure. Covers Redis Cloud provisioning, Redis Software cluster setup, Kubernetes operators and Helm charts, and Redis OSS installation. Each product has specific deployment patterns and requirements.

---

## 2. Configuration (config)

**Impact:** CRITICAL

**Description:** Redis configuration affects performance, memory usage, and behavior. Covers redis.conf essentials, runtime configuration via CONFIG SET, cluster configuration, and product-specific settings for Cloud console, Software Cluster Manager, and Kubernetes CRDs.

---

## 3. Security (security)

**Impact:** CRITICAL

**Description:** Security is essential for production Redis deployments. Covers Access Control Lists (ACLs), TLS encryption, authentication mechanisms, RBAC, network security, and product-specific features like Cloud SSO and Software LDAP integration.

---

## 4. High Availability (ha)

**Impact:** HIGH

**Description:** High availability ensures Redis survives failures. Covers Redis Sentinel for OSS, automatic failover in Cloud and Software, rack/zone awareness, and quorum configuration. Each product implements HA differently but shares core concepts.

---

## 5. Clustering & Scaling (cluster)

**Impact:** HIGH

**Description:** Redis Cluster enables horizontal scaling across multiple nodes. Covers cluster creation, slot management, resharding, adding/removing nodes, and cluster-aware client configuration. Applies to OSS Cluster, Software, and Kubernetes deployments.

---

## 6. Replication (replication)

**Impact:** HIGH

**Description:** Replication provides data redundancy and read scaling. Covers master-replica setup, read replicas, replication lag monitoring, and Active-Active geo-distribution for multi-region deployments (Enterprise feature).

---

## 7. Persistence (persist)

**Impact:** MEDIUM-HIGH

**Description:** Persistence configuration determines durability guarantees. Covers RDB snapshots, AOF (Append Only File), hybrid persistence, fsync policies, and the trade-offs between durability and performance.

---

## 8. Monitoring (monitor)

**Impact:** MEDIUM

**Description:** Monitoring is essential for production operations. Covers Redis INFO command, SLOWLOG analysis, latency monitoring, memory diagnostics, Prometheus metrics export, Grafana dashboards, and alerting strategies.

---

## 9. Backup & Recovery (backup)

**Impact:** MEDIUM

**Description:** Backup and recovery strategies protect against data loss. Covers RDB snapshot backups, backup scheduling, disaster recovery planning, data import/export, and cross-region backup replication.

---

## 10. Data Integration (rdi)

**Impact:** LOW-MEDIUM

**Description:** Redis Data Integration (RDI) enables CDC from source databases to Redis. Covers pipeline configuration, source database setup (PostgreSQL, MySQL, Oracle, etc.), data transformation, and monitoring RDI pipelines.
