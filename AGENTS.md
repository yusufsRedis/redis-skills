# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot, etc.) when working with code in this repository.

## Repository Overview

A collection of skills for AI coding agents working with Redis. Contains three skills targeting different audiences:

- **redis-best-practices** - For developers writing application code
- **redis-ai-patterns** - For AI/ML engineers building intelligent apps
- **redis-infrastructure** - For DevOps/SREs running Redis systems

## Directory Structure

```
skills/
  redis-best-practices/       # Development patterns
    SKILL.md
    AGENTS.md (generated)
    metadata.json
    README.md
    rules/
      _sections.md
      _template.md
      {prefix}-{description}.md

  redis-ai-patterns/          # AI/ML patterns
    SKILL.md
    AGENTS.md (generated)
    metadata.json
    README.md
    rules/
      _sections.md
      _template.md
      {prefix}-{description}.md

  redis-infrastructure/       # Operations patterns
    SKILL.md
    AGENTS.md (generated)
    metadata.json
    README.md
    rules/
      _sections.md
      _template.md
      {prefix}-{description}.md

packages/
  redis-best-practices-build/  # Build tooling for all skills
    src/
      build.ts
      config.ts
      parser.ts
      types.ts
      validate.ts
```

## Naming Conventions

- **Skill directories**: `kebab-case`
- **Rule files**: `{prefix}-{description}.md` where prefix maps to section
- **SKILL.md, AGENTS.md**: Always uppercase

### Prefixes by Skill

**redis-best-practices:**
`ds-`, `key-`, `cmd-`, `conn-`, `cache-`, `use-`, `msg-`, `stack-`, `memory-`, `resilience-`

**redis-ai-patterns:**
`vec-`, `search-`, `rag-`, `semcache-`, `llm-`, `agent-`, `embed-`, `integrate-`, `perf-`

**redis-infrastructure:**
`deploy-`, `config-`, `security-`, `ha-`, `cluster-`, `replication-`, `persist-`, `monitor-`, `backup-`, `rdi-`

## Building

```bash
cd packages/redis-best-practices-build
npm install
npm run build                 # Build all skills
npm run build-best-practices  # Build specific skill
npm run build-ai
npm run build-infrastructure
npm run validate              # Validate rule files
```

## Adding a New Rule

1. Create `skills/{skill}/rules/{prefix}-{description}.md`
2. Include frontmatter: title, impact, impactDescription, tags
3. Include: explanation, "Incorrect" section, "Correct" section
4. Run `npm run validate` to check structure
5. Run `npm run build` to regenerate AGENTS.md
