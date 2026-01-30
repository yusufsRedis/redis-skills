# Redis Best Practices

Development patterns and best practices for building applications with Redis, optimized for agents and LLMs.

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
   - `ds-` Data Structures
   - `key-` Key Design
   - `cmd-` Commands & Patterns
   - `conn-` Connection Management
   - `cache-` Caching Strategies
   - `use-` Common Use Cases
   - `msg-` Pub/Sub & Streams
   - `stack-` JSON & Search
   - `memory-` Memory Optimization
   - `resilience-` Error Handling & Resilience
3. Fill in frontmatter and content
4. Ensure clear examples with explanations
5. Run build to regenerate AGENTS.md

## Building

From the build package directory:

```bash
cd packages/redis-best-practices-build
npm install
npm run build-best-practices
```

## Validation

```bash
npm run validate
```
