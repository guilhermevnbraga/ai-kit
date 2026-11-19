#!/usr/bin/env node
/**
 * Full verification suite for ai-kit:
 * 1. JS syntax check on all scripts and tests
 * 2. JSON validity on manifests, hooks and .ai-kit.json
 * 3. Node built-in unit tests (tests/*.test.mjs)
 * 4. Official plugin validators (agy plugin validate / claude plugin validate) when installed
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function run(cmd, args, { allowMissing = false } = {}) {
  try {
    return {
      ok: true,
      out: execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
    };
  } catch (err) {
    if (allowMissing && err.code === 'ENOENT') {
      return { ok: true, skipped: true, out: '' };
    }
    return {
      ok: false,
      out: `${err.stdout || ''}\n${err.stderr || ''}`.trim(),
    };
  }
}

const files = walk(root);

// 1. JS syntax
const jsFiles = files.filter((f) => /\.(m?js)$/.test(f));
for (const f of jsFiles) {
  const r = run(process.execPath, ['--check', f]);
  if (!r.ok) {
    console.error(`SYNTAX FAIL: ${f}\n${r.out}`);
    failed = true;
  }
}
console.log(`syntax: ${jsFiles.length} JS files checked`);

// 2. JSON validity
const jsonFiles = files.filter((f) => f.endsWith('.json'));
for (const f of jsonFiles) {
  try {
    JSON.parse(readFileSync(f, 'utf8'));
  } catch (err) {
    console.error(`JSON FAIL: ${f}: ${err.message}`);
    failed = true;
  }
}
console.log(`json: ${jsonFiles.length} JSON files valid`);

// 3. Unit tests
const testFiles = files.filter((f) => f.endsWith('.test.mjs'));
const testRes = run(process.execPath, ['--test', ...testFiles]);
if (!testRes.ok) {
  console.error(`TESTS FAIL:\n${testRes.out}`);
  failed = true;
} else {
  const summaryLine = testRes.out
    .split(/\r?\n/)
    .filter((l) => /^# (tests|pass|fail) /.test(l))
    .join(', ');
  console.log(`tests: ${summaryLine || 'passed'}`);
}

// 4. Optional harness plugin validators
for (const [label, cmd, args] of [
  ['agy-validate', 'agy', ['plugin', 'validate', '--strict', root]],
  ['claude-validate', 'claude', ['plugin', 'validate', '--strict', root]],
]) {
  const r = run(cmd, args, { allowMissing: true });
  if (r.skipped) {
    console.log(`${label}: skipped (${cmd} not in PATH)`);
  } else if (!r.ok) {
    console.error(`${label} FAIL:\n${r.out}`);
    failed = true;
  } else {
    console.log(`${label}: passed`);
  }
}

if (failed) {
  process.exit(1);
}
console.log('OK');
