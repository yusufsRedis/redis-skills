# Redis AI Patterns

Patterns and best practices for building AI applications with Redis, optimized for agents and LLMs.

## Structure

- `rules/` - Individual rule files (one per rule)
  - `_sections.md` - Section metadata (titles, impacts, descriptions)
  - `_template.md` - Template for creating new rules
  - `{prefix}-{description}.md` - Individual rule files
- `metadata.json` - Document metadata
- `SKILL.md` - Agent-facing skill definition
- **`AGENTS.md`** - Compiled output (generated)

## Creating a New Rule

1. Copy `rules/_template.md` to `rules/{prefix}-{description}.md`
2. Choose appropriate prefix based on category:
   - `vec-` Vector Storage & Indexing
   - `search-` Similarity Search
   - `rag-` RAG Implementation
   - `semcache-` Semantic Caching
   - `llm-` LLM Memory & Sessions
   - `agent-` AI Agent Patterns
   - `embed-` Embeddings & Models
   - `integrate-` Framework Integration
   - `perf-` Performance Tuning
3. Fill in frontmatter and content
4. Ensure clear examples with explanations
5. Run build to regenerate AGENTS.md

## Building

From the build package directory:

```bash
cd packages/redis-best-practices-build
npm install
npm run build
```

## Validation

```bash
npm run validate
```
