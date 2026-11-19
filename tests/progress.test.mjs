import test from 'node:test';
import assert from 'node:assert/strict';
import { compactProgressContent, shortenProgressLine } from '../scripts/lib/progress.mjs';

test('leaves short lines and non-checklist lines untouched', () => {
  const heading = '# ' + 'A'.repeat(250);
  const shortItem = '- [x] Curto e validado.';
  assert.equal(shortenProgressLine(heading, 190), heading);
  assert.equal(shortenProgressLine(shortItem, 190), shortItem);
});

test('truncates long checklist items while preserving NAO validado caveat', () => {
  const longLine =
    '- [ ] Implementar sistema completo de sincronização entre dispositivos com fila offline, retries exponenciais e resolução de conflitos automática para múltiplos clientes simultâneos. Detalhes extras muito longos que não cabem na linha. NÃO validado: cenário sem internet real';
  const out = shortenProgressLine(longLine, 190);
  assert.ok(out.length <= 195, `expected compact line, got ${out.length}: ${out}`);
  assert.match(out, /NÃO validado: cenário sem internet real/);
});

test('preserves line endings (CRLF vs LF) and reports idempotence', () => {
  const raw = '# Title\r\n- [x] Short line\r\n';
  const res = compactProgressContent(raw, 190);
  assert.equal(res.changed, false);
  assert.equal(res.output, raw);
});
