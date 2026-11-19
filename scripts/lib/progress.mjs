/**
 * Pure compacting logic for docs/PROGRESS.md.
 * Keeps every "- [x]" / "- [ ]" line within maxLen characters while preserving
 * the first sentence and any "NÃO validado/testado/confirmado" caveat.
 */
export function shortenProgressLine(line, maxLen = 190) {
  if (line.length <= maxLen || !/^- \[[ x]\]/.test(line)) return line;

  let caveat = '';
  const m = line.match(/NÃO (?:validado|testado|confirmado)[^.;]*/i);
  if (m) caveat = ' · ' + m[0].slice(0, 110).replace(/[ ,]+$/, '');
  const head = m ? line.slice(0, m.index) : line;

  let cut = null;
  const re = /(?<=[a-zA-ZÀ-ÿ0-9)\]`*])\. /g;
  for (const hit of head.matchAll(re)) {
    if (hit.index >= 90) {
      cut = hit.index + 1;
      break;
    }
  }

  const budget = Math.max(40, maxLen - caveat.length);
  const trimmed =
    cut === null || cut > budget
      ? head.slice(0, budget).replace(/[ ,;:(]+$/, '') + '…'
      : head.slice(0, cut);
  return trimmed + caveat;
}

export function compactProgressContent(raw, maxLen = 190) {
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const out = lines.map((line) => shortenProgressLine(line, maxLen)).join(nl);
  return {
    output: out,
    beforeBytes: Buffer.byteLength(raw, 'utf8'),
    afterBytes: Buffer.byteLength(out, 'utf8'),
    changed: out !== raw,
  };
}
