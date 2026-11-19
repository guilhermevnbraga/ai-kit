#!/usr/bin/env node
/**
 * Initializes the thin project layer for ai-kit (.ai-kit.json, docs/HANDOFF.md,
 * docs/PROGRESS.md, docs/archive/.gitkeep, and optional AGENTS.md / CLAUDE.md stub).
 * Non-destructive: never overwrites existing files unless --force is passed.
 *
 * Usage: node scripts/init-project.mjs <targetDir> [--name my-proj] [--check "npm test"] [--quirks docs/QUIRKS.md] [--claude] [--force]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

function parseArgs(argv) {
  const opts = { target: '.', name: null, check: null, quirks: null, claude: false, force: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--name' && argv[i + 1]) opts.name = argv[++i];
    else if (a === '--check' && argv[i + 1]) opts.check = argv[++i];
    else if (a === '--quirks' && argv[i + 1]) opts.quirks = argv[++i];
    else if (a === '--claude') opts.claude = true;
    else if (a === '--force') opts.force = true;
    else if (!a.startsWith('-')) positional.push(a);
  }
  if (positional[0]) opts.target = positional[0];
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const root = resolve(opts.target);
const projectName = opts.name || basename(root);
const today = new Date().toISOString().slice(0, 10);

function writeIfMissing(relPath, content) {
  const full = join(root, relPath);
  if (existsSync(full) && !opts.force) {
    console.log(`skip  ${relPath} (exists)`);
    return;
  }
  mkdirSync(resolve(full, '..'), { recursive: true });
  writeFileSync(full, content, 'utf8');
  console.log(`write ${relPath}`);
}

const noFullRead = ['docs/HANDOFF.md', 'docs/PROGRESS.md'];
const aiKitJson = {
  version: 1,
  name: projectName,
  check: opts.check,
  handoff: 'docs/HANDOFF.md',
  progress: 'docs/PROGRESS.md',
  archiveDir: 'docs/archive',
  quirksDoc: opts.quirks,
  noFullRead,
  maxProgressLine: 190,
  maxHandoffKb: 6,
};

writeIfMissing('.ai-kit.json', JSON.stringify(aiKitJson, null, 2) + '\n');
writeIfMissing('docs/archive/.gitkeep', '');
writeIfMissing(
  'docs/HANDOFF.md',
  `# HANDOFF — ${projectName}\n\nAtualizado: ${today}. Histórico em \`docs/archive/\` (só Grep).\n\n## Estado\n- Projeto inicializado com \`ai-kit\`.\n\n## Próximos passos\n1. Preencher domínio e arquitetura em \`AGENTS.md\`${opts.claude ? ' / `CLAUDE.md`' : ''}.\n2. Configurar o comando \`check\` em \`.ai-kit.json\`.\n`
);
writeIfMissing(
  'docs/PROGRESS.md',
  `# PROGRESS — ${projectName}\n\nUma linha por item (≤ 190 chars). Marque \`[x]\` só após validação real.\n\n## Pendências\n- [ ] Configurar stack, regras de domínio e comando de verificação do projeto.\n`
);

const domainStub = `# ${projectName}\n\n> Regras universais (comunicação, economia de tokens, verificação honesta, git e handoff) vêm do plugin \`ai-kit\`. Este arquivo guarda **apenas** o que é específico deste projeto.\n\n## Arquitetura e stack\n- (Descrever módulos principais, stack e convenções locais)\n\n## Verificação e QA\n- Check local: \`${opts.check || '(definir em .ai-kit.json)'}\`\n${opts.quirks ? `- Armadilhas de ambiente/MCP: \`${opts.quirks}\` (leia antes de usar).\n` : ''}- QA específico do projeto: (descrever como validar em ambiente real)\n`;

writeIfMissing('AGENTS.md', domainStub);
if (opts.claude) {
  writeIfMissing('CLAUDE.md', `@AGENTS.md\n`);
}
