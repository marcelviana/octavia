# B6 — DESENHO (position · reorder · D11) — Revisão 3

*(Rev. 3 = rev. 2 aprovada no mérito + duas adições do aval de
2026-09-01: inventário de escritores de `setlist_songs` no §0.1/§0.2 —
que registrou a **brecha (e)** do delete de content como decisão
pendente **B6-Q9** — e guard de double-delete no §2.4.)*

Fase de desenho do Bloco B6, sobre as decisões **B6-D1 a D7 fechadas pelo
Marcel em 2026-08-31**, com as emendas dos dois avais condicionados do
mesmo dia:

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
- **B6-D10** (aval da rev. 1): **o addSong também escreve via função** —
  `add_setlist_song` na MESMA migração, com o MESMO lock da linha-pai.
  Motivo: o addSong era o único escritor de `setlist_songs` sem o lock, e
  o interleaving *addSong lê max=N → remove completo commita (1..N-1) →
  addSong insere N+1* produz **gap silencioso em N que nenhum guard das
  outras funções vê** (§2.4 da rev. 1 afirmava "nada silencioso" — estava
  errado para este caso; corrigido no §2.5). **D3 fica FUNDIDA na
  função**: o `Math.max` do route.ts deixa de existir — max+1 é calculado
  DENTRO da transação. `position` do payload continua aceita e ignorada
  (D3). O shape do 201 é preservado **byte a byte** (medido, §0).
- **§4.1 (rev. 1)**: leitura literal da D3 confirmada (append-only;
  inserção-com-deslocamento fica para o PRD do cliente nativo).
- **§9**: fatiamento aceito (3a/3b; D7 no ciclo de console da 3a); com a
  D10, a PR-2 é proposta como **absorvida** na 3b (§9, com argumento).

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
  as funções do §2 usam duas fases dentro da MESMA transação.
- **Não há CHECK constraint sobre `position`** (premissa da fase 1 por
  negação) `[medido]` — coluna e saída LITERAL do grep (rev. 7 do aval):
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
  215:CREATE POLICY "User can insert own content" ON "public"."content" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'uid'::"text")));
  219:CREATE POLICY "User can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = ("auth"."jwt"() ->> 'uid'::"text")));
  223:CREATE POLICY "User can insert own setlists" ON "public"."setlists" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'uid'::"text")));
  227:CREATE POLICY "User can insert setlist songs" ON "public"."setlist_songs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
  ```
  Os 4 hits são `WITH CHECK` de policies (RLS) — **zero CHECK constraint
  de tabela** no dump inteiro. `position` é `integer NOT NULL` sem
  restrição de sinal: **negativos são permitidos**; a fase 1 por negação
  fica mantida e declarada.
- **Shape do 201 do addSong hoje** (base da paridade byte a byte da D10)
  `[medido ao vivo no pre-check, probe L1.1]`:
  ```
  ← 201
  {"id":"cfffae1e-9aef-4b04-a121-409979dbe079","setlist_id":"a698dab4-3d09-45eb-925f-fa7f9f0f4b23","content_id":"2e98efc7-92ec-4a2b-b11f-8e2a92a9d46f","position":4,"notes":null,"created_at":"2026-08-31T21:44:16.275869+00:00"}
  ```
  Chaves, na ordem: `id, setlist_id, content_id, position, notes,
  created_at` — exatamente as colunas da tabela na ordem do dump
  (:89-96). `returns setof public.setlist_songs` na função devolve a
  linha nessa MESMA ordem de colunas (§2.5); o gate de byte-identidade
  está no §8.
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
- **Sintaxe do §6 verificada contra a versão instalada** `[medido]`:
  `pnpm list @supabase/supabase-js` → **2.89.0**; types empacotados
  (`@supabase/postgrest-js@2.89.0`, `dist/index.d.mts:852-877`) trazem:
  ```typescript
  order(column: string, options?: {
    ascending?: boolean;
    nullsFirst?: boolean;
    referencedTable?: string;
  }): this;
  /** @deprecated Use `options.referencedTable` instead of `options.foreignTable` */
  ```
  `referencedTable` é a forma vigente; `foreignTable` está deprecada.
- **Invariante 1..N no estado ATUAL dos dados** `[medido]` — script
  read-only via service key (`b6-item4-invariante.ts`: por setlist,
  `count/min/max/distinct` de `position`, TODAS as contas):
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

### §0.1 Inventário de escritores de `setlist_songs` (rev. 3 do aval) `[medido]`

Comandos e saída LITERAL:

```
$ grep -rn "setlist_songs" app lib scripts --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v "\.test\." | grep -E "from\(|insert|update|delete|upsert" | grep -v "^\s*//"
app/api/setlists/route.ts:41:          .from("setlist_songs")
app/api/setlists/route.ts:192:          .from('setlist_songs')
app/api/setlists/songs/[songId]/route.ts:47:      .from("setlist_songs")
app/api/setlists/songs/[songId]/route.ts:84:      .from("setlist_songs")
app/api/setlists/songs/[songId]/route.ts:95:      .from("setlist_songs")
app/api/setlists/songs/[songId]/route.ts:112:          .from("setlist_songs")
app/api/setlists/songs/[songId]/route.ts:189:      .from('setlist_songs')
app/api/setlists/songs/[songId]/route.ts:214:      .from('setlist_songs')
app/api/setlists/songs/[songId]/route.ts:248:        .from('setlist_songs')
app/api/setlists/songs/[songId]/route.ts:287:        .from('setlist_songs')
app/api/setlists/[id]/route.ts:64:      .from("setlist_songs")
app/api/setlists/[id]/route.ts:223:        .from("setlist_songs")
app/api/setlists/[id]/route.ts:341:      .from("setlist_songs")
app/api/setlists/[id]/songs/route.ts:57:        .from("setlist_songs")
app/api/setlists/[id]/songs/route.ts:87:        .from("setlist_songs")
lib/content-service-server.ts:123:    .from("setlist_songs")

$ grep -rn "setlist_songs\|setlistSongs" scripts/ --include="*.ts" | grep -v test | head
scripts/ux-audit/cleanup.ts:5: * setlists (a rota DELETE já remove setlist_songs antes) → content →
scripts/ux-audit/cleanup.ts:40:  setlist_songs: Array<{ id: string }>
scripts/ux-audit/discover.ts:34:  setlist_songs: Array<{ id: string; position: number; content_id: string }>
scripts/ux-audit/discover.ts:101:    return { ...found, setlist_songs: [...found.setlist_songs].sort((a, b) => a.position - b.position) }
(demais hits de discover.ts: leituras de shape em memória)
```

Classificação, caminho a caminho (leituras — `route.ts:41/:47/:95/:189/
:214/:64/:223/:57` e `content-service-server.ts:123` são `.select()`,
fora do inventário de ESCRITA; verificado por leitura de cada trecho):

| Caminho | Operação | Classe |
|---|---|---|
| `app/api/setlists/route.ts:192` (POST create, `songs[]` inline) | INSERT multi-row | **(b) seguro por construção**: a setlist acabou de ser criada NA MESMA request — o id é desconhecido de terceiros até a resposta; positions 1..N atribuídas pelo servidor pela ordem do array (`rows.map((s, i) => … position: i + 1)`, :185-190); falha tem delete compensatório declarado (PR-5 do B2) |
| `app/api/setlists/[id]/songs/route.ts:87` (addSong) | INSERT | **(a) vira RPC** `add_setlist_song` (D10) |
| `app/api/setlists/songs/[songId]/route.ts:84` + `:112` (remove + shift) | DELETE + UPDATEs | **(a) vira RPC** `remove_setlist_song` (D9) |
| `app/api/setlists/songs/[songId]/route.ts:248` + `:287` (move-one) | UPDATEs 2N | **(a) rota REMOVIDA** (D1) |
| `app/api/setlists/[id]/route.ts:341` (DELETE da setlist: apaga as songs antes) | DELETE em massa | **(c)**: remoção do conjunto INTEIRO — o invariante fica vácuo (a setlist morre em seguida). Interleaving com addSong pós-D10: um insert que entre depois do `:341` morre no FK cascade do delete da setlist (`setlist_songs_setlist_id_fkey ON DELETE CASCADE`, dump:189-190), e o delete da linha de `setlists` serializa com o `for update` das funções. Nota `[análise]`: o delete explícito `:341` é redundante com o cascade — fica como está (fora do escopo) |
| Cascade `profiles`→`setlists`→`setlist_songs` (dump:194-196 + :189-190) | DELETE em cadeia | **(c)** vácuo (setlists morrem junto); sem rota — só console, e a regra operacional é nunca deletar `profiles` |
| `scripts/ux-audit/*` (cleanup/seed/discover) | via ROTAS da API | **(d)**: nenhuma escrita direta em `setlist_songs` no grep — cleanup deleta via rota DELETE da setlist (comentário `:5`), seed cria via rotas, discover só lê. Respeitam o contrato por construção |
| `app/api/content/[id]/route.ts:96-102` (DELETE de content) → FK `setlist_songs_content_id_fkey ON DELETE CASCADE` (dump:184-185) | DELETE indireto por cascade | **(e) BRECHA** — ver abaixo |

**PUT /api/setlists/[id] NÃO aceita `songs[]`** — verbatim do schema de
update (`lib/api-schemas.ts:336-341`): não-escritor por construção.

```typescript
  // update é SÓ metadados (decisão D2): songs aqui → 400 por chave
  // desconhecida (não strip). Reordenar/adicionar/remover têm rotas próprias.
  update: z.object({
    ...setlistMetadataFields,
    name: commonSchemas.createSafeText(1, 255).optional(),
  }).strict(),
```

**A brecha (e)** — verbatim do DELETE de content
(`app/api/content/[id]/route.ts:96-102`):

```typescript
    const { data: content, error } = await supabase
      .from('content')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid)
      .select()
      .single()
```

O handler apaga só a linha de `content`; o FK
`setlist_songs_content_id_fkey ON DELETE CASCADE` (dump:184-185) apaga
silenciosamente a música do **MEIO** de toda setlist que a referencie,
**sem renumeração** → gap real, fora de qualquer lock/guard do §2. O
estado atual não tem vítimas (§0: 0 violações em 8 setlists/107 songs),
mas o caminho existe desde sempre. **Registrada como decisão pendente
B6-Q9 (do Marcel, não decidida aqui)** — opções preparadas:

- **(i) fechar no B6**: 4ª função `delete_content_and_resequence(
  p_content_id, p_user_id)` na MESMA migração — coleta as setlists
  afetadas, toma os locks das linhas-pai **em ordem determinística de id**
  (anti-deadlock), deleta o content (cascade dispara dentro da transação)
  e renumera cada setlist afetada pelas duas fases; a rota de content
  troca o delete direto pela RPC. Custo: migração e PR-3b crescem.
- **(ii) adiar numerado**: registrar a janela no SETLISTS.md e no
  encerramento; o invariante fica declarado como "garantido pelos
  escritores de setlist, com a exceção conhecida do delete de content".

### §0.2 Consequência do inventário na terminologia

Onde a rev. 2 dizia "os TRÊS escritores", leia-se: **os três escritores
de produção pós-criação** (addSong, remove, reorder — classes (a), todos
sob o lock da D10) + o create inline (b, seguro por construção) + os
deletes em massa por cascade (c, vácuos) + o tooling via rotas (d) + a
brecha (e) do delete de content, pendente na B6-Q9. §2, §2.2 e §10
ajustados nesta revisão.

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

A tradução SQLSTATE→envelope é **por rota** (rev. 3 do aval) — tabela
completa no §2.2; nesta rota, `OB601` → o 400 acima e `OB602` → o 404
canônico do gate.

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

## 2. Funções RPC (D2 + D9 + D10)

A migração leva **TRÊS funções** — os três escritores de produção
pós-criação de `setlist_songs` (reorder, remove, addSong — inventário
completo com as demais classes no §0.1) passam a serializar no MESMO lock
da linha-pai (`setlists`), que é o mecanismo do invariante 1..N (D10). Comentário
obrigatório no SQL das três (rev. 1 do aval): as funções-tabela devolvem
colunas homônimas às da tabela (`id`, `position`) — **toda referência a
coluna sai qualificada** (`ss.`/`s.`/`o.`/`t.`) para não colidir com os
nomes de saída.

### 2.1 `reorder_setlist_songs` — assinatura e corpo (rascunho SQL)

```sql
-- NOTA (as 3 funções): os OUT-params/colunas de retorno id/position
-- colidem com nomes de coluna de setlist_songs — manter TODA referência
-- a coluna qualificada (ss./s./o./t.), nunca nua.
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
  -- lock único do invariante (D10): TODO escritor de setlist_songs
  -- serializa aqui
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
    -- com a D10 este ramo vira inalcançável (nenhum escritor entra sem
    -- o lock); fica como cinto — se disparar, invariante interno quebrou
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

- **SECURITY INVOKER** (as três): o único chamador é o service role
  (grant explícito; revoke de `public` tira as funções da superfície do
  PostgREST para `anon`/`authenticated`). DEFINER não compra nada — o
  invoker já bypassa RLS — e alargaria o dano de um grant errado.
- **Posse checada FORA (na rota), consistência DENTRO (na função)**: as
  funções rodam como service role e não têm o uid do Firebase (não há JWT
  de usuário no caminho — padrão desde o B2); cada rota mantém seu gate
  de posse 404 sem oráculo. As checagens de consistência
  (permutação/contagem) precisam estar DENTRO da transação — checar na
  rota e escrever depois reabriria a janela TOCTOU. `SETLIST_NOT_FOUND`/
  `SONG_NOT_FOUND` nas funções são cinto para o intervalo rota→RPC em que
  o recurso é deletado.
- **Exceção → envelope por SQLSTATE, não por mensagem** (rev. 7 do aval
  da rev. 0, mantida): `raise … using errcode` custom — `OB601`
  (mismatch/invariante interno), `OB602` (setlist sumiu), `OB603` (song
  sumiu). O PostgREST propaga o SQLSTATE no campo `code` e o
  `PostgrestError` do supabase-js o expõe em `error.code` — as rotas
  traduzem **por `error.code`**, nunca por `error.message` (regra D6 do
  B3). **Tradução POR ROTA** (rev. 3 do aval da rev. 1):

  | SQLSTATE | rota reorder | rota DELETE (remove) | rota addSong |
  |---|---|---|---|
  | `OB601` | **400** `field:"order"` (erro do cliente: array ≠ conjunto) | **500** `internalError()` | **500** `internalError()` |
  | `OB602` | **404** `Setlist not found` | **404** `Song not found` | **404** `Setlist not found` |
  | `OB603` | **500** `internalError()` (inalcançável aqui) | **404** `Song not found` | **500** `internalError()` (inalcançável aqui) |
  | outro | **500** `internalError()` | **500** `internalError()` | **500** `internalError()` |

  Racional do `OB601` → 500 em remove/addSong: com o lock da D10, os
  guards de `row_count` dessas funções são inalcançáveis; se dispararem,
  é **invariante interno quebrado**, não erro do cliente — 500 honesto,
  detalhe no log. No reorder, `OB601` é a resposta legítima a um array
  que não é permutação — erro do cliente, 400.
- **1..N contíguo sem tempOffset**: a fase 2 grava `ordinality` = 1..N de
  um array que a checagem provou ser permutação exata — contiguidade por
  construção. O expediente `tempOffset = 10000` (route.ts:231 atual)
  morre com a rota velha.
- **Concorrência**: com a D10, os três escritores de produção
  pós-criação tomam `for update` na linha da setlist — reorder×reorder,
  reorder×remove, addSong×qualquer serializam por construção;
  last-writer-wins de operação COMPLETA, sem estado misto. As demais
  classes do inventário (§0.1) não disputam: o create (b) escreve numa
  setlist que só ele conhece, os deletes em massa (c) são vácuos e
  serializam pelo lock/cascade da própria linha-pai; a exceção real é a
  brecha (e) do delete de content — pendente na B6-Q9. Os guards de `row_count` + cinto `position < 1`
  permanecem como defesa em profundidade (e como detectores de invariante
  interno quebrado), não mais como única defesa contra interleaving.
  Negativos **nunca** são visíveis fora da transação (atomicidade):
  nenhum estado commitado contém posição negativa.

### 2.3 (histórico) A janela que motivou a D10

Registro do caso que derrubou o "nada silencioso" da rev. 1: **sem** a
D10, o addSong (rota) lia `max` e inseria SEM lock. Interleaving real:
addSong lê max=N → `remove_setlist_song` roda COMPLETO e commita
(renumera 1..N-1) → addSong insere em N+1 → estado commitado final
`1..N-1, N+1` — **gap silencioso em N**. Nenhum guard vê: os guards do
remove rodaram ANTES do insert existir, e a UNIQUE não objeta a N+1
(vago). Os guards de `row_count` só protegem interleavings que cruzam as
FASES INTERNAS de uma função; este cruza duas transações inteiras. A
correção estrutural é o addSong entrar no mesmo lock — B6-D10, §2.5.

### 2.4 `remove_setlist_song` — função irmã (D9)

O DELETE atual fecha o buraco com loop de UPDATEs sequenciais não-atômico
(`songs/[songId]/route.ts:94-121`) — falha no meio viola o invariante.
Com a D9, mesma migração e mesma mecânica:

```sql
-- NOTA: colunas de retorno id/position homônimas às da tabela — toda
-- referência qualificada (ss./s./t.), nunca nua.
create or replace function public.remove_setlist_song(
  p_song_id uuid
) returns table (id uuid, position integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_setlist_id uuid;
  v_del  integer;
  v_rem  integer;
  v_rows integer;
begin
  select ss.setlist_id into v_setlist_id
    from setlist_songs ss where ss.id = p_song_id;
  if not found then
    raise exception 'SONG_NOT_FOUND' using errcode = 'OB603';
  end if;

  -- lock único do invariante (D10)
  perform 1 from setlists s where s.id = v_setlist_id for update;
  if not found then
    -- rev. 2 do aval: setlist deletada entre a leitura acima e o lock
    -- (cascade levou a song junto) — mesmo 404 de song sumida na rota
    raise exception 'SETLIST_NOT_FOUND' using errcode = 'OB602';
  end if;

  delete from setlist_songs ss where ss.id = p_song_id;
  get diagnostics v_del = row_count;
  if v_del = 0 then
    -- double-delete (rev. 3 do aval): um remove concorrente da MESMA
    -- música commitou enquanto esta transação esperava o lock — 404
    -- canônico na rota. Idempotência de replay é pauta do B9, não
    -- deste bloco.
    raise exception 'SONG_NOT_FOUND' using errcode = 'OB603';
  end if;

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
tradução por `error.code` do §2.2. **Double-delete declarado** (rev. 3 do
aval): se um remove concorrente da mesma música commitar enquanto esta
transação espera o lock, o `row_count` do delete dá 0 → `OB603` → 404
canônico — o segundo cliente vê "Song not found", nunca um 200 mentiroso.
**Idempotência de replay é pauta do B9**, não deste bloco; fica
registrado. **Guard addSong×remove (reescrito na
rev. 2 do aval)**: os guards internos desta função NÃO cobrem o
interleaving entre transações inteiras — o caso do §2.3 (addSong lê max,
remove completo commita, addSong insere max+1 velho) produzia gap
silencioso exatamente porque cada transação, isolada, era consistente. O
fechamento é estrutural, não por guard: **com a D10, o addSong toma o
mesmo `for update` antes de ler o max** — o interleaving passa a ser
impossível por serialização, e os guards ficam como detectores de
invariante interno.

### 2.5 `add_setlist_song` — terceira função (D10; D3 fundida)

```sql
-- NOTA: returns setof setlist_songs evita OUT-params homônimos, mas a
-- regra das irmãs vale — referências a coluna sempre qualificadas.
create or replace function public.add_setlist_song(
  p_setlist_id uuid,
  p_content_id uuid,
  p_notes      text
) returns setof public.setlist_songs
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- lock único do invariante (D10): o addSong era o ÚNICO escritor sem
  -- ele — a janela do §2.3 fecha aqui, por serialização
  perform 1 from setlists s where s.id = p_setlist_id for update;
  if not found then
    raise exception 'SETLIST_NOT_FOUND' using errcode = 'OB602';
  end if;

  -- B6-D3 (fundida): max+1 calculado DENTRO da transação, sob o lock —
  -- append-only, gap impossível por construção
  return query
    insert into setlist_songs (setlist_id, content_id, position, notes)
    values (
      p_setlist_id,
      p_content_id,
      coalesce((select max(ss.position) from setlist_songs ss
                 where ss.setlist_id = p_setlist_id), 0) + 1,
      p_notes
    )
    returning *;

  update setlists s set updated_at = now() where s.id = p_setlist_id;
end;
$$;

revoke all on function public.add_setlist_song(uuid, uuid, text) from public;
grant execute on function public.add_setlist_song(uuid, uuid, text) to service_role;
```

Na rota addSong (PR-3b): os gates de posse ficam como estão (setlist
:22-39, content :42-53 — 404 sem oráculo); a leitura de max (:55-67), o
cálculo de `actualPosition` (:69-76), o insert (:78-95) e o bump
best-effort (:97-106) viram UMA chamada
`rpc('add_setlist_song', { p_setlist_id, p_content_id, p_notes })` com a
tradução do §2.2. O bump de `updated_at`, hoje best-effort fora da
escrita (erro só logado), passa a ser transacional — mudança declarada.
`returns setof public.setlist_songs` devolve a linha inteira na ordem de
colunas da tabela — o 201 responde `data[0]` e preserva o shape medido no
§0 **byte a byte** (gate no §8). `position` do payload: aceita e ignorada
(D3; comentário do schema no §4.2).

---

## 3. B6-D8 (ex-Q8) — versionamento da migração: DECIDIDA, opção B

**Decisão do aval (2026-08-31)**: arquivo
`supabase/migrations/<timestamp>_b6_setlist_songs_rpc.sql` no repo (as
**TRÊS** funções do §2 + revoke/grant), revisado como código na PR-3a;
**aplicação em prod = ação do Marcel** (console ou CLI dele; o CLI só é
necessário para aplicar — criar o arquivo não exige `supabase init`);
`pnpm db:dump` + `pnpm db:types` regenerados como prova pós-aplicação (as
funções aparecem no dump e em `Functions` do types).

Registro dos trade-offs que sustentaram a decisão (medidos no §0): a
pasta não existia; `db:types`/`db:dump` não interagem com migrações; na
opção A a função só seria revisável como diff de artefato gerado — e a
régua do CLAUDE.md é que dump/types provam, não definem.

**Teste local da RPC: não existe caminho** — não há Supabase local
(`config.toml` ausente) e a suíte moca o client. O que a suíte prova SEM
banco: mapeamento `error.code`→envelope por rota, schema Zod, gates de
posse, shapes de 200/201 (com `rpc` mockado). O que só preview/prod
prova: o SQL — coberto pelos probes do §8.

CLAUDE.md ganha na PR-3a a seção: migrações vivem em
`supabase/migrations/`; aplicação em prod é passo do Marcel; dump/types
regenerados são a prova, nunca a fonte.

---

## 4. addSong (D3 — fundida na D10)

### 4.1 O diff da rev. 1 morre; a D3 entra pela função

A alteração pontual proposta na rev. 1 (route.ts:73-76,
`actualPosition = currentMaxPosition + 1`) **deixa de existir como diff**:
com a D10, a rota não calcula position nenhuma — max+1 é calculado DENTRO
da transação, sob o lock, pela `add_setlist_song` (§2.5). O efeito
observável da D3 é o mesmo (append-only, gap impossível; replay do L1.4:
`position: 99` → 201 com `position = max+1`) e o gate correspondente
muda de PR (§8/§9). O shape do 201 é preservado byte a byte (§0).

### 4.2 Comentário do schema (api-schemas.ts:355-361)

```typescript
  addSong: z.object({
    content_id: commonSchemas.objectId,
    // B6-D3 (via B6-D10): a exceção deliberada à política D1 (B2) está
    // ENCERRADA — position é aceita por compatibilidade e IGNORADA; a
    // RPC add_setlist_song grava sempre max+1 sob o lock da setlist
    // (append; gap impossível por construção). O invariante contíguo
    // 1..N de setlist_songs é contrato (docs/api/SETLISTS.md); o 201
    // devolve a position real.
    position: z.number().int().min(0).nullish(),
    notes: commonSchemas.safeText.nullish(),
  }).strict(),
```

### 4.3 Corrida addSong×addSong (reescrito — rev. 4 do aval)

Hoje: dois addSongs simultâneos leem o mesmo max=N e tentam ambos N+1 — a
UNIQUE derruba o segundo em **500** (comportamento esperado do código
atual; vira medição no §8, não afirmação). **Com a D10, a corrida
serializa**: o segundo espera o lock, lê max=N+1 e insere em N+2 —
**201+201, positions N+1 e N+2**. Isso é um **flip observável** da PR-3b,
com controle negativo de graça: o P1-contraste do §8 mede os dois lados
(branch 201+201 × prod 201+500) na mesma rodada. A semântica de bis
(mesma música duas vezes) não muda — continua permitida.

---

## 5. D5′ no upload (paridade upload→delete como contrato)

### 5.1 Diff proposto (upload/route.ts:55)

```diff
-    const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').trim()
+    // B6-D5' (emenda da D5/B5-D11): a PARIDADE upload→delete é o
+    // contrato — todo path produzido aqui DEVE casar a regex do delete
+    // (delete/route.ts:46, [a-zA-Z0-9._-]). NFD + remoção de marcas
+    // diacríticas preserva o legível (coração→coracao); o resto vira '_'
+    // (flag u: 1 '_' por code point — emoji vira UM '_').
+    const sanitizedFilename = filename
+      .normalize('NFD')
+      .replace(/[\u0300-\u036f]/gu, '')
+      .replace(/[^a-zA-Z0-9._-]/gu, '_')
```

Notas declaradas:

- **Flag `u` adotada e declarada** (rev. 6 do aval): a classe negada
  opera por code point — um emoji (surrogate pair) vira **UM** `_`, não
  dois.
- O `.trim()` atual morre: depois da classe `[^a-zA-Z0-9._-]` → `_` não
  sobra whitespace para aparar (mudança declarada, não silenciosa).
- O guard `sanitizedFilename.length === 0` existente (route.ts:56-60)
  permanece — continua inalcançável na prática (a classe substitui, não
  remove), mas é cinto barato.
- O schema `commonSchemas.filename` (api-schemas.ts:48) não muda: nome
  hostil continua ACEITO na entrada; a normalização é declarada e o 201
  devolve o `path` real (como hoje, medido L4.1). A checagem
  `mimeMatchesExtension` roda sobre o nome já sanitizado — a extensão
  sobrevive intacta (`.` está na classe preservada).
- `STORAGE.md`: seção de naming ganha a regra completa (NFD + marcas
  diacríticas removidas + `[^a-zA-Z0-9._-]`→`_`, flag `u`) e a declaração
  de paridade como contrato. O casado `1750171474983-Easy - Guitar.pdf`
  segue indeletável pela rota — consequência aceita da B5-D11
  (precedente console).

### 5.2 Gate: TESTE DE PARIDADE (repertório B5) + it.fails→it

Unit test de paridade na suíte (storage mockado): para CADA nome do
conjunto hostil que ALCANÇA a sanitização, o `uniqueFilename` passado ao
`.upload()` DEVE (a) casar a regex do delete
`/^\d+-[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/` e (b) passar em
`storageSchemas.delete.safeParse`. Conjunto hostil (ampliado na rev. 6 do
aval) e resultado esperado:

| Nome enviado | Path esperado (após `<ts>-`) OU recusa anterior |
|---|---|
| `b6 precheck.txt` (espaço) | `b6_precheck.txt` |
| `demo\tfinal.txt` (tab) | `demo_final.txt` |
| `coração é ação.pdf` (acentos) | `coracao_e_acao.pdf` |
| `Show (acústico).pdf` (parênteses) | `Show__acustico_.pdf` |
| `d'água & cia.txt` (apóstrofo, &) | `d_agua___cia.txt` |
| `hino #1 + bis.pdf` (#, +) | `hino__1___bis.pdf` |
| `[ao vivo].pdf` (colchetes) | `_ao_vivo_.pdf` |
| `🎸riff.txt` (emoji) | `_riff.txt` (flag `u`: 1 `_` por emoji) |
| `çãõ.pdf` (só diacríticos no stem) | `cao.pdf` (NFD decompõe; sobra a base ASCII) |
| `.hidden.pdf` (ponto inicial) | `.hidden.pdf` (já-limpo; a regex do delete aceita `.` em qualquer posição após o `<ts>-`) |
| `a.pdf.` (ponto final) | **recusado ANTES da sanitização**: `storageSchemas.upload` refine de extensão — `split('.').pop()` = `""` ∉ lista → 400 `File type not allowed` (`lib/api-schemas.ts:230-232`) |
| `README` (sem extensão) | **recusado ANTES**: `pop()` = `readme` ∉ lista → 400 `File type not allowed` (`lib/api-schemas.ts:230-232`) |

Todos os nomes que alcançam a sanitização passam o schema de entrada (a
regex do `commonSchemas.filename` só proíbe `<>:"/\|?*`). Os dois casos
recusados-antes entram no teste como asserts do 400 (com o path
`filename` no detail), não da paridade. Rito **it.fails→it, dois commits
na ordem**: commit 1 — o teste de paridade falha no código atual em todos
os casos não-já-limpos (o L4.1 provou ao vivo o espaço preservado;
acentos/&/parênteses idem por leitura da regex atual); commit 2 — diff do
§5.1, teste vira `it`. Replay em preview (balanço zero): L4 refeito na
branch → 201 com `b6_precheck.txt` no path + **delete → 200** (o par
fecha; saldo volta a 7 SEM console) + um nome acentuado → 201/delete 200;
contraste com prod (201 com espaço) antes do merge.

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
| D5′ paridade | **it.fails→it** com o conjunto hostil do §5.2 (12 nomes: 10 de paridade + 2 de recusa-anterior) | falha provada no código atual (L4.1 ao vivo para espaço; leitura da regex para o resto); flip no commit 2; replay L4 + acento em preview, par upload→delete fechando com saldo 7 |
| D3 gap no addSong (via D10) | **it.fails→it** no unit da rota (mock `rpc`): payload com `position: 99` → assert de que a rota IGNORA position e o 201 ecoa a linha da RPC | controle vivo: replay L1.4 na branch (201 → `position = max+1`) × prod (99 persistido — já medido). O gate mudou da PR-2 para a 3b (§9) |
| D10 byte-identidade do 201 | replay do L1.1 na branch: chaves e ordem do 201 idênticas ao literal medido no §0 (`id, setlist_id, content_id, position, notes, created_at`) | qualquer divergência de shape reprova; o literal de prod é o baseline |
| D4 guard 1,2MB | **contraste vivo branch × prod**: replay do L2.1 na rota nova → 400 `field:""` `Invalid request body format`; em prod o L2.1 medido deu `unrecognized_keys` após parse integral (956ms) | a rota nasce com o guard — não há "código velho da mesma rota" para it.fails; o contraste de envelopes é o controle (técnica do B5 PR-2) |
| D1 permutação inválida | unit tests nascem com a rota + **replay dos probes "sem análogo" do pre-check, agora com análogo**: array incompleto → 400; duplicado → 400; ID de setlist própria alheia ao recurso → 400 | sensibilidade: os 400 de mismatch DEVEM ser byte-idênticos entre si (anti-oráculo) — assert de igualdade literal dos corpos |
| D2 errcode atravessa | probe pós-aplicação da PR-3a: `rpc()` direto via service key — mismatch → `error.code === 'OB601'`; setlist inexistente → `'OB602'`; song inexistente na remove → `'OB603'`; add válido → linha com shape do §0 (rollback do add provado: linha deletada via `remove_setlist_song`, contiguidade relida — saldo zero) | prova que os SQLSTATEs custom chegam ao `PostgrestError.code` antes de qualquer rota depender deles |
| D2 rollback | **probe de rollback com restauração por natureza**: estado lido ANTES; rota reorder com array válido MENOS um ID → 400; estado DEPOIS colado e idêntico | prova que a violação aborta a transação inteira (guards de `row_count` + cinto `position < 1`); nenhuma restauração manual |
| D2 concorrência (lado novo) | **P1-K na branch**: setlist semeada com 8 músicas; K=6 permutações DISTINTAS via `Promise.all` contra a rota nova; gate: estado final ∈ {perm₁…perm₆} **e** invariante exato 1..8 | qualquer estado misto reprova; o `for update` é o mecanismo que o velho não tinha |
| D2 concorrência (lado prod) | **P1-K contra o move-one EM PROD, ANTES do merge da 3b**: setlist semeada (balanço zero), K=6 moves concorrentes, mesma varredura (positions > N, duplicatas, ≥10000) | resultado registra como **controle negativo medido** OU como **"não reproduzido em K=6"** — nunca como argumento |
| D10 addSong×addSong (rev. 5a) | **P1-contraste de 2 addSongs simultâneos, branch × prod**: mesma setlist semeada, `Promise.all` de 2 POSTs | esperado **201+201 (positions N+1, N+2)** na branch × **201+500** em prod (UNIQUE) — controle negativo medido de graça; se prod não reproduzir (timing), registra "não reproduzido", nunca argumento |
| D10 addSong×remove (rev. 5b) | **P1 na branch**: `Promise.all` de DELETE (song do meio) + addSong na mesma setlist semeada; varredura de contiguidade 1..N do estado final | lado prod: mesma dupla contra o código atual, tentando reproduzir o gap do §2.3 — registra **gap reproduzido** (controle medido) OU **"não reproduzido em P1"** (janela é timing-dependent), nunca argumento |
| D9 remove | it.fails→it no unit da rota DELETE (mock `rpc`) + replay do DELETE em preview com leitura de contiguidade pós-remoção | o loop sequencial velho é o controle de leitura (pre-check §2); a prova viva é a contiguidade 1..N-1 após remover do MEIO |
| D6 N+1 | **gate de invariância**: contador do §6.2 (7→1) + diff byte-a-byte do JSON | o contador no código velho acusa 7 — controle embutido |
| D7 | pg_policies antes/depois (§7) + diff do dump regenerado | o "antes" já está medido e colado |
| Estado dos dados | revalidação do invariante com `b6-item4-invariante.ts` no ciclo da PR-3b (pré-merge) | baseline desta revisão: **0 violações em 8 setlists/107 songs** (§0); se divergir, saneamento único com leitura antes/depois (precedente O-1) entra como passo declarado da 3b |

Prova destrutiva de falha-no-meio da transação segue **não executável**
sem injeção de falha — declarado; o rollback-probe e os guards de
`row_count` são o substituto no nível da função. Toda validação em
preview usa URL de branch (≠ main), bypass por header em fetch Node,
`--retries=0`, semeadura própria com balanço zero, leitura antes/depois,
e plano de lotes apresentado para aprovação quando houver volume (os P1
somam ~8 requests extras na família `setlist-mutate`, teto 120/15min).

---

## 9. Fatiamento em PRs (ajustado à D10)

**Proposta: a PR-2 é ABSORVIDA na 3b** (inclinação do Marcel,
subscrita). Argumento contra os dois princípios em tensão:

- *"Toque único nas mesmas linhas"* **vence**: o diff da PR-2
  (route.ts:73-76) alteraria exatamente as linhas que a 3b DELETA ao
  trocar o miolo pela `rpc('add_setlist_song')` — a PR-2 entregaria
  código nascido para morrer uma PR depois, e o revisor leria o mesmo
  trecho duas vezes em estados intermediários distintos.
- *"Um flip observável por PR"* **não se perde, muda de lugar**: o flip
  da D3 (replay L1.4 → 201 com max+1, gap impossível) continua existindo
  e é medido no ciclo da 3b, ao lado dos flips que a D10 acrescentou
  (addSong×addSong 201+201; byte-identidade do 201). A 3b já era a PR do
  contrato de escrita — concentrar ali TODOS os flips de escrita é
  coerência, não acúmulo.

| PR | Conteúdo | Flip observável | Depende de |
|---|---|---|---|
| **PR-0** | docs-only: este desenho (rev. 2) versionado | — | aval da revisão |
| **PR-1** | D5′: sanitização NFD+classe (flag `u`) no upload + teste de paridade + STORAGE.md | par upload→delete fecha para TODO o conjunto hostil (replay com saldo 7) | — |
| ~~PR-2~~ | **ABSORVIDA na 3b** (D3 fundida na D10 — argumento acima) | — | — |
| **PR-3a** | D2+D8+D9+D10: `supabase/migrations/<ts>_b6_setlist_songs_rpc.sql` (**as TRÊS funções** + revoke/grant) + **aplicação pelo Marcel** (mesmo ciclo de console roda o SQL da D7) + `db:dump`/`db:types` regenerados + CLAUDE.md (fluxo de migração) + probes de errcode (OB601/OB602/OB603, saldo zero) | funções existem no banco (probes `rpc` via service key) + diff do dump | aval da rev. 2 |
| **PR-3b** | D1+D3+D4+D9/D10-rotas: rota nova de reorder (`withBodyValidation` + RPC) + DELETE → `rpc('remove_setlist_song')` + **addSong → `rpc('add_setlist_song')`** + remoção do move-one (rota PUT, schema, service, import morto) + migração dos 7 testes (§1.5) + `docs/api/SETLISTS.md` + revalidação do invariante + P1s do §8 (prod ANTES do merge) | contrato novo responde; move-one → 404 de rota inexistente; L2.1 → 400 `field:""`; L1.4 → max+1; addSong×addSong 201+201; 201 byte-idêntico | PR-3a aplicada |
| **PR-4** | D6: embedding no GET | contador 7→1 + byte-identidade | — (depois da 3b por higiene de rebase) |
| **ENC** | B6-ENCERRAMENTO.md | — | tudo acima |

Ordem: **1 → 3a → 3b → 4**. Banco primeiro (3a antes da 3b) — precedente
da B5-D4. D7 roda no ciclo de console da 3a (uma sessão, um dump).
**Merge de cada PR: ação do Marcel, sempre** — checkpoint com diff
verbatim na resposta antes de cada pedido de merge (régua do B5 mantida).

---

## 10. Documentação

| Doc | Ação |
|---|---|
| `docs/api/SETLISTS.md` | **novo** (PR-3b): contrato de addSong (append-only via RPC, position aceita-e-ignorada, 201 fiel byte a byte) + reorder em lote (URL, schema, invariante de permutação, mapa de erros §1.3, resposta 200) + DELETE renumerando por RPC (D9) + **invariante contíguo 1..N declarado como contrato da tabela, com o mecanismo nomeado: os três escritores de produção pós-criação de `setlist_songs` serializam no lock `for update` da linha-pai (D10), e as demais classes do inventário §0.1 são declaradas (create seguro por construção; cascades vácuos; B6-Q9 conforme decisão)** |
| `docs/api/STORAGE.md` | PR-1: regra completa de naming da D5′ (NFD + marcas removidas + classe→`_`, flag `u`) + paridade upload→delete declarada como contrato |
| `docs/api/CONTRATO-DE-ERRO.md` | **sem mudança** — nenhum code novo (§1.3); a lista continua 5 (os SQLSTATEs OB6xx são internos banco→rota, nunca aparecem no envelope) |
| `CLAUDE.md` | PR-3a (D8): seção de banco ganha "migrações em `supabase/migrations/`; aplicação em prod = passo do Marcel; dump/types provam, não definem" |
| `lib/api-schemas.ts` | PR-3b: comentário do addSong (§4.2, exceção encerrada via D10); schema `reorder` entra, `updateSongPosition` sai |
| `types/database.types.ts` | PR-3a: `pnpm db:types` pós-aplicação (as três funções aparecem em `Functions`) |

---

*Fase seguinte: aval desta revisão pelo Marcel (leitura verbatim), merge
da PR #253 (ação dele), então PR-1. Nenhuma linha dos §§1-7 vira código
antes disso.*
