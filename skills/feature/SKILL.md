---
name: feature
description: >-
  Pipeline completo para entregar uma feature, melhoria ou correção em qualquer projeto
  que use ai-kit (design, implementação, verificação local, QA, docs, commit+push e relatório).
  Use quando o usuário pedir uma nova funcionalidade, melhoria ou correção.
---

# /feature — pipeline genérico de entrega

Siga em ordem sem pedir permissão entre etapas (exceto decisões de escopo ou ações estritamente manuais do usuário). Respeite as regras específicas de domínio em `AGENTS.md`/`CLAUDE.md` do projeto. Se `.ai-kit.json` definir `quirksDoc`, leia-o antes de usar MCPs/ferramentas externas.

1. **[Design]** Em 1 parágrafo: objetivo, arquivos afetados, contratos/invariantes de domínio e impacto em código/ambiente existente. Se faltar informação do sistema ou ambiente, investigue primeiro.
2. **[Implementação]** Siga a stack e convenções do `AGENTS.md`/`CLAUDE.md` do projeto. Extraia lógica pura para módulos testáveis. Evite mudanças fora do escopo pedido.
3. **[Verificação local]** Adicione ou atualize testes unitários para lógica pura nova/alterada testando o **contrato** (nunca enfraqueça teste por bug real). Rode o comando `check` do projeto (`.ai-kit.json` / `AGENTS.md`) e exija sucesso.
4. **[QA real]** Execute a validação em ambiente real/MCP descrita no `AGENTS.md`/`CLAUDE.md` do projeto (em lote e com segurança: dry-run antes de ações destrutivas/custosas; restaure o estado após testar). Registre honestamente o que não pôde ser validado.
5. **[Docs]**
   - `docs/PROGRESS.md`: adicione/atualize UMA linha (≤ 190 chars; `[x]` só para o que foi validado; senão `"NÃO validado: ..."`). Rode `node "<kit>/scripts/compact-progress.mjs" --max 190 docs/PROGRESS.md`.
   - Atualize `README.md` / docs de domínio se algo visível ou estrutural mudou, e `docs/HANDOFF.md` se mudou o estado/próximo passo.
6. **[Git]** `git add` apenas dos arquivos da entrega, commit em **uma linha em inglês** (Conventional Commits, **sem `Co-Authored-By`**), `git push`.
7. **[Relatório]** Poucas linhas: o que foi entregue, resultado do `check` e do QA, o que ficou **NÃO validado**, e próxima recomendação (se houver).
