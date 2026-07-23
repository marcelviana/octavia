# P1-C — Teatro de mock deletado (decisão humana D3)

Data: 2026-07-23. Decisão D3 aprovada: **deletar, não consertar** os arquivos de
"integração" que não importam nenhum código de produção — eles testam
componentes definidos dentro do próprio arquivo de teste (mock testando mock).
As 14 falhas neles foram skipadas no P1-A com marcador `SKIP(P1-D3)`.

## Como a lista foi confirmada

1. `grep -rl 'SKIP(P1-D3)' tests/` → os 5 arquivos de `tests/integration/`.
2. O harness-map (P0-C, linha 9) registra que `vitest.integration.config.mts`
   seleciona `tests/integration/**` **e** o padrão `*integration*` → **6
   arquivos**. O 6º é `tests/components/component-functionality.integration.test.tsx`
   (sem marcador SKIP porque não tinha falha no baseline — 17/17 passando),
   já acusado no harness-map como "SÓ MOCK: zero imports de código do app".
3. Re-verificação de imports em cada um dos 6 (grep abaixo): nenhum importa
   `@/` nem caminho relativo saindo de `tests/` — só React, @testing-library,
   vitest, userEvent e tipos de `next/*`.

### Grep de evidência

Comando (por arquivo):

```
grep -nE "@/|from ['\"]\.|import\(|require\(|importActual|importOriginal" <arquivo>
```

| Arquivo | Resultado |
|---|---|
| tests/integration/api-real-world-validation.test.tsx | nenhuma ocorrência |
| tests/integration/auth-security-flows.test.tsx | nenhuma ocorrência |
| tests/integration/data-flow-state-management.test.tsx | nenhuma ocorrência |
| tests/integration/end-to-end-workflows.test.tsx | 1 ocorrência: `38: vi.mock('@/lib/firebase-auth', () => ({` — declaração de mock com factory própria (sem `importActual`); substitui o módulo em vez de executá-lo, e nada no arquivo importa o módulo. Não é import de código real. |
| tests/integration/performance-mode-stress.test.tsx | nenhuma ocorrência |
| tests/components/component-functionality.integration.test.tsx | nenhuma ocorrência |

Imports estáticos reais de cada arquivo (grep `^import`): apenas `react`,
`@testing-library/react`, `@testing-library/user-event`, `vitest`,
`next/navigation` (hook mockado) e `next/router` (só o tipo `NextRouter`).

## Arquivos deletados

| Arquivo | Tamanho | Linhas | Nº de `it`s | Falhas no baseline (P0-A) |
|---|--:|--:|--:|--:|
| tests/integration/api-real-world-validation.test.tsx | 28 KB | 802 | 16 | 1 |
| tests/integration/auth-security-flows.test.tsx | 32 KB | 908 | 15 | 4 |
| tests/integration/data-flow-state-management.test.tsx | 28 KB | 823 | 11 | 5 |
| tests/integration/end-to-end-workflows.test.tsx | 36 KB | 1058 | 8 | 1 (+1 unhandled) |
| tests/integration/performance-mode-stress.test.tsx | 28 KB | 775 | 14 | 3 |
| tests/components/component-functionality.integration.test.tsx | 24 KB | 699 | 17 | 0 |
| **Total** | **176 KB** | **5065** | **81** | **14** |

## Divergências encontradas

1. **Localização do 6º arquivo.** A lista esperada dizia "6 arquivos de
   tests/integration", mas `tests/integration/` só contém 5. O 6º arquivo do
   conjunto de integration do harness-map vive em `tests/components/` e entra
   no runner pelo glob `*integration*`. Ele satisfaz o mesmo critério (zero
   imports de código do app, já acusado como SÓ MOCK no P0-C) e foi incluído;
   sem ele o runner de integration continuaria executando teatro de mock e a
   contagem de 6 não fecharia.

2. **P1-A não estava commitado.** A pré-condição dizia "P1-A commitado", mas os
   marcadores SKIP(P1-D3) (e os demais skips do P1-A em tests/hooks/,
   tests/security/ e tests/typescript-*) estavam apenas no working tree, sem
   commit. Irrelevante para os 6 deletados; as demais modificações do P1-A
   foram deixadas fora do commit do P1-C.

3. **`pnpm test:integration` agora sai com código 1 — "No test files found".**
   Consequência mecânica da deleção: os 6 arquivos eram TODO o conteúdo
   selecionado por `vitest.integration.config.mts` (include:
   `tests/integration/**/*.test.{ts,tsx}` + `**/*integration*.test.{ts,tsx}`),
   e vitest falha por padrão quando não encontra nenhum teste. O conserto
   exige tocar config (`passWithNoTests: true`, ou remover o runner/script
   `test:integration` do package.json) — **proibido pelo escopo do P1-C**.
   Decisão pendente para o humano. `pnpm test` (unit) segue em exit 0
   (47 arquivos / 504 testes passando).

## Resultado dos runners pós-deleção

- `pnpm test` → **exit 0** (47 passed | 6 skipped; 504 tests passed | 165 skipped)
- `pnpm test:integration` → **exit 1** ("No test files found" — ver divergência 3)

## Reversão

`git revert` do commit "test: P1-C remove teatro de mock (6 arquivos que não
importam código do app) [D3]".
