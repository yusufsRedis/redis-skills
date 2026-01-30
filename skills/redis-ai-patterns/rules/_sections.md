# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Vector Storage & Indexing (vec)

**Impact:** CRITICAL

**Description:** Proper vector storage and indexing is fundamental to AI application performance. Covers storing embeddings in Redis hashes or JSON, choosing between HNSW and FLAT indexes, configuring index parameters (M, EF_CONSTRUCTION, EF_RUNTIME), and dimension considerations.

---

## 2. Similarity Search (search)

**Impact:** CRITICAL

**Description:** Effective similarity search is core to vector database usage. Covers KNN queries, range queries, hybrid search combining vector similarity with attribute filters, distance metrics (cosine, L2, IP), and result scoring.

---

## 3. RAG Implementation (rag)

**Impact:** HIGH

**Description:** Retrieval Augmented Generation patterns for enhancing LLM responses with contextual data. Covers document chunking strategies, retrieval patterns, context window management, prompt construction, and handling multiple retrieved documents.

---

## 4. Semantic Caching (semcache)

**Impact:** HIGH

**Description:** Semantic caching reduces LLM costs and latency by returning cached responses for semantically similar queries. Covers similarity thresholds, cache key design, TTL strategies, cache invalidation, and handling cache misses.

---

## 5. LLM Memory & Sessions (llm)

**Impact:** HIGH

**Description:** Managing conversation history and context for LLM applications. Covers session storage, context window sliding, memory summarization, retrieving relevant past conversations, and multi-turn dialogue patterns.

---

## 6. AI Agent Patterns (agent)

**Impact:** MEDIUM-HIGH

**Description:** Patterns for building AI agents with Redis as the memory and state layer. Covers agent memory persistence, tool/route selection based on semantic similarity, agentic RAG, and multi-step reasoning state management.

---

## 7. Embeddings & Models (embed)

**Impact:** MEDIUM

**Description:** Best practices for embedding generation and model selection. Covers choosing embedding models, dimension trade-offs, normalization, batch embedding generation, and handling embedding model updates.

---

## 8. Framework Integration (integrate)

**Impact:** MEDIUM

**Description:** Patterns for integrating Redis with popular AI frameworks. Covers LangChain vector stores and memory, LlamaIndex integration, Spring AI, Semantic Kernel, and RedisVL library usage.

---

## 9. Performance Tuning (perf)

**Impact:** LOW-MEDIUM

**Description:** Optimizing Redis for AI workloads. Covers index optimization, batch ingestion strategies, query optimization, memory management for large vector sets, and scaling considerations.
