#!/usr/bin/env node
/**
 * Unified SessionStart hook for Antigravity (--harness agy) and Claude Code (--harness claude).
 * Reads hook JSON payload from stdin, locates the target project from cwd/workspacePaths,
 * and injects compact state only when the project opts into ai-kit.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findProjectRoot, loadProjectConfig } from './lib/config.mjs';
import { buildSessionSummary, formatHarnessOutput } from './lib/session-summary.mjs';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  let harness = 'agy';
  let cwdOverride = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--harness' && argv[i + 1]) harness = argv[++i];
    else if (argv[i] === '--cwd' && argv[i + 1]) cwdOverride = argv[++i];
  }
  return { harness, cwdOverride };
}

function readStdinSafe() {
  if (process.stdin.isTTY) return '';
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function readText(root, rel) {
  if (!rel) return '';
  const p = resolve(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

function git(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

const { harness, cwdOverride } = parseArgs(process.argv.slice(2));

try {
  let stdinPayload = {};
  const rawStdin = readStdinSafe().trim();
  if (rawStdin) {
    try {
      stdinPayload = JSON.parse(rawStdin);
    } catch {
      stdinPayload = {};
    }
  }

  const candidateDir =
    cwdOverride ||
    process.env.AI_KIT_PROJECT_ROOT ||
    stdinPayload.cwd ||
    (Array.isArray(stdinPayload.workspacePaths) ? stdinPayload.workspacePaths[0] : null) ||
    process.cwd();

  const projectRoot = findProjectRoot(candidateDir);
  const { active, config } = loadProjectConfig(projectRoot, { harness });

  if (!active) {
    process.stdout.write(formatHarnessOutput(harness, ''));
    process.exit(0);
  }

  const handoff = readText(projectRoot, config.handoff);
  const progress = readText(projectRoot, config.progress);
  const gitLog = git(projectRoot, ['log', '--oneline', `-${config.gitLogCount ?? 6}`]);
  const gitStatus = git(projectRoot, ['status', '--short'])
    .split(/\r?\n/)
    .slice(0, 10)
    .join('\n');

  // Antigravity loads rules/AGENTS.md natively from the plugin; Claude Code receives it via additionalContext.
  const universalRules = harness === 'claude' ? readText(kitRoot, 'rules/AGENTS.md') : '';

  const summary = buildSessionSummary({
    config,
    kitRoot,
    handoff,
    progress,
    gitLog,
    gitStatus,
    universalRules,
  });

  process.stdout.write(formatHarnessOutput(harness, summary));
} catch {
  process.stdout.write(formatHarnessOutput(harness, ''));
}
