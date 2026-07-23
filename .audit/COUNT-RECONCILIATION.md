# P1-V — Reconciliação de contagem (Node 24 → Node 22)

Data: 2026-07-23. HEAD: `785c7a1` (working tree limpa antes da medição).
Runtime da re-medição: **Node v22.23.1** (o pinado por `.nvmrc`), pnpm 10.28.0.
Log: `.audit/logs/test-node22-p1v.log`.

## Os dois números a reconciliar

| Medição | Runtime | passed | skipped | total |
|---|---|--:|--:|--:|
| Baseline P1-A | Node 24 | 522 | 143 | 665 |
| Atual (P1-V) | Node 22 | **504** | **165** | **669** |
| **Delta** | | **−18** | **+22** | **+4** |

Derivação do baseline 522: o log de P0-A (`.audit/logs/test.log`, Node 24)
reporta 519 passed / 143 skipped, total 665 — os 3 its de
`tests/hooks/use-content-loading.test.ts` contavam no total mas nunca
reportavam (worker morria por OOM). Com o fix do OOM (P1-A, `7a3abce`),
esses 3 passam: 519 + 3 = **522 / 143 / 665**.

## Álgebra por arquivo

Único conjunto de arquivos do runner UNIT cujas contagens mudaram entre o
baseline e agora: os 4 arquivos de teste tocados pelo P1-B (`85ac2eb`).
Contagens por arquivo extraídas dos logs (baseline: `.audit/logs/test.log`;
atual: `.audit/logs/test-node22-p1v.log`):

| Arquivo | Baseline (passed/skip/total) | Atual (passed/skip/total) | Δpassed | Δskip | Δtotal |
|---|---|---|--:|--:|--:|
| `tests/hooks/useAddContentState.test.ts` | 26 / 4 / 30 | 20 / 12 / 32 | −6 | +8 | +2 |
| `tests/components/add-content.refactoring.test.tsx` | 27 / 9 / 36 | 15 / 23 / 38 | −12 | +14 | +2 |
| `components/__tests__/content-display.test.tsx` | 7 / 0 / 7 | 7 / 0 / 7 | 0 | 0 | 0 |
| `__tests__/performance-mode/chords-display-bug.test.tsx` | 3 / 0 / 3 | 3 / 0 / 3 | 0 | 0 | 0 |
| **Soma** | | | **−18** | **+22** | **+4** |

**A conta fecha exatamente**: −18 passed, +22 skipped, +4 total.

### a. Its skipados pelo P1-B

Marcadores no working tree (grep):

- `BUG(P1-B)`: **10** its `it.skip` — todos em
  `tests/components/add-content.refactoring.test.tsx` (os 10
  [FALHA-COMPORTAMENTO] do LOST-BEHAVIOR.md).
- `INAPLICÁVEL(P1-B)`: its skipados por superfície de API morta sem
  equivalente no gêmeo vivo — em `useAddContentState.test.ts` e
  `add-content.refactoring.test.tsx`.

Decomposição do +22 de skipped:

- `useAddContentState.test.ts`: 4 → 12 skipped (+8). Os 4 TODO pré-existentes
  continuam skip (agora rotulados INAPLICÁVEL); +6 its passaram de passed
  para skip INAPLICÁVEL; +2 its novos de split (ver b.) nasceram skip.
- `add-content.refactoring.test.tsx`: 9 → 23 skipped (+14). Dos 9 TODO
  pré-existentes, 1 foi des-skipado ("content creator display", agora
  [PASSA]) → 8 viram skip INAPLICÁVEL; +10 skips BUG(P1-B) (ex-passed);
  +3 its ex-passed viram skip INAPLICÁVEL (useFileHandling init, skip to
  step 3, props do StepIndicator — API do wizard morto); +2 its novos de
  split nascem skip (ver b.). Total: 8 + 10 + 3 + 2 = **23** ✓.
  Passed: 27 − 10 (BUG) − 3 (INAPLICÁVEL) + 1 (TODO des-skipado) = **15** ✓.

### b. Its novos adicionados pelo P1-B

**+4 its**, todos por divisão de its mistos (asserções sobre superfície
exclusiva do gêmeo morto movidas para its `it.skip` INAPLICÁVEL próprios,
sem deletar asserção — método documentado no LOST-BEHAVIOR.md):

- +2 em `useAddContentState.test.ts` (30 → 32)
- +2 em `add-content.refactoring.test.tsx` (36 → 38)

Isso explica integralmente o Δtotal de +4.

### c. Its removidos pelo P1-C

**Zero efeito no runner unit — confirmado por construção e por contagem.**
`vitest.config.mts` (runner unit) exclui `**/*integration*.test.{ts,tsx}` e
`**/integration/**/*.test.{ts,tsx}`; os 6 arquivos deletados pelo P1-C
(5 em `tests/integration/` + `tests/components/component-functionality.integration.test.tsx`)
caem todos nesses padrões de exclusão. Conferência pela contagem de
arquivos do runner unit: 53 no baseline (46 passed + 6 skipped + 1 crash
OOM) e 53 agora (47 passed + 6 skipped) — nenhum arquivo saiu do runner.
O efeito do P1-C aparece apenas no runner de integração ("No test files
found", pendência D5).

### d. Álgebra completa

```
passed:  522 − 6 (useAddContentState: passed→skip INAPLICÁVEL)
             −12 (add-content.refactoring: −10 passed→skip BUG(P1-B),
                  −3 passed→skip INAPLICÁVEL, +1 TODO des-skipado→passed) = 504 ✓
skipped: 143 + 8 (useAddContentState)  +14 (add-content.refactoring)      = 165 ✓
total:   665 + 2 (split useAddContentState) + 2 (split refactoring)       = 669 ✓
```

Node 24 → Node 22 **não altera nenhuma contagem**: todo o delta é explicado
por commits (P1-B); nenhum it mudou de status sem commit que o explique.

## Conclusão

**A conta FECHA. Ambiente Node 22 (v22.23.1) declarado HOMOLOGADO** para as
medições da Fase 1. `pnpm test` → exit 0 sob Node 22 com 504/165/669,
idêntico ao registrado no fechamento do P1-A.
