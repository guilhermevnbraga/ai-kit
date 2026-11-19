/**
 * Pure builders for SessionStart context injection (Antigravity + Claude Code).
 */
export function extractPendingItems(progressText, { maxLines = 30, maxChars = 150 } = {}) {
  if (!progressText) return '';
  return progressText
    .split(/\r?\n/)
    .map((line, i) => ({ line, num: i + 1 }))
    .filter(({ line }) => /^- \[ \]/.test(line))
    .slice(0, maxLines)
    .map(({ line, num }) => `${num}:${line.slice(0, maxChars)}`)
    .join('\n');
}

export function buildSessionSummary({
  config,
  kitRoot,
  handoff = '',
  progress = '',
  gitLog = '',
  gitStatus = '',
  universalRules = '',
}) {
  const pending = extractPendingItems(progress, {
    maxLines: config.maxPendingLines ?? 30,
    maxChars: config.maxPendingChars ?? 150,
  });

  const noFullRead = (config.noFullRead || []).join(', ');
  const parts = [
    `=== ESTADO DO PROJETO (ai-kit${config.name ? ` · ${config.name}` : ''}) ===`,
    `Regra de economia: NÃO leia inteiros: ${noFullRead || 'docs/HANDOFF.md, docs/PROGRESS.md'}. Use este resumo, Grep e leitura por intervalo.`,
  ];

  const meta = [];
  if (kitRoot) meta.push(`kit=${kitRoot}`);
  if (config.check) meta.push(`check="${config.check}"`);
  if (config.quirksDoc) meta.push(`quirks=${config.quirksDoc}`);
  if (meta.length) parts.push(`Meta: ${meta.join(' | ')}`);

  parts.push(
    '',
    `--- ${config.handoff || 'docs/HANDOFF.md'} ---`,
    handoff.trim() || '(vazio)',
    '',
    `--- Pendências abertas em ${config.progress || 'docs/PROGRESS.md'} ("- [ ]") ---`,
    pending || '(nenhuma)',
    '',
    '--- git ---',
    gitLog.trim() || '(sem commits)'
  );

  if (gitStatus && gitStatus.trim()) {
    parts.push('', 'status:', gitStatus.trim());
  }

  if (universalRules && universalRules.trim()) {
    parts.push('', '--- ai-kit regras universais ---', universalRules.trim());
  }

  return parts.join('\n');
}

export function formatHarnessOutput(harness, summaryText) {
  if (!summaryText) {
    return harness === 'agy' ? '{}\n' : '';
  }

  if (harness === 'claude') {
    return (
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: summaryText,
        },
      }) + '\n'
    );
  }

  return (
    JSON.stringify({
      injectSteps: [
        {
          systemMessage: {
            systemMessage: summaryText,
          },
        },
      ],
    }) + '\n'
  );
}
