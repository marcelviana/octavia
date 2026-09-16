# N2 — pre-check: Fase A (estática) e Fase B (prod, leitura e 400/401/500)

> **Bloco**: N2 — tela 2 do app nativo, **escrita de setlist** (criar com nome e
> data, renomear, apagar, adicionar e remover músicas, reordenar), no
> `apps/native`, contra o backend atual **sem alteração**.
> **Data**: 2026-09-16. **Árvore**: `../octavia-n2`, branch `n2/precheck`, a
> partir de `origin/main` = `9e14042`.
> **Fase A** (commit `37e7f48`): inventário estático. Nenhuma escrita em
> prod, nenhuma chamada à API do Octavia, nenhum código de app, nenhum
> emulador. As leituras de rede foram ao **GitHub** (`gh api …/rulesets…`,
> para o A5), não à API do app.
> **Fase B + aval** (segundo commit, mesma PR #306): cinco requests a
> `https://octavia.rocks` com a conta de audit (§11), **zero escrita**; as
> decisões do aval em §0.1 (N2-D6…D11).
> **Regra de leitura**: `[medido: Ax]` = comando e saída literal no anexo
> `N2-PRECHECK-anexos/Ax-*.txt` (cada bloco começa com `$ <comando>` e termina
> com `[exit n]`). `[hipótese]` = não medido, com dono em §12.
> **Numeração de divergências**: começa em **144**, e não em 143 — ver a div. 144.

---

## 0. Decisões e premissas

### 0.1 Decisões já tomadas (Marcel, 2026-09-16)

| # | Decisão |
|---|---|
| **N2-D1** | Recorte: só escrita de setlist. Escrita de content é o N3, com o B9 antes. |
| **N2-D2** | No N2 a escrita só funciona online, e a falha aparece na tela. Fila de escrita offline é bloco próprio. |
| **N2-D3** | Da dívida do palco, só a div. 121 entra no N2. A div. 119, o estouro do `lruEvict` e a medição do build de release vão para um W4. |
| **N2-D4** | Design novo: Claude Design com brief próprio, como extensão de S1/S2. A proposta §8.3 do `DESIGN-V1` (ordenar S1 pela data do show) é decidida nesse brief. |
| **N2-D5** | O pre-check inclui o probe dos workflows de CI (A5), e a PR do pre-check é o teste real da proteção de branch. |

**Aval da Fase A (Marcel, 2026-09-16):**

| # | Decisão |
|---|---|
| **N2-D6** | Divs. 150 e 151: hotfix **agora**, em PR própria no web, antes de qualquer escrita do nativo. Sessão e worktree separadas; não é o executor do N2. |
| **N2-D7** | Div. 145: a errata do `SETLISTS.md` (criar, editar, apagar a setlist) nasce na **PR-0 do N2** (o PRD da tela 2), copiada dos handlers medidos em §1. A div. 149 (`event_date` no `PRD-TELA-1.md:314`) vai junto. |
| **N2-D8** | Div. 157 + T1-R10 entram no N2 como **primeira PR de código**, com o gate antes da tela: ligar o `diffByUpdatedAt` no sync, contador real no log, controle negativo com `invalidated=1` sob mock com `updated_at` diferente. A errata do A7 no `PRD-TELA-1.md` vai nessa PR. A div. 121 se resolve pelo mesmo mecanismo. |
| **N2-D9** | O nativo **não desloga** em 401 de escrita: trata como falha da operação e mantém a sessão. Se o 401 de email não verificado for idêntico byte a byte ao de token inválido, a distinção no backend é item do Bloco D e o nativo mostra frase genérica. |
| **N2-D10** | Fase B: **B-c, B-a, B-b e B-d aprovados**; B-e adiado para a Fase C; **B-f vetado**. A B-a ganha o `cmp` da N2-D9. |
| **N2-D11** | O A10 continua dependendo de uso real. O aceite do N2 mede o mecanismo (criar setlist com data → o prefetch dispara) com uma setlist que o Marcel criaria de qualquer jeito, ou por fixture, com o A10 registrado como "não reproduzido". |

### 0.2 Premissas do prompt — veredito

| # | Premissa | Veredito | Onde |
|---|---|---|---|
| **P1** | `main` em `9e14042` | **verdadeira** — `git rev-parse origin/main` → `9e14042b95d09c56b77afa7a8a2439d798c96127` `[medido: A0]` | §1 do prompt |
| **P2** | `SETLISTS.md` cobre lock, posição 1..N, atomicidade e reorder em lote; o nativo não precisa do B9 | **parcialmente falsa** — cobre as **músicas** da setlist (add/remove/reorder, invariante 1..N, lock), mas **não contrata** as três escritas da própria setlist que o N2 mais usa: `POST /api/setlists`, `PUT /api/setlists/[id]`, `DELETE /api/setlists/[id]`. Também não fala de conflito entre dois writers nem de TTL de lock. A segunda metade (o N2 não depende do B9) é verdadeira. → **div. 145** | §2 |
| **P3** | a coluna é `performance_date` e é gravável por `POST`/`PUT` | **verdadeira** — `date`, nullable (`schema.dump.sql:385`); `YYYY-MM-DD` ou `null` no Zod (`lib/api-schemas.ts:324-326`); gravada em `route.ts:129` e `[id]/route.ts:187-189`. O `event_date` de `types/setlist.ts` **não existe mais** (saiu na B7-PR2); o PRD §11 ainda o cita → **div. 149** | §3 |
| **P4** | S1 tem seis estados implementados; S2 é o índice; ambos em `apps/native/src/screens/` | **verdadeira** — `SetlistsScreen.tsx` (S1, estados a–f em `:269-273`, `:317-380`) e `IndexScreen.tsx` (S2) | §8 |
| **P5** | `build` e `gates-nativos` obrigatórios; `android-debug-apk` não; filtro de `paths` desconhecido | **verdadeira**, e a dúvida fica respondida: o ruleset `maion` (id 23545697, ativo) exige exatamente `gates-nativos` e `build`, com `strict_required_status_checks_policy: true`. O `ci.yml` **não tem** filtro de paths; o `native.yml` tem | §5 |
| **P6** | a div. 121 trata de `updated_at` no T1-R17 (prefetch por data); a 119, do `emVoo`; ambas em `W1-*`/`W2-*` | **parcialmente falsa** — a 121 é de fato sobre o T1-R17, mas o T1-R17 é o **indicador "garantido offline"**, não o prefetch por data (que é o T1-R15). E o `updated_at` em questão é o do **content**, não o da setlist. A 119 está certa. As duas estão em `W1-PRECHECK.md:865,868` → **div. 146** | §6 |
| **P7** | o cache de setlists segue C-D4/T1-R9: troca o conjunto inteiro, sem merge; mostra o cache primeiro e revalida depois | **verdadeira** — `planSync` (`core/sync.ts:61-80`) + `save` (`apps/native/src/store.ts:114-125`); o cache é mostrado primeiro e o sync roda depois (`App.tsx:132-173`). **Com uma ressalva que a premissa não pedia**: o versionamento por `updated_at` do T1-R10 (`diffByUpdatedAt`) não tem nenhum chamador em produção → **div. 157** | §7 |
| **P8** | `packages/core` tem `authFetch` (bearer, T1-R3), usado só para `GET` | **verdadeira** — `createAuthFetch` aceita `method`/`body` (`core/auth-fetch.ts:13-18`); o único chamador é `get()` em `apps/native/src/api.ts:101-124` | §7 |

---

## 1. Os writers de setlist (A1)

`git ls-tree -r --name-only HEAD app/api/setlists` → 5 `route.ts`, 8 handlers
exportados (2 `GET`, 6 de escrita) `[medido: A1]`.

### 1.1 Tabela

As colunas "Cadeia" e "Email verificado" seguem o `docs/api/AUTH.md` §2/§3.
**Cadeia A** = `requireAuthServer` (`lib/firebase-server-utils.ts:137-181`).
**Cadeia B** = `requireAuthServerSecure` (`lib/secure-auth-utils.ts:244-319`),
chamada pelo `withBodyValidation` (`lib/api-validation-middleware.ts:101`).

| # | Método e rota | Handler | Cadeia | Bearer sem cookie (linha do extrator) | Exige email verificado | Schema Zod | Rate limit | `updated_at` | Lock | Respostas |
|---|---|---|---|---|---|---|---|---|---|---|
| W1 | `POST /api/setlists` | `route.ts:91-216`, export `:224` | **B** | sim — `secure-auth-utils.ts:267-270` (regex `/^Bearer\s+(.+)$/i`; o cookie só é lido no `else`, `:277`) | **sim** (`:307-310`) | `setlistSchemas.create` (`lib/api-schemas.ts:339-350`), `.strict()`, `songs[]` ≤100 sem `content_id` repetido | `setlist-mutate` `MUTATE` 120/15 min (`route.ts:92`); conta **antes** da validação do corpo (`middleware:114-125` < `:145-164`) | o handler preenche `created_at` e `updated_at` com `new Date()` do Node no INSERT (`route.ts:133-134`) | nenhum (setlist nova); com `songs[]`: INSERT multi-row (`:168-171`) e, se falhar, um DELETE que desfaz a criação (`:174-178`) | 201 = setlist + `setlist_songs` gravadas; 400 `VALIDATION_ERROR` (middleware `:163`; posse de `songs` `:117-119`); 401/429 (middleware); 500 (`:182`, `:213`) |
| W2 | `PUT /api/setlists/[id]` | `[id]/route.ts:147-294`, wrapper `:297-310` | **B** | sim — idem | **sim** | `setlistSchemas.update` (`api-schemas.ts:354-357`), `.strict()`, todos os campos opcionais; `{}` passa e só atualiza o `updated_at` | `setlist-mutate` (`:148`) | **atualizado no handler**, no mesmo UPDATE (`:174-176`, `new Date()` do Node) | **nenhum explícito**: é um UPDATE simples (`:195-201`), sem pré-condição e sem `If-Match` — quem grava por último vence | 200 = setlist + songs com content embutido; 400 id (`:163-166`); 404 (`PGRST116`, `:207-209`); 500 (`:291`) |
| W3 | `DELETE /api/setlists/[id]` | `[id]/route.ts:315-367`, wrapper `:370-381` | **A** (`:320`) | sim — `firebase-server-utils.ts:153-155` (`startsWith('Bearer ')`, diferencia maiúsculas) | **não** | **nenhum** de corpo; o id passa por `commonSchemas.objectId` (`:332-335`) | `setlist-mutate` via `enforceUserLimit` (`:325`) | — (a linha é apagada) | **nenhum**. Apaga `setlist_songs` **sem filtro de dono** (`:340-343`) e depois `setlists` com `user_id` (`:351-355`); FK `ON DELETE CASCADE` (`schema.dump.sql:468`) → **div. 150** | **200 `{success:true}` mesmo quando nada foi apagado** (**div. 151**); 400 id; 401; 429; 500 (`:365`) |
| W4 | `POST /api/setlists/[id]/songs` | `songs/route.ts:13-86`, wrapper `:89-101` | **B** | sim | **sim** | `setlistSchemas.addSong` (`api-schemas.ts:371-380`); `position` é aceita e ignorada (`route.ts:65`) | `setlist-mutate` (`:14`) | atualizado **dentro da RPC**, na mesma transação (`schema.dump.sql:67`) | `FOR UPDATE` na linha-pai (`dump:49`) | 201 = a linha inserida (6 colunas); 404 `Setlist not found` (`:35-37`) / `Content not found` (`:50-54`); OB602 → 404 (`lib/rpc-errors.ts:40-42`); 500. **O id do path não passa por validação de uuid** → **div. 153** |
| W5 | `PUT /api/setlists/[id]/songs/order` | `order/route.ts:17-62`, wrapper `:65-75` | **B** | sim | **sim** | `setlistSchemas.reorder` (`api-schemas.ts:363-369`): 1..**100** uuids, sem repetição | `setlist-mutate` (`:18`) | na RPC (`dump:337`) | `FOR UPDATE` (`dump:287`) | 200 `{songs:[{id,position}]}`; 400 `field:"order"` (OB601, `rpc-errors.ts:24-31`); 404; 500. Id do path sem validação → div. 153 |
| W6 | `DELETE /api/setlists/songs/[songId]` | `[songId]/route.ts:22-92`, wrapper `:95-106` | **A** (`:27`) | sim — `firebase-server-utils.ts:153-155` | **não** | **nenhum**; `songId` vai cru para `.eq("id", songId)` (`:52`) → div. 153 | `setlist-mutate` (`:32`) | na RPC (`dump:265`) | `FOR UPDATE` (`dump:225`) | 200 `{success:true}`; 404 `Song not found` (`:59-61`, `:70-72`, OB602/OB603); 500 |

`[medido: A1]` — handlers, `grep` das cadeias/famílias/escritas, trechos do
middleware, das duas cadeias, do `rpc-errors`, do `api-errors`, do dump
(funções, `for update`, `update setlists … updated_at`, FKs) e
`grep -in trigger supabase/schema.dump.sql` → `[exit 1]` (nenhum trigger).

### 1.2 O que a tabela diz ao nativo

1. **Bearer sem cookie funciona nas seis rotas.** Nas duas cadeias, o header
   `Authorization` tem precedência; o cookie só é lido quando o header falta.
   O `authFetch` do core manda `Bearer <token>` literal (`core/auth-fetch.ts:44`),
   que as duas cadeias aceitam.
2. **Há duas políticas de email verificado na mesma tela.** Criar, renomear/datar,
   adicionar e reordenar exigem email verificado; apagar a setlist e remover
   música, não. O C-PRECHECK já tinha previsto isso (`docs/ux/C-PRECHECK.md:888`,
   "vira bloqueador da tela 2 … só se o Marcel quiser uma política única").
   **O que o C não viu é o efeito no nativo** → **div. 152**.
3. **O `updated_at` da setlist muda em toda escrita**: no handler (W1, W2) ou
   na RPC (W4, W5, W6). Só W1 e W2 **devolvem** o valor novo no corpo; W4
   devolve a linha de `setlist_songs`, W5 devolve `{id, position}` e W6
   devolve `{success}`. → §6.
4. **O limite é por uid e compartilhado**: as seis rotas somam na mesma janela
   `setlist-mutate` (120 por 15 min), e o 400 também conta, porque o limite é
   verificado antes do corpo. O próprio comentário do código dimensiona o
   limite como "montagem de setlist de 56 canções cabe 2×" (`lib/user-rate-limit.ts:51-52`).

---

## 2. O contrato — `docs/api/SETLISTS.md` (A2)

Seções, verbatim no anexo `[medido: A2]`: invariante 1..N (`:10-29`), addSong
(`:70-85`), reorder em lote (`:87-107`), remove (`:109-117`), move-one removida
(`:119-123`), nota de concorrência (`:125-130`). O `create` com `songs[]` só
aparece no parágrafo do mecanismo (`:21-24`: "seguro por construção").

### 2.1 Garantias de que o nativo vai depender

| # | Garantia | Onde |
|---|---|---|
| G1 | posições **exatamente 1..N**, contíguas, 1-based, em toda setlist | `:12-13`, `:27` |
| G2 | addSong sempre adiciona no fim (`max+1` calculado sob o lock); a `position` enviada é ignorada; o 201 traz a `position` real | `:74-83` |
| G3 | repetir uma música (bis) é permitido: cada add cria uma linha nova | `:84-85` |
| G4 | o reorder é uma **permutação exata**; ela é conferida e renumerada dentro da transação | `:93-96` |
| G5 | a resposta do reorder **é a leitura**: `{songs:[{id,position}]}`, e o nativo reconcilia sem outro GET | `:103-105` |
| G6 | a falha do reorder por falta, sobra, id alheio ou corrida tem **um único corpo**, sem oráculo | `:97-102` |
| G7 | remove + renumeração + atualização do `updated_at` numa única transação; dois deletes concorrentes → um deles recebe 404 | `:114-116` |
| G8 | add×reorder, add×remove e reorder×remove esperam uns pelos outros no lock da linha-pai; add×add gera N+1, N+2 | `:127-129` |
| G9 | toda resposta não-2xx usa o envelope do `CONTRATO-DE-ERRO.md` | `:6-8` |

### 2.2 O que o contrato **não** dá

| # | Lacuna | Consequência para o N2 |
|---|---|---|
| L1 | **`POST /api/setlists` sem seção** (shape do 201, `songs[]`, o DELETE que desfaz a criação, erros) | o nativo depende do código (`route.ts:91-216`), não de contrato → div. 145 |
| L2 | **`PUT /api/setlists/[id]` sem seção** (semântica por campo: `undefined` = não mexe, `null` = limpa, `api-schemas.ts:321`; `{}` válido) | idem |
| L3 | **`DELETE /api/setlists/[id]` sem seção** (200 para inexistente; ordem dos dois DELETEs) | idem; e os defeitos das div. 150/151 não aparecem em lugar nenhum do contrato |
| L4 | **conflito entre dois writers de metadados**: nenhum `If-Match`/ETag/`updated_at` como pré-condição; `grep -n "If-Match\|ETag\|TTL\|last-write\|idempot" docs/api/SETLISTS.md` → só as linhas 45/50 (listagem) `[medido: A2]` | renomear no web e no tablet ao mesmo tempo: **vence quem grava por último**, sem aviso |
| L5 | **TTL do lock**: não se aplica. O lock é `FOR UPDATE` e dura só a transação da RPC (`dump:49,225,287`); não existe lock que atravesse requests | nada a desenhar; o contrato só não diz |
| L6 | **idempotência**: nenhuma escrita é idempotente. Um `POST` repetido cria duas setlists; um addSong repetido cria **um bis** (G3) | o retry de escrita é decisão do N2 → §7.1, H-N2-4 |
| L7 | **o teto do reorder** (100) não é contrato da setlist: o addSong não tem teto | setlist com mais de 100 músicas não pode ser reordenada → div. 155 |
| L8 | nenhuma rota de escrita da setlist aparece no `CONTRATO-DE-ERRO.md` (`grep -n setlists` → `[exit 1]`) — o contrato de erro é por classe, não por rota | só informativo |

---

## 3. A data (A3)

`[medido: A3]`

- **Banco**: `"performance_date" "date",` sem `NOT NULL` (`supabase/schema.dump.sql:385`).
  Não há `supabase/*.sql` além do `schema.dump.sql` e do `storage.dump.sql`
  (e das migrações em `supabase/migrations/`).
- **Zod** (compartilhado por `create` e `update`, `api-schemas.ts:318-327`):
  `z.string().regex(/^\d{4}-\d{2}-\d{2}$/, …).nullish()`. Formato só-data
  (decisão B5); timestamp → 400; `null` limpa; ausente não mexe.
- **Handlers**: `performance_date: validatedData.performance_date ?? null`
  (`route.ts:129`); `if (validatedData.performance_date !== undefined) updateData.performance_date = … ?? null`
  (`[id]/route.ts:187-189`).
- **A regex só confere o formato, não o calendário**: `2026-02-31` passa pelo
  Zod e chega ao Postgres → **div. 154** `[hipótese]` de que isso vira 500.
- **`event_date`**: `grep -rn 'event_date' --include='*.ts' --include='*.tsx'` →
  uma única ocorrência, **num comentário** (`types/setlist.ts:36`); o arquivo
  tem 37 linhas e a interface foi removida na B7-PR2 (decisão B7-D4). Ainda
  assim o `PRD-TELA-1.md:314` o lista como dead code em `types/setlist.ts:40` → div. 149.
- **Consumidores no nativo**: `core/types.ts:62`, `core/offline.ts:99-102`
  (prefetch de 7 dias), `SetlistsScreen.tsx:190,214`, `IndexScreen.tsx:212-213`,
  `prefetch.ts:150`. O nativo **exibe a string crua** (`YYYY-MM-DD`,
  `SetlistsScreen.tsx:214`) — formatação é insumo do brief.

---

## 4. Paridade com o web (A4)

`grep -rn '/api/setlists' app components hooks lib contexts` (fora de
`app/api` e testes) → 7 fetches, todos em `lib/setlist-service.ts`; o único
consumidor das escritas é `components/setlist-manager.tsx` `[medido: A4]`.
**`domains/` não existe** → div. 148.

| Operação | Serviço (`lib/setlist-service.ts`) | Chamador (`components/setlist-manager.tsx`) | Método | Campos enviados |
|---|---|---|---|---|
| criar | `createSetlist` `:139-152` | `:103-109` | `POST /api/setlists` | `name`, `description`, `performance_date`, `venue`, `notes` — todos com `\|\| null` (string vazia vira `null`). **Nunca envia `songs[]`** |
| editar (nome, data, …) | `updateSetlist` `:187-194` | `:80-86` | `PUT /api/setlists/${id}` | os mesmos cinco campos, **sempre todos** (`\|\| null`): editar só o nome também regrava os outros quatro |
| apagar | `deleteSetlist` `:227-230` | `:140` | `DELETE /api/setlists/${id}` | nenhum corpo |
| adicionar | `addSongToSetlist` `:265-276` | `:170-184` | `POST /api/setlists/${id}/songs` | `content_id`, `position` (calculada no cliente e ignorada pelo servidor), `notes: ""`. **Um POST por música, em sequência** |
| remover | `removeSongFromSetlist` `:313-318` | `:207-210` | `DELETE /api/setlists/songs/${songId}` | nenhum corpo |
| reordenar | — | `:277-280` `// TODO: Implement song reordering` | — | **o web não reordena** (confirma `SETLISTS.md:106-107`) |

**O que "igualar, não superar" quer dizer aqui.** O web cobre criar, editar,
apagar, adicionar e remover. **Reordenar é superação por decisão já tomada**:
a rota em lote nasceu para o nativo (B6-D1, `SETLISTS.md:106`). O web tem dois
defeitos que o nativo **não** deve copiar → div. 156:

- remove procurando `s.content.id === songId` (`setlist-manager.tsx:207`) e
  filtra **todas** as ocorrências no estado local (`:214`), enquanto o
  servidor removeu uma só — com bis, a tela e o banco divergem até recarregar;
- depois de adicionar, o item local recebe o id falso `${setlist.id}-${songId}`
  (`:179`); remover esse item sem recarregar manda um id que não é uuid para
  a W6 (div. 153).

---

## 5. CI e proteção de branch (A5)

`[medido: A5]`

| Workflow | Arquivo | Job (nome do check) | `on:` | Filtro de paths |
|---|---|---|---|---|
| `CI` | `.github/workflows/ci.yml` | `gates-nativos` (`:36`) | `push` em `main` (`:27-29`); `pull_request: null` (`:30`) | **nenhum** (o comentário `:33-35` diz que é de propósito) |
| `CI` | idem | `build` (`:60`) | idem | **nenhum** |
| `native` | `.github/workflows/native.yml` | `android-debug-apk` (`:27`) | `pull_request` (`:11`) e `push` em `main` (`:16-18`) | **sim**: `apps/native/**`, `.github/workflows/native.yml`, `pnpm-workspace.yaml` (`:12-15`, `:19-22`) |

`grep -rn 'paths' .github/workflows/` → só `native.yml:12` e `:19`.

**Ruleset da `main`** (`gh api repos/marcelviana/octavia/rules/branches/main`):
`deletion`, `non_fast_forward`, `required_status_checks` =
`[{"context":"gates-nativos"},{"context":"build"}]` com
`"strict_required_status_checks_policy":true`, e `pull_request` com
`"allowed_merge_methods":["merge"]`, `"required_approving_review_count":0`.
Nenhum ator pode ignorar as regras (`"bypass_actors":[]`). Não há branch protection clássica
(`…/branches/main/protection` → `Branch not protected (HTTP 404)`, `[exit 1]`).
O ruleset foi criado em `2026-09-16T10:14:00-03:00`, o que fecha o item 2 da
dívida do W3 (`W3-ENCERRAMENTO.md:399`).

**Resposta de A5.** **Sim.** Uma PR que toca só `docs/**` faz `build` e
`gates-nativos` reportarem: os dois estão no `ci.yml`, que dispara em todo
`pull_request` (`ci.yml:30`) sem filtro de paths. Só o `android-debug-apk`
(`native.yml:12-15`) fica de fora, e ele não é obrigatório. **Nenhum achado
bloqueante.** A prova empírica é o `gh pr checks` desta PR, no relatório.

Dois efeitos do `strict: true` para o rito:
- a PR precisa estar **atualizada com a `main`** para o merge. Se a `main`
  andar, o Marcel tem de atualizar o ramo, e os dois checks rodam de novo;
- na PR docs-only, o `gates-nativos` roda o G1 contra um diff vazio. Com a
  lista de exceções velha, ele **imprime o aviso da div. 141** e passa (§10).

---

## 6. Divs. 121 e 119 (A6)

`[medido: A6]`

**Div. 119 (A)**, `W1-PRECHECK.md:865`, verbatim:

> **O `emVoo` deduplica por URL e ignora as opções** (`files.ts:151-167`): quem pede um arquivo já em voo recebe a promise alheia, com o `guaranteed` do outro. Efeitos: (a) o palco herda a promise do prefetch e, se ela não assenta, fica em `buscando` sem alcançar o `catch` do `download-error`; (b) um pedido `guaranteed:true` que pega carona num voo `false` grava no purgável — o `promoteList` conserta na passada seguinte, não nessa

Fica fora do N2 (N2-D3).

**Div. 121 (D)**, `W1-PRECHECK.md:868`, verbatim:

> **O T1-R17 (i) exige `updated_at` igual ao do último sync e o `offlineStatus` nunca olha `updated_at`** (`core/offline.ts:52-65`). Gap PRD × código no outro eixo da garantia. **Fora desta PR** — [decidido], §8, Q5; proposta para o N2

T1-R17 (i), `PRD-TELA-1.md:179`: *"todas as suas `song.content_id` existem no
cache de `content` com `updated_at` igual ao do último sync"*. O
`offlineStatus` (`core/offline.ts:52-65`) só confere se o content existe e se
o arquivo está no aparelho.

### 6.1 O que a 121 implica para a escrita de setlist

1. **A 121 é sobre o `updated_at` do content, e o N2 não escreve content**
   (N2-D1). Nenhuma escrita do N2 muda `content.updated_at`. O único writer de
   setlist que mexe em content é o delete de content (`dump:199`), que não é do N2.
2. **A colisão real é do lado da setlist, e o nativo nem olha para ela.**
   Toda escrita do N2 muda `setlists.updated_at` no servidor (§1.2, item 3).
   Mas o nativo **não usa** `setlists.updated_at` para nada: fora de
   comentários, as ocorrências de `updated_at` em `apps/native/src` e
   `packages/core/src` são as duas declarações de tipo (`core/types.ts:36,64`)
   e o `diffByUpdatedAt` de content (`core/sync.ts:87-104`) `[medido: A6]`.
3. **O `diffByUpdatedAt` não é chamado por nenhum código de produção.** O
   `grep` fora dos testes só acha a definição (`core/sync.ts:87`). O
   `invalidated=0` do log é **literal** (`store.ts:123-124`), e o aceite A7
   que o lê no aparelho (`V1-ENCERRAMENTO.md:122`) está lendo uma constante →
   **div. 157**. Na prática, o T1-R10 em vigor no app é "substituir sempre".
4. **Onde colide com T1-R9/T1-R10.** Depois de uma escrita, o cache local fica
   defasado até o próximo `GET /api/setlists`. As saídas possíveis:
   - (a) **fazer um sync inteiro depois de cada escrita**. É o T1-R9 puro, mas
     `sincronizar` sempre busca também as páginas de content
     (`apps/native/src/sync.ts:59-60`): 1 + ⌈N/100⌉ requests por escrita, e
     roda de novo `prefetchEArrumar` (`App.tsx:159`);
   - (b) **aplicar localmente a resposta da escrita**. Isso é um **merge**, que
     o T1-R9 proíbe ("Nada é mesclado", `PRD-TELA-1.md:130`); e W4, W5 e W6
     não devolvem o `updated_at` novo, então o cache ficaria com um
     `updated_at` que não existe no servidor;
   - (c) **um `GET /api/setlists` só de setlists depois da escrita**, trocando
     apenas o conjunto de setlist+song. O T1-R9 já prevê isso: o conjunto de
     setlists é substituído por um 200 de `GET /api/setlists`, independente
     do de content.

   A escolha é decisão de desenho do N2 (H-N2-5). A 121 entra no N2 (N2-D3)
   como **fechar o (i) do T1-R17**. Para isso é preciso guardar o `updated_at`
   de content "do último sync" e compará-lo, o que hoje não existe (item 3).

---

## 7. O que o core e o cache já dão (A7)

`[medido: A7]`

### 7.1 `authFetch`

- **Aceita método e corpo.** `AuthRequestInit = { method?, headers?, body?, cache? }`
  (`core/auth-fetch.ts:13-18`); `doFetch` repassa `...init` e acrescenta
  `Authorization` e `cache: 'no-store'` (`:41-46`).
- **Único uso até hoje**: `get()` em `apps/native/src/api.ts:101-124`, chamado por
  `getSetlists` (`:127-129`) e `getContentPage` (`:145-147`). O `grep` por
  `method|POST|PUT|DELETE` em `apps/native/src` e `packages/core/src` (fora de
  testes) só encontra `core/auth-fetch.ts:14` e um comentário do `StageScreen`.
- **A política de nova tentativa (T1-R3) só age em 401.** A linha que decide é
  `if (response.status !== 401) return { response, requests: 1 }` (`:55`).
  Em 401, o token é renovado **uma** vez e a request é refeita **uma** vez
  (`:57-64`). **Isso não duplica escrita:** nas seis rotas, o 401 sai antes de
  qualquer comando no banco (a autenticação é o primeiro passo — middleware
  `:100-112`; `[id]/route.ts:320-323`; `[songId]/route.ts:27-31`).
  O `authFetch` **não** tenta de novo em 5xx, 429 nem erro de rede.
- **O risco de escrita dupla fica fora do `authFetch`.** Se a rede cair
  depois de o servidor gravar e antes de a resposta chegar, o nativo recebe
  `networkError` (`api.ts:120-123`). Repetir, por decisão do usuário ou do
  código, cria **outra setlist** (W1) ou **outro bis** (W4). Nenhuma rota é
  idempotente (L6). Para W2, W5 e W6, repetir é inofensivo: W2 e W5
  reaplicam o mesmo estado, e W6 devolve 404 na segunda vez.
- **401 por email não verificado derruba a sessão.** A cadeia B devolve
  `null` → 401 quando `!emailVerified` (`secure-auth-utils.ts:307-310`). O
  `authFetch` trata esse 401 como token inválido: renova, repete e chama
  `onAuthFailure` (`:63`), e no app isso é `signOutSession()`
  (`api.ts:83-86` → `session.ts:77-78`, `signOut(auth)`). Em nenhum ponto o
  nativo olha `emailVerified` (`grep` → `[exit 1]`) → **div. 152**.
- `errorFrom` (`core/errors.ts`) devolve `{kind, code, retryAfter, messageKey}`
  e **descarta `details`**. Um 400 de formulário (nome vazio, nome > 255) chega
  à tela sem o campo que falhou. É insumo do desenho: o nativo valida antes
  de enviar.

### 7.2 O cache de setlists

- **Onde**: `Paths.document/octavia-<uid>/setlists.json` (`store.ts:39-41`,
  `:121`), gravação atômica `.tmp` + `moveSync` (`:52-60`).
- **Formato**: `{ setlists: SetlistDTO[]; syncedAtMs: number | null }`
  (`store.ts:73-76`), com o `content` embutido zerado antes de gravar
  (`semEmbutido`, `:85-90`). `SetlistDTO` = `{id, name, performance_date,
  venue, updated_at, setlist_songs[]}` (`core/types.ts:58-67`); a song é
  `{id, setlist_id, content_id, position, notes, content}` (`:45-55`).
- **A função do T1-R9**: `planSync` (`core/sync.ts:61-80`) decide entre
  `apply` e `keep-previous`; quem troca o arquivo é `save` (`store.ts:114-125`),
  chamado só por `sincronizar` (`apps/native/src/sync.ts:98`).
  **É aqui que uma escrita teria de invalidar o cache.** Hoje o único caminho
  que troca o cache é um sync completo (`App.tsx:133-173`, `rodarSync`).
- **Mostra o cache primeiro e revalida depois**: a tela desenha o cache e
  `rodarSync` roda depois (`sync.ts:6-8`; `App.tsx:132`). Em falha, o cache
  anterior fica intacto (`App.tsx:162-172`). P7 é verdadeira.
- **Os dois arquivos são gravados juntos** (`store.ts:121-122`). Uma escrita
  que só quisesse atualizar setlists (§6.1-c) precisaria de um `save` só de
  setlists, ou de regravar o content anterior sem mudança.

---

## 8. S1 e S2 como estão (A8)

`[medido: A8]` — insumo do brief de design (N2-D4).

### 8.1 Arquivos e pilha

| Tela | Arquivo | Linhas | Props |
|---|---|---|---|
| S1 (setlists) | `apps/native/src/screens/SetlistsScreen.tsx` | 529 | `SetlistsScreenProps` `:39-56` — `setlists`, `contentById`, `filesPresent`, `baixando`, `temCache`, `sync`, `online`, `onTentarNovamente`, `onAbrirSetlist`, `onBaixarSetlist`, `onBuscar` |
| S2 (índice) | `apps/native/src/screens/IndexScreen.tsx` | 339 | `IndexScreenProps` `:45-56` — `setlist`, `contentById`, `syncDone`, `posicaoAtual`, `onVoltar`, `onAbrirPosicao`, `onBuscar` |

Nenhuma das duas tem prop de escrita. As duas passam do teto de 150 linhas do
`CLAUDE.md`, que as PRs do nativo não vêm aplicando; não é tratado aqui.

**Pilha (native-stack)**, `navigation.tsx`: `RootStackParamList` (`:22-35`) =
`Login`, `Setlists`, `Index {setlistId, posicaoAtual?}`, `Stage {setlistId,
position, avulsa?}`, `Search {setlistId?, posicao?}`, `End {setlistId}`;
`headerShown: false` (`:83`); telas em `:87`, `:97`, `:124`, `:164`, `:190`,
`:226`. `Index` procura a setlist no cache e, se não achar, mostra
`<Placeholder titulo="SETLIST" nota="não está no cache" />` (`:99-102`).

### 8.2 Estados de S1: código × `DESIGN-V1` §7

| ID (`DESIGN-V1/README.md:336-341`) | Condição no código (`SetlistsScreen.tsx`) | testID |
|---|---|---|
| `S1a` sincronizando sem cache | `semCache && sync.fase === 'sincronizando'` (`:270`, `:317-322`) | `s1a` (`:319`) |
| `S1b` normal, online | lista (`:364-380`) com chip online | `setlist-<8>` por cartão (`:206`) |
| `S1c` offline com cache | a mesma lista; muda o chip (`:365`) | idem |
| `S1d` offline/falha sem cache | `offlineSemCache \|\| falhaSemCache` (`:271-272`, `:323-344`) | `s1d` (`:327`), `tentar` (`:340`) |
| `S1e` falha com cache | `sync.fase === 'falha' && temCache` (`:274`, banner `:296-315`) | `tentar-banner` (`:309`) |
| `S1f` vazia após sync | `temCache && setlists.length === 0` (`:273`, `:345-363`) | `s1f` (`:350`) |

Seis estados, seis condições: P4 é verdadeira. Outros testIDs: `baixar-<8>`
(`:227`) e `buscar` (`:288`). **S2**: `voltar` (`IndexScreen.tsx:201`),
`buscar` (`:220`), `song-${song.position}` (`:134`).

**G2 na árvore limpa**: `sh apps/native/scripts/g2g3.sh 9e14042 WORKTREE` →
`G2 — testIDs  antes=43  depois=43` / `G2: antes ⊆ depois ✓` / `G3 — linhas log( antes=57  depois=57` `[exit 0]`.
Essa é a baseline que a primeira PR de código do N2 vai ler.

### 8.3 Pontos que o brief precisa enfrentar

1. **O texto do S1f vira mentira**: *"Sua conta não tem setlists. Crie na
   versão web — elas aparecem aqui na próxima sincronização."*
   (`SetlistsScreen.tsx:359-361`). Com o N2, o nativo cria setlists.
2. **O testID do S2 é a posição** (`song-${song.position}`, `:134`). O G2
   compara texto, então o reorder não o quebra. Mas o número que o testID
   carrega muda a cada reorder, e o `Stage` também é endereçado por
   `position` (`navigation.tsx:31`). Reordenar com o palco aberto muda a
   música que aquela posição aponta → H-N2-7.
3. **A data aparece crua** (`SetlistsScreen.tsx:214`, `'sem data'` quando
   `null`; `IndexScreen.tsx:213`). O §8.3 do `DESIGN-V1` (ordenar por data,
   `README.md:390-398`) se decide no brief (N2-D4). O próprio §8.3 registra
   que, com os dados de hoje, a ordenação quase não aparece.
4. **Ordem da lista**: a API ordena por `created_at desc` (`route.ts:38`). Uma
   setlist criada pelo nativo aparece **no topo** depois do sync.
5. **Estado de falha da escrita** (N2-D2): não existe hoje. Os estados de S1
   são todos de sync.

---

## 9. A10 e H17 (A9)

`[medido: A9]`

**A10** (`PRD-TELA-1.md:286`), verbatim:

> | A10 | Setlist com `performance_date` amanhã → arquivos baixados em background sem abrir; indicador ✓/◔/✗ correto e recalculado | T1-R15, T1-R17 |

**H17** (`N1-ENCERRAMENTO.md:164-179`), o essencial verbatim:

> **A primeira metade é verdadeira** — 1 das 2 setlists tem data. **A conclusão anexa é falsa**: a data está **422 dias no passado** e **nenhuma das duas setlists tem um único `file_url`**. O único arquivo da conta (`Easy_-_Guitar.pdf`, content `b23a3803`) **não está em setlist alguma** […]

> **Caminho para fechá-la**: datar uma setlist da principal dentro da janela de 7 dias e pôr um arquivo nela — **escrita do Marcel, quando houver show de verdade**. Decisão registrada (2026-09-11): *"não vou datar setlist para satisfazer aceite"*.

**Em uma frase**: para o A10 rodar com dado real, uma setlist criada pelo
nativo precisaria de `performance_date` entre hoje e hoje+7
(`core/offline.ts:96-101`) **e** de pelo menos uma música cujo content tenha
`file_url` não nulo e corpo válido do tipo `file`
(`core/offline.ts:33-38`) — na conta principal, isso só é possível com o
`Easy_-_Guitar.pdf`.

**Aviso**: o N2 **torna isso possível**, mas não autoriza a fazê-lo. A decisão
de 2026-09-11 continua valendo. Criar setlist na principal para fechar o A10
é decisão do Marcel (H-N2-8).

---

## 10. O aviso do `g1` (A10)

`[medido: A10]`. Não há `pnpm gate:g1`: os scripts `gate:*` são só `gate:a20`
e `gate:icones` (`apps/native/package.json:42-45`); o equivalente é
`sh apps/native/scripts/g1.sh <base> WORKTREE`, que o CI roda (`ci.yml:56`)
→ div. 147. `git status --porcelain -- apps packages scripts` → vazio.

`sh apps/native/scripts/g1.sh 9e14042 WORKTREE`, verbatim:

```
base=9e14042 head=WORKTREE
G1a — diff vazio em 33 arquivos DERIVADOS de apps/native + packages/core/src
      escopo derivado (W2, div. 134): união BASE∪HEAD, menos apps/native/{test,scripts}/,
      menos os *.test.ts (que ficam sob o G1b), menos as exceções abaixo
      EXCEÇÕES DECLARADAS (o escopo desta PR):
        apps/native/src/files.ts
        apps/native/src/prefetch.ts
  G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)
  G1a: EXCEÇÃO DECLARADA E NÃO USADA — poda isto ANTES do merge (div. 141):
        apps/native/src/files.ts
        apps/native/src/prefetch.ts
G1b — linhas REMOVIDAS ou ALTERADAS nos testes do core: 0
  G1b: só adição ✓
[exit 0]
```

(A mesma saída com `origin/main` como base.) **Não podado.** Fica para a
**primeira PR de código do N2**: esvaziar a lista de exceções no commit 1 e
declarar nela os arquivos que a PR vai tocar. Consequência até lá: o G1a
**não cobre** `files.ts` nem `prefetch.ts`, e o CI desta PR vai imprimir o
mesmo aviso.

---

## 11. Fase B — executada (2026-09-16, 17:57:56Z–17:58:02Z)

Aprovação: **N2-D10** (B-c, B-a, B-b, B-d; B-e adiado; B-f vetado). Uma
execução de cada, nesta ordem, **sem nenhuma repetição**. Transcrição completa
(comandos com o token redigido como `$TOKEN`, status, bytes, sha e os `cmp`) em
`N2-PRECHECK-anexos/B-execucao.txt`; respostas brutas (`curl -sS -i`) em
`B-a-1.txt`, `B-b-1.txt`, `B-b-2.txt` e `B-d-1.txt`; B-c em `B-c-1.txt`
(veja o desvio declarado 1).

**Token**: `set -a; source .env.uxaudit; source .env.local; set +a; bash $SP/fase-b.sh`.
O script chama `node $SP/token.mjs`, que faz **só** o `signInWithPassword` do
Firebase REST, a mesma chamada de `scripts/ux-audit/auth.ts:67-75`, **sem** o
`POST /api/auth/session` que aquele módulo faz em seguida (`auth.ts:109-139`).
Esse POST seria uma request a prod fora do orçamento e traria cookie, que os
probes não podem ter → div. 159. Saída:
`signInWithPassword status=200` ·
`uid=Pw3bxXZw0iT3WwyL7kxGtGJIJH83 claim.email_verified=true claim.sign_in_provider=password`
(o claim é lido do payload do JWT, localmente e sem request).

### 11.0 Resultado

| Probe | Request | Status | Bytes (bruto · corpo) | sha256 do corpo | Garantia de zero escrita | Veredito |
|---|---|---|---|---|---|---|
| **B-c** | `GET /api/setlists`, bearer, sem cookie | **200** | 50.363 · **49.983** | `08ebfe43…e8cb01` | GET: um `select` e `NextResponse.json` (`route.ts:12-86`) | **conforme**. 3 setlists (`4340bf95…` 60 songs · `00c2c1f4…` 8 · `8c4413d9…` 1), as três com `performance_date: null` e `venue: null`, posições contíguas; `cache-control: private, no-store` |
| **B-a** | `POST /api/setlists`, bearer, sem cookie, `{}` | **400** | 505 · 127 | `24ef235a…07af8c` | a validação do corpo devolve em `api-validation-middleware.ts:163`, **antes** do handler (`:167`); o INSERT fica em `route.ts:137-141` | **conforme**: `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"name","message":"Required","code":"invalid_type"}]}`. O bearer sozinho passa pela cadeia B, e **a conta de audit tem email verificado** (senão seria 401, `secure-auth-utils.ts:307-310`) |
| **B-b1** | `POST /api/setlists`, **sem token**, `{}` | **401** | 462 · 58 | `3c1c84e3…014111` | sem credencial → `null` (`secure-auth-utils.ts:284-287`) → `authRequired()` (`middleware:111`), sem ler o corpo; handler não chamado | **conforme**; `www-authenticate: Bearer` |
| **B-b2** | `GET /api/setlists`, **sem token** | **401** | 470 · 58 | `3c1c84e3…014111` | `firebase-server-utils.ts:169-171` → `authRequired()` (`route.ts:16-18`) | **conforme**; corpo idêntico ao da B-b1 (`cmp` → `[exit 0]`) e ao do **C-PRECHECK B.2 P1** (sha `3c1c84e3…4111`, 58 B; `cmp` com o corpo literal → `[exit 0]`) |
| **B-d** | `DELETE /api/setlists/songs/nao-e-uuid`, bearer | **500** | 450 · 57 | `f349dba9…4b3fb9` | o primeiro acesso ao banco é o SELECT (`[songId]/route.ts:41-53`), que falha com o id malformado; a RPC de escrita (`:79`) não é alcançada | **conforme a div. 153** (hipótese confirmada nesta rota): `{"error":"Internal server error","code":"INTERNAL_ERROR"}`, contra o 400 `field:"id"` do contrato. `x-matched-path: /api/setlists/songs/[songId]` |

shas completos (do arquivo bruto e do corpo) em `B-execucao.txt`.

**Rate limit e `authfail` usados**: `setlist-read` 1 · `setlist-mutate` 2
(B-a, B-d) · 2 requests anônimas, que **não** contam no `authfail`. A
ausência de token sai em `secure-auth-utils.ts:284-287` e
`firebase-server-utils.ts:169-171`, **antes** do `recordAuthFailure`
(`:294` e `:176`); o `getAuthFailureLimit` do middleware só lê
(`lib/user-rate-limit.ts:176-188`). Escrita em prod: **zero**.

**Estado para a Fase C (B-c)**: o corpo tem **49.983 B**, o mesmo tamanho
medido no N1-PRECHECK A3 (2026-09-09), com os **mesmos três `updated_at`**
(`2026-08-29T19:43:10.287+00:00`, `2026-08-08T20:01:24.728+00:00`,
`2026-08-08T20:01:23.522+00:00`). Nenhuma setlist da conta de audit foi escrita
entre as duas medições. Primeiro `setlist_songs.id` de cada setlist:
`39dc91b1…`, `879f60d4…`, `ff37eb87…` (completos em `B-c-1.txt`). **A Fase C
compara com esta medição.**

### 11.1 O `cmp` da N2-D9

**A B-a devolveu 400, então o `cmp` da N2-D9 não se aplica à conta de audit**:
ela tem email verificado, e não há 401 "com token válido e email não
verificado" para comparar. (O `cmp B-a.body B-b1.body` foi registrado só
como fato: `differ: char 11, line 1`, porque é um 400 contra um 401.)
**Leitura do código, `[análise]`, não medição**: os dois 401 da cadeia B saem
do mesmo `return authRequired()` (`api-validation-middleware.ts:111`), sem
argumento. Por construção, o corpo deve ser idêntico byte a byte ao de token
ausente ou inválido, e isso poria a N2-D9 no ramo "Bloco D + frase genérica".
**A medição fica em aberto e depende de uma conta com email não verificado**
(H-N2-11, dono: Marcel).

### 11.2 Desvios declarados

1. **O corpo da B-c não foi commitado.** O `B-c-1.txt` traz os **headers
   literais** e um **resumo gerado do corpo** (ids, datas, venue, n de songs,
   contiguidade, `updated_at`, `created_at`, tamanho do nome). O corpo tem
   `content_data`/`file_url` da biblioteca de audit, e o precedente é o
   N1-PRECHECK A3, que também não gravou corpo de música. Tamanho e sha do
   corpo inteiro (49.983 B, `08ebfe43…`) permitem conferir uma cópia
   futura. Isso vai contra a letra do aval ("corpo salvo em anexo").
2. **O token não veio do `scripts/ux-audit/auth.ts` inteiro**: só do passo
   `signInWithPassword` dele. O motivo está acima (div. 159).

### 11.3 Desenho dos probes (escrito antes da execução — mantido como estava)

**Padrão proposto** (o do N1-PRECHECK A3, `N1-PRECHECK-anexos/A3-probe-n1.mts.txt`):
um script `tsx` no scratchpad, env carregado na linha de comando
(`set -a; source .env.uxaudit; source .env.local; set +a`),
`signInWithPassword` (Firebase REST) com a **conta de audit** → `idToken`.
Os comandos abaixo usam `$TOKEN` = esse idToken, **nunca impresso**. Base
`https://octavia.rocks` (prod). O script **não tenta de novo nada**, **para
em 429**, e registra status, headers relevantes e corpo, sem token, email ou
corpo de música.
**Ordem proposta: C → A → B** (leitura antes de qualquer outra coisa).

### B-c — estado inicial da conta de audit (leitura)

- **Objetivo**: fotografar o estado que a Fase C vai mudar: n de setlists, ids
  (8 caracteres), `performance_date`, n de songs, posições contíguas,
  `updated_at` de cada uma.
- **Comando**:
  ```bash
  curl -sS -D - -o "$OUT/B-c.json" -H "Authorization: Bearer $TOKEN" https://octavia.rocks/api/setlists
  ```
- **Esperado**: `200`, `cache-control: private, no-store`, array na raiz. Pelo
  N1-PRECHECK A3: 3 setlists (60/8/1 songs, `performance_date: null`).
  **A Fase C compara com ESTA medição, não com a do N1.**
- **Prova de que não escreve**: GET, sem nenhum comando de escrita
  (`route.ts:12-86`: um `select` e `NextResponse.json`).
- **Custo**: 1 login + 1 request `setlist-read` (1 de 300/min).

### B-a — bearer sem cookie, corpo inválido, rota de escrita → 400

- **Objetivo**: provar que (1) o bearer sozinho passa pela cadeia B numa rota
  de escrita; (2) o 400 sai no envelope do `CONTRATO-DE-ERRO.md`; (3)
  **de quebra, se a conta de audit tem email verificado.** Se não tiver, a
  resposta é **401**, não 400 (`secure-auth-utils.ts:307-310`), e isso muda a
  Fase C (div. 152).
- **Comando** (sem `Cookie`, corpo `{}` sem o `name` obrigatório):
  ```bash
  curl -sS -D - -X POST https://octavia.rocks/api/setlists \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    --data '{}'
  ```
- **Esperado**: `400` e
  `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"name","message":"…","code":"invalid_type"}]}`
  (a `message` exata vem do Zod: é a saída a medir, não a prever).
- **Prova de que não escreve**: o middleware valida o corpo
  (`api-validation-middleware.ts:151`) e devolve `validationError` (`:163`)
  **antes** de chamar o handler (`:167`). O único INSERT de W1 fica dentro do
  handler (`route.ts:137-141`). Se a resposta for 401, a saída foi ainda
  mais cedo (`:102-111`).
- **Custo**: 1 request na janela `setlist-mutate` da conta de audit (1 de
  120/15 min; conta mesmo com 400, `:114-125`). Não mexe no `authfail`
  (token válido).
- **Leitura após**: nenhuma necessária; se o Marcel quiser a prova
  empírica, repetir o B-c e comparar os ids e os `updated_at` (+1 request).

### B-b — mesma rota, sem token → 401 idêntico byte a byte ao da tela 1

- **Objetivo**: o 401 da cadeia B numa escrita tem de ser idêntico byte a
  byte ao 401 da cadeia A na leitura que a tela 1 já trata.
- **Comandos** (os dois sem `Authorization` e sem `Cookie`):
  ```bash
  curl -sS -D - -o "$OUT/B-b-post.body" -X POST https://octavia.rocks/api/setlists -H "Content-Type: application/json" --data '{}'
  curl -sS -D - -o "$OUT/B-b-get.body" https://octavia.rocks/api/setlists
  cmp "$OUT/B-b-post.body" "$OUT/B-b-get.body"; echo "cmp exit=$?"
  ```
- **Esperado**: os dois `401`, `www-authenticate: Bearer`, corpo
  `{"error":"Authentication required","code":"AUTH_REQUIRED"}`, `cmp exit=0`.
- **Prova de que não escreve**: sem credencial, as duas cadeias devolvem
  `null` antes de tudo (`secure-auth-utils.ts:284-287`;
  `firebase-server-utils.ts:169-171`). O middleware responde `authRequired()`
  (`:111`) sem ler o corpo, e o handler nunca é chamado.
- **Custo**: 2 requests anônimas. **Não entram** no `authfail`, porque
  ausência de token não chama `recordAuthFailure` (só credencial inválida:
  `secure-auth-utils.ts:292-294`, `firebase-server-utils.ts:175-177`), e
  também não entram em limite por uid. O `getAuthFailureLimit` só lê
  (`lib/user-rate-limit.ts:176-188`).

### Opcionais — o Marcel decide um a um

| # | Probe | Objetivo | Prova / risco | Custo |
|---|---|---|---|---|
| B-d | `DELETE https://octavia.rocks/api/setlists/songs/not-a-uuid` com bearer | medir a div. 153: **500 ou 400?** | o `select` com `.eq("id","not-a-uuid")` (`[songId]/route.ts:41-53`) falha no Postgres **antes** da RPC (`:79`); nenhuma escrita chega a ser executada | 1 `setlist-mutate` |
| B-e | `PUT https://octavia.rocks/api/setlists/<uuid da B-c>` com `{"performance_date":"2026-02-31"}` | medir a div. 154: **500 ou 400?** | **risco declarado**: o UPDATE **é executado**. Se o Postgres aceitar a data (não deveria, `date` rejeita 31/02), grava a data e o `updated_at`. Restaurar exigiria outro PUT, e o `updated_at` **não volta**. **Recomendação: adiar para a Fase C** | 1 `setlist-mutate` |
| B-f | `DELETE https://octavia.rocks/api/setlists/<uuid v4 gerado na hora>` com bearer | medir a div. 151: **200 `{success:true}` para inexistente** | **risco declarado**: executa dois `DELETE` de verdade (`[id]/route.ts:340-355`), cada um com filtro por um uuid recém-gerado → 0 linhas, salvo colisão de uuid v4. **Recomendação: vetar em prod**; a leitura do código basta | 1 `setlist-mutate` |

**Garantia de zero escrita da B-d, escrita ANTES da execução (aval, Parte 2)**:
`DELETE /api/setlists/songs/nao-e-uuid` → wrapper extrai `songId` do path
(`[songId]/route.ts:96-97`) → autenticação (`:27-31`) → rate limit (`:32-33`)
→ **o primeiro acesso ao banco é um SELECT** (`:41-53`,
`.from("setlist_songs").select(…).eq("id", songId).single()`). Um id que não é
uuid falha **nesse select** (o Postgres não converte `nao-e-uuid` para `uuid`,
22P02); o erro não é `PGRST116` (`:59`), então `throw songError` (`:63`) →
`catch` → `internalError()` (`:88-90`). A única escrita da rota é a RPC
`remove_setlist_song` (`:79`), **depois** do select e da checagem de dono
(`:70-72`); ela não é alcançada. A rota **não recebe id de setlist**, e é da
**cadeia A** (sem exigência de email verificado, `firebase-server-utils.ts:137-181`)
→ div. 160.

**A div. 150 (apagar músicas de setlist alheia) NÃO deve ser provada em
prod**: a prova exigiria uma setlist de outra conta. Se o Marcel quiser prova
empírica, o lugar é um teste de rota com o mock factory (a própria correção
nasce com esse teste) ou o preview com duas contas de audit.

**Custo total do mínimo (C+A+B)**: 1 login + 1 `setlist-read` + 1
`setlist-mutate` + 2 anônimas.

---

## 12. Hipóteses

| # | Hipótese | Dono | Como fecha |
|---|---|---|---|
| **H-N2-1** | a conta de **audit** tem `emailVerified: true` | — | **FECHADA, verdadeira** (Fase B): a B-a deu **400**, não 401, e o claim do token diz `email_verified=true` (`B-execucao.txt`). A Fase C pode usar a conta de audit |
| **H-N2-2** | a conta **principal** tem `emailVerified: true` | Marcel (console do Firebase) | aberta. Pela N2-D9, um `false` já não desloga o nativo; a escrita da cadeia B falharia com a frase genérica |
| **H-N2-3** | id de path malformado → 500 nas três rotas da div. 153 | executor | **removeSong: FECHADA, verdadeira** (B-d: 500 `INTERNAL_ERROR`). **addSong e reorder: abertas** (só leitura de código; nenhum probe aprovado). O nativo sempre manda ids reais |
| **H-N2-4** | a política de nova tentativa das escritas do N2 é "nenhuma automática; a falha aparece e o usuário decide" (N2-D2), e o risco de setlist ou bis duplicado sob rede instável é aceito | Marcel (desenho) | decisão no desenho do N2; a alternativa exige idempotência no servidor, o que contraria "backend sem alteração" |
| **H-N2-5** | depois de cada escrita, o nativo reconcilia com a opção (c) de §6.1: `GET /api/setlists` só de setlists | Marcel (desenho) | decisão no desenho; o custo está em §6.1 |
| **H-N2-6** | `performance_date` impossível (`2026-02-31`) → 500 | executor | B-e na Fase C, ou teste de rota |
| **H-N2-7** | reordenar com o palco aberto muda a música que o `Stage {position}` aponta | executor (desenho/aceite) | decisão do brief: o palco é endereçado por `setlist_songs.id` ou a edição bloqueia com o palco aberto |
| **H-N2-8** | o A10 com dado real **continua não reproduzido** no N2 (decisão de 2026-09-11) | Marcel | **decidido (N2-D11)**: o aceite do N2 mede o mecanismo (setlist com data → o prefetch dispara) com uma setlist de uso real ou por fixture, com o A10 "não reproduzido" |
| **H-N2-9** | o limite `setlist-mutate` (120/15 min) basta para montar uma setlist no nativo, com um POST por música como no web | executor | conta no desenho: 60 músicas + create + reorder = 62; duas montagens seguidas estouram |
| **H-N2-10** | o design (N2-D4) cabe sem mudar `SetlistDTO` além de campos que a API já devolve (`description`, `notes` existem na resposta e não estão no DTO) | Claude Design / executor | brief |
| **H-N2-11** | o 401 da cadeia B para **email não verificado** é idêntico byte a byte ao 401 de token ausente/inválido (sha `3c1c84e3…`) — `[análise]`: os dois saem de `authRequired()` sem argumento (`api-validation-middleware.ts:111`) | **Marcel** (precisa de uma conta com email não verificado; a de audit é verificada) | medição pendente; decide o ramo da N2-D9 (se idênticos: Bloco D + frase genérica) |

---

## 13. Divergências (144 a 160)

| # | Origem | Divergência | Estado |
|---|---|---|---|
| **144** | **P** | **A numeração começa em 144, não em 143.** O prompt diz "a 142 foi a última do W3", mas o W3 registra a **div. 143** (T, "a saída que o executor jogou fora", `W3-ENCERRAMENTO.md:230`; `W3-anexos/README.md:13`: "Divergências desta PR: 140 a 143") `[medido: A0]` | registrada; numeração ajustada |
| **145** | **P** | **P2 é só parcialmente verdadeira**: o `SETLISTS.md` não contrata `POST /api/setlists`, `PUT /api/setlists/[id]` nem `DELETE /api/setlists/[id]` (§2.2 L1–L3), nem fala de conflito entre dois writers (L4) ou de idempotência (L6) | registrada; completar o contrato é tarefa de doc do N2, se o Marcel quiser |
| **146** | **P** | **P6**: a div. 121 é do T1-R17 (indicador "garantido offline"), não do "prefetch por data" (T1-R15), e fala do `updated_at` de **content**, não do de setlist | registrada |
| **147** | **P** | **"herança 6 do W3" não existe**: o `W3-ENCERRAMENTO.md` não tem seção de herança (`grep -ni heran` → `[exit 1]`); o item 6 da dívida (§7) é o `parcial.delete()`; a poda do g1 é a div. 141 (§3). E **não há `pnpm gate:g1`**; o equivalente é `sh apps/native/scripts/g1.sh`. **Origem (aval, 2026-09-16)**: as duas referências vieram do **handoff do Marcel (memória de sessão)**, não do `W3-ENCERRAMENTO.md`. É exatamente o caso que a regra "estado de bloco é artefato de repositório" (`CLAUDE.md`) existe para pegar: o rastro citado como se estivesse na branch | registrada; o A10 foi feito com o script |
| **148** | **P** | O A4 pede busca em `domains/`, **que não existe** (`ls -d … domains …` → `No such file or directory`) | registrada |
| **149** | **D** | `PRD-TELA-1.md:314` ainda aponta `types/setlist.ts:40 event_date` como dead code; a interface saiu na B7-PR2 (o arquivo tem 37 linhas e só um comentário em `:35-37`) | registrada; errata do PRD na primeira PR do N2 que tocar o PRD |
| **150** | **A** | **`DELETE /api/setlists/[id]` apaga as músicas de QUALQUER setlist: EXPLORÁVEL.** `[id]/route.ts:340-343` roda `delete from setlist_songs where setlist_id = <id>` **sem filtro de dono**, **antes** do DELETE de `setlists` filtrado por `user_id` (`:351-355`). **O cliente é o de service role**: `const supabase = getSupabaseServiceClient()` (`[id]/route.ts:337`), criado com `process.env.SUPABASE_SERVICE_ROLE_KEY` (`lib/supabase-service.ts:7`, `:25-34`). A RLS de `setlist_songs` **está ligada** (`schema.dump.sql:547`), e a policy de dono (`"User owns setlist songs"`, `:526-531`, `auth.jwt() ->> 'uid'`) barraria o DELETE, **mas não se aplica a este cliente**: `"Service role access to setlist songs"` (`:485`, sem `FOR`, logo vale para todos os comandos, `USING (auth.role() = 'service_role')`) libera tudo para ele, e as policies permissivas se somam por OR. (O papel `service_role` do Supabase também ignora RLS por atributo da plataforma, `[hipótese]` fora do dump: `grep -i "bypassrls\|FORCE ROW LEVEL"` → `[exit 1]`. O veredito não depende disso.) **Veredito: explorável, não defesa em profundidade.** Qualquer usuário autenticado (cadeia A: nem exige email verificado) que conheça o uuid de uma setlist alheia a **esvazia** e recebe `200 {"success":true}`. O B6-DESENHO:203 inventariou a linha como "redundante com o cascade" e não viu a falta do filtro; o teste `[id]/__tests__/route.test.ts:351-363` só verifica o status. Atenuante: uuid v4 não se adivinha. `[medido: B-aval-150.txt]` | **registrada, achado de segurança**. Correção: **hotfix no web em PR própria, fora desta sessão (N2-D6)**. Não corrigido aqui; não provado em prod |
| **151** | **A** | `DELETE /api/setlists/[id]` para setlist inexistente ou alheia → **200 `{success:true}`**, não 404 (`:357-362`: um DELETE que afeta 0 linhas não é erro). As outras rotas por id devolvem 404. Para o nativo, "apaguei" e "já não existia" ficam iguais | registrada; **hotfix junto com a 150 (N2-D6)** |
| **152** | **A / X** | **Uma escrita da cadeia B com email não verificado desloga o usuário do nativo.** A cadeia B devolve 401 (`secure-auth-utils.ts:307-310`); o `authFetch` renova, repete e chama `onAuthFailure` (`core/auth-fetch.ts:55-64`) → `signOut` (`api.ts:83-86`, `session.ts:77-78`). As leituras (cadeia A) funcionam para a mesma conta. Além disso, apagar e remover (cadeia A) aceitam o que criar e adicionar (cadeia B) recusam | registrada. **N2-D9**: o nativo não desloga em 401 de escrita. A conta de audit tem email verificado (H-N2-1); a principal segue em H-N2-2; a identidade byte a byte fica em H-N2-11 |
| **153** | **A** | Três rotas de escrita **não validam o id do path**: addSong (`songs/route.ts`), reorder (`order/route.ts`), removeSong (`[songId]/route.ts:52`); `grep objectId\|commonSchemas` nos três → `[exit 1]`. Id malformado vai cru ao Postgres → 500 (**medido em prod na removeSong, B-d**; addSong/reorder por leitura, H-N2-3), contra "id de path malformado → 400 `field:"id"`" (`CONTRATO-DE-ERRO.md:32-33`). O web chega a esse caminho (div. 156) | registrada |
| **154** | **A** | A regex de `performance_date` (`api-schemas.ts:324-326`) aceita datas que não existem no calendário (`2026-02-31`), e o Postgres `date` as rejeita → 500 em vez de 400 `[hipótese H-N2-6]` | registrada; o seletor de data do nativo não gera esse valor |
| **155** | **A** | O reorder tem teto de 100 (`api-schemas.ts:364`), o addSong não tem. Uma setlist com mais de 100 músicas **não pode ser reordenada** (400). O `songs[]` do create também para em 100 (`:345`) | registrada; insumo do desenho |
| **156** | **A** | Dois defeitos do web que o nativo não copia: remove por `content.id` com filtro de todas as ocorrências (`setlist-manager.tsx:207,214`), que com bis deixa tela e banco divergentes; e id local falso `${setlist.id}-${songId}` depois do add (`:179`), que ao remover manda um id que não é uuid para a W6 (div. 153) | registrada; fora do escopo (web) |
| **157** | **A / T** | **O T1-R10 não está ligado no app.** `diffByUpdatedAt` (`core/sync.ts:87`) não tem chamador fora dos testes; `store.ts:123-124` loga `invalidated=0` **literal**. O aceite A7 "`invalidated=0` no device" (`V1-ENCERRAMENTO.md:122`; `LOGS-OCTAVIA.md:38`) lê uma constante, **não pode reprovar**. Na prática, o app substitui sempre | registrada; **caso 21** do padrão em `LOGS-OCTAVIA.md`; correção na **primeira PR de código do N2 (N2-D8)**, que também resolve a 121 |
| **158** | **P** | **O aval numera as hipóteses de outro jeito que o documento.** Ele chama de "H-N2-2 confirmada para audit" o que aqui é a **H-N2-1** (email verificado da conta de audit), e de "H-N2-3, dono Marcel" a pergunta sobre uma conta não verificada, que aqui é a nova **H-N2-11** (a H-N2-3 do documento é a do id malformado) | registrada; vale a numeração do documento |
| **159** | **P** | **"O mesmo mecanismo das Fases B do C e do N1 (`scripts/ux-audit/`)" são dois mecanismos.** O C usou o `auth.ts` inteiro, que depois do `signInWithPassword` faz `POST /api/auth/session` e recebe cookie (`scripts/ux-audit/auth.ts:109-139`; `C-PRECHECK.md:1163`: "o único POST foi o `/api/auth/session` do `signIn`"). O N1 usou um script próprio **só** com o `signInWithPassword` (`N1-PRECHECK-anexos/A3-probe-n1.mts.txt`). Usei o do N1: o do C somaria uma request a prod fora do orçamento e um cookie que os probes não podem ter | registrada; §11 |
| **160** | **P** | **A B-d do aval pressupõe duas coisas que a rota não tem.** (1) "setlist real da B-c": `DELETE /api/setlists/songs/[songId]` **não recebe id de setlist** (`[songId]/route.ts:95-106`); (2) "se a B-a der 401, a B-d vai devolver 401 também": a removeSong é da **cadeia A** (`:27`, `requireAuthServer`), que **não** exige email verificado; ela daria 500 mesmo para uma conta não verificada | registrada; a B-d rodou com `songId=nao-e-uuid` |

---

## Anexos

`docs/native/N2-PRECHECK-anexos/` — rastro bruto (comando + saída literal +
exit), não fonte. Onde a prosa e o anexo divergirem, vale o anexo.

| Anexo | Item |
|---|---|
| `A0-preparacao.txt` | §1 do prompt (sha, branch, worktree); numeração de divergências e referência "herança 6" |
| `A1-writers.txt` | A1 |
| `A2-contrato.txt` | A2 |
| `A3-data.txt` | A3 |
| `A4-paridade-web.txt` | A4 |
| `A5-ci.txt` | A5 (inclui as duas leituras `gh api`) |
| `A6-divs-121-119.txt` | A6 e div. 157 |
| `A7-core-cache.txt` | A7 e div. 152 |
| `A8-s1-s2.txt` | A8 (inclui o G2/G3 na árvore limpa) |
| `A9-a10-h17.txt` | A9 |
| `A10-g1-aviso.txt` | A10 |
| `B-aval-150.txt` | aval 1.2-a: cliente Supabase do DELETE e RLS/policies de `setlist_songs` (div. 150) |
| `B-execucao.txt` | Fase B: transcrição (token redigido), status, bytes e sha de cada probe, os `cmp` |
| `B-c-1.txt` | B-c: headers literais + resumo do corpo (o corpo não foi commitado, §11.2) |
| `B-a-1.txt`, `B-b-1.txt`, `B-b-2.txt`, `B-d-1.txt` | respostas brutas (`curl -sS -i`) |
