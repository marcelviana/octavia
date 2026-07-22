# Notas de configuração do knip (P0-C)

knip 6.29.0, adicionado como devDependency. Config em `knip.json` na raiz.
Report: `.audit/knip-report.md` (gerado com `pnpm exec knip --reporter markdown`;
exit 1 é o comportamento normal do knip quando há issues — rodou sem crash).

## Decisões de configuração (e por quê)

1. **`components/ui/**` ignorado como biblioteca vendorizada.** São os
   primitivos shadcn/ui copiados para o repo. O knip acusaria ~12 deles como
   unused (bate com o grafo do P0-B), mas tratamos como vendor: deletar
   primitivo shadcn é decisão separada de deletar código do app.
   **Consequência para o cruzamento**: os 12 órfãos de `components/ui/*` do
   P0-B ficam SEM segunda condenação por construção — aparecem na lista de
   "discordâncias" como absolvição artificial, não entram na kill-list.

2. **Entry points.** `middleware.ts`, `worker/index.js` (o plano dizia
   `worker/sw.ts`, que não existe — mesmo ajuste feito no P0-B),
   `scripts/build-sw.js`, e todo `tests/**` e `__tests__/**` como entries de
   teste. As páginas/rotas do App Router, os configs de next/vitest/playwright
   e os setupFiles são detectados automaticamente pelos plugins do knip
   (next, vitest, playwright) — os hints "Remove redundant entry pattern" que
   restam para `middleware.ts` e `scripts/build-sw.js` confirmam isso; mantive
   os dois explícitos por documentação.

3. **`scripts/setup-database.js` e `scripts/check-supabase.js` como entry.**
   Não são importados por ninguém, mas são documentados como comandos manuais
   em `DATABASE_SETUP.md` ("node scripts/setup-database.js"). Falso positivo
   clássico de script standalone → viram entry. Já
   `scripts/performance-comparison.ts` e `scripts/test-performance-import.js`
   NÃO têm nenhuma referência (nem em package.json, nem em docs, nem em outros
   scripts) — ficam acusados.

4. **`src/test-setup-integration.ts` NÃO é entry.** Primeira iteração o
   listava como entry por parecer setupFile; verificação mostrou que
   `vitest.integration.config.mts` usa `./src/test-setup.ts` (o mesmo da
   unitária) e a única menção a `test-setup-integration` no repo é numa lista
   de exclusão de coverage. Está morto de verdade; o knip agora o acusa.

5. **`types/**` e `scripts/**` estão no project scope** mesmo estando fora do
   universo do grafo do P0-B (app/components/lib/hooks/domains). Achados do
   knip nessas árvores aparecem no report mas não podem receber dupla
   condenação — anotados como "só knip" nas discordâncias.

## Falsos positivos conhecidos que NÃO são falsos

- `types/database.types.ts`: a única "referência" no repo é o import
  `import type { Database } from '@/types/database'` em
  `tests/typescript-ide-improvements.test.ts` e
  `tests/typescript-strict-mode.test.ts` — que **não resolve** (o arquivo real
  chama-se `database.types.ts`). Como é type-only, é apagado na transpilação e
  os testes rodam mesmo assim; mas sob tsc/IDE o tipo está quebrado. O knip
  acusa o unresolved import E o arquivo unused; ambos procedem.
- `node-mocks-http` (unlisted dependency em
  `tests/security/auth-penetration-testing.test.ts` e
  `tests/security/owasp-top10-penetration.test.ts`): o pacote **não existe em
  node_modules** e não está no package.json. Os testes passam porque o binding
  `createMocks` importado nunca é usado e o transform do vitest elide o import.
  Import fantasma — remover o import é o conserto, não instalar o pacote.

## Hints restantes (aceitos)

- `middleware.ts` / `scripts/build-sw.js` redundantes (ver item 2).
- `.css` "compiled extension excluded" — imports de CSS não são seguidos;
  irrelevante para caça de código morto TS/TSX.

## Discordâncias grafo (P0-B) × knip — 35 casos

### Grafo condena, knip absolve (28)

**(a) Absolvição artificial — `components/ui/*` ignorado por config (12):**
alert-dialog, aspect-ratio, breadcrumb, calendar, collapsible, popover,
progress, resizable, sheet, table, toaster, toggle. O knip não os avaliou
(vendor shadcn). O grafo os condena; sem segunda fonte, ficam fora da
kill-list por decisão de config, não por absolvição real.

**(b) Vivos APENAS por testes (16) — o caso interessante.** O knip trata todo
arquivo de teste como entry; o grafo do P0-B marca "importado por teste" mas
exige rota para absolver. Todos os 16 abaixo estão fora de qualquer rota e só
não são "unused" porque um teste (ou um órfão que um teste importa) os alcança:

| Arquivo | Alcançado via |
|---|---|
| components/add-content-refactored.tsx | tests/components/add-content.refactoring.test.tsx + bench |
| components/add-content/StepIndicator.tsx | idem (via add-content-refactored) |
| components/file-upload.tsx | via add-content-refactored |
| components/performance-mode.tsx | __tests__/performance-mode/chords-display-bug.test.tsx |
| components/performance-mode/content-display.tsx | components/__tests__/content-display.test.tsx + performance-mode.tsx |
| domains/shared/state-management/app-store.ts | tests/utils/test-utils.tsx |
| hooks/use-content-caching.ts | hooks/__tests__/use-content-caching.test.ts + performance-mode.tsx |
| hooks/use-content-preloader.ts | via performance-mode.tsx |
| hooks/useAddContentState.ts | tests/hooks/useAddContentState.test.ts + refactoring tests |
| hooks/useFileHandling.ts | tests/components/add-content.refactoring.test.tsx |
| lib/platform-utils.ts | tests/platform/* (3 arquivos) |
| lib/react-native-compatibility.ts | tests/platform/react-native-compatibility.test.ts |
| lib/security-logger.ts | lib/__tests__/security-logger.test.ts |
| lib/storage-service.ts | via file-upload.tsx / useFileUpload.ts |
| lib/test-utils/api-test-helpers.ts | app/api/setlists/**/__tests__ (2 arquivos) |
| lib/test-utils/supabase-mock-factory.ts | via api-test-helpers.ts |

Interpretação: são zumbis mantidos vivos pelo arnês. Deletar exige decidir o
destino do teste junto (migrar alvo para o gêmeo vivo, ou deletar par
teste+código). Não entram na kill-list desta fase.

### Knip condena, grafo não alcança/absolve (7)

| Arquivo | Por que só o knip vê |
|---|---|
| lib/__tests__/behavioral-test-helpers.ts | P0-B o listou como "teste colocado" (fora do fecho, esperado); knip mostra que NENHUM teste o importa — helper morto |
| lib/__tests__/test-auth.tsx | idem |
| lib/__tests__/test-database.ts | idem |
| src/test-setup-integration.ts | fora do universo do grafo; nenhum config o usa (integration usa src/test-setup.ts) |
| scripts/performance-comparison.ts | fora do universo; zero referências em package.json/docs |
| scripts/test-performance-import.js | idem |
| types/database.types.ts | fora do universo; única "referência" é o import type quebrado `@/types/database` em 2 testes |

Candidatos legítimos, mas com UMA fonte só — precisam de confirmação manual na
Fase 1 (estão fora do grafo por escopo, não porque algo os importa).
