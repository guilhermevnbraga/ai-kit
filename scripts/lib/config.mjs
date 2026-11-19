import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const DEFAULT_CONFIG = Object.freeze({
  version: 1,
  name: null,
  check: null,
  handoff: 'docs/HANDOFF.md',
  progress: 'docs/PROGRESS.md',
  archiveDir: 'docs/archive',
  quirksDoc: null,
  noFullRead: ['docs/HANDOFF.md', 'docs/PROGRESS.md'],
  maxProgressLine: 190,
  maxHandoffKb: 6,
  maxPendingLines: 30,
  maxPendingChars: 150,
  gitLogCount: 6,
  enabled: true,
});

/**
 * Walks up from startDir to find the repository/project root.
 * Prefers a directory containing .ai-kit.json, then docs/HANDOFF.md, then .git.
 */
export function findProjectRoot(startDir) {
  if (!startDir) return null;
  let dir = resolve(startDir);
  let gitRoot = null;

  while (true) {
    if (existsSync(join(dir, '.ai-kit.json'))) return dir;
    if (existsSync(join(dir, 'docs', 'HANDOFF.md'))) return dir;
    if (!gitRoot && existsSync(join(dir, '.git'))) gitRoot = dir;

    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return gitRoot || resolve(startDir);
}

/**
 * Checks whether a project already defines a local SessionStart hook for the given harness,
 * so ai-kit won't double-inject context on legacy repos that haven't migrated to .ai-kit.json yet.
 */
export function hasLegacyLocalSessionStart(projectRoot, harness) {
  if (!projectRoot) return false;
  try {
    if (harness === 'agy') {
      const p = join(projectRoot, '.agents', 'hooks.json');
      if (!existsSync(p)) return false;
      const parsed = JSON.parse(readFileSync(p, 'utf8'));
      return Object.values(parsed || {}).some(
        (entry) => entry && entry.enabled !== false && Array.isArray(entry.SessionStart) && entry.SessionStart.length > 0
      );
    }
    if (harness === 'claude') {
      const p = join(projectRoot, '.claude', 'settings.json');
      if (!existsSync(p)) return false;
      const parsed = JSON.parse(readFileSync(p, 'utf8'));
      return Boolean(parsed?.hooks?.SessionStart && parsed.hooks.SessionStart.length > 0);
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Loads effective ai-kit config for projectRoot.
 * Returns { active, reason, explicit, projectRoot, config }.
 */
export function loadProjectConfig(projectRoot, { harness = 'agy' } = {}) {
  if (!projectRoot || !existsSync(projectRoot)) {
    return { active: false, reason: 'no-root', explicit: false, projectRoot, config: { ...DEFAULT_CONFIG } };
  }

  const configPath = join(projectRoot, '.ai-kit.json');
  const explicit = existsSync(configPath);

  if (explicit) {
    let raw = {};
    try {
      raw = JSON.parse(readFileSync(configPath, 'utf8'));
    } catch {
      return { active: false, reason: 'invalid-config', explicit: true, projectRoot, config: { ...DEFAULT_CONFIG } };
    }
    const config = mergeConfig(raw);
    if (config.enabled === false) {
      return { active: false, reason: 'disabled', explicit: true, projectRoot, config };
    }
    return { active: true, reason: 'explicit', explicit: true, projectRoot, config };
  }

  // Convention opt-in: docs/HANDOFF.md exists, provided there isn't a legacy local SessionStart hook.
  const handoffPath = join(projectRoot, DEFAULT_CONFIG.handoff);
  if (!existsSync(handoffPath)) {
    return { active: false, reason: 'not-opted-in', explicit: false, projectRoot, config: { ...DEFAULT_CONFIG } };
  }

  if (hasLegacyLocalSessionStart(projectRoot, harness)) {
    return { active: false, reason: 'legacy-local-hook', explicit: false, projectRoot, config: { ...DEFAULT_CONFIG } };
  }

  return { active: true, reason: 'convention', explicit: false, projectRoot, config: { ...DEFAULT_CONFIG } };
}

export function mergeConfig(raw = {}) {
  const merged = { ...DEFAULT_CONFIG, ...raw };
  const baseNoFullRead = [merged.handoff, merged.progress].filter(Boolean);
  const extraNoFullRead = Array.isArray(raw.noFullRead) ? raw.noFullRead : [];
  merged.noFullRead = [...new Set([...baseNoFullRead, ...extraNoFullRead])];
  return merged;
}
