---
name: kit-promote
description: >-
  Promove uma melhoria de workflow, regra, skill ou script validada em um projeto de volta
  para o repositório central ai-kit, mantendo retrocompatibilidade e removendo duplicação local.
  Use quando uma melhoria de processo feita num projeto dever valer para todos os projetos.
---

# /kit-promote — evoluir o ai-kit a partir do projeto

Meta: retroalimentar o repositório central `ai-kit` (`kit=<path>` informado no `SessionStart`) com descobertas de workflow sem quebrar projetos antigos.

1. **Identifique o candidato:** confirme o que deve subir para o core — regra universal (`rules/AGENTS.md`), skill genérica (`skills/*/SKILL.md`), script/hook (`scripts/`) ou campo opcional de `.ai-kit.json`.
   - Regra de ouro: se depende de stack/domínio de um só projeto, **não** promove — fica no projeto.
2. **Generalize mantendo retrocompatibilidade:**
   - Todo campo novo em `.ai-kit.json` precisa de valor padrão em `scripts/lib/config.mjs` para projetos antigos continuarem funcionando sem mexer neles.
   - Mantenha compatibilidade com **Antigravity** (`plugin.json`, `hooks.json`, `rules/AGENTS.md`) e **Claude Code** (`.claude-plugin/plugin.json`, `.claude-plugin/hooks.json`).
3. **Aplique e teste no repo `ai-kit`:**
   - Edite os arquivos no `<kit>`.
   - Adicione/atualize teste unitário em `<kit>/tests/` se alterou lógica em `scripts/lib/`.
   - Rode `node "<kit>/scripts/check.mjs"` no repo `<kit>` e exija `OK`.
   - Atualize `<kit>/docs/PROGRESS.md` (1 linha ≤ 190 chars) e `<kit>/docs/HANDOFF.md` se relevante.
4. **Commit no repo `ai-kit`:** commit em uma linha em inglês (Conventional Commits, sem `Co-Authored-By`) dentro de `<kit>` (e `git push` se houver remote configurado).
5. **Limpe o projeto atual:** se a melhoria estava num override local (ex.: `.agents/skills/feature/SKILL.md` ou regra duplicada em `AGENTS.md`), remova a cópia redundante do projeto para voltar a herdar do `ai-kit`.
6. **Relate em poucas linhas** o commit no `ai-kit`, o resultado do `check.mjs` e o que foi limpo no projeto atual.
