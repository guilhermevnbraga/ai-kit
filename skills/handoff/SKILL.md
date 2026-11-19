---
name: handoff
description: >-
  Salva o contexto da sessão de forma econômica antes de /clear (HANDOFF <= 6 KB,
  PROGRESS <= 190 chars/linha, arquivamento do excesso, check do projeto e commit+push).
  Use ao fim de uma etapa grande, de uma sessão, ou quando o usuário pedir /handoff.
---

# /handoff — salvar estado para a próxima sessão

Meta: a próxima sessão começa só com o resumo injetado pelo hook `SessionStart` (`HANDOFF` + pendências `- [ ]` + `git log`). Use os caminhos configurados em `.ai-kit.json` (padrões: `docs/HANDOFF.md`, `docs/PROGRESS.md`, `docs/archive/`) e o `kit=<path>` informado no `SessionStart`.

1. Rode `git log --oneline -15` e `git status --short` para ver o que realmente mudou (não releia código nem docs grandes).
2. **PROGRESS (`docs/PROGRESS.md`):** garanta que cada entrega ou descoberta concluída tem UMA linha `- [x]` ou `- [ ]` (máx. `maxProgressLine` = 190 chars; marque `[x]` **só** se validado; caso contrário inclua `"NÃO validado: ..."`). Depois rode:
   `node "<kit>/scripts/compact-progress.mjs" --max 190 docs/PROGRESS.md`
   Prosa longa vai para o doc de domínio do projeto ou fica no histórico do git.
3. **HANDOFF (`docs/HANDOFF.md`):** reescreva de forma enxuta apenas o que mudou:
   - Data, versão/marco (se aplicável), último commit de código e contagem de testes.
   - **Estado atual** (3–5 linhas).
   - **Próximos passos** (máx. 4 itens em ordem de prioridade).
   - **Pendente do usuário** (ações manuais necessárias, se houver).
   - **Armadilhas:** aponte para `quirksDoc` (se existir); não duplique.
   - **Limite rígido:** ≤ 6 KB (`maxHandoffKb`). Se passar, mova histórico antigo para `docs/archive/HANDOFF_ate_<YYYY-MM-DD>.md` (só Grep depois).
4. **Verificação:** se `.ai-kit.json` (ou `AGENTS.md`/`CLAUDE.md`) definir comando `check`, rode-o e exija sucesso.
5. **Commit e push:** faça `git add` apenas dos arquivos do handoff/docs, commit em **uma linha em inglês** (Conventional Commits, ex.: `docs: update session handoff`), **sem `Co-Authored-By`** nem atribuição de IA, e rode `git push`.
6. **Resposta final (máx. 2 linhas):** informe o que foi salvo e avise que já pode rodar `/clear` — a próxima sessão receberá o resumo automaticamente.
