# Redis Agent Skills

A collection of skills for AI coding agents working with Redis. Skills are packaged instructions and resources that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

### redis-best-practices

Development patterns and best practices for building applications with Redis.

**Use when:**
- Writing code that interacts with Redis
- Choosing data structures or designing key schemas
- Implementing caching strategies
- Building queues, leaderboards, or rate limiters

**Categories:** Data Structures, Key Design, Commands & Patterns, Connection Management, Caching Strategies, Common Use Cases, Pub/Sub & Streams, JSON & Search, Memory Optimization, Error Handling

---

### redis-ai-patterns

Patterns for building AI applications with Redis as a vector database.

**Use when:**
- Implementing vector search or similarity queries
- Building RAG (Retrieval Augmented Generation) pipelines
- Adding semantic caching for LLM responses
- Managing LLM conversation memory

**Categories:** Vector Storage & Indexing, Similarity Search, RAG Implementation, Semantic Caching, LLM Memory, AI Agents, Embeddings, Framework Integration, Performance Tuning

---

### redis-infrastructure

Patterns for deploying, securing, and operating Redis in production.

**Use when:**
- Deploying Redis (Cloud, Software, Kubernetes, or OSS)
- Configuring security, HA, or clustering
- Setting up monitoring and backups
- Integrating data with RDI

**Products covered:** Redis Cloud, Redis Software, Redis Kubernetes, Redis OSS, RDI

**Categories:** Deployment, Configuration, Security, High Availability, Clustering, Replication, Persistence, Monitoring, Backup & Recovery, Data Integration

---

## Installation

```bash
npx add-skill redis/redis-agent-skills
```

## Building

From the build package directory:

```bash
cd packages/redis-best-practices-build
npm install
npm run build              # Build all skills
npm run build-best-practices  # Build only redis-best-practices
npm run build-ai              # Build only redis-ai-patterns
npm run build-infrastructure  # Build only redis-infrastructure
```

## License

MIT
