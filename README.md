# ai-kit

Núcleo compartilhado e versionado de workflow para agentes de IA (**Antigravity** + **Claude Code**): injeção econômica de contexto (`SessionStart`), protocolo `/handoff` + `PROGRESS.md` compacto, pipeline `/feature`, regras universais e evolução bidirecional (`/kit-promote`).

## Por que este formato

- **Uma fonte viva, zero cópia entre projetos:** este repo é registrado diretamente no Antigravity (`~/.gemini/config/plugins.json`) e linkado via junction/symlink no Claude Code (`~/.claude/skills/ai-kit`).
- **Opt-in seguro:** o hook `SessionStart` só injeta contexto em projetos com `.ai-kit.json` (ou `docs/HANDOFF.md` sem hook local legado). Em outros repos, fica inerte.
- **Precedência local:** qualquer skill ou regra no workspace do projeto (`.agents/` ou `.claude/`) sobrescreve o core sem quebrar outros projetos.

## Instalação (uma vez por máquina)

```bash
node scripts/install.mjs
```

Opções: `--agy-only`, `--claude-only`, `--uninstall`.

## Adotar em um projeto (camada fina)

Via CLI ou chamando `/kit-init` dentro do projeto:

```bash
node scripts/init-project.mjs /caminho/do/projeto --name meu-app --check "npm test" --claude
```

Cria apenas a camada específica do projeto:
- `.ai-kit.json` — configuração mínima (`check`, `quirksDoc`, `noFullRead`, limites).
- `AGENTS.md` (e `CLAUDE.md` apontando `@AGENTS.md` com `--claude`) — **somente** domínio, stack e QA local.
- `docs/HANDOFF.md`, `docs/PROGRESS.md`, `docs/archive/`.

## Evoluindo o kit junto com os projetos

1. **Experimente localmente:** crie ou ajuste um override no projeto se quiser testar uma variação.
2. **Promova para o core (`/kit-promote`):** validou que serve para todos? A skill move a melhoria para este repo, garante retrocompatibilidade (defaults em `scripts/lib/config.mjs`), roda `node scripts/check.mjs`, commita aqui e limpa o duplicado no projeto.

## Verificação

```bash
node scripts/check.mjs
```

Valida sintaxe JS, todos os JSONs, testes unitários (`tests/*.test.mjs`) e executa `agy plugin validate` e `claude plugin validate` quando disponíveis no `PATH`.
