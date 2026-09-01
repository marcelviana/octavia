# B6 — DESENHO (position · reorder · D11) — Revisão 1

Fase de desenho do Bloco B6, sobre as decisões **B6-D1 a D7 fechadas pelo
Marcel em 2026-08-31**. **Revisão 1** incorpora o aval condicionado do
mesmo dia, que também fechou:

- **B6-D8** (ex-Q8): migração versionada no repo
  (`supabase/migrations/`); **aplicação em prod = ação do Marcel**; dump
  regenerado como prova.
- **B6-D9**: o invariante 1..N estende-se ao DELETE — função irmã
  `remove_setlist_song` na mesma migração (PR-3a); o DELETE passa a
  usá-la (PR-3b).
- **B6-D5′** (emenda da D5): a **paridade upload→delete é o contrato** —
  sanitização do upload = NFD + remoção de marcas diacríticas +
  `[^a-zA-Z0-9._-]` → `_`; gate = teste de paridade com conjunto de
  nomes hostis; extensão declarada em STORAGE.md.
- **§4.1**: leitura literal da D3 confirmada (append-only;
  inserção-com-deslocamento fica para o PRD do cliente nativo).
- **§9**: fatiamento aceito (3a/3b; ordem 1→2→3a→3b→4; D7 no ciclo de
  console da 3a).

Este documento não reabre decisão. Zero código de comportamento nesta
fase; **merge de toda PR é sempre ação do Marcel**.

Referências de medição: relatório do pre-check (2026-08-31, saída íntegra
em scratchpad `b6-campanha-saida.txt`); fatos com arquivo:linha do estado
da main `bce342e`.

## §0. Fatos de base medidos na fase de desenho

- `setlist_songs` tem **UNIQUE (setlist_id, position)** e ela **não é
  DEFERRABLE** — `supabase/schema.dump.sql:139-140`:
  ```sql
  ALTER TABLE ONLY "public"."setlist_songs"
      ADD CONSTRAINT "setlist_songs_setlist_id_position_key" UNIQUE ("setlist_id", "position");
  ```
  Consequência: renumerar com um único UPDATE ingênuo pode colidir por
  linha durante o statement (checagem da UNIQUE é imediata, por linha);
  a RPC do §2 usa duas fases dentro da MESMA transação.
- **Não há CHECK constraint sobre `position`** (premissa da fase 1 por
  negação — revisão 1 do aval) `[medido]`:
  ```
  $ sed -n '89,101p' supabase/schema.dump.sql
  CREATE TABLE IF NOT EXISTS "public"."setlist_songs" (
      "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
      "setlist_id" "uuid" NOT NULL,
      "content_id" "uuid" NOT NULL,
      "position" integer NOT NULL,
      "notes" "text",
      "created_at" timestamp with time zone DEFAULT "now"()
  );
  $ grep -n "CHECK" supabase/schema.dump.sql
  215/219/223/227: … WITH CHECK de policies (RLS) — únicos hits; ZERO
  CHECK constraint de tabela no dump inteiro.
  ```
  `position` é `integer NOT NULL` sem restrição de sinal — **negativos
  são permitidos**; a fase 1 por negação fica mantida e declarada.
- Guard de corpo existente: `lib/api-validation-middleware.ts:29-39`
  (`parseRequestBody`, `if (text.length > 1024 * 1024)` → 400
  `field:""`/`Invalid request body format` via middleware).
- `ls supabase/` → **somente `schema.dump.sql`**: não há `migrations/`
  nem `config.toml`. Scripts de banco (package.json:19-20) não leem nem
  aplicam migrações — geram artefatos do banco vivo:
  ```json
  "db:types": "supabase gen types typescript --project-id mlxjmpbdchmwplcfislt > types/database.types.ts",
  "db:dump": "supabase db dump -s public -f supabase/schema.dump.sql"
  ```
- **Sintaxe do §6 verificada contra a versão instalada** (revisão 6)
  `[medido]`: `pnpm list @supabase/supabase-js` → **2.89.0**; types
  empacotados (`@supabase/postgrest-js@2.89.0`,
  `dist/index.d.mts:852-877`) trazem:
  ```typescript
  order(column: string, options?: {
    ascending?: boolean;
    nullsFirst?: boolean;
    referencedTable?: string;
  }): this;
  /** @deprecated Use `options.referencedTable` instead of `options.foreignTable` */
  ```
  `referencedTable` é a forma vigente; `foreignTable` está deprecada.
- **Invariante 1..N no estado ATUAL dos dados** (revisão 4) `[medido]` —
  script read-only via service key (`b6-item4-invariante.ts`: por
  setlist, `count/min/max/distinct` de `position`, TODAS as contas):
  ```
  setlists (todas as contas): 8 · setlist_songs: 107
  OK   user=6b2da77b… "Mikio e Seus Teclados" count=4 min=1 max=4 distinct=4
  OK   user=6b2da77b… "Season 3" count=23 min=1 max=23 distinct=23
  OK   user=auvL2KKs… "adasda" count=0 min=null max=null distinct=0
  OK   user=Pw3bxXZw… "UX-AUDIT Estresse" count=60 min=1 max=60 distinct=60
  OK   user=Pw3bxXZw… "UX-AUDIT Show padrão" count=8 min=1 max=8 distinct=8
  OK   user=Pw3bxXZw… "UX-AUDIT Solo" count=1 min=1 max=1 distinct=1
  OK   user=xVDJRBh1… "Good Times" count=4 min=1 max=4 distinct=4
  OK   user=xVDJRBh1… "Season 3" count=7 min=1 max=7 distinct=7
  violações do invariante 1..N: 0
  ```
  **Zero violações — saneamento único NÃO é necessário** no estado
  medido. O mesmo script roda de novo no ciclo da PR-3b (pré-merge) como
  revalidação; se algo tiver quebrado até lá, o saneamento (leitura
  antes/depois, precedente O-1) entra como passo declarado da 3b.
- Consumidor do move-one: `lib/setlist-service.ts:332`
  (`updateSongPosition`) é importada em `components/setlist-manager.tsx:13`
  e **nunca invocada** (handler da UI é `TODO` na :279; única chamada em
  `.tsx.backup`, fora da compilação). Zero consumidores vivos.

---

## 1. Contrato da rota de reorder em lote (D1 + D4)

### 1.1 URL, método, família

**`PUT /api/setlists/[id]/songs/order`** (arquivo novo
`app/api/setlists/[id]/songs/order/route.ts`).

- `PUT` no sub-recurso `order`: o payload substitui A ORDEM da coleção,
  nunca sua composição — `PUT` na coleção `songs` sugeriria substituir os
  membros, que este contrato proíbe (permutação exata, §1.3).
- Setlist no path (como o addSong), não no body: mata a classe do L2.3/L2.4
  do pre-check (setlistId do body divergente do recurso da URL).
- Rate limit: família **`setlist-mutate`**, `RATE_LIMITS.MUTATE`.
- Middleware: **`withBodyValidation`** (o mesmo do addSong,
  `app/api/setlists/[id]/songs/route.ts:12-14`) — auth + rate limit +
  `parseRequestBody` (guard de 1MB, D4) + Zod + envelope, tudo pelo ponto
  único. A rota nasce sem nenhum `request.json()` cru.

### 1.2 Schema Zod proposto (verbatim, para lib/api-schemas.ts)

```typescript
  // PUT /api/setlists/[id]/songs/order — reorder em LOTE (B6-D1): o array
  // é a ordem completa, permutação EXATA dos setlist_songs da setlist
  // (posse/existência a rota checa; permutação a RPC checa na transação —
  // B6-D2). max(100) alinhado ao songs[] do create.
  reorder: z.object({
    order: z.array(commonSchemas.objectId).min(1).max(100)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        'Duplicate song id in order'
      ),
  }).strict(),
```

Limitação declarada: setlist com >100 músicas não reordena por este
contrato (o create já limita `songs` a 100 em `lib/api-schemas.ts:329`;
o addSong não tem teto de contagem — se um dia estourar 100, o teto do
reorder sobe junto do teto do create, decisão à parte).

### 1.3 Invariante de entrada e mapa de erros

O array deve ser **permutação exata** do conjunto de `setlist_songs.id` da
setlist: mesmos IDs, sem faltas, sem sobras, sem duplicatas. Mapa completo
(só codes existentes do `docs/api/CONTRATO-DE-ERRO.md` — **nenhum code
novo é necessário**):

| Violação | Onde detecta | Status | code | field | Mensagem |
|---|---|---|---|---|---|
| Sem credencial | funil de auth | 401 | AUTH_REQUIRED | — | canônica |
| Rate limit | middleware | 429 | RATE_LIMITED | — | canônica + retryAfter |
| Corpo >1MB / JSON malformado | parseRequestBody | 400 | VALIDATION_ERROR | `""` | `Invalid request body format` |
| Chave desconhecida | Zod strict | 400 | VALIDATION_ERROR | uma por chave (D7 do B3) | `Unrecognized key: '…'` |
| Item não-UUID / array vazio / >100 | Zod | 400 | VALIDATION_ERROR | `order` (ou `order.N`) | issue do Zod |
| **Duplicata no array** | Zod refine | 400 | VALIDATION_ERROR | `order` | `Duplicate song id in order` |
| **Setlist inexistente OU alheia** | rota (query `id`+`user_id`, padrão addSong :22-39) | 404 | NOT_FOUND | — | `Setlist not found` (byte-idêntico ao do addSong — D2 do B3, sem oráculo) |
| **Faltando / sobrando / ID de outra setlist / corrida detectada** | RPC (SQLSTATE `OB601`, §2) | 400 | VALIDATION_ERROR | `order` | `order must contain exactly the songs of the setlist` |

Nota anti-oráculo: as classes de mismatch (falta, sobra, ID alheio,
corrida com addSong) saem **byte-idênticas** — a resposta não distingue
"esse ID existe em outra setlist" de "esse ID não existe", nem revela
contagens. O caso "setlist de OUTRO usuário" real permanece coberto pelo
padrão 404-idêntico e, em teste, por unit test mockado (como no B3) — em
preview segue não-avaliável (sem segundo usuário).

### 1.4 Resposta de sucesso

**200 com a ordem canônica renumerada**:

```json
{ "songs": [ { "id": "<setlist_song uuid>", "position": 1 }, … ] }
```

Argumento voltado ao cliente nativo: o drag-and-drop reordena otimista e
dispara o PUT; devolver o estado canônico permite reconciliar sem um GET
subsequente (que custaria as queries do §6 inteiras) e torna o 200
auto-verificável nos gates (a resposta É a leitura). Custo zero de query
extra: a RPC devolve as linhas renumeradas (§2.1, `RETURNS TABLE`).
`{success: true}` foi considerado e descartado: é o shape da rota que está
morrendo e não dá ao nativo nenhuma verdade do servidor.

### 1.5 Remoção do move-one

Sai (na PR-3b, §9):

- `app/api/setlists/songs/[songId]/route.ts`: o handler PUT
  (`updateSongPositionHandler`, linhas 156-311, + wrapper 314-327 e o
  `export const PUT`). **O DELETE do mesmo arquivo FICA** (e passa a
  chamar a função irmã da D9 — §2.4).
- `lib/api-schemas.ts:343-353`: schema `updateSongPosition` + comentário.
- `lib/setlist-service.ts:332-370`: função `updateSongPosition` (cliente
  sem chamador vivo) + import morto em `components/setlist-manager.tsx:13`.

Destino dos 7 testes do pre-check §6
(`app/api/setlists/songs/[songId]/__tests__/route.test.ts`):

| Teste atual | Destino |
|---|---|
| G-D2 PUT: song de outro usuário → 404 | **migra**: setlist alheia → 404 na rota nova (mock) |
| G-PGRST116 PUT: songId inexistente → 404 | **migra**: vira ID inexistente DENTRO de `order` → 400 mismatch (a classe "recurso da URL inexistente" vira "setlist inexistente → 404", já coberta) |
| 401 PUT: envelope authRequired | **migra**: 401 da rota nova |
| SEM ORÁCULO: 404 byte-idêntico | **migra**: byte-identidade dos 404 (alheia × inexistente) E dos 400 de mismatch (falta × sobra × alheio) na rota nova |
| G-D2 DELETE / G-PGRST116 DELETE / 401 DELETE | **ficam** (contrato do DELETE não muda; o miolo passa a ser a RPC da D9 — os mocks trocam de query para `rpc`) |

Novos, sem equivalente no velho: duplicata → 400; permutação incompleta →
400; guard 1,2MB → 400 `field:""`; sucesso devolve ordem canônica.

---

## 2. Funções RPC (D2 + D9)

### 2.1 `reorder_setlist_songs` — assinatura e corpo (rascunho SQL, rev. 1 e 2 do aval)

```sql
create or replace function public.reorder_setlist_songs(
  p_setlist_id uuid,
  p_song_ids   uuid[]
) returns table (id uuid, position integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_n    integer := coalesce(array_length(p_song_ids, 1), 0);
  v_rows integer;
begin
  -- serializa reorders/removes concorrentes na MESMA setlist
  perform 1 from setlists s where s.id = p_setlist_id for update;
  if not found then
    raise exception 'SETLIST_NOT_FOUND' using errcode = 'OB602';
  end if;

  -- permutação exata: mesma contagem, todos os IDs da setlist, sem
  -- duplicata (defesa em profundidade — o Zod já barrou duplicata antes)
  if (select count(*) from setlist_songs ss
       where ss.setlist_id = p_setlist_id) <> v_n
     or (select count(distinct u) from unnest(p_song_ids) u) <> v_n
     or exists (
       select 1 from unnest(p_song_ids) u(sid)
       left join setlist_songs ss
         on ss.id = u.sid and ss.setlist_id = p_setlist_id
       where ss.id is null)
  then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- fase 1: tira todo mundo da faixa 1..N. A UNIQUE (setlist_id,
  -- position) não é DEFERRABLE (dump:140) e NÃO há CHECK de sinal na
  -- coluna (§0 — medido): negativos são legais e nunca colidem entre si
  -- porque as positions de partida são únicas.
  update setlist_songs ss set position = -ss.position
   where ss.setlist_id = p_setlist_id;
  get diagnostics v_rows = row_count;
  if v_rows <> v_n then
    -- um INSERT commitou entre a checagem e a fase 1 (addSong é
    -- transação independente e não segura o lock da setlist): abortar —
    -- rollback total, nada parcial commitado
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- fase 2: ordem do array = ordem final, 1..N contíguo por construção
  update setlist_songs ss
     set position = o.ord
    from unnest(p_song_ids) with ordinality as o(sid, ord)
   where ss.id = o.sid and ss.setlist_id = p_setlist_id;
  get diagnostics v_rows = row_count;
  if v_rows <> v_n then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- cinto final: nenhuma linha pode restar fora de 1..N
  if exists (select 1 from setlist_songs ss
              where ss.setlist_id = p_setlist_id and ss.position < 1) then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- a mudança de músicas muda a setlist (regra do PR-5 do B2, agora
  -- DENTRO da transação — o bump não pode mais se perder sozinho)
  update setlists s set updated_at = now() where s.id = p_setlist_id;

  return query
    select ss.id, ss.position from setlist_songs ss
     where ss.setlist_id = p_setlist_id order by ss.position;
end;
$$;

revoke all on function public.reorder_setlist_songs(uuid, uuid[]) from public;
grant execute on function public.reorder_setlist_songs(uuid, uuid[]) to service_role;
```

### 2.2 Decisões internas, com argumento

- **SECURITY INVOKER**: o único chamador é o service role (grant
  explícito; revoke de `public` tira a função da superfície do PostgREST
  para `anon`/`authenticated`). DEFINER não compra nada — o invoker já
  bypassa RLS — e alargaria o dano de um grant errado no futuro.
- **Posse checada FORA (na rota), permutação DENTRO (na função)**: a
  função roda como service role e não tem o uid do Firebase (não há JWT
  de usuário no caminho — padrão de todas as rotas desde o B2); a rota
  faz o gate de posse com a query filtrada por `user_id` que já produz o
  404 sem oráculo (padrão addSong). A checagem de permutação precisa
  estar DENTRO da transação: checar na rota e escrever depois reabriria a
  janela TOCTOU. `SETLIST_NOT_FOUND` na função é cinto para o intervalo
  rota→RPC em que a setlist é deletada: a rota o traduz em 404 (mesmo
  corpo do gate).
- **Exceção → envelope por SQLSTATE, não por mensagem** (revisão 7,
  adotada): cada `raise` sai com `using errcode` custom — `OB601`
  (mismatch/corrida), `OB602` (setlist sumiu), `OB603` (song sumiu, na
  irmã §2.4). O PostgREST propaga o SQLSTATE no campo `code` do corpo de
  erro e o `PostgrestError` do supabase-js o expõe em `error.code` — a
  rota traduz **por `error.code`**, nunca por `error.message` (imune a
  mudança de texto e à regra D6 do B3: mensagem de dependência não
  navega). `OB601` → 400 canônico do §1.3; `OB602`/`OB603` → 404
  canônico; qualquer outro code → 500 `internalError()` com detalhe só no
  log. O probe pós-aplicação da PR-3a (§8) confirma ao vivo que o code
  atravessa a pilha.
- **1..N contíguo sem tempOffset**: a fase 2 grava `ordinality` = 1..N de
  um array que a checagem provou ser permutação exata — contiguidade por
  construção. O expediente `tempOffset = 10000` (route.ts:231 atual)
  morre com a rota velha.
- **Concorrência (reescrito na revisão 2)**: o `for update` na linha da
  setlist serializa reorder×reorder e reorder×remove (a irmã toma o mesmo
  lock) — last-writer-wins de ORDEM COMPLETA, sem estado misto. A janela
  real é **addSong×reorder**: o addSong não toma o lock (INSERT direto) e
  roda em transação própria. **Sem os guards**, um addSong commitado
  entre a checagem e a fase 1 entraria na negação (fase 1 tocaria N+1
  linhas), ficaria FORA do array da fase 2 e terminaria **commitado em
  position negativa, silenciosamente** — corrupção real, não "UNIQUE
  falhando ruidosamente" (a UNIQUE não vê nada de errado em -7). **Com os
  guards**, cada desfecho é seguro por construção: (a) addSong commita
  antes da fase 1 → `row_count` da fase 1 dá N+1 ≠ N → `OB601` →
  rollback total (400; o cliente relê e reenvia com a música nova); (b)
  addSong commita depois da fase 1 → não vê negativos (estado
  não-commitado é invisível fora da transação) → insere em max+1 do
  snapshot commitado e a lista final fica 1..N + a nova em N+1 —
  contígua; (c) qualquer resto anômalo cai no cinto final `position < 1`
  → rollback. Negativos **nunca** são visíveis fora da transação
  (atomicidade): nenhum estado commitado contém posição negativa.

### 2.3 (movido para §2.4 — a nota PARA VETO virou decisão D9)

### 2.4 `remove_setlist_song` — função irmã (D9)

O DELETE atual fecha o buraco com loop de UPDATEs sequenciais não-atômico
(`songs/[songId]/route.ts:94-121`) — falha no meio viola o invariante.
Com a D9, mesma migração e mesma mecânica:

```sql
create or replace function public.remove_setlist_song(
  p_song_id uuid
) returns table (id uuid, position integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_setlist_id uuid;
  v_rem  integer;
  v_rows integer;
begin
  select ss.setlist_id into v_setlist_id
    from setlist_songs ss where ss.id = p_song_id;
  if not found then
    raise exception 'SONG_NOT_FOUND' using errcode = 'OB603';
  end if;

  -- mesmo lock da reorder: serializa remove×reorder e remove×remove
  perform 1 from setlists s where s.id = v_setlist_id for update;

  delete from setlist_songs ss where ss.id = p_song_id;

  -- renumeração pelas MESMAS duas fases, com os MESMOS guards
  update setlist_songs ss set position = -ss.position
   where ss.setlist_id = v_setlist_id;
  get diagnostics v_rem = row_count;

  -- ordem original preservada: positions eram únicas; negadas, o desc
  -- reproduz o asc original — row_number renumera 1..N contíguo mesmo
  -- que houvesse gap herdado
  update setlist_songs ss
     set position = t.rn
    from (select ss2.id, row_number() over (order by ss2.position desc) as rn
            from setlist_songs ss2
           where ss2.setlist_id = v_setlist_id) t
   where ss.id = t.id;
  get diagnostics v_rows = row_count;
  if v_rows <> v_rem then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;
  if exists (select 1 from setlist_songs ss
              where ss.setlist_id = v_setlist_id and ss.position < 1) then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  update setlists s set updated_at = now() where s.id = v_setlist_id;

  return query
    select ss.id, ss.position from setlist_songs ss
     where ss.setlist_id = v_setlist_id order by ss.position;
end;
$$;

revoke all on function public.remove_setlist_song(uuid) from public;
grant execute on function public.remove_setlist_song(uuid) to service_role;
```

A rota DELETE mantém o contrato externo intacto (gate de posse via join —
`route.ts:46-77` — e resposta `{success: true}`); o miolo (delete + loop
de shift + bump) vira UMA chamada `rpc('remove_setlist_song', …)`, com a
mesma tradução por `error.code` do §2.2. Guard addSong×remove: idêntico ao
da reorder — `row_count` da fase 1 é lido DEPOIS dela; um INSERT
commitado antes entra na contagem e nas duas fases (renumerado junto,
lista contígua) ou dispara o cinto final; nada silencioso.

---

## 3. B6-D8 (ex-Q8) — versionamento da migração: DECIDIDA, opção B

**Decisão do aval (2026-08-31)**: arquivo
`supabase/migrations/<timestamp>_b6_setlist_songs_rpc.sql` no repo (as
DUAS funções do §2 + revoke/grant), revisado como código na PR-3a;
**aplicação em prod = ação do Marcel** (console ou CLI dele; o CLI só é
necessário para aplicar — criar o arquivo não exige `supabase init`);
`pnpm db:dump` + `pnpm db:types` regenerados como prova pós-aplicação (a
função aparece no dump e em `Functions` do types).

Registro dos trade-offs que sustentaram a decisão (medidos no §0): a
pasta não existia; `db:types`/`db:dump` não interagem com migrações; na
opção A a função só seria revisável como diff de artefato gerado — e a
régua do CLAUDE.md é que dump/types provam, não definem.

**Teste local da RPC: não existe caminho** — não há Supabase local
(`config.toml` ausente) e a suíte moca o client. O que a suíte prova SEM
banco: mapeamento `error.code`→envelope, schema Zod, gate de posse, shape
do 200 (com `rpc` mockado). O que só preview/prod prova: o SQL — coberto
pelos probes do §8.

CLAUDE.md ganha na PR-3a a seção: migrações vivem em
`supabase/migrations/`; aplicação em prod é passo do Marcel; dump/types
regenerados são a prova, nunca a fonte.

---

## 4. addSong (D3 — leitura literal confirmada no aval)

### 4.1 Alteração (route.ts:73-76)

Hoje (medido L1):

```typescript
      const currentMaxPosition = (maxPositionResult as { position: number } | null)?.position || 0
      const actualPosition = position == null
        ? currentMaxPosition + 1
        : Math.max(position, currentMaxPosition + 1)
```

Proposto:

```typescript
      const currentMaxPosition = (maxPositionResult as { position: number } | null)?.position || 0
      // B6-D3: position é sugestão SEMPRE recalculada — o clamp a max+1
      // elimina o gap (L1.4 do pre-check: 99 persistia verbatim e se
      // propagava). Consequência decidida no aval: addSong é append-only;
      // a position enviada nunca altera o resultado e o 201 devolve a
      // real. Inserção-com-deslocamento: PRD do cliente nativo.
      const actualPosition = currentMaxPosition + 1
```

### 4.2 Comentário do schema (api-schemas.ts:355-361)

```typescript
  addSong: z.object({
    content_id: commonSchemas.objectId,
    // B6-D3: a exceção deliberada à política D1 (B2) está ENCERRADA —
    // position é aceita por compatibilidade e SEMPRE recalculada para
    // max+1 (append; gap impossível por construção). O invariante
    // contíguo 1..N de setlist_songs é contrato (docs/api/SETLISTS.md);
    // o 201 devolve a position real.
    position: z.number().int().min(0).nullish(),
    notes: commonSchemas.safeText.nullish(),
  }).strict(),
```

### 4.3 addSong × RPC

**Fica FORA das funções.** Inserir em max+1 preserva 1..N trivialmente se
o invariante valia antes (§0: vale, 0 violações em 8 setlists/107 songs);
um INSERT é atômico por si; a corrida addSong×addSong (dois leem max=N,
dois tentam N+1) morre na UNIQUE com falha ruidosa — para ESTA corrida a
UNIQUE é guard suficiente, porque aqui as duas escritas disputam a MESMA
position (diferente da janela addSong×reorder do §2.2, onde a UNIQUE não
via a corrupção). Comportamento idêntico ao atual, resíduo `[análise]`
aceito. A corrida addSong×reorder e addSong×remove ficam cobertas pelos
guards de `row_count` DENTRO das funções (§2.2/§2.4).

---

## 5. D5′ no upload (paridade upload→delete como contrato)

### 5.1 Diff proposto (upload/route.ts:55)

```diff
-    const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').trim()
+    // B6-D5' (emenda da D5/B5-D11): a PARIDADE upload→delete é o
+    // contrato — todo path produzido aqui DEVE casar a regex do delete
+    // (delete/route.ts:46, [a-zA-Z0-9._-]). NFD + remoção de marcas
+    // diacríticas preserva o legível (coração→coracao); o resto vira '_'.
+    const sanitizedFilename = filename
+      .normalize('NFD')
+      .replace(/[\u0300-\u036f]/g, '')
+      .replace(/[^a-zA-Z0-9._-]/g, '_')
```

Notas declaradas:

- O `.trim()` atual morre: depois da classe `[^a-zA-Z0-9._-]` → `_` não
  sobra whitespace para aparar (mudança declarada, não silenciosa).
- O guard `sanitizedFilename.length === 0` existente (route.ts:56-60)
  permanece — continua inalcançável na prática (a classe substitui, não
  remove), mas é cinto barato.
- Emoji e qualquer caractere fora do ASCII sem decomposição NFD viram
  `_` **por unidade de código UTF-16** (um emoji = 2 `_`) — cosmético,
  declarado.
- O schema `commonSchemas.filename` (api-schemas.ts:48) não muda: nome
  hostil continua ACEITO na entrada; a normalização é declarada e o 201
  devolve o `path` real (como hoje, medido L4.1). A checagem
  `mimeMatchesExtension` roda sobre o nome já sanitizado — a extensão
  sobrevive intacta (`.` está na classe preservada).
- `STORAGE.md`: seção de naming ganha a regra completa (NFD + marcas
  diacríticas removidas + `[^a-zA-Z0-9._-]`→`_`) e a declaração de
  paridade como contrato. O casado `1750171474983-Easy - Guitar.pdf`
  segue indeletável pela rota — consequência aceita da B5-D11
  (precedente console).

### 5.2 Gate: TESTE DE PARIDADE (repertório B5) + it.fails→it

Unit test de paridade na suíte (storage mockado): para CADA nome do
conjunto hostil, o `uniqueFilename` passado ao `.upload()` DEVE (a) casar
a regex do delete `/^\d+-[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/` e (b) passar em
`storageSchemas.delete.safeParse`. Conjunto hostil e resultado esperado:

| Nome enviado | Path esperado (após `<ts>-`) |
|---|---|
| `b6 precheck.txt` (espaço) | `b6_precheck.txt` |
| `demo\tfinal.txt` (tab) | `demo_final.txt` |
| `coração é ação.pdf` (acentos) | `coracao_e_acao.pdf` |
| `Show (acústico).pdf` (parênteses) | `Show__acustico_.pdf` |
| `d'água & cia.txt` (apóstrofo, &) | `d_agua___cia.txt` |
| `hino #1 + bis.pdf` (#, +) | `hino__1___bis.pdf` |
| `[ao vivo].pdf` (colchetes) | `_ao_vivo_.pdf` |
| `🎸riff.txt` (emoji) | `__riff.txt` (2 `_` por emoji, declarado) |

Todos os nomes acima passam o schema de entrada (a regex do
`commonSchemas.filename` só proíbe `<>:"/\|?*`). Rito **it.fails→it, dois
commits na ordem**: commit 1 — o teste de paridade falha no código atual
em TODOS os casos exceto os já-limpos (o L4.1 provou ao vivo o espaço
preservado; acentos/&/parênteses idem por leitura da regex atual); commit
2 — diff do §5.1, teste vira `it`. Replay em preview (balanço zero): L4
refeito na branch → 201 com `b6_precheck.txt` no path + **delete → 200**
(o par fecha; saldo volta a 7 SEM console) + um nome acentuado → 201/
delete 200; contraste com prod (201 com espaço) antes do merge.

---

## 6. N+1 no GET /api/setlists (D6)

### 6.1 Query única proposta (embedding PostgREST)

As FKs existem (`setlist_songs_setlist_id_fkey`, dump:189-190;
`setlist_songs_content_id_fkey`, dump:184-185); a sintaxe do `order` com
tabela referenciada está verificada contra o supabase-js **2.89.0**
instalado (§0 — `referencedTable`, `foreignTable` deprecado):

```typescript
    const { data: setlists, error } = await supabase
      .from('setlists')
      .select(`*, setlist_songs ( id, setlist_id, content_id, position, notes,
        content ( id, title, artist, content_type, key, bpm, file_url, content_data ) )`)
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false })
      .order('position', { referencedTable: 'setlist_songs', ascending: true })
```

O mapeamento JS atual (route.ts:78-100, fallbacks `Unknown Title` etc.)
permanece, só trocando a fonte (o `content` embutido no lugar do
`contentMap`) — o shape é construído pelo MESMO código, chave a chave.

**Delta declarado**: a query atual de content filtra `user_id`
(route.ts:63); o embedding segue a FK sem esse filtro. Diferença
observável apenas se existisse `setlist_song` apontando para content de
OUTRO usuário — estado inalcançável pelos caminhos de escrita (addSong e
create validam posse; pre-check §1 e route.ts:42-53) e inexistente nos
dados. Declarado, não silencioso.

### 6.2 Gate de invariância (regra 7)

Reuso do contador do pre-check §3 (`b6-item3-n1-count.ts`, wrapper de
fetch sobre o handler real): **esperado 7 → 1 para N=3** na mesma conta de
audit. Byte-identidade: capturar o JSON do handler atual e o do novo na
mesma conta/estado e exigir diff vazio (`diff <(old) <(new)`). O contador
no código VELHO é o controle negativo natural (acusa 7); o teste unitário
da rota afirma o shape com os fallbacks.

---

## 7. WITH CHECK (D7)

SQL para o console do Marcel (4 ALTERs, expressões espelhando o USING
medido no dump:207-256 e no pg_policies colado por ele no pre-check):

```sql
alter policy "Service role access to setlists" on public.setlists
  with check ((auth.role() = 'service_role'::text));

alter policy "User owns setlists" on public.setlists
  with check ((user_id = (auth.jwt() ->> 'uid'::text)));

alter policy "Service role access to setlist songs" on public.setlist_songs
  with check ((auth.role() = 'service_role'::text));

alter policy "User owns setlist songs" on public.setlist_songs
  with check ((EXISTS ( SELECT 1 FROM public.setlists
    WHERE setlists.id = setlist_songs.setlist_id
      AND setlists.user_id = (auth.jwt() ->> 'uid'::text))));
```

Prova antes/depois (mesmo SQL do pre-check §4, já validado no console):

```sql
select tablename, policyname, cmd,
       (qual is not null)       as has_using,
       (with_check is not null) as has_with_check
from pg_policies
where schemaname = 'public' and tablename in ('setlists','setlist_songs')
order by tablename, policyname;
```

Esperado: os 4 `has_with_check` das policies ALL viram `true`; demais
inalterados. Pelo aval do §9, este SQL roda **no mesmo ciclo de console da
PR-3a** (uma sessão, um dump regenerado que prova migração + policies).
Nota `[análise]` do pre-check mantida: o Postgres aplica USING como check
quando WITH CHECK falta em policy ALL — o ganho é explícito-sobre-
implícito + defesa em profundidade declarada (o app escreve via service
role, que bypassa RLS).

---

## 8. Plano de provas — regra nº 7, gate a gate

| Gate | Controle negativo | Mecânica |
|---|---|---|
| D5′ paridade | **it.fails→it** com o conjunto hostil do §5.2 | falha provada no código atual (L4.1 ao vivo para espaço; leitura da regex para o resto); flip no commit 2; replay L4 + acento em preview, par upload→delete fechando com saldo 7 |
| D3 gap no addSong | **it.fails→it**: mock com max=6, `position: 99` → assert `insert` com `position: 7` | falha hoje (L1.4: gravou 99); flip com o diff §4.1; replay L1.4 na branch (201 → max+1) × prod (99) |
| D4 guard 1,2MB | **contraste vivo branch × prod**: replay do L2.1 na rota nova → 400 `field:""` `Invalid request body format`; em prod o L2.1 medido deu `unrecognized_keys` após parse integral (956ms) | a rota nasce com o guard — não há "código velho da mesma rota" para it.fails; o contraste de envelopes é o controle (técnica do B5 PR-2) |
| D1 permutação inválida | unit tests nascem com a rota + **replay dos probes "sem análogo" do pre-check, agora com análogo**: array incompleto → 400; duplicado → 400; ID de setlist própria alheia ao recurso → 400 | sensibilidade: os 400 de mismatch DEVEM ser byte-idênticos entre si (anti-oráculo) — assert de igualdade literal dos corpos |
| D2 errcode atravessa | probe pós-aplicação da PR-3a: `rpc()` direto via service key com mismatch → assert `error.code === 'OB601'` | prova que o SQLSTATE custom chega ao `PostgrestError.code` antes de qualquer rota depender disso |
| D2 rollback | **probe de rollback com restauração por natureza**: estado lido ANTES; rota com array válido MENOS um ID → 400; estado DEPOIS colado e idêntico | prova que a violação aborta a transação inteira (guards de `row_count` + cinto `position < 1`); nenhuma restauração manual |
| D2 concorrência (lado novo) | **P1-K na branch**: setlist semeada com 8 músicas; K=6 permutações DISTINTAS via `Promise.all` contra a rota nova; gate: estado final ∈ {perm₁…perm₆} **e** invariante exato 1..8 | qualquer estado misto reprova; o `for update` é o mecanismo que o velho não tinha |
| D2 concorrência (lado prod — revisão 5) | **P1-K contra o move-one EM PROD, ANTES do merge da 3b**: setlist semeada (balanço zero), K=6 moves concorrentes, mesma varredura (positions > N, duplicatas, ≥10000) | resultado registra como **controle negativo medido** (estado misto/vazamento observado no mecanismo velho) OU como **"não reproduzido em K=6"** — nunca como argumento. Plano de lotes: ~10 requests na família `setlist-mutate` (teto 120/15min), apresentado para aprovação antes de disparar (rito do pre-check) |
| D9 remove | it.fails→it no unit da rota DELETE (mock `rpc`) + replay do DELETE em preview com leitura de contiguidade pós-remoção | o loop sequencial velho é o controle de leitura (pre-check §2); a prova viva é a contiguidade 1..N-1 após remover do MEIO |
| D6 N+1 | **gate de invariância**: contador do §6.2 (7→1) + diff byte-a-byte do JSON | o contador no código velho acusa 7 — controle embutido |
| D7 | pg_policies antes/depois (§7) + diff do dump regenerado | o "antes" já está medido e colado |
| Estado dos dados (revisão 4) | revalidação do invariante com `b6-item4-invariante.ts` no ciclo da PR-3b (pré-merge) | baseline desta revisão: **0 violações em 8 setlists/107 songs** (§0); se divergir, saneamento único com leitura antes/depois (precedente O-1) entra como passo declarado da 3b |

Prova destrutiva de falha-no-meio da transação segue **não executável**
sem injeção de falha — declarado; o rollback-probe e os guards de
`row_count` são o substituto no nível da função. Toda validação em
preview usa URL de branch (≠ main), bypass por header em fetch Node,
`--retries=0`, semeadura própria com balanço zero e leitura antes/depois.

---

## 9. Fatiamento em PRs (aceito no aval; D9 incorporada)

| PR | Conteúdo | Flip observável | Depende de |
|---|---|---|---|
| **PR-0** | docs-only: este desenho (rev. 1) versionado | — | aval da revisão |
| **PR-1** | D5′: sanitização NFD+classe no upload + teste de paridade + STORAGE.md | par upload→delete fecha para TODO o conjunto hostil (replay com saldo 7) | — |
| **PR-2** | D3: append-only no addSong + comentário do schema | L1.4 replay: 201 devolve max+1, gap impossível | — |
| **PR-3a** | D2+D8+D9: `supabase/migrations/<ts>_b6_setlist_songs_rpc.sql` (AS DUAS funções + revoke/grant) + **aplicação pelo Marcel** (mesmo ciclo de console roda o SQL da D7) + `db:dump`/`db:types` regenerados + CLAUDE.md (fluxo de migração) + probe do errcode | funções existem no banco (probe `rpc` via service key: `OB601` no mismatch, 200-shape no válido) + diff do dump | aval da rev. 1 |
| **PR-3b** | D1+D4+D9-rota: rota nova (`withBodyValidation` + RPC) + DELETE passa a `rpc('remove_setlist_song')` + remoção do move-one (rota PUT, schema, service, import morto) + migração dos 7 testes (§1.5) + `docs/api/SETLISTS.md` + revalidação do invariante (§8) + **P1-K prod contra o move-one ANTES do merge** (revisão 5) | contrato novo responde; move-one → 404 de rota inexistente; L2.1 replay → 400 `field:""`; P1-K branch limpo | PR-3a aplicada |
| **PR-4** | D6: embedding no GET | contador 7→1 + byte-identidade | — (depois da 3b por higiene de rebase) |
| **ENC** | B6-ENCERRAMENTO.md | — | tudo acima |

Ordem: **1 → 2 → 3a → 3b → 4** (aval). Banco primeiro (3a antes da 3b) —
precedente da B5-D4. D7 roda no ciclo de console da 3a (uma sessão, um
dump). **Merge de cada PR: ação do Marcel, sempre** — checkpoint com diff
verbatim na resposta antes de cada pedido de merge (régua do B5 mantida).

---

## 10. Documentação

| Doc | Ação |
|---|---|
| `docs/api/SETLISTS.md` | **novo** (PR-3b): contrato de addSong (append-only, position aceita-e-recalculada, 201 fiel) + reorder em lote (URL, schema, invariante de permutação, mapa de erros §1.3, resposta 200) + DELETE renumerando por RPC (D9) + **invariante contíguo 1..N declarado como contrato da tabela** |
| `docs/api/STORAGE.md` | PR-1: regra completa de naming da D5′ (NFD + marcas removidas + classe→`_`) + paridade upload→delete declarada como contrato |
| `docs/api/CONTRATO-DE-ERRO.md` | **sem mudança** — nenhum code novo (§1.3); a lista continua 5 (os SQLSTATEs OB6xx são internos banco→rota, nunca aparecem no envelope) |
| `CLAUDE.md` | PR-3a (D8): seção de banco ganha "migrações em `supabase/migrations/`; aplicação em prod = passo do Marcel; dump/types provam, não definem" |
| `lib/api-schemas.ts` | PR-2: comentário do addSong (§4.2, exceção encerrada); PR-3b: schema `reorder` entra, `updateSongPosition` sai |
| `types/database.types.ts` | PR-3a: `pnpm db:types` pós-aplicação (as duas funções aparecem em `Functions`) |

---

*Fase seguinte: aval desta revisão pelo Marcel (leitura verbatim), merge
da PR #253 (ação dele), então PR-1. Nenhuma linha dos §§1-7 vira código
antes disso.*
