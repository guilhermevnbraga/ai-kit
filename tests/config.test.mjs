import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findProjectRoot, loadProjectConfig, mergeConfig } from '../scripts/lib/config.mjs';

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'ai-kit-cfg-'));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('stays inactive on repos without .ai-kit.json or docs/HANDOFF.md', () => {
  withTempDir((dir) => {
    const res = loadProjectConfig(dir, { harness: 'agy' });
    assert.equal(res.active, false);
    assert.equal(res.reason, 'not-opted-in');
  });
});

test('activates explicitly via .ai-kit.json and merges defaults + deduplicated noFullRead', () => {
  withTempDir((dir) => {
    writeFileSync(
      join(dir, '.ai-kit.json'),
      JSON.stringify({ name: 'demo', check: 'npm test', noFullRead: ['docs/SPEC.md', 'docs/HANDOFF.md'] })
    );
    const res = loadProjectConfig(dir, { harness: 'claude' });
    assert.equal(res.active, true);
    assert.equal(res.reason, 'explicit');
    assert.equal(res.config.check, 'npm test');
    assert.equal(res.config.maxProgressLine, 190);
    assert.deepEqual(res.config.noFullRead, ['docs/HANDOFF.md', 'docs/PROGRESS.md', 'docs/SPEC.md']);
  });
});

test('respects enabled: false in .ai-kit.json', () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, '.ai-kit.json'), JSON.stringify({ enabled: false }));
    const res = loadProjectConfig(dir, { harness: 'agy' });
    assert.equal(res.active, false);
    assert.equal(res.reason, 'disabled');
  });
});

test('activates by convention when docs/HANDOFF.md exists without legacy local SessionStart', () => {
  withTempDir((dir) => {
    mkdirSync(join(dir, 'docs'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'HANDOFF.md'), '# Handoff\n');
    const res = loadProjectConfig(dir, { harness: 'agy' });
    assert.equal(res.active, true);
    assert.equal(res.reason, 'convention');
  });
});

test('yields to legacy local Antigravity SessionStart hook when no .ai-kit.json exists', () => {
  withTempDir((dir) => {
    mkdirSync(join(dir, 'docs'), { recursive: true });
    mkdirSync(join(dir, '.agents'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'HANDOFF.md'), '# Handoff\n');
    writeFileSync(
      join(dir, '.agents', 'hooks.json'),
      JSON.stringify({ s: { SessionStart: [{ type: 'command', command: 'node x.mjs' }] } })
    );
    const res = loadProjectConfig(dir, { harness: 'agy' });
    assert.equal(res.active, false);
    assert.equal(res.reason, 'legacy-local-hook');
  });
});

test('yields to legacy local Claude SessionStart hook when no .ai-kit.json exists', () => {
  withTempDir((dir) => {
    mkdirSync(join(dir, 'docs'), { recursive: true });
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'HANDOFF.md'), '# Handoff\n');
    writeFileSync(
      join(dir, '.claude', 'settings.json'),
      JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'bash x.sh' }] }] } })
    );
    const res = loadProjectConfig(dir, { harness: 'claude' });
    assert.equal(res.active, false);
    assert.equal(res.reason, 'legacy-local-hook');
  });
});

test('findProjectRoot walks up from nested subdirectory to .ai-kit.json root', () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, '.ai-kit.json'), '{}');
    const nested = join(dir, 'src', 'features', 'deep');
    mkdirSync(nested, { recursive: true });
    assert.equal(findProjectRoot(nested), dir);
  });
});

test('mergeConfig keeps custom handoff/progress paths inside noFullRead', () => {
  const cfg = mergeConfig({ handoff: 'notes/HANDOFF.md', progress: 'notes/PROGRESS.md' });
  assert.ok(cfg.noFullRead.includes('notes/HANDOFF.md'));
  assert.ok(cfg.noFullRead.includes('notes/PROGRESS.md'));
});
