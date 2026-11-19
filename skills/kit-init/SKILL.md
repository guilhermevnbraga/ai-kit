---
name: kit-init
description: >-
  Inicializa a camada fina do ai-kit num projeto novo ou migra um projeto existente
  (.ai-kit.json, docs/HANDOFF.md, docs/PROGRESS.md, docs/archive e AGENTS.md/CLAUDE.md enxuto).
  Use quando o usuário quiser adotar o ai-kit num repositório.
---

# /kit-init — adotar ai-kit no projeto atual

Meta: configurar a camada fina do projeto sem duplicar regras, scripts ou skills universais que já vivem no plugin `ai-kit`.

1. **Inspecione o projeto (rápido):** identifique stack, comando de verificação/testes (`check`), se há doc de armadilhas (`quirksDoc`), docs grandes para `noFullRead`, e se o projeto usa Antigravity, Claude Code ou ambos.
2. **Crie a camada fina** rodando o script do kit (ele nunca sobrescreve arquivos existentes sem `--force`):
   `node "<kit>/scripts/init-project.mjs" . --name "<nome>" --check "<cmd>" [--quirks "<path>"] [--claude]`
3. **Ajuste `.ai-kit.json`:** preencha `noFullRead` com quaisquer docs grandes do projeto (ex.: specs longas, guias de arquitetura) e confirme `check` e `quirksDoc`.
4. **Enxugue `AGENTS.md` / `CLAUDE.md`:** mantenha no projeto **apenas** domínio, arquitetura, stack, QA específico e exceções. Remova duplicação das regras universais (estilo PT-BR, economia de tokens, Conventional Commits sem Co-Authored-By) — o `ai-kit` já fornece isso.
   - Se o projeto usa ambos os harnesses, mantenha `AGENTS.md` como fonte única e `CLAUDE.md` apontando para ele (`@AGENTS.md`).
5. **Migração de hooks/scripts legados (se existirem):**
   - Se o projeto já tinha `SessionStart` local (`.agents/hooks.json` ou `.claude/settings.json`) ou cópias locais de `compact-progress` / `handoff`, remova apenas o que agora é idêntico ao `ai-kit` — mantenha overrides/skills realmente específicos do projeto (ex.: skills de domínio, formatadores/linters específicos da stack).
6. **Valide o hook:** teste simulando `SessionStart`:
   `node "<kit>/scripts/session-start.mjs" --harness agy --cwd .`
   (e `--harness claude` se usar Claude Code) e confirme que o resumo sai compacto e sem duplicação.
7. **Relate em 3–4 linhas** o que foi criado/migrado e sugira commitar a configuração.
