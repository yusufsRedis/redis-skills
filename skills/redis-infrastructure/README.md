# Redis Infrastructure

Patterns and best practices for deploying and operating Redis in production, optimized for agents and LLMs.

## Structure

- `rules/` - Individual rule files (one per rule)
  - `_sections.md` - Section metadata (titles, impacts, descriptions)
  - `_template.md` - Template for creating new rules
  - `{prefix}-{description}.md` - Individual rule files
- `metadata.json` - Document metadata
- `SKILL.md` - Agent-facing skill definition
- **`AGENTS.md`** - Compiled output (generated)

## Products Covered

- **Redis Cloud** - Managed DBaaS
- **Redis Software** - Self-managed enterprise
- **Redis Kubernetes** - K8s operators and Helm
- **Redis OSS** - Open source
- **RDI** - Redis Data Integration

## Creating a New Rule

1. Copy `rules/_template.md` to `rules/{prefix}-{description}.md`
2. Choose appropriate prefix based on category:
   - `deploy-` Deployment
   - `config-` Configuration
   - `security-` Security
   - `ha-` High Availability
   - `cluster-` Clustering & Scaling
   - `replication-` Replication
   - `persist-` Persistence
   - `monitor-` Monitoring
   - `backup-` Backup & Recovery
   - `rdi-` Data Integration
3. For product-specific rules, add product to prefix:
   - `deploy-cloud-provision.md`
   - `deploy-software-cluster.md`
   - `deploy-k8s-operator.md`
   - `deploy-oss-install.md`
4. Fill in frontmatter and content
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
