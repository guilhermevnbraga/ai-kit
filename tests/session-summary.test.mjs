import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSessionSummary,
  extractPendingItems,
  formatHarnessOutput,
} from '../scripts/lib/session-summary.mjs';
import { DEFAULT_CONFIG } from '../scripts/lib/config.mjs';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hookScript = join(kitRoot, 'scripts', 'session-start.mjs');

test('extractPendingItems returns only unchecked items with line numbers', () => {
  const md = ['# P', '- [x] Done', '- [ ] Open A', 'plain text', '- [ ] Open B'].join('\n');
  assert.equal(extractPendingItems(md), '3:- [ ] Open A\n5:- [ ] Open B');
});

test('formatHarnessOutput produces correct contract for agy and claude', () => {
  const agyEmpty = JSON.parse(formatHarnessOutput('agy', ''));
  assert.deepEqual(agyEmpty, {});

  const agyFull = JSON.parse(formatHarnessOutput('agy', 'hello'));
  assert.equal(agyFull.injectSteps[0].systemMessage.systemMessage, 'hello');

  assert.equal(formatHarnessOutput('claude', ''), '');
  const claudeFull = JSON.parse(formatHarnessOutput('claude', 'hello'));
  assert.equal(claudeFull.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.equal(claudeFull.hookSpecificOutput.additionalContext, 'hello');
});

test('buildSessionSummary includes metadata, handoff, pending items and optional rules', () => {
  const out = buildSessionSummary({
    config: { ...DEFAULT_CONFIG, name: 'demo', check: 'npm test', quirksDoc: 'docs/Q.md' },
    kitRoot: '/path/to/ai-kit',
    handoff: 'Estado OK',
    progress: '- [ ] Validar X',
    gitLog: 'abc1234 feat: init',
    universalRules: 'Regra 1',
  });
  assert.match(out, /demo/);
  assert.match(out, /check="npm test"/);
  assert.match(out, /quirks=docs\/Q\.md/);
  assert.match(out, /Estado OK/);
  assert.match(out, /1:- \[ \] Validar X/);
  assert.match(out, /Regra 1/);
});

test('session-start CLI injects for opted-in project on both harnesses and stays silent otherwise', () => {
  const optedIn = mkdtempSync(join(tmpdir(), 'ai-kit-in-'));
  const plain = mkdtempSync(join(tmpdir(), 'ai-kit-plain-'));
  try {
    mkdirSync(join(optedIn, 'docs'), { recursive: true });
    writeFileSync(join(optedIn, '.ai-kit.json'), JSON.stringify({ name: 'pilot', check: 'echo ok' }));
    writeFileSync(join(optedIn, 'docs', 'HANDOFF.md'), 'Pilot handoff body');
    writeFileSync(join(optedIn, 'docs', 'PROGRESS.md'), '- [ ] Pending task');

    const agyOut = execFileSync(process.execPath, [hookScript, '--harness', 'agy'], {
      input: JSON.stringify({ cwd: optedIn }),
      encoding: 'utf8',
    });
    const agyJson = JSON.parse(agyOut);
    assert.match(agyJson.injectSteps[0].systemMessage.systemMessage, /Pilot handoff body/);
    assert.doesNotMatch(agyJson.injectSteps[0].systemMessage.systemMessage, /ai-kit regras universais/);

    const claudeOut = execFileSync(process.execPath, [hookScript, '--harness', 'claude'], {
      input: JSON.stringify({ cwd: optedIn }),
      encoding: 'utf8',
    });
    const claudeJson = JSON.parse(claudeOut);
    assert.match(claudeJson.hookSpecificOutput.additionalContext, /Pilot handoff body/);
    assert.match(claudeJson.hookSpecificOutput.additionalContext, /ai-kit regras universais/);

    const plainAgy = execFileSync(process.execPath, [hookScript, '--harness', 'agy'], {
      input: JSON.stringify({ cwd: plain }),
      encoding: 'utf8',
    });
    assert.deepEqual(JSON.parse(plainAgy), {});

    const plainClaude = execFileSync(process.execPath, [hookScript, '--harness', 'claude'], {
      input: JSON.stringify({ cwd: plain }),
      encoding: 'utf8',
    });
    assert.equal(plainClaude, '');
  } finally {
    rmSync(optedIn, { recursive: true, force: true });
    rmSync(plain, { recursive: true, force: true });
  }
});
