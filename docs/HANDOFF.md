# HANDOFF — ai-kit

Atualizado: 2026-11-19. Versão: `0.1.0`. Repo: `github.com/guilhermevnbraga/ai-kit` (`main`). Histórico em `docs/archive/` (só Grep).

## Estado
- Plugin unificado Antigravity (`plugin.json`, `hooks.json`, `rules/AGENTS.md`) + Claude Code (`.claude-plugin/plugin.json`, `.claude-plugin/hooks.json`) com `skills/` e `scripts/` compartilhados.
- `SessionStart` opt-in com proteção contra duplicação em repos legados (`hasLegacyLocalSessionStart`).
- Skills prontas: `/handoff`, `/feature`, `/kit-init`, `/kit-promote`.
- Instalador (`scripts/install.mjs`) registra via `~/.gemini/config/plugins.json` (Antigravity — evita limitação de junction no runtime Windows) e junction em `~/.claude/skills/ai-kit` (Claude Code); validado ao vivo em ambos.

## Próximos passos
1. Validar `scripts/install.mjs` em Linux/macOS (além do Windows já validado).
2. Adicionar arquivo `LICENSE` (MIT) e documentação de onboarding para novos usuários.
