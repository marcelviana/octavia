# P1-V — Veredito da verificação de integridade pré-deleção

Data: 2026-07-23. HEAD verificado: `785c7a1`. Runtime: Node v22.23.1
(pinado por `.nvmrc`), pnpm 10.28.0.

## Conclusão

**GATE ABERTO: P1-D autorizado.**

Os quatro critérios fecharam sem divergência inexplicada:

## 1. Reconciliação de contagem — FECHOU

Baseline P1-A (Node 24) 522/143/665 → atual (Node 22) 504/165/669.
Delta (−18 passed, +22 skipped, +4 total) explicado 100% por commits do
P1-B, item a item e por arquivo, com soma exata — ver
`.audit/COUNT-RECONCILIATION.md`. O P1-C não afeta o runner unit (os 6
arquivos deletados caíam nos padrões de exclusão de `vitest.config.mts`;
contagem de arquivos do runner: 53 antes e 53 depois). Nenhum it mudou de
status sem commit que o explique. **Ambiente Node 22 homologado.**

## 2. Vereditos do P1-B sob Node 22 — 100% CONFIRMADOS

- 45 [PASSA]: re-executados individualmente os 4 arquivos do P1-B sob
  Node 22 → 45 passed / 35 skipped / 80, zero falhas
  (`.audit/logs/test-node22-p1b-files.log`).
- 10 [FALHA-COMPORTAMENTO]: re-executados **des-skipados** em worktree
  descartável (sem tocar nos arquivos do projeto) → exatamente os mesmos
  10 its falham, com as mesmas mensagens de erro do LOST-BEHAVIOR.md
  (heading "Add New Content" ausente, botão Back ausente, headings do
  wizard ausentes, "Import Music File" ausente ×3 — UI de upload é o
  placeholder —, erro nunca renderizado)
  (`.audit/logs/test-node22-p1b-unskipped.log`).
- Nenhum veredito mudou; LOST-BEHAVIOR.md anotado como revisado sob Node 22.

## 3. Verde operacional — OK

| Comando | Exit | Observação |
|---|---|---|
| `pnpm test` | **0** ✅ | 504/165/669 (`.audit/logs/test-node22-p1v.log`) |
| `pnpm build` | **0** ✅ | build completo + sw copiado, working tree segue limpa (`.audit/logs/build-node22-p1v.log`) |
| `pnpm test:integration` | 1 ⚠️ | **exclusivamente** "No test files found, exiting with code 1" — pendência D5 conhecida, nada além (`.audit/logs/test-integration-node22-p1v.log`) |

e2e: não re-rodado; vale o baseline de `785c7a1` (`.audit/E2E-BASELINE.md`).

## 4. Coerência da kill-list — SEM DIVERGÊNCIA

Existência: **61/61 arquivos existem**. Grep de importadores (protocolo
P1-D passo 1) por amostragem estratificada — 14/14 de `lib/`, 3/3 de
`hooks/`, 8 aleatórios de `components/` (status-badge, form-dialog,
batch-import, FileUploadZone, signup-form, optimized-performance-controls,
metadata-editor, login-form), 5 aleatórios de `domains/`
(ContentTypeSelector, StepIndicator, shared/services/index,
DomainErrorBoundary, ImportOptions) — 30 arquivos verificados:

- 22/30: **zero importadores** no repositório inteiro.
- 8/30: importados **apenas por outros arquivos da própria kill-list**
  (cadeia `-refactored` entre si; barrels `index.ts` de common/ e
  domains/ reexportando os irmãos condenados). Nenhum importador de fora
  do conjunto condenado — consistente com a "cadeia fechada" já
  documentada no rascunho. **Não é divergência**; é a ordem de deleção do
  P1-D que deve remover barrels junto com (ou depois de) seus reexports.

`.audit/KILL-LIST-DIVERGENCES.md` não foi criado: nenhuma divergência.

## Ressalvas herdadas (não bloqueiam o gate)

- `test:integration` exit 1 por runner vazio — decisão humana D5 pendente
  (remover script/config ou repovoar com integração real).
- 1 falha funcional real no e2e chromium (`basic.spec.ts:96`, navegação
  /signup) registrada no baseline — fora do escopo do P1-D.
- Bloco "segurança nunca ligada" da kill-list (file-security,
  sql-injection-prevention etc.): deleção é decisão de produto/segurança,
  como já avisa o rascunho — exigir confirmação humana no P1-D.
