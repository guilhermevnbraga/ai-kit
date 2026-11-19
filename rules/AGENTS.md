# AI Kit — Regras Universais

Estas regras definem o núcleo operacional compartilhado entre projetos. Regras de domínio, stack e arquitetura vivem no `AGENTS.md` / `CLAUDE.md` de cada projeto e têm precedência em caso de conflito.

## Comunicação
- Responda em **PT-BR**, direto e curto.
- **Recomende** o melhor caminho em vez de despejar menus de opções.
- Relatório final em poucas linhas; tabela só para comparar.

## Economia de tokens
- Busque/Grep antes de ler; leia só o intervalo necessário (`StartLine`/`EndLine` ou `offset`/`limit`).
- Nunca releia arquivo que acabou de editar.
- Em projetos com `.ai-kit.json` ou `docs/HANDOFF.md`, o hook `SessionStart` já injeta estado, pendências `- [ ]` e `git log`: **não** leia inteiros `docs/HANDOFF.md`, `docs/PROGRESS.md` nem docs listados em `noFullRead`. Histórico em `docs/archive/` é só via Grep.
- Valide em lote (1 script/comando retornando JSON/linha-resumo em vez de dumps grandes ou vários screenshots); capturas visuais só para perguntas visuais.
- Fim de etapa grande ou contexto longo: rode `/handoff` e sugira `/clear`.

## Qualidade e verificação (obrigatória antes de dar por pronto)
- Rode o comando de verificação do projeto (`check` em `.ai-kit.json` ou `AGENTS.md`) e exija sucesso.
- Lógica pura nova ganha teste unitário testando o **contrato**, nunca o bug atual. Teste falhando por bug real é sucesso: reporte, não enfraqueça o teste.
- **Honestidade absoluta:** diga explicitamente o que **NÃO** foi validado; nunca marque `[x]` em `docs/PROGRESS.md` sem validação real.
- Antes de usar MCPs ou ferramentas externas com armadilhas conhecidas, leia o doc `quirksDoc` do projeto (se configurado).

## Entrega e Git
- Em projetos com `docs/PROGRESS.md`: UMA linha por item (≤ 190 chars, com `"NÃO validado: ..."` quando aplicável); compacte com `scripts/compact-progress.mjs` do kit.
- Commits: Conventional Commits, inglês, **uma linha, sem corpo** (`feat|fix|refactor|perf|docs|test|chore|build`).
- **PROIBIDO** `Co-Authored-By`, `"Generated with ..."` ou qualquer atribuição de IA no commit.
- Nunca use `--force` nem `--no-verify`. Se o push falhar, reporte.
