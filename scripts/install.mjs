#!/usr/bin/env node
/**
 * Installs ai-kit into Antigravity and Claude Code pointing directly at this git repo
 * (single live source of truth: editing/pulling this repo updates all projects immediately).
 *
 * - Antigravity: registers this repo in ~/.gemini/config/plugins.json (avoids Windows junction
 *   discovery quirk where runtime skill scanning skips junctions under plugins/).
 * - Claude Code: links into ~/.claude/skills/ai-kit via junction (Windows) or symlink (Unix).
 *
 * Usage: node scripts/install.mjs [--agy-only | --claude-only | --uninstall]
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pluginName = basename(kitRoot);
const parentPath = dirname(kitRoot).replace(/\\/g, '/');

const args = new Set(process.argv.slice(2));
const uninstall = args.has('--uninstall');
const doAgy = !args.has('--claude-only');
const doClaude = !args.has('--agy-only');

function sameEntry(entry) {
  if (!entry || typeof entry.path !== 'string') return false;
  const normPath = entry.path.replace(/\\/g, '/').replace(/\/+$/, '');
  const expectedPath = parentPath.replace(/\/+$/, '');
  if (normPath.toLowerCase() !== expectedPath.toLowerCase()) return false;
  return (
    Array.isArray(entry.include_only) &&
    entry.include_only.length === 1 &&
    entry.include_only[0] === pluginName
  );
}

function handleAntigravity() {
  const configDir = join(homedir(), '.gemini', 'config');
  const pluginsJsonPath = join(configDir, 'plugins.json');
  const legacyLink = join(configDir, 'plugins', pluginName);

  // Clean up any legacy symlink/junction in ~/.gemini/config/plugins/<name>
  if (existsSync(legacyLink)) {
    try {
      if (lstatSync(legacyLink).isSymbolicLink()) {
        rmSync(legacyLink, { recursive: false, force: true });
        console.log(`cleaned legacy Antigravity link: ${legacyLink}`);
      }
    } catch {
      // ignore
    }
  }

  let data = { entries: [] };
  if (existsSync(pluginsJsonPath)) {
    try {
      data = JSON.parse(readFileSync(pluginsJsonPath, 'utf8')) || {};
    } catch (err) {
      console.error(`FAIL    Antigravity plugins.json is invalid JSON: ${err.message}`);
      process.exitCode = 1;
      return;
    }
  }
  if (!Array.isArray(data.entries)) data.entries = [];

  if (uninstall) {
    const before = data.entries.length;
    data.entries = data.entries.filter((e) => !sameEntry(e));
    if (data.entries.length !== before) {
      writeFileSync(pluginsJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`removed Antigravity entry from ${pluginsJsonPath}`);
    } else {
      console.log(`absent  Antigravity entry in ${pluginsJsonPath}`);
    }
    return;
  }

  mkdirSync(configDir, { recursive: true });
  if (data.entries.some(sameEntry)) {
    console.log(`ok      Antigravity plugins.json: ${pluginsJsonPath} -> ${kitRoot}`);
    return;
  }

  data.entries.push({ path: parentPath, include_only: [pluginName] });
  writeFileSync(pluginsJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`added   Antigravity plugins.json: ${pluginsJsonPath} -> ${kitRoot}`);
}

function handleClaude() {
  const linkPath = join(homedir(), '.claude', 'skills', pluginName);
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';

  if (uninstall) {
    if (existsSync(linkPath)) {
      if (lstatSync(linkPath).isSymbolicLink()) {
        rmSync(linkPath, { recursive: false, force: true });
        console.log(`removed Claude Code plugin link: ${linkPath}`);
      } else {
        console.warn(`skip    Claude Code plugin: ${linkPath} is not a symlink/junction (remove manually)`);
      }
    } else {
      console.log(`absent  Claude Code plugin: ${linkPath}`);
    }
    return;
  }

  mkdirSync(dirname(linkPath), { recursive: true });
  if (existsSync(linkPath)) {
    if (lstatSync(linkPath).isSymbolicLink()) {
      const current = resolve(dirname(linkPath), readlinkSync(linkPath));
      if (current.toLowerCase() === kitRoot.toLowerCase()) {
        console.log(`ok      Claude Code skills-dir plugin: ${linkPath} -> ${kitRoot}`);
        return;
      }
      rmSync(linkPath, { recursive: false, force: true });
    } else {
      console.error(`FAIL    Claude Code plugin: ${linkPath} already exists as a real directory.`);
      process.exitCode = 1;
      return;
    }
  }

  symlinkSync(kitRoot, linkPath, linkType);
  console.log(`linked  Claude Code skills-dir plugin: ${linkPath} -> ${kitRoot}`);
}

if (doAgy) handleAntigravity();
if (doClaude) handleClaude();
