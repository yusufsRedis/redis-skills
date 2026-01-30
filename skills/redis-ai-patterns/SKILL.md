---
name: redis-ai-patterns
description: Patterns for building AI applications with Redis as a vector database. Use when implementing vector search, RAG, semantic caching, LLM memory, or AI agents. Triggers on tasks involving embeddings, similarity search, retrieval augmented generation, LangChain, LlamaIndex, or vector databases.
license: MIT
metadata:
  author: redis
  version: "1.0.0"
---

# Redis AI Patterns

Patterns and best practices for building AI and ML applications with Redis. Covers vector search, RAG implementation, semantic caching, and LLM integration.

## When to Apply

Reference these guidelines when:
- Storing and querying vector embeddings
- Building RAG (Retrieval Augmented Generation) pipelines
- Implementing semantic caching for LLM responses
- Managing conversation history and LLM memory
- Building AI agents with Redis as the memory layer
- Integrating with LangChain, LlamaIndex, or similar frameworks

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Vector Storage & Indexing | CRITICAL | `vec-` |
| 2 | Similarity Search | CRITICAL | `search-` |
| 3 | RAG Implementation | HIGH | `rag-` |
| 4 | Semantic Caching | HIGH | `semcache-` |
| 5 | LLM Memory & Sessions | HIGH | `llm-` |
| 6 | AI Agent Patterns | MEDIUM-HIGH | `agent-` |
| 7 | Embeddings & Models | MEDIUM | `embed-` |
| 8 | Framework Integration | MEDIUM | `integrate-` |
| 9 | Performance Tuning | LOW-MEDIUM | `perf-` |

## Quick Reference

### 1. Vector Storage & Indexing (CRITICAL)

Storing embeddings and configuring vector indexes (HNSW vs FLAT).

### 2. Similarity Search (CRITICAL)

KNN queries, range queries, hybrid search combining vectors with filters.

### 3. RAG Implementation (HIGH)

Document chunking, retrieval strategies, and context construction.

### 4. Semantic Caching (HIGH)

Caching LLM responses by semantic similarity to reduce costs and latency.

### 5. LLM Memory & Sessions (HIGH)

Managing conversation history and context windows.

### 6. AI Agent Patterns (MEDIUM-HIGH)

Agent memory, tool routing, and multi-step reasoning with Redis.

### 7. Embeddings & Models (MEDIUM)

Model selection, dimensionality, and embedding generation patterns.

### 8. Framework Integration (MEDIUM)

Patterns for LangChain, LlamaIndex, Spring AI, and Semantic Kernel.

### 9. Performance Tuning (LOW-MEDIUM)

Index optimization, batch ingestion, and scaling vector workloads.

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/vec-choose-index-type.md
rules/rag-chunk-documents.md
rules/semcache-similarity-threshold.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
