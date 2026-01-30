/**
 * Configuration for the build tooling
 */

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Base paths
export const SKILLS_DIR = join(__dirname, '../../..', 'skills')
export const BUILD_DIR = join(__dirname, '..')

// Skill configurations
export interface SkillConfig {
  name: string
  title: string
  description: string
  skillDir: string
  rulesDir: string
  metadataFile: string
  outputFile: string
  sectionMap: Record<string, number>
}

export const SKILLS: Record<string, SkillConfig> = {
  'redis-best-practices': {
    name: 'redis-best-practices',
    title: 'Redis Best Practices',
    description: 'Redis applications',
    skillDir: join(SKILLS_DIR, 'redis-best-practices'),
    rulesDir: join(SKILLS_DIR, 'redis-best-practices/rules'),
    metadataFile: join(SKILLS_DIR, 'redis-best-practices/metadata.json'),
    outputFile: join(SKILLS_DIR, 'redis-best-practices/AGENTS.md'),
    sectionMap: {
      ds: 1,
      key: 2,
      cmd: 3,
      conn: 4,
      cache: 5,
      use: 6,
      msg: 7,
      stack: 8,
      memory: 9,
      resilience: 10,
    },
  },
  'redis-ai-patterns': {
    name: 'redis-ai-patterns',
    title: 'Redis AI Patterns',
    description: 'AI applications using Redis',
    skillDir: join(SKILLS_DIR, 'redis-ai-patterns'),
    rulesDir: join(SKILLS_DIR, 'redis-ai-patterns/rules'),
    metadataFile: join(SKILLS_DIR, 'redis-ai-patterns/metadata.json'),
    outputFile: join(SKILLS_DIR, 'redis-ai-patterns/AGENTS.md'),
    sectionMap: {
      vec: 1,
      search: 2,
      rag: 3,
      semcache: 4,
      llm: 5,
      agent: 6,
      embed: 7,
      integrate: 8,
      perf: 9,
    },
  },
  'redis-infrastructure': {
    name: 'redis-infrastructure',
    title: 'Redis Infrastructure',
    description: 'Redis infrastructure and operations',
    skillDir: join(SKILLS_DIR, 'redis-infrastructure'),
    rulesDir: join(SKILLS_DIR, 'redis-infrastructure/rules'),
    metadataFile: join(SKILLS_DIR, 'redis-infrastructure/metadata.json'),
    outputFile: join(SKILLS_DIR, 'redis-infrastructure/AGENTS.md'),
    sectionMap: {
      deploy: 1,
      config: 2,
      security: 3,
      ha: 4,
      cluster: 5,
      replication: 6,
      persist: 7,
      monitor: 8,
      backup: 9,
      rdi: 10,
    },
  },
}

// Default skill
export const DEFAULT_SKILL = 'redis-best-practices'

// Legacy exports for backwards compatibility
export const SKILL_DIR = SKILLS[DEFAULT_SKILL].skillDir
export const RULES_DIR = SKILLS[DEFAULT_SKILL].rulesDir
export const METADATA_FILE = SKILLS[DEFAULT_SKILL].metadataFile
export const OUTPUT_FILE = SKILLS[DEFAULT_SKILL].outputFile
