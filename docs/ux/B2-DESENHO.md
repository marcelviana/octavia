# B2 — Desenho da correção

> **Status**: **APROVADO por Marcel em 2026-08-24**, com as seis decisões
> pendentes resolvidas (§6) e cinco ajustes obrigatórios da revisão
> incorporados. Este documento é o registro fiel do que será executado.
> Segue o [`B2-PRECHECK.md`](B2-PRECHECK.md) e implementa as decisões D1–D9
> do Marcel como restrições fixas.
>
> **Data**: 2026-08-24 · **Base**: `main` (`d995c9e`)
>
> **Ajustes do aval incorporados neste texto**: (1) enum falso do CLAUDE.md
> corrigido no PR-0; (2) **ordem de execução** `PR-0 → PR-2 → PR-1 → PR-3 →
> PR-4 → PR-5 → PR-6` — nomes das PRs inalterados para rastreabilidade;
> (3) colunas órfãs sem destino declaradas no escopo (§5); (4) comentário
> obrigatório no schema do add-song sobre a exceção de `position` (§1.PR-4);
> (5) gate da D1 testa comportamento, não internals do Zod (§3.3).

---

## 0. Inventário completo do dump (o que faltava no pre-check)

`supabase/schema.dump.sql`, 341 linhas, schema `public`. Lido inteiro.

### 0.1 Constraints — D0 resolvido

| Tabela | Constraint | Definição | Destino |
|--------|-----------|-----------|---------|
| `setlist_songs` | `setlist_songs_setlist_id_content_id_key` | `UNIQUE (setlist_id, content_id)` | 🔴 **morre** (bis, decisão B5) |
| `setlist_songs` | `setlist_songs_setlist_id_position_key` | `UNIQUE (setlist_id, position)` | ✅ **fica** |
| todas | `*_pkey` | PK em `id` | fica |
| 6 FKs | `annotations_content_id_fkey`, `annotations_user_id_fkey`, `content_user_id_fkey`, `setlist_songs_content_id_fkey`, `setlist_songs_setlist_id_fkey`, `setlists_user_id_fkey` | todas `ON DELETE CASCADE` | ficam |

**Zero CHECK constraints** em todo o schema. **`profiles.email` NÃO tem UNIQUE**
(o `schema.sql` manual declarava `UNIQUE`) — 🆕 drift **D-8**.

### 0.2 Índices — 5 vivos, 6 declarados a mais no `schema.sql`

Vivos: `idx_annotations_content_id`, `idx_content_content_type`, `idx_content_user_id`,
`idx_setlist_songs_setlist_id`, `idx_setlists_user_id`.

Declarados no `schema.sql` e **inexistentes**: `idx_content_is_favorite`,
`idx_content_created_at`, `idx_content_updated_at`, `idx_setlists_created_at`,
`idx_setlist_songs_content_id`, `idx_setlist_songs_position`. 🆕 drift **D-9**.

Consequência para a migration do bis: dropar `setlist_songs_setlist_id_content_id_key`
**também remove o índice implícito em `(setlist_id, content_id)`**. Verificado: nenhuma
query do app filtra `setlist_songs` por `content_id` — todas filtram por `setlist_id`
(que tem índice próprio) ou por `id`. **Nenhuma perda de plano.**

### 0.3 🔴 Triggers e functions: **NÃO EXISTE NENHUM**

O dump não tem um único `CREATE TRIGGER` nem `CREATE FUNCTION`. O `schema.sql`
manual declara **uma function** (`update_updated_at_column()`) e **quatro triggers**.
Nada disso existe no banco. Confirma e amplia o drift D-3 do pre-check.

**Consequência de contrato**: `updated_at` **não é mantido pelo banco** — só existe
se o handler escrever. Auditoria dos handlers:

| Escrita | Seta `updated_at`? |
|---|---|
| `POST /api/setlists` | ✅ ([`route.ts:132`](../../app/api/setlists/route.ts:132)) |
| `PUT /api/setlists/[id]` | ✅ ([`route.ts:171`](../../app/api/setlists/[id]/route.ts:171)) |
| `POST /api/content`, `PUT /api/content` | ✅ |
| `POST /api/profile`, `PATCH /api/profile` | ✅ |
| **`POST /api/setlists/[id]/songs`** | ❌ — o pai não é tocado |
| **`PUT /api/setlists/songs/[songId]`** (reorder) | ❌ |
| **`DELETE /api/setlists/songs/[songId]`** | ❌ |

🆕 **Achado**: adicionar, remover ou reordenar músicas **não mexe em
`setlists.updated_at`**. Uma setlist cuja ordem mudou parece intocada. O
cliente nativo que sincronizar por `updated_at` vai **perder toda mudança de
músicas**. Entra no desenho (PR-5).

### 0.4 🔴 RLS — `annotations` está **desprotegida**

```
ALTER TABLE public.content        ENABLE ROW LEVEL SECURITY;   ✅
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;   ✅
ALTER TABLE public.setlist_songs  ENABLE ROW LEVEL SECURITY;   ✅
ALTER TABLE public.setlists       ENABLE ROW LEVEL SECURITY;   ✅
public.annotations                                             ❌ AUSENTE
```

`annotations` **não tem RLS habilitada e não tem nenhuma policy** — e recebe
`GRANT ALL ON TABLE public.annotations TO anon` (linha 282). A `anon key` é
`NEXT_PUBLIC_*`, publicada no bundle do browser.

**Leitura**: qualquer pessoa com a anon key (extraível do site) pode fazer
`SELECT`/`INSERT`/`UPDATE`/`DELETE` na tabela `annotations`. As outras quatro
tabelas estão protegidas: com RLS ligada e `auth.jwt()->>'uid'` nulo para a role
`anon`, nenhuma policy casa e tudo é negado.

**Exposição real hoje**: **zero linhas** na tabela (medido, seção 0.6) e zero
leitores no app — não há dado a vazar. O risco é **escrita**: inserção de lixo
por terceiros, com custo de armazenamento e FKs apontando para `content`/`profiles`
reais (o `content_id` precisaria existir, mas os ids são UUIDs — não adivinháveis).
Severidade prática baixa, superfície inaceitável.

> ### ⚠️ SINALIZAÇÃO — não desenhei em cima disso sem avisar
>
> Isso **não contradiz** o D7 (não dropar; modelagem fica para o Bloco C), mas é
> informação nova que o pre-check não podia ver. Uma tabela world-writable pela
> chave pública não deveria ficar de pé sem decisão explícita.
>
> **Proposta**: `ENABLE ROW LEVEL SECURITY` + `REVOKE` dos grants de `anon` e
> `authenticated`, mantendo a tabela e o acesso via service role (que ignora RLS).
> Custo: duas linhas de migration. Zero impacto no app, que nunca a acessa.
> Entra em **MIG-1** junto com o drop do bis. ✅ **Aprovada no aval (ponto 1)**
> — ver [§2.2](#22-mig-1--migração-única).

### 0.5 Outros achados do dump

- `gen_random_uuid()` é o default de todos os PKs; o `schema.sql` dizia `uuid_generate_v4()` e `CREATE EXTENSION "uuid-ossp"`. 🆕 drift **D-10**.
- `annotations` tem índice em `content_id`, **não** em `user_id`.
- As policies `"User owns X"` usam só `USING` (sem `WITH CHECK`) — em tese permitiriam a um usuário mover uma linha para outro `user_id` via UPDATE. **Inalcançável na prática**: o app nunca usa a role `authenticated` (o browser nunca fala com o Supabase — `getSupabaseBrowserClient` tem **zero chamadores**, verificado), e um JWT do Firebase não é um JWT do Supabase, então `auth.jwt()->>'uid'` é nulo para `anon`. Registro como dívida latente, **fora do escopo do B2**.
- `supabase/rls-policies.sql` (47 linhas) é um terceiro arquivo de schema à mão. Mesmo destino do `schema.sql`: aposentado.

### 0.6 D4 — contagem autorizada de `content_type` (leitura pura via PostgREST)

```
TOTAL DE LINHAS: 194
  "Lyrics"   147
  "Chords"    25
  "Tab"       15
  "Sheet"      7
```

✅ **Zero linhas fora do enum canônico.** Nenhuma migration de dados. O D4 é só
o fechamento do schema.

Contagens de apoio (mesma medição): `setlists` **8**, `setlist_songs` **107**,
`profiles` **5**, `annotations` **0** — a contagem zero **prova** o d1 do
pre-check: a tabela nunca recebeu uma linha.

### 0.7 D9 — blast radius **medido**, não estimado

Troquei `types/supabase.ts` por um re-export dos types gerados, rodei
`tsc --noEmit`, e **reverti** (working tree confirmado limpo, `tsc` exit 0 de novo).

**Resultado: 3 erros, todos drift real que o arquivo manual escondia.**

| Arquivo:linha | Erro | Leitura |
|---|---|---|
| [`app/api/profile/route.ts:140`](../../app/api/profile/route.ts:140) | `TS2578: Unused '@ts-expect-error' directive` | o `@ts-expect-error` só existia porque os types manuais estavam errados. Some junto com eles |
| [`app/api/setlists/[id]/route.ts:95`](../../app/api/setlists/[id]/route.ts:95) e [`:242`](../../app/api/setlists/[id]/route.ts:242) | `TS2345` — `Json` não é atribuível a `Record<string, unknown> \| null` | `types/setlist.ts:ContentData.content_data` promete objeto; a coluna é `jsonb` e aceita string/número/array. **É o mesmo defeito do b3 pelo outro lado**: o tipo mente sobre o que a coluna pode conter |

**A migração de types é barata.** 22 sites de import, 3 erros reais. Isso muda a
ordenação: D9 pode e deve vir cedo, como o Marcel pediu.

**Não medido**: a remoção dos 10 `as any` + 1 `@ts-expect-error` do A4 — exige
editar as rotas, e a tentativa de fazê-lo no working tree foi bloqueada pelo
classificador de permissões. Fica como **primeira tarefa da PR-2**, com critério
de aceite explícito ([§1.3](#pr-2--d9-types-gerados-como-fonte-única)).

### 0.8 Baseline de testes

`pnpm test` → **52 arquivos, 412 passed, 101 skipped, 14.8s**. Verde.

Nota: [`app/api/setlists/[id]/songs/__tests__/route.test.ts`](../../app/api/setlists/[id]/songs/__tests__/route.test.ts)
tem os **9 testes `it.skip` com `TODO: Fix …`** — arquivo morto que finge cobertura
sobre exatamente a rota que a PR-5 toca. Destino declarado em [§3.5](#35-o-arquivo-de-teste-morto).

---

## 1. Sequência de PRs

Princípios: diffs pequenos; superfície sensível; **PR-2 (types) vem cedo para
devolver ao `tsc` o poder de policiar as PRs seguintes**; remoções antes de
consolidações (removem trabalho da consolidação); infra em commit próprio.

**Ordem de execução (ajuste do aval)** — a PR-2 executa **antes** da PR-1:
o `tsc` com types reais passa a policiar também os handlers que a PR-1 toca
(`profile/route.ts` tem um dos 3 erros medidos na §0.7), e elimina o churn
duplo nesse arquivo. Os nomes das PRs não mudam.

```
ordem de execução:
PR-0  infra/tooling + docs
PR-2  D9 · types gerados como fonte única
PR-1  D8 · dois S1 de perfil (estreia a política D1)
PR-3  remoções (D6 + validate-token)
PR-4  D3 + D4 · módulo único de schemas
      ── MIG-1 executada por Marcel entre o merge da PR-4 e a validação da PR-5 ──
PR-5  SET-01 + D2 · setlists de verdade (depende de MIG-1 em prod)
PR-6  b7 · Zod no reorder
```

Protocolo: **uma PR por vez** — diff + testes + texto → aval → validação em
preview (`octavia-preview.vercel.app`, bypass por cookie, `--retries=0`,
relatório quantitativo) → aval → merge → confirmação em prod. Regra nº 7 em
cada PR (specs novos rodados contra a árvore sem o fix, assert e mensagem
registrados). Gate definitivo de merge: Vercel preview + Lint + type-check +
unit + coverage + Build, todos verdes.

### PR-0 — infra/tooling

**Sem código de produção.** Não toca `app/`, `lib/`, `components/`, `hooks/`.

| Ação | Detalhe |
|---|---|
| Versionar `supabase/schema.dump.sql` | artefato regenerável, mesmo estatuto dos types |
| `git rm supabase/schema.sql` | ✅ decidido no aval (ponto 6). **Não** vai para `docs/` — o histórico do git já é o registro, e um arquivo em `docs/` convida à edição à mão. O commit cita os 10 drifts (D-1…D-10) como justificativa |
| `git rm supabase/rls-policies.sql` | terceiro arquivo de schema à mão, mesma razão |
| `package.json` | `"db:types"` e `"db:dump"` — os dois comandos de regeneração, escritos uma vez |
| `CLAUDE.md` — schema/types gerados | parágrafo curto: schema e types são **gerados**; nunca editar à mão; como regenerar |
| `CLAUDE.md` — **corrigir o enum falso** (ajuste do aval) | `Lyrics, chords, tabs, piano, drums` (linha 114) é a **origem do c2** — `Tabs`/`Piano`/`Drums` nunca existiram no produto. Corrigido para o canônico `Lyrics \| Chords \| Tab \| Sheet`, com nota apontando [`types/content.ts`](../../types/content.ts) como fonte única |
| Versionar `docs/ux/B2-PRECHECK.md` e `docs/ux/B2-DESENHO.md` | os dois registros do ciclo entram no repositório |
| `PLANO-TRANSICAO.md` — correção do D7 | registro de `annotations` muda de "write-only desde sempre" para **"nunca-escrita (0 linhas, medido no pre-check do B2)"** |
| `.gitignore` | **nada a fazer** — `supabase/.temp` já é ignorado pela regra `*.temp` da linha 61 (verificado com `git check-ignore`) |

Scripts propostos:
```json
"db:types": "supabase gen types typescript --project-id mlxjmpbdchmwplcfislt > types/database.types.ts",
"db:dump":  "supabase db dump -s public -f supabase/schema.dump.sql"
```
`db:dump` exige projeto linkado — documentado no `CLAUDE.md` como passo do Marcel.

**Aceite**: `pnpm test` verde, `tsc` verde, `pnpm build` verde. Zero mudança de comportamento.

---

### PR-1 — D8: os dois S1 de perfil (estreia a política D1)

> **Executa DEPOIS da PR-2** (ajuste do aval — ver ordem em §1). O nome
> PR-1 permanece para rastreabilidade com o desenho aprovado.

Duas linhas de bug, mas é a PR que **fixa o idioma da política D1** numa
superfície pequena antes de generalizá-lo na PR-4.

#### O idioma da D1

D1 = *strip explícito por lista + `.strict()` no resto*. Zod não tem isso pronto.
Duas formas possíveis:

| | **(A) wrapper de pré-processamento** ⭐ recomendado | (B) campo ignorado dentro do schema |
|---|---|---|
| como | `withIgnoredKeys(schema, ['id','email'])` remove as chaves listadas do body **antes** do parse; o schema é `.strict()` | `id: ignored()` = `z.unknown().optional().transform(() => undefined)` |
| lista de ignorados | array literal, ao lado do schema | dentro do `z.object` |
| `validatedData` | limpo — só campos reais | carrega `id: undefined`, `email: undefined` |
| risco | nenhum | `...validatedData` espalharia `undefined` para dentro do `insert` |

**Recomendo (A)**, porque hoje os handlers fazem `{ ...validatedData }`
([`profile/route.ts:79`](../../app/api/profile/route.ts:79) e [`:134`](../../app/api/profile/route.ts:134),
[`content/route.ts:183`](../../app/api/content/route.ts:183)) e (B) injetaria
`undefined` em colunas reais. **Regra adicional que vem junto**: handlers param de
espalhar `validatedData` e passam a **enumerar** os campos — explícito dos dois lados.

#### Escopo da PR-1

| Item | Antes | Depois |
|---|---|---|
| **b2** — login social sem `displayName` | `full_name/first_name/last_name/avatar_url: z.…optional()` → **400** com `null` | `.nullish()` — `null` atravessa e limpa a coluna |
| **b1** — perfil sem site | `website: z.string().url().optional()` → **400** com `""` | `z.preprocess(v => v === '' ? null : v, z.string().url().nullish())` — `""` vira `null` |
| **D1** | chaves desconhecidas caem em silêncio | `withIgnoredKeys(profileCreate, ['id','email'])` + `.strict()` |
| handlers | `{ id, ...validatedData, email }` | campos enumerados |
| `bio` | `createSafeText(0, 2000)` | idem, mas `.nullish()` por coerência |

`avatar_url` ganha o mesmo `preprocess` de `""`→`null` (o `photoURL` pode vir vazio).

**Não entra**: o `ProfileForm` só edita 3 das 7 colunas (`first_name`,
`last_name`, `primary_instrument`, `avatar_url` inalcançáveis pela UI). É UI web,
Bloco D — o contrato passa a aceitar os 7; a web continua mandando 3.

**Aceite**: `contract-profile.test.ts` novo, com controle negativo registrado
(as saídas medidas do pre-check §2.6/§2.7 são exatamente os asserts que devem
falhar contra o código atual). Salvar o perfil sem site em preview → 200.

---

### PR-2 — D9: types gerados como fonte única

| Ação | Detalhe |
|---|---|
| 22 imports | `@/types/supabase` → `@/types/database.types` ([lista completa no pre-check](B2-PRECHECK.md)) |
| `rm types/supabase.ts` | o arquivo manual morre. **Sem shim de re-export** — o shim deixaria o import velho vivo e o próximo dev o usaria |
| remover 10 `as any` + 1 `@ts-expect-error` | `setlists/route.ts:137`, `setlists/[id]/route.ts:183`, `setlists/[id]/songs/route.ts:74`, `setlists/songs/[songId]/route.ts:113,240,279`, `content/route.ts:191,240`, `content/[id]/route.ts:117`, `profile/route.ts:87,140` |
| corrigir os 3 erros medidos | `@ts-expect-error` órfão some; `types/setlist.ts:ContentData.content_data` passa a `Json` e o consumo ganha guarda de forma |

**Critério de aceite, explícito**: depois de remover os casts, `tsc --noEmit`
roda. **Cada erro novo é drift real que o cast escondia e vira item nomeado no
corpo da PR** — corrigido no tipo ou no código, **nunca silenciado com um cast
novo**. Se algum erro exigir mudança de comportamento (e não só de tipo), ele
**sai da PR-2** e vira item próprio, para a PR-2 continuar sendo uma mudança de
tipos sem risco de runtime.

**Por que cedo**: a partir daqui, `tsc` policia as PRs 3–6 de verdade. Foi o
pedido do Marcel e a medição da §0.7 confirma que é barato.

---

### PR-3 — remoções (D6 + extra aprovado)

Vem **antes** da consolidação porque encolhe a superfície que a PR-4 precisa migrar.

| Remoção | Justificativa |
|---|---|
| `PUT` de [`app/api/content/[id]/route.ts`](../../app/api/content/[id]/route.ts) | D6. Órfã (zero chamadores), e a mais quebrada do repo: rejeita `Tab`/`Sheet`, rejeita `null` em 3 campos, stripa 6 campos, aceita `title` de 1000 chars num `varchar(255)`. `GET` e `DELETE` **permanecem** |
| `app/api/auth/validate-token/route.ts` inteiro | extra aprovado. Zero referências no repositório **inclusive testes**, sem Zod, **sem rate limit**, `verifyIdToken` remoto em rota pública. Precedente citado no corpo da PR: as remoções do B1.0 |
| testes do `PUT` em `app/api/content/[id]/__tests__/route.test.ts` | somem junto; os de GET/DELETE ficam |

**Não removido**: `POST /api/storage/delete` (só referenciado pelo próprio teste).
É par do **B5** (reconciliação de órfãos de storage) e provavelmente vai **ganhar**
uso lá — remover agora seria retrabalho. Declarado, não esquecido.

**Aceite**: `pnpm test` verde; `curl -X PUT /api/content/<id>` em preview → **405**;
`curl -X POST /api/auth/validate-token` → **404**.

---

### PR-4 — D3 + D4: módulo único de schemas

O coração do B2.

| Ação | Detalhe |
|---|---|
| criar `lib/api-schemas.ts` | fonte única. `lib/api-validation-middleware.ts` fica **só com o middleware** (auth, rate limit, `sanitizeInput`, `withValidation`) — D3 |
| estilo | `.nullish()` em tudo que é opcional. A classe SET-23 deixa de ser possível por construção |
| política D1 | `.strict()` em todos os schemas + `withIgnoredKeys` com a lista escrita por rota |
| **D4** | enum canônico único, importado de [`types/content.ts`](../../types/content.ts): `Lyrics \| Chords \| Tab \| Sheet`. As **quatro** listas divergentes (incl. o whitelist do filtro em [`content/route.ts:94`](../../app/api/content/route.ts:94)) passam a derivar dela. **Sem migration de dados** (§0.6) |
| limites de string | tabela única derivada do dump (`title` 255, `genre` 100, `content_type` 50, `key` 10, `time_signature` 10, `difficulty` 20, `tuning` 50, `name` 255, `venue` 255, `primary_instrument` 100, `email` 255). Mata a classe c1 |
| `bpm` | faixa única **1–999** — ✅ decidido no aval (ponto 3) |
| `difficulty` | proponho manter os 4 (`Beginner \| Intermediate \| Advanced \| Expert`) — a coluna é `varchar(20)` livre e `Expert` já era aceito pela rota viva |
| campos que voltam | `genre`, `file_url`, `time_signature`, `is_public`, e **`capo`/`tuning`** (colunas órfãs d2) passam a existir no contrato de content — o nativo nasce com eles |
| mortes | os 8 schemas órfãos de `lib/validation-schemas.ts` (incl. o de `event_date`), `storageSchemas.delete`, `setlistSchemas.updatePosition`. `lib/validation-schemas.ts` fica só com `allowedMimeTypes`/`allowedExtensions`/`sanitizeString` ou some inteiro, conforme sobrar |
| listas de MIME | as **três** listas incompatíveis (`storageSchemas.upload` regex, `allowedMimeTypes`, `FileUploadZone`) viram uma. Resolve b8 (`image/jpg`) |

**b6 (`file_url`)** — o contrato declara `file_url: z.string().url().nullish()`.
A armadilha fica desativada **no contrato**; o fallback morto
`uploadedFile.url ?? uploadedFile.name` ([`useAddContentLogic.ts:231`](../../hooks/useAddContentLogic.ts:231))
é inalcançável na web (provado no pre-check §2.3). ✅ **Decidido no aval
(ponto 4): a linha morta é removida** como one-liner desta PR (`file_url:
uploadedFile.url`).

**`position` do add-song — comentário obrigatório no schema** (ajuste do aval):
o `setlistSchemas.addSong` mantém `position` como **sugestão que o servidor
recalcula** ([`songs/route.ts:62`](../../app/api/setlists/[id]/songs/route.ts:62)).
Isso é uma **exceção deliberada à política D1** (um campo aceito cujo valor
pode não ser honrado), pendente de definição no **B6**. O comentário no schema
cita isso textualmente — sem ele, a exceção fica invisível para o próximo
leitor e alguém a "corrige" sem contexto.

**D5 respeitado**: `content_data` fica `z.record(z.unknown()).nullish()` (objeto),
e o call site quebrado do batch (`content_data: song.body`, string) **não é
consertado**. O contrato correto fica declarado para o nativo; o batch morre com
a web. Uma linha de comentário no schema registra a decisão para ninguém
"consertar" depois sem contexto.

**Aceite**: `pnpm test` verde; `contract-content.test.ts` e `contract-storage.test.ts`
novos; **gate estrutural da D1** (§3.3) passando.

---

### PR-5 — SET-01 + D2: setlists de verdade

Depende de **MIG-1** já aplicada em prod.

#### 5a — os três campos fantasma (SET-01)

`venue`, `performance_date`, `notes` entram nos schemas de create **e** update.
`performance_date` é **date-only** — e o dump confirma que a coluna **já é `date`**
(§0.5 do pre-check): **nenhuma migration de tipo**. Validação:
`z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish()` — recusa timestamp, recusa fuso.

O handler de update ([`[id]/route.ts:174-179`](../../app/api/setlists/[id]/route.ts:174))
passa a copiar os cinco campos com a semântica SET-23 já estabelecida:
`undefined` = não mexa, `null` = limpe.

**Fora do escopo, declarado**: o off-by-one de exibição (c6 —
`new Date(performance_date)` em [`setlist-card.tsx:66`](../../components/setlist/setlist-card.tsx:66),
[`:172`](../../components/setlist/setlist-card.tsx:172),
[`setlist-details.tsx:135`](../../components/setlist/setlist-details.tsx:135))
é **render web**, Bloco D. O contrato entrega `YYYY-MM-DD` sem fuso; o nativo
nasce certo. A web continua exibindo com o off-by-one até morrer.

#### 5b — `songs[]` (D2)

Schema do item: `{ content_id, notes? }`. **`position` sai do payload** — a
**ordem do array é a ordem**, renumerada `1..N` no servidor. Motivo: a `position`
enviada já é ignorada hoje pelo handler de add ([`songs/route.ts:62`](../../app/api/setlists/[id]/songs/route.ts:62),
o item 21 da Fase D), e aceitar um campo que o servidor recalcula é a mesma
mentira que o B2 existe para matar.

Validações novas no schema: `content_id` único dentro do array (a UNIQUE de bis
morre em MIG-1, mas repetir a mesma música **na criação** é erro do cliente, não
bis intencional — bis se faz adicionando depois). Máx. 100, como hoje.

O handler valida que **todos** os `content_id` pertencem ao usuário **antes** de
qualquer insert — uma query `.in('id', ids).eq('user_id', uid)` e compara a
contagem.

> #### ✅ "Em transação" — decidido no aval (ponto 2): opção (B)
>
> `supabase-js` não tem API de transação. Marcel escolheu **dois statements +
> delete compensatório** (zero superfície nova, tudo em TypeScript, segue o
> padrão do CLAUDE.md), rejeitando a RPC em plpgsql.
>
> **Garantia exigida no aval — nenhum 201 mentiroso**:
> 1. `INSERT` da setlist → se falhar, erro honesto, nada criado.
> 2. `INSERT` **multi-row único** das músicas (`.insert([...])` — atômico
>    entre si) → se falhar, o handler **apaga a setlist recém-criada**
>    (`DELETE ... eq('id', setlist.id).eq('user_id', uid)`) e devolve erro
>    honesto (500 com o shape de validação/erro da etapa).
> 3. **Pior caso documentado em comentário no handler**: se o próprio delete
>    compensatório falhar (rede/banco no meio-tempo), sobra uma setlist
>    **vazia** órfã — visível na listagem, apagável pela UI. Nunca um 201
>    com músicas fantasma.

`songs[]` também entra no **update**? **Não.** Update de setlist mexe em metadados;
reordenar/adicionar/remover tem rotas próprias. O schema de update **deixa de
aceitar `songs`** — hoje ele aceita e ignora, que é o a3. Menos mentira, menos código.

#### 5c — `updated_at` do pai (achado §0.3)

`POST /api/setlists/[id]/songs`, `DELETE .../songs/[songId]` e o reorder passam a
fazer `UPDATE setlists SET updated_at = now() WHERE id = …`. Sem isso o nativo
sincroniza errado. Três linhas, um teste.

**Aceite**: `contract-setlist.test.ts`; em preview, criar setlist com venue+data+notas
e 3 músicas em **uma** requisição, e o read-back trazer tudo; editar o venue e
persistir; adicionar música e ver `updated_at` mudar.

---

### PR-6 — b7: Zod no reorder

[`PUT /api/setlists/songs/[songId]`](../../app/api/setlists/songs/[songId]/route.ts)
é a **única rota com body e zero validação**. Hoje: `if (!setlistId || !newPosition)`.

| Problema | Correção |
|---|---|
| `newPosition: 0` lido como ausente (`!0`) | Zod distingue: `0` → 400 **com a mensagem certa** |
| `newPosition: "3"` (string) entra na aritmética | `z.number().int()` |
| `setlistSchemas.updatePosition` órfão com nomes que não batem | morre na PR-4; o schema real usa os nomes que a rota lê |

**Base 0 ou 1?** As posições no banco são **1-based** (`newPos = i + 1`,
`currentMaxPosition + 1`). O contrato fica **1-based**, `z.number().int().min(1)`,
e o nativo nasce sabendo. Trocar para 0-based seria migration de 107 linhas para
ganhar nada.

Schema: `{ setlistId: uuid, newPosition: int >= 1 }`, `.strict()`.

**Fora do escopo, declarado**: os **2N UPDATEs sem transação** com `tempOffset = 10000`
(SET-07) e a semântica de `position` no add (item 21) são **B6 — "Position e
reorder: contrato para o nativo"**. A PR-6 é **só validação de entrada**. A
UNIQUE `(setlist_id, position)` fica, então o `tempOffset` continua necessário.

---

## 2. Migrations

### 2.1 Princípio

Não há ferramenta de migration no projeto (`supabase/migrations/` não existe e
não vou criar uma para duas linhas de DDL). O SQL vive **na descrição da MIG-1**
e no corpo da PR-5; a **verdade pós-execução é o dump regenerado**.

### 2.2 MIG-1 — migração única

**Executada pelo Marcel**, no SQL Editor do dashboard do Supabase (credencial de
console é dele). Duas partes independentes.

```sql
-- Parte A — bis liberado (decisão B5)
ALTER TABLE public.setlist_songs
  DROP CONSTRAINT setlist_songs_setlist_id_content_id_key;

-- Parte B — annotations deixa de ser world-writable (§0.4) [✅ APROVADA no aval, ponto 1]
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.annotations FROM anon;
REVOKE ALL ON TABLE public.annotations FROM authenticated;
```

| | Parte A | Parte B |
|---|---|---|
| **Reversível?** | ✅ `ADD CONSTRAINT … UNIQUE (setlist_id, content_id)` — **só volta se não houver duplicata**. Depois que o primeiro bis for gravado, o rollback exige apagar dados | ✅ trivialmente (`DISABLE` + `GRANT`) |
| **Bloqueia?** | `ACCESS EXCLUSIVE` momentâneo numa tabela de **107 linhas** — milissegundos | idem, 0 linhas |
| **Quebra código?** | Não. Nenhum handler depende da unicidade `(setlist_id, content_id)`. `DELETE .../songs/[songId]` apaga por `id` (PK), não por `content_id` — verificado | Não. O app nunca acessa `annotations`; o service role ignora RLS |
| **Perde índice?** | Sim, o implícito em `(setlist_id, content_id)`. **Sem impacto** — nenhuma query filtra por essa combinação (§0.2) | — |

**Verificação pós-execução** (eu rodo, leitura pura):
1. `pnpm db:dump` → `setlist_songs_setlist_id_content_id_key` **ausente**, `setlist_songs_setlist_id_position_key` **presente**, `annotations` com `ENABLE ROW LEVEL SECURITY` e sem os grants de `anon`. Diff do dump anexado ao relatório.
2. Prova funcional do bis, **em preview**: adicionar a mesma música duas vezes na mesma setlist → **201 nas duas**, com posições diferentes. Antes da MIG-1 isso dá 500 (SET-06). **É o controle negativo da própria migration.**
3. `curl` com a anon key em `/rest/v1/annotations` → **401/403** (antes: 200 com `[]`).

**Ordem (fixada no aval)**: MIG-1 é executada por Marcel no SQL Editor **entre
o merge da PR-4 e o início da validação da PR-5**. Quando a PR-4 for mergeada,
eu aviso que é o momento; Marcel roda o SQL; eu executo a verificação
pós-execução acima (dump regenerado + diff anexado, prova funcional do bis em
preview, curl com a anon key → 401/403).

### 2.3 Migration de dados: **nenhuma**

D4 medido: 194 linhas, **zero** fora do enum canônico (§0.6). O fechamento é só
de schema.

**Não proponho `CHECK (content_type IN (…))`**: o banco nunca teve CHECK nenhum,
toda escrita passa pela API com Zod, e um CHECK novo transformaria um 400 legível
em um 500 genérico se algum dia divergissem. O Zod é o portão. Registro a escolha
para não parecer esquecimento.

---

## 3. Testes de contrato (regra nº 7)

### 3.1 Onde vivem

`lib/__tests__/contract-*.test.ts`, Vitest, seguindo o precedente já no repo:
[`lib/__tests__/setlist-schemas.test.ts`](../../lib/__tests__/setlist-schemas.test.ts)
(o gate do SET-23). Mesmo padrão: importa o schema **real**, testa **semântica**
(o que atravessa o parse e como), não só válido/inválido.

**Entram no gate definitivo de merge**: são testes unitários, então `pnpm test`
os pega e o CI já roda `pnpm test`. Zero configuração nova.

### 3.2 Promoção dos probes — não reescrever

Os 4 probes do pre-check já contêm os casos e as **saídas medidas**. A promoção é
mecânica:

| Probe | Vira | Casos |
|---|---|---|
| `probe1.ts` | `contract-content.test.ts` | batch string · draft · upload OK · upload fallback · payload do editor · bpm NaN |
| `probe2.ts` | `contract-setlist.test.ts` | SET-01 create · SET-01 update · `songs[]` · addSong |
| `probe3.ts` + `probe4.ts` | `contract-profile.test.ts` | signup · signup instrumento vazio · social sem displayName · social com displayName · PATCH com colunas não editáveis · **website vazio** |
| `probe4.ts` (parte storage) | `contract-storage.test.ts` | pdf · `image/jpg` · 0 bytes |

Cada `it()` carrega, no comentário, **a saída medida contra o código pré-fix** —
o controle negativo fica documentado no próprio teste, não só num relatório.

O `setlist-schemas.test.ts` existente **fica intocado**. É um gate verde de um
item já fechado (SET-23); mexer nele só cria risco de perder cobertura.
`contract-setlist.test.ts` é arquivo novo, ao lado.

### 3.3 Gate estrutural da política D1

Um teste que **não existe hoje** e que impede a regressão da política.
**Ajuste do aval**: o gate testa **comportamento, não internals** — nada de
`schema._def.unknownKeys` (API interna do Zod, frágil entre versões):

```
para cada schema exportado de lib/api-schemas.ts:
  parse do payload mínimo válido + { __chave_desconhecida_b2__: 1 }
  → expect: parse FALHA (400), nomeando a chave desconhecida
```

Mesma cobertura (um schema sem `.strict()` engole a chave e o teste falha),
zero dependência de implementação. O payload mínimo válido de cada schema fica
numa tabela no próprio teste.

**Controle negativo**: rodar contra qualquer schema sem `.strict()` — a chave
desconhecida atravessa em silêncio e o assert falha. Fácil de provar, e é o
que garante que a D1 não erode na próxima rota.

### 3.4 Gate de drift Zod × banco

Um teste que trava a classe c1 (schema aceita o que a coluna não guarda):

```
para cada (schema, campo) com limite de string:
  expect(maxDoZod).toBeLessThanOrEqual(limiteDaColuna)
```

Os limites vêm do dump (§0.7 do pre-check), **hardcoded com comentário citando o
dump** — não há como ler DDL em teste unitário. Quando o banco mudar, o dump
muda, e a divergência aparece na revisão do próximo `db:dump`.

**Controle negativo**: `contentSchemas.update.title` com max 1000 contra
`varchar(255)` — exatamente o c1, que **falha hoje**.

### 3.5 O arquivo de teste morto

[`app/api/setlists/[id]/songs/__tests__/route.test.ts`](../../app/api/setlists/[id]/songs/__tests__/route.test.ts):
9 `it.skip` com `TODO: Fix …`, sobre a rota que a PR-5 toca. Finge cobertura.

✅ **Decidido no aval (ponto 5)**: `git rm` na PR-5, substituído pelos casos
equivalentes em `contract-setlist.test.ts` (schema) + os asserts de
comportamento que a PR-5 precisa. Ressuscitar 9 testes de mock quebrados custa
mais que reescrever os que importam.

### 3.6 Registro do controle negativo

Para cada PR, antes do merge: rodar os specs novos **contra a árvore sem o fix**
(`git stash` do fix, ou o commit anterior) e registrar no relatório de validação
**qual assert falhou e com que mensagem**. Sem isso o gate não vale. As saídas do
pre-check já são a prova de que os asserts pegam o bug — a execução formal é
confirmação, não descoberta.

---

## 4. Contrato pós-B2 para o cliente nativo

O que o cliente RN pode assumir depois de todas as PRs. Regras gerais:

- **Toda chave desconhecida no body → 400.** Nada mais é descartado em silêncio.
- **`null` significa "limpe o campo"; ausente significa "não mexa".** Vale para todo campo opcional de todo update.
- **`id`/`email`/`user_id`/`updated_at` vindos do cliente são ignorados por decisão escrita** — o servidor os deriva do token. Enviá-los não dá erro (estão na lista de ignorados) e não tem efeito.
- Erro de validação: `400 { error: 'Validation failed', code: 'VALIDATION_ERROR', details: [{ field, message, code }] }` — **o shape que o B3 vai generalizar**.

| Rota | Métodos | Contrato |
|---|---|---|
| `/api/content` | GET · POST · PUT · DELETE | **é a rota canônica de content.** PUT leva `id` no corpo. Campos: `title`(≤255) `artist` `album`(≤255) `genre`(≤100) `content_type` `content_data`(objeto ou null) `file_url`(URL absoluta ou null) `key`(≤10) `bpm`(1–999) `time_signature`(≤10) `difficulty` `capo` `tuning`(≤50) `tags`(≤20) `notes` `is_favorite` `is_public` |
| `/api/content/[id]` | GET · DELETE | **sem PUT** (removido na PR-3) |
| `/api/setlists` | GET · POST | POST aceita `name` `description` `venue`(≤255) `performance_date`(**`YYYY-MM-DD`**, sem hora, sem fuso) `notes` e **`songs[]` = `[{content_id, notes?}]`, na ordem desejada**, criados em uma requisição. O 201 traz `setlist_songs` **preenchido de verdade** |
| `/api/setlists/[id]` | GET · PUT · DELETE | PUT mexe **só em metadados** (os 5 campos acima). **Não aceita `songs`** |
| `/api/setlists/[id]/songs` | POST | `{ content_id, position?, notes? }`. **`position` é sugestão** — o servidor calcula (item 21, semântica definida no B6). Bis **permitido** (constraint dropada). Bump em `setlists.updated_at` |
| `/api/setlists/songs/[songId]` | PUT · DELETE | PUT: `{ setlistId: uuid, newPosition: int ≥ 1 }` — **posições são 1-based**. `0` → 400 explícito. Bump em `setlists.updated_at` |
| `/api/profile` | GET · POST · PATCH | 7 campos editáveis: `full_name` `first_name` `last_name` `primary_instrument` `avatar_url` `bio` `website`. **`""` em URL vira `null`**; `null` limpa |
| `/api/storage/upload` | POST | multipart `file` + `filename`. **Uma** lista de MIME/extensão. `image/jpg` aceito |
| `/api/auth/session` | POST · DELETE | inalterado |
| `/api/proxy`, `/api/health` | GET | inalterados |
| ~~`/api/auth/validate-token`~~ | — | **removida** |

### Armadilhas desativadas

| Era | Fica |
|---|---|
| **b6** `file_url` recusava caminho relativo/nome de arquivo | contrato explícito: URL absoluta ou `null` |
| **b7** `newPosition: 0` virava "campo obrigatório ausente" | 400 nomeando o campo e o mínimo |
| **a3** `songs[]` aceito e descartado com 201 | implementado (PR-5) ou **rejeitado** (no update) |
| **b4/b5** `PUT /api/content/[id]` rejeitava `Tab`/`Sheet` e `null` | rota removida |
| **c2** quatro enums de `content_type` | um só, derivado de `types/content.ts` |
| **c1** `title` de 1000 chars num `varchar(255)` | limites derivados do dump, com gate |

### O que o nativo **ainda não** pode assumir (fica para outros blocos)

- **Erro estruturado uniforme** — o shape acima vale para erros de validação; 401/403/404/500 ainda variam. **B3**.
- **Semântica de `position` no add e transacionalidade do reorder** — **B6**.
- **Listagem de storage / reconciliação de órfãos / magic bytes** — **B5**.
- **Idempotência do `POST /api/content`** — **B9**.
- **Forma interna de `content_data`** e modelagem de anotações — **Bloco C**.
- **Busca com acento/typo** (`unaccent`/`pg_trgm`) — **B5**.

---

## 5. Escopo declarado

### Cobre

Os 14 endpoints do inventário; os 4 arquivos de schema (2 módulos Zod + 2 de
types); as migrations MIG-1; os testes de contrato e os dois gates estruturais;
o contrato documentado para o nativo.

### Não cobre — e para onde vai

| Item | Destino |
|---|---|
| Shape uniforme de erro para não-validação | **B3** (herda o `{error, code, details}` desta etapa como semente) |
| `position` no add · reorder transacional · 2N UPDATEs (SET-07) | **B6** |
| Storage: listagem, órfãos, magic bytes; `POST /api/storage/delete` (mantida sem uso) | **B5** |
| Idempotência do POST de content · replay da fila offline | **B9** |
| Forma interna de `content_data`; tabela `annotations` vs. JSONB | **Bloco C** (greenfield — a tabela tem 0 linhas) |
| Batch import quebrado (b3) | **Bloco D** — D5: morre com a web |
| Off-by-one de exibição de `performance_date` (c6) | **Bloco D** — render web |
| `ProfileForm` só edita 3 de 7 campos | **Bloco D** — o contrato aceita 7 |
| Policies `USING` sem `WITH CHECK` (§0.5) | dívida latente, inalcançável hoje. Registrada, sem tarefa |
| **Colunas órfãs sem destino** (ajuste do aval): `content.thumbnail_url` e `setlists.is_public` | permanecem órfãs, **fora do contrato** (nenhum schema as declara); destino decidido no **Bloco C**. As demais órfãs do d2 (`capo`, `tuning`) entram no contrato na PR-4 |
| 6 índices declarados e inexistentes (D-9) | sem tarefa — 194 linhas de content, 8 setlists. Registrado |
| `profiles.email` sem UNIQUE (D-8) | sem tarefa nesta etapa. **Vale sua decisão futura**: 5 perfis hoje, sem duplicata |
| N+1 em `GET /api/setlists` | performance, não contrato. Sem destino ainda |
| `setlist-manager.tsx:99` grava cache offline com o array velho | Bloco D (cache web) |

### Não faz parte de nenhuma PR

Nenhuma mudança de UI web. Nenhuma mudança de rate limiting (B1 fechado).
Nenhuma mudança de auth. Nenhum redesign.

---

## 6. Decisões do aval (2026-08-24) — todas resolvidas

| # | Ponto | Decisão de Marcel |
|---|-------|-------------------|
| 1 | §0.4 — RLS de `annotations` (Parte B da MIG-1) | ✅ **Aprovada** como desenhada: `ENABLE RLS` + `REVOKE` de `anon` e `authenticated`; service role intocada |
| 2 | §1.PR-5 — "em transação" | **Opção (B)** — dois statements + delete compensatório. A RPC sai do desenho. Garantia: nenhum 201 mentiroso; pior caso (setlist vazia órfã se o delete compensatório falhar) documentado em comentário no handler |
| 3 | §1.PR-4 — `bpm` | **Faixa única 1–999** |
| 4 | §1.PR-4 — fallback morto de `file_url` | **Remover** (one-liner em `useAddContentLogic.ts:231`, dentro da PR-4) |
| 5 | §3.5 — 9 `it.skip` de `songs/__tests__/route.test.ts` | **`git rm`** na PR-5, substituídos pelos contract tests |
| 6 | §1.PR-0 — `schema.sql` e `rls-policies.sql` | **`git rm`** no PR-0, commit citando os drifts D-1…D-10 |

Ajustes obrigatórios da mesma revisão: enum falso do CLAUDE.md corrigido no
PR-0; ordem de execução PR-0 → PR-2 → PR-1 → PR-3…; colunas órfãs declaradas
(§5); comentário da exceção de `position` no schema (§1.PR-4); gate da D1 por
comportamento (§3.3). Todos incorporados no corpo deste documento.
