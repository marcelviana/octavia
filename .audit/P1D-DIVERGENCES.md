# P1-D — Divergências do passo 1 (arquivos poupados)

Data: 2026-07-23. Protocolo: qualquer hit vivo fora de (o próprio arquivo,
homônimos documentados, arquivos do mesmo lote) ⇒ arquivo sai do lote e
entra aqui. Não improvisar.

## 1. components/library/index.ts — POUPADO (lote 3)

**Motivo**: o barrel é VIVO via import dinâmico não resolvido pelo grafo
P0-B nem pelo knip.

Grep cru (protocolo passo 1, checagem de barrel por caminho de import):

```
components/library-page-client.tsx:8:const Library = dynamic(() => import("@/components/library").then(mod => ({ default: mod.Library })), {
```

Cadeia de vida completa até rota:

```
app/library/page.tsx:4:import LibraryPageClient from "@/components/library-page-client";
components/library-page-client.tsx:8:const Library = dynamic(() => import("@/components/library").then(...))
components/library/index.ts  →  reexporta RefactoredLibrary como `Library`
```

**Por que as duas fontes erraram**: `import("@/components/library")` é um
dynamic import de diretório (resolve para `index.ts`); tanto o
dependency-cruiser (orphans.md linha 26: sem importador) quanto o knip
(knip-report.md, unused files) falharam em resolvê-lo. Falso positivo de
dupla condenação — exatamente o cenário que o passo 1 existe para pegar.

**Consequência**: `components/library/index.ts` permanece no repositório.
Os demais 21 arquivos do lote 3 foram deletados normalmente (nenhum era
reexportado só por esse barrel de forma que o mantivesse vivo — os
reexports do barrel apontam para os arquivos vivos de `components/library/`,
que nunca estiveram na kill-list).

**Follow-up sugerido (fora do escopo P1-D)**: trocar o import do barrel por
import direto de `./library/RefactoredLibrary` e aí sim avaliar o barrel —
ou corrigir a config do depcruise/knip para resolver dynamic imports de
diretório e re-auditar.

## 2. Observação (não é divergência): vi.mock de app-store em src/test-setup.ts

`src/test-setup.ts:90` registra `vi.mock('@/domains/shared/state-management/app-store', ...)`
com factory `importActual`. O app-store foi deletado no lote 1 (complemento
explícito da D1). A factory do `vi.mock` é lazy: só executa se algum teste
importar o caminho mockado — após o lote 1, nenhum importa (suite verde,
504/165/669). `src/test-setup.ts` é config de teste (PROIBIDO tocar no
escopo do P1-D); o bloco morto (linhas 89–107) fica como resíduo inerte a
limpar em fase futura.

## Saldo

- Kill-list: 61 condenados → **60 deletados**, 1 poupado (library/index.ts).
- Complementos deletados além da kill-list: `domains/shared/state-management/app-store.ts`
  (D1), `tests/utils/test-utils.tsx` + `tests/utils/mock-services.ts`
  (cadeia morta cujo único alvo de código do app era o app-store — provisão
  do passo 2; zero importadores em todo o repo).
