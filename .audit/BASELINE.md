# BASELINE P0-A — Estado real do repositório

Data da medição: 2026-07-22
Executado em: macOS (Darwin 25.5.0), Node v24.16.0 (nvm), pnpm 10.28.0

## Estado do repositório

| Item | Valor |
|---|---|
| HEAD | `08960e16aa699c66ce57cfddda5184d3aa22cf9a` |
| Branch | `main` (up to date com origin/main) |
| Working tree | limpo antes da medição |
| `git branch -r \| wc -l` | 4 |
| PRs abertos (`gh pr list`) | **0** ✓ (conforme esperado) |

**Divergência do esperado nas branches remotas**: o esperado era "só main".
Refs remotas locais: `origin/HEAD`, `origin/main`,
`origin/7f4s0q-codex/perform-comprehensive-app-quality-evaluation`,
`origin/codex/implement-domain-whitelisting-and-auth`.
`git fetch --prune --dry-run` mostra que **apenas** a branch `7f4s0q-codex/...` é
ref stale (já deletada no remoto). A branch
`origin/codex/implement-domain-whitelisting-and-auth` **ainda existe no remoto**.
Nenhum prune foi executado (fora do escopo desta unidade).

## Dependências "latest" pinadas

Todas pinadas na versão exata que já estava resolvida no pnpm-lock.yaml
(nenhuma atualização de versão; specifiers do lockfile sincronizados via
`pnpm install --lockfile-only`, resoluções inalteradas):

| Pacote | Antes | Depois |
|---|---|---|
| @supabase/ssr | latest | 0.8.0 |
| @supabase/supabase-js | latest | 2.89.0 |
| @types/debug | latest | 4.1.12 |
| @vitest/browser | latest | 4.0.16 |
| @vitest/ui | latest | 4.0.16 |
| happy-dom | latest | 20.0.11 |
| vitest | latest | 4.0.16 |

`pnpm install --frozen-lockfile` após o pin: **exit 0** ("Lockfile is up to date").
Zero ocorrências de `"latest"` restantes em package.json e pnpm-lock.yaml.

## Resultado dos comandos

Logs completos em `.audit/logs/` (um arquivo por comando).

| Comando | Exit | Resumo |
|---|---|---|
| `pnpm lint` | **0** | ✔ Sem warnings ou erros de ESLint |
| `pnpm build` | **0** | ✔ Build Next.js completo (33 rotas) + service worker copiado. 1 warning: `nodejs runtime support for middleware requires experimental.nodeMiddleware` |
| `pnpm test` | **1** | 519 passed / **0 failed** / 143 skipped (665). 46 files passed, 6 skipped. Exit 1 causado por **crash de worker: heap OOM (4 GB)** — ver abaixo |
| `pnpm test:integration` | **1** | 67 passed / **14 failed** (81). 1 file passed, 5 failed. +1 unhandled error |
| `pnpm test:e2e` | **1** | 0 testes executados. Falha no global-setup: browsers do Playwright não instalados (`Executable doesn't exist at .../chromium_headless_shell-1187/...`) |

## Hipótese do cabeçalho: CONFIRMADA

Hipótese: "lint e build passam; test/test:ci falham". **Confirmada localmente.**
`pnpm lint` → 0 e `pnpm build` → 0 no mesmo commit que o Vercel deployou com
sucesso; `pnpm test` e `pnpm test:integration` → 1. Isso é consistente com o
step de coverage do CI reclamando "No files were found with the provided path:
coverage": `test:ci` (`vitest run --coverage`) morre antes de emitir o
diretório `coverage/` — localmente por OOM de worker; runners de CI têm menos
RAM que esta máquina, então o mesmo OOM (ou pior) é esperado lá.
Nenhuma divergência local-vs-Vercel foi observada; não há falha [AMBIENTE] de
build a registrar.

## Falha da suíte unitária (pnpm test)

**Zero testes falharam.** O exit 1 vem de um único crash:

- **Arquivo**: `tests/hooks/use-content-loading.test.ts` (3 testes; único dos
  53 arquivos que nunca reporta resultado)
- **Erro**: `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation
  failed - JavaScript heap out of memory` (heap ~4 GB) →
  `[vitest-pool]: Worker forks emitted error / Worker exited unexpectedly`
- **Reprodução isolada**: `pnpm exec vitest run tests/hooks/use-content-loading.test.ts`
  → mesmo OOM, determinístico, ~50 s
  (log: `.audit/logs/test-use-content-loading-isolated.log`; "tests 0ms" no
  sumário — o worker morre durante a execução, antes de qualquer teste reportar)
- **Classificação**: **[INDEFINIDO]** — o arquivo importa o hook real
  (`@/hooks/use-content-loading`); a alocação descontrolada pode estar no hook
  ([CÓDIGO]) ou num loop de re-render induzido pelos mocks do teste ([TESTE]).
  A mensagem de erro não permite decidir. É a falha nº 1 a investigar: é ela
  que mata o `test:ci` e o artefato de coverage.

## Falhas de integração (pnpm test:integration) — 14

**Fato decisivo para a classificação**: os 5 arquivos que falham **não importam
nenhum código do app** (nenhum import de `@/` ou caminho relativo para
`components/`, `lib/`, `hooks/`; apenas React, @testing-library e vitest —
verificado por grep). Eles renderizam componentes mock definidos dentro do
próprio arquivo de teste. Logo, nenhuma dessas falhas pode ser [CÓDIGO]: o
comportamento do app não é exercitado. Todas são **[TESTE]**.

| # | Teste | Arquivo | Erro cru (resumo) | Classe |
|---|---|---|---|---|
| 1 | should handle network timeouts and retries | tests/integration/api-real-world-validation.test.tsx | `Unable to find an element by: [data-testid="result-errorRecovery"]` | [TESTE] |
| 2 | should handle failed authentication with rate limiting | tests/integration/auth-security-flows.test.tsx:565 | `expected "vi.fn()" to be called with arguments: [ 'invalid_credentials', …] — Number of calls: 0` | [TESTE] |
| 3 | should enforce rate limiting and block after multiple failures | tests/integration/auth-security-flows.test.tsx | `toHaveTextContent()` esperava "Too many failed attempts. Please try again later." — recebeu vazio | [TESTE] |
| 4 | should handle secure sign out with token blacklisting | tests/integration/auth-security-flows.test.tsx | `Unable to find an element by: [data-testid="signout-button"]` | [TESTE] |
| 5 | should log all security events comprehensively | tests/integration/auth-security-flows.test.tsx:897 | `expected "vi.fn()" to be called 6 times, but got 4 times` | [TESTE] |
| 6 | should manage local state within library component | tests/integration/data-flow-state-management.test.tsx | `Unable to find an element by: [data-testid="song-1"]` | [TESTE] |
| 7 | should manage setlist state correctly | tests/integration/data-flow-state-management.test.tsx | `toHaveTextContent()` esperava "2. Song 2" — recebeu vazio | [TESTE] |
| 8 | should handle rapid state updates without race conditions | tests/integration/data-flow-state-management.test.tsx | `toHaveTextContent()` esperava "Global Setlist Count: 3" — recebeu vazio | [TESTE] |
| 9 | should handle concurrent modifications from multiple components | tests/integration/data-flow-state-management.test.tsx | `Unable to find an element by: [data-testid="global-remove-1"]` | [TESTE] |
| 10 | should maintain state consistency during component errors | tests/integration/data-flow-state-management.test.tsx:776 | `Error: Simulated error` (lançado pelo próprio mock `ProblematicComponent` do teste, não capturado como esperado) | [TESTE] |
| 11 | should handle collaborative setlist sharing | tests/integration/end-to-end-workflows.test.tsx:831 | `TypeError: Cannot set property clipboard of #<Navigator> which has only a getter` (mock de clipboard incompatível com o jsdom atual) | [TESTE] |
| 12 | should maintain smooth performance with large setlist (100+ songs) | tests/integration/performance-mode-stress.test.tsx | `Unable to find an element by: [data-testid="quick-jump-50"]` | [TESTE] |
| 13 | should handle cache operations efficiently | tests/integration/performance-mode-stress.test.tsx:505 | `expected "vi.fn()" to be called at least once` (`mockOfflineCache.get`) | [TESTE] |
| 14 | should handle keyboard navigation under stress | tests/integration/performance-mode-stress.test.tsx | `toHaveTextContent()` esperava "6 / 40" — recebeu vazio | [TESTE] |

Unhandled error adicional (não conta como teste falho): em
`tests/integration/end-to-end-workflows.test.tsx:472`,
`TypeError: Cannot read properties of undefined (reading 'length')`
(`setlist.songs.length` no componente mock `SetlistCreationFlow` do próprio
teste) — [TESTE].

Observação honesta sobre valor: como esses arquivos "de integração" não
exercitam código do app, mesmo quando passam não validam o produto — testam os
próprios mocks. Registro apenas; nenhuma ação nesta unidade.

## Falha E2E (pnpm test:e2e)

- **Erro cru**: `browserType.launch: Executable doesn't exist at
  /Users/marcelviana/Library/Caches/ms-playwright/chromium_headless_shell-1187/
  chrome-mac/headless_shell` em `tests/e2e/global-setup.ts:17`
- **Classificação**: **[AMBIENTE]** — browsers do Playwright não instalados
  nesta máquina (`pnpm exec playwright install` resolveria). Nenhum teste E2E
  chegou a executar; nada se pode afirmar sobre o app por esta suíte.

## Testes skipped

Suíte unitária reporta **143 testes skipped** (6 arquivos inteiramente skipped).
Ocorrências de `it.skip|describe.skip|test.skip` no código:

Em `tests/` (exigido pelo escopo), por subdiretório:

| Diretório | Arquivos com skip | Ocorrências |
|---|---|---|
| tests/security | 7 | 41 |
| tests/components | 2 | 33 |
| tests/performance | 2 | 20 |
| tests/hooks | 2 | 6 |
| tests/platform | 1 | 7 |
| **Total tests/** | **14** | **107** |

Fora de `tests/` (registrado como contexto; grep em app/, components/, lib/,
hooks/, contexts/, __tests__/, domains/):

| Arquivo | Ocorrências |
|---|---|
| app/api/content/[id]/__tests__/route.test.ts | 10 |
| app/api/setlists/[id]/songs/__tests__/route.test.ts | 9 |
| app/api/profile/__tests__/route.test.ts | 8 |
| app/api/setlists/__tests__/route.test.ts | 4 |
| app/api/storage/__tests__/upload.test.ts | 1 |
| app/api/setlists/[id]/__tests__/route.test.ts | 1 |
| **Total fora de tests/** | **33** |

(Ocorrências de `.skip` no fonte ≠ testes skipped em runtime: um
`describe.skip` pode pular N testes de uma vez — daí 140 ocorrências vs. 143
testes skipped reportados.)

## Classificações com MENOS confiança (3)

1. **OOM em `tests/hooks/use-content-loading.test.ts` → [INDEFINIDO]**
   Evidência crua: `FATAL ERROR: Ineffective mark-compacts near heap limit
   Allocation failed - JavaScript heap out of memory` seguido de
   `Error: [vitest-pool]: Worker forks emitted error. / Caused by: Error:
   Worker exited unexpectedly`. Determinístico em isolamento. O arquivo importa
   o hook real do app, então [CÓDIGO] é possível; mas loops de alocação em
   testes de hooks são frequentemente causados pelos mocks/render do próprio
   teste. A mensagem não identifica a linha culpada.

2. **"should log all security events comprehensively" → [TESTE]**
   Evidência crua: `AssertionError: expected "vi.fn()" to be called 6 times,
   but got 4 times` (auth-security-flows.test.tsx:897). Classifiquei [TESTE]
   porque o arquivo não importa código do app — mas 4≠6 chamadas indica que o
   fluxo mock interno diverge do roteiro do próprio teste, e sem depurar não
   sei qual dos dois lados do arquivo está errado (só sei que ambos são teste).

3. **"should maintain state consistency during component errors" → [TESTE]**
   Evidência crua: `Error: Simulated error ❯ ProblematicComponent
   tests/integration/data-flow-state-management.test.tsx:776` — o erro é
   lançado de propósito pelo teste; a falha real é que o error boundary
   esperado pelo teste não o conteve. Como o boundary também é definido no
   teste, mantive [TESTE], mas a mensagem por si só não prova onde a contenção
   deveria ocorrer.

## Contagem final por pilha

| Pilha | Quantidade |
|---|---|
| [TESTE] | 14 (todas as falhas de integração) |
| [CÓDIGO] | 0 confirmadas |
| [AMBIENTE] | 1 (E2E inteiro: browsers Playwright ausentes) |
| [INDEFINIDO] | 1 (OOM de use-content-loading.test.ts — mata o exit code da suíte unitária e o coverage do CI) |
