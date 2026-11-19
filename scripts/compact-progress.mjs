#!/usr/bin/env node
/**
 * Compacts docs/PROGRESS.md: keeps each "- [x]"/"- [ ]" line short (default <= 190 chars).
 * Usage: node scripts/compact-progress.mjs [--max 190] [docs/PROGRESS.md]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { compactProgressContent } from './lib/progress.mjs';

let maxLen = 190;
const args = process.argv.slice(2);
if (args[0] === '--max') {
  maxLen = parseInt(args[1], 10) || 190;
  args.splice(0, 2);
}
const target = args[0] || 'docs/PROGRESS.md';

const raw = readFileSync(target, 'utf8');
const { output, beforeBytes, afterBytes } = compactProgressContent(raw, maxLen);
writeFileSync(target, output, 'utf8');
console.log(`${target}: ${beforeBytes} -> ${afterBytes} bytes`);
