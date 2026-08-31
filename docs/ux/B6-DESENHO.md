# B6 — DESENHO (position · reorder · D11)

Fase de desenho do Bloco B6, sobre as decisões **B6-D1 a D7 fechadas pelo
Marcel em 2026-08-31** (registro na conversa da sessão; o pre-check foi
encerrado com balanço zero: setlists 3→3, setlist_songs 69→69, bucket 7→7,
suíte 607/86). Este documento não reabre decisão; a **B6-Q8** segue aberta
e é preparada no §3 com recomendação, sem decidir. Zero código de
comportamento nesta fase; **merge de toda PR é sempre ação do Marcel**.

Referências de medição: relatório do pre-check (sessão de 2026-08-31, saída
íntegra em scratchpad `b6-campanha-saida.txt`); fatos citados abaixo com
arquivo:linha do estado da main `bce342e`.

Fatos de base medidos NESTA fase (condicionam o desenho):

- `setlist_songs` tem **UNIQUE (setlist_id, position)** e ela **não é
  DEFERRABLE** — `supabase/schema.dump.sql:139-140`:
  ```sql
  ALTER TABLE ONLY "public"."setlist_songs"
      ADD CONSTRAINT "setlist_songs_setlist_id_position_key" UNIQUE ("setlist_id", "position");
  ```
  Consequência: renumerar com um único UPDATE ingênuo pode colidir por
  linha durante o statement (a checagem da UNIQUE é imediata, por linha);
  a RPC do §2 usa duas fases dentro da MESMA transação.
- Guard de corpo existente: `lib/api-validation-middleware.ts:29-39`
  (`parseRequestBody`, `if (text.length > 1024 * 1024)` → erro que o
  middleware converte em 400 `field:""`/`Invalid request body format`).
- `ls supabase/` → **somente `schema.dump.sql`**: não há pasta
  `migrations/` nem `config.toml` (repo nunca foi `supabase init`).
- Scripts de banco (package.json:19-20):
  ```json
  "db:types": "supabase gen types typescript --project-id mlxjmpbdchmwplcfislt > types/database.types.ts",
  "db:dump": "supabase db dump -s public -f supabase/schema.dump.sql"
  ```
  Nenhum dos dois lê ou aplica migrações — geram artefatos do banco vivo.
- Consumidor do move-one: `lib/setlist-service.ts:332` (função
  `updateSongPosition`) é importada em `components/setlist-manager.tsx:13`
  e **nunca invocada** (o handler da UI é `TODO` na linha 279; a única
  chamada real está em `setlist-manager-original.tsx.backup`, fora da
  compilação). Zero consumidores vivos — pré-condição da D1 confirmada.

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
- Rate limit: família **`setlist-mutate`**, `RATE_LIMITS.MUTATE` (mesma dos
  irmãos POST/DELETE).
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
| **Faltando / sobrando / ID de outra setlist** | RPC (exceção `ORDER_MISMATCH`, §2) | 400 | VALIDATION_ERROR | `order` | `order must contain exactly the songs of the setlist` |

Nota anti-oráculo: as três classes de mismatch (falta, sobra, ID alheio)
saem **byte-idênticas** — a resposta não distingue "esse ID existe em outra
setlist" de "esse ID não existe", nem revela contagens. O caso "setlist de
OUTRO usuário" real permanece coberto pelo padrão 404-idêntico e, em teste,
por unit test mockado (como no B3) — em preview segue não-avaliável (sem
segundo usuário).

### 1.4 Resposta de sucesso

**200 com a ordem canônica renumerada**:

```json
{ "songs": [ { "id": "<setlist_song uuid>", "position": 1 }, … ] }
```

Argumento voltado ao cliente nativo: o drag-and-drop reordena otimista e
dispara o PUT; devolver o estado canônico permite reconciliar sem um GET
subsequente (que custaria as queries do §6 inteiras) e torna o 200 auto-
verificável nos gates (a resposta É a leitura). Custo zero de query extra:
a RPC devolve as linhas renumeradas (§2.1, `RETURNS TABLE`). `{success:
true}` foi considerado e descartado: é o shape da rota que está morrendo e
não dá ao nativo nenhuma verdade do servidor.

### 1.5 Remoção do move-one

Sai (na PR-3b, §9):

- `app/api/setlists/songs/[songId]/route.ts`: o handler PUT
  (`updateSongPositionHandler`, linhas 156-311, + wrapper 314-327 e o
  `export const PUT`). **O DELETE do mesmo arquivo FICA** (remoção de
  música não é objeto da D1).
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
| G-D2 DELETE / G-PGRST116 DELETE / 401 DELETE | **ficam** intactos (DELETE não muda) |

Novos, sem equivalente no velho: duplicata → 400; permutação incompleta →
400; guard 1,2MB → 400 `field:""`; sucesso devolve ordem canônica.

---

## 2. Função RPC (D2)

### 2.1 Assinatura e corpo (rascunho SQL)

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
  v_n integer := coalesce(array_length(p_song_ids, 1), 0);
begin
  -- serializa reorders concorrentes na MESMA setlist (a linha-pai é o lock)
  perform 1 from setlists s where s.id = p_setlist_id for update;
  if not found then
    raise exception 'SETLIST_NOT_FOUND';
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
    raise exception 'ORDER_MISMATCH';
  end if;

  -- fase 1: tira todo mundo da faixa 1..N (a UNIQUE (setlist_id, position)
  -- não é DEFERRABLE — dump:140; negativos nunca colidem entre si porque
  -- as positions de partida são únicas)
  update setlist_songs ss set position = -ss.position
   where ss.setlist_id = p_setlist_id;

  -- fase 2: ordem do array = ordem final, 1..N contíguo por construção
  update setlist_songs ss
     set position = o.ord
    from unnest(p_song_ids) with ordinality as o(sid, ord)
   where ss.id = o.sid and ss.setlist_id = p_setlist_id;

  -- a mudança de músicas muda a setlist (mesma regra do PR-5 do B2,
  -- agora DENTRO da transação — o bump não pode mais se perder sozinho)
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
  função roda como service role e não tem o uid do Firebase (não há JWT de
  usuário no caminho — padrão de todas as rotas desde o B2); a rota faz o
  gate de posse com a query filtrada por `user_id` que já produz o 404
  sem oráculo (padrão addSong). A checagem de permutação, porém, precisa
  estar DENTRO da transação: checar na rota e escrever depois reabriria a
  janela TOCTOU (um addSong entre o check e o write). `SETLIST_NOT_FOUND`
  na função é cinto-e-suspensório para o intervalo rota→RPC em que a
  setlist é deletada: a rota o traduz em 404 (mesmo corpo do gate).
- **1..N contíguo sem tempOffset**: a fase 2 grava `ordinality` = 1..N de
  um array que a checagem provou ser permutação exata — contiguidade por
  construção, não por convenção. O expediente `tempOffset = 10000`
  (route.ts:231 atual) morre com a rota velha.
- **Exceção → envelope**: `supabase.rpc('reorder_setlist_songs', …)`
  devolve `error` com a mensagem do `raise`. A rota inspeciona
  `error.message` por `ORDER_MISMATCH`/`SETLIST_NOT_FOUND` e responde a
  mensagem CANÔNICA do §1.3 — **nunca** interpola `error.message` (regra
  D6 do B3, sentinela de dependência); qualquer outra exceção → 500
  `internalError()` com detalhe só no log.
- **Concorrência**: o `for update` na linha da setlist serializa reorders
  concorrentes — o segundo espera o commit do primeiro e renumera sobre o
  estado final dele (last-writer-wins de ORDEM COMPLETA, sem estado misto
  possível). Um addSong simultâneo ao reorder não segura esse lock
  (insert direto em `setlist_songs`); a colisão residual é a UNIQUE
  `(setlist_id, position)` falhar ruidosamente numa das duas transações
  (500 honesto, sem corrupção) — mesma exposição do código atual,
  registrada como resíduo aceito, não regressão.

### 2.3 Nota declarada PARA VETO (não é decisão tomada)

O DELETE de música (`songs/[songId]/route.ts:94-121`) continua fechando o
buraco com um loop de UPDATEs sequenciais não-atômico — falha no meio viola
o invariante 1..N da D3. Fora do texto da D1/D2, que falam de reorder.
Opção barata: a MESMA migração levar uma irmã
`remove_setlist_song(p_song_id uuid)` (delete + renumeração pelas duas
fases, mesma mecânica) e o DELETE passar a usá-la. Se vetada, fica
registrado que o invariante da D3 tem uma janela conhecida no DELETE.

---

## 3. B6-Q8 — versionamento da migração (preparada, NÃO decidida)

**Opção A — SQL no console do Marcel + `pnpm db:dump` regenerado.**
Precedente: teto 4MB do bucket (B5-D4) e o WITH CHECK da D7. A função
aparece no dump regenerado (o `db:dump -s public` inclui funções do
schema), então A também termina versionada — mas como ARTEFATO GERADO,
não como fonte: o diff revisável da função só existe na PR que regenera o
dump, e a régua do CLAUDE.md é que dump/types "nunca editar à mão" — o
dump prova, não define.

**Opção B — `supabase/migrations/<timestamp>_reorder_setlist_songs.sql`
no repo; aplicação em prod pelo Marcel (console ou CLI dele); dump
regenerado como prova.** A pasta não existe hoje (`ls supabase/` →
só `schema.dump.sql`) — criá-la não conflita com nada: `db:types` e
`db:dump` (package.json:19-20) não leem migrações. O arquivo pode ser
criado à mão com o timestamp no nome (o CLI só é necessário para APLICAR
via `db push`, que exige `supabase link` + senha — passo do Marcel, como o
`db:dump` já é hoje).

**Trade-offs medidos:**

| | A (console + dump) | B (migração no repo) |
|---|---|---|
| Fonte revisável em PR | só o diff do dump (gerado) | o SQL da função, como código |
| Precedente no projeto | ✔ (teto 4MB, D7) | ✖ (pasta nova) |
| Reaplicável (novo ambiente/rollback) | reconstruir do dump à mão | reexecutar o arquivo |
| Aplicação em prod | Marcel (console) | Marcel (console ou CLI dele) — igual |
| Prova pós-aplicação | dump regenerado | dump regenerado — igual |

**Teste local da RPC: não existe caminho** — não há Supabase local
(`config.toml` ausente), e a suíte moca o client (padrão de todos os
testes de rota). O que a suíte prova SEM banco: o mapeamento
erro-da-RPC→envelope, o schema Zod, o gate de posse e o shape do 200 (com
`rpc` mockado). O que só preview/prod prova: o SQL em si — coberto pelos
probes do §8 (rollback de mismatch + P1-K), que são o gate real da função.

**Recomendação (alinhada à preliminar do revisor): Opção B.** A função é
código-fonte — a rota a chama por nome/assinatura e os probes dependem do
seu comportamento; código-fonte se revisa como diff de PR, não como efeito
colateral de um dump. A aplicação permanece 100% do Marcel, e o dump
regenerado segue sendo a prova nas duas opções. Decisão no aval.

---

## 4. addSong (D3)

### 4.1 Alteração proposta (route.ts:73-76)

Hoje (`app/api/setlists/[id]/songs/route.ts:73-76`, medido L1):

```typescript
      const currentMaxPosition = (maxPositionResult as { position: number } | null)?.position || 0
      const actualPosition = position == null
        ? currentMaxPosition + 1
        : Math.max(position, currentMaxPosition + 1)
```

Leitura literal da D3 ("permanece sugestão, **agora clampada para no
máximo max+1**"): compor o clamp com o recálculo existente. Como o
recálculo já eleva tudo que está ≤ max para max+1 (medido L1.2/L1.3), o
teto max+1 colapsa o resultado em **sempre max+1**:

```typescript
      const currentMaxPosition = (maxPositionResult as { position: number } | null)?.position || 0
      // B6-D3: position é sugestão SEMPRE recalculada — o clamp a max+1
      // elimina o gap (L1.4 do pre-check: 99 persistia verbatim e se
      // propagava). Consequência declarada: addSong é append-only; a
      // position enviada nunca altera o resultado e o 201 devolve a real.
      const actualPosition = currentMaxPosition + 1
```

**Consequência declarada para o aval** (não decidir aqui, só enxergar): com
esse diff, `position` vira campo aceito-e-sempre-ignorado (documentado,
resposta fiel — aderente ao princípio SAN-01 de semântica declarada).
Existe uma leitura alternativa de "sugestão": respeitá-la DENTRO de
1..max+1 como inserção-com-deslocamento (entrar em `p2` empurra p2..pN
para baixo), que preservaria o invariante e daria uso real ao campo — mas
custa renumeração no addSong (a mecânica das duas fases do §2) e muda
comportamento observado por cliente. O desenho propõe a leitura literal
(diff acima, mínima); se o aval preferir a alternativa, ela reutiliza a
RPC e o schema não muda.

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

**Fica FORA da função.** Inserir em max+1 preserva 1..N trivialmente se o
invariante valia antes (nenhuma renumeração necessária); um INSERT é
atômico por si; e a UNIQUE `(setlist_id, position)` faz a corrida
addSong×addSong (dois leem max=N, dois tentam N+1) falhar ruidosamente em
vez de corromper — comportamento idêntico ao atual, registrado como
resíduo `[análise]`, não regressão. Chamar a RPC no addSong só compraria
serialização dessa corrida ao custo de acoplar a rota quente de montagem
de setlist à migração — desnecessário para a D3.

---

## 5. D11 no upload (D5)

### 5.1 Diff proposto (upload/route.ts:55)

```diff
-    const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').trim()
+    // B6-D5 (execução da B5-D11): espaço/whitespace → '_' — o delete
+    // (delete/route.ts:46) sempre recusou espaço; o par upload×delete
+    // fecha. \s cobre tab/quebra pela mesma razão que o espaço.
+    const sanitizedFilename = filename.replace(/[<>:"/\\|?*\s]/g, '_').trim()
```

`\s` (e não só `' '`): o regex do delete só aceita `[a-zA-Z0-9._-]` —
qualquer whitespace criaria o MESMO objeto indeletável; sanear a classe
inteira fecha a assimetria de uma vez. O `.trim()` vira quase-no-op
(bordas já viram `_`) e fica por inércia inofensiva. O schema
`commonSchemas.filename` (api-schemas.ts:48) não muda: espaço continua
ACEITO na entrada — a normalização é declarada, no path, e o 201 devolve
`path` real (como hoje, medido L4.1).

`STORAGE.md`: parágrafo do naming ganha a regra "whitespace no nome
original vira `_` no objeto". O casado
`1750171474983-Easy - Guitar.pdf` segue indeletável pela rota —
consequência aceita e já registrada na B5-D11 (precedente console).

### 5.2 Prova (rito it.fails→it, dois commits na ordem)

Unit test da rota de upload (storage mockado, padrão da suíte):
`filename: 'b6 precheck.txt'` → assert de que o nome passado ao
`.upload()` casa `/^\d+-b6_precheck\.txt$/` **e** que o par
delete-schema aceita esse path (`storageSchemas.delete.safeParse` ok).
Commit 1 (`it.fails`): falha no código atual — o L4.1 provou ao vivo que
o espaço é preservado. Commit 2: diff do §5.1, teste vira `it`. Replay
em preview: L4 refeito na branch → 201 com `_` no path + delete → 200
(o par fecha; saldo do bucket volta a 7 SEM console); contraste com prod
(201 com espaço) antes do merge.

---

## 6. N+1 no GET /api/setlists (D6)

### 6.1 Query única proposta (embedding PostgREST)

As FKs existem (`setlist_songs_setlist_id_fkey`, dump:189-190;
`setlist_songs_content_id_fkey`, dump:184-185) — o embedding aninhado é
direto:

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
create validam posse; medido no pre-check §1 e verbatim route.ts:42-53) e
inexistente nos dados. Declarado, não silencioso.

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
medido no dump:207-256 e no pg_policies colado por ele):

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

Prova antes/depois (mesmo SQL do pre-check §4, já validado por ele no
console):

```sql
select tablename, policyname, cmd,
       (qual is not null)       as has_using,
       (with_check is not null) as has_with_check
from pg_policies
where schemaname = 'public' and tablename in ('setlists','setlist_songs')
order by tablename, policyname;
```

Esperado: os 4 `has_with_check` das policies ALL viram `true`; os demais
inalterados. Depois, `pnpm db:dump` (Marcel, exige link) e PR docs com o
dump regenerado. Nota `[análise]` já registrada no pre-check: o Postgres
aplica USING como check quando WITH CHECK falta em policy ALL — o ganho é
explícito-sobre-implícito + servir de defesa em profundidade declarada
(o app escreve via service role, que bypassa RLS).

---

## 8. Plano de provas — regra nº 7, gate a gate

| Gate | Controle negativo | Mecânica |
|---|---|---|
| D5 espaço no upload | **it.fails→it** (§5.2) | falha provada no código atual (L4.1 ao vivo); flip no commit 2; replay L4 branch × prod |
| D3 gap no addSong | **it.fails→it**: mock com max=6, `position: 99` → assert `insert` com `position: 7` | falha hoje (L1.4: gravou 99); flip com o diff §4.1; replay L1.4 na branch (201 → position max+1) × prod (99) |
| D4 guard 1,2MB | **contraste vivo branch × prod**: replay do L2.1 na rota nova → 400 `field:""` `Invalid request body format`; em prod o L2.1 medido deu `unrecognized_keys` após parse integral (956ms) | a rota nasce com o guard — não há "código velho da mesma rota" para it.fails; o contraste de envelopes é o controle (mesma técnica do B5 PR-2) |
| D1 permutação inválida | unit tests nascem com a rota + **replay dos probes "sem análogo" do pre-check, agora com análogo**: array incompleto → 400; duplicado → 400; ID de setlist própria alheia ao recurso → 400 byte-idêntico | sensibilidade do gate: os três 400 de mismatch devem ser BYTE-IDÊNTICOS entre si (anti-oráculo) — assert de igualdade literal dos corpos |
| D2 rollback | **probe de rollback com restauração por natureza**: estado lido ANTES; RPC via rota com array válido MENOS um ID (mismatch) → 400; estado DEPOIS colado e idêntico | prova que a violação no meio da transação não deixa nada (as duas fases nunca commitam parciais); nenhuma restauração manual necessária |
| D2 concorrência | **P1-K**: setlist semeada com 8 músicas; K=6 permutações DISTINTAS via `Promise.all`; gate: estado final ∈ {perm₁…perm₆} **e** invariante exato 1..8 sem duplicata/sem >N | o pre-check provou que 1 amostra não separa (serialização acidental, 473×1716ms); K=6 com assert de PERTENCIMENTO ao conjunto de permutações pedidas reprova qualquer estado misto — que o mecanismo velho (2N UPDATEs sem lock) não tem como excluir. Orçamento: 6 mutates + semeadura/cleanup ≈ 10 na família (teto 120/15min). Prova destrutiva de falha-no-meio segue **não executável** sem injeção de falha — declarado; o rollback-probe acima é o substituto no nível da função |
| D6 N+1 | **gate de invariância**: contador do §6.2 (7→1) + diff byte-a-byte do JSON | o contador rodado no código velho acusa 7 — controle embutido |
| D7 | pg_policies antes/depois (§7) + diff do dump regenerado | o "antes" já está medido e colado (pre-check §4 + console do Marcel) |

Toda validação em preview usa URL de branch (≠ main), bypass por header em
fetch Node, `--retries=0`, semeadura própria com balanço zero e leitura
antes/depois — o rito do pre-check.

---

## 9. Fatiamento em PRs (proposta para aval)

| PR | Conteúdo | Flip observável | Depende de |
|---|---|---|---|
| **PR-0** | docs-only: este desenho versionado | — | aval do desenho |
| **PR-1** | D5: `\s`→`_` no upload + STORAGE.md | par upload×delete fecha (L4 replay: 201 sem espaço + delete 200) | — |
| **PR-2** | D3: append-only no addSong + comentário do schema | L1.4 replay: 201 devolve max+1, gap impossível | — |
| **PR-3a** | D2 + Q8: arquivo de migração (função RPC) + **aplicação pelo Marcel** + dump regenerado + testes unitários do mapeamento (rpc mockado) | função existe no banco (probe `rpc` direto via service key + diff do dump) | Q8 decidida |
| **PR-3b** | D1 + D4: rota nova (`withBodyValidation` + RPC) + remoção do move-one (rota PUT, schema, service, import morto) + migração dos 7 testes (§1.5) | contrato novo responde; move-one → 404 de rota inexistente; L2.1 replay → 400 `field:""` | PR-3a aplicada |
| **PR-4** | D6: embedding no GET | contador 7→1 + byte-identidade | — |
| **D7** | fora de PR de código: SQL do Marcel no console (§7) + PR docs com dump regenerado | pg_policies flip + diff do dump | — |
| **ENC** | B6-ENCERRAMENTO.md | — | tudo acima |

Argumentos sobre o ponto de partida do Marcel:

- **Dividir a PR-3 em 3a/3b: sim.** Cada uma tem UM flip observável
  (função no banco ≠ contrato HTTP novo) e a 3b só é testável em preview
  com a função já aplicada em prod (banco é o mesmo) — banco primeiro,
  precedente da B5-D4 (bucket antes da rota).
- **Ordem 1→2→3→4**: PR-1 e PR-2 pequenas e independentes aquecem o rito;
  PR-4 é independente (pode entrar a qualquer momento, mas depois da 3b
  evita re-basear o teste de rota duas vezes). D7 pode rodar no MESMO
  ciclo de console/dump da PR-3a (uma sessão de console, um dump
  regenerado) — opção do Marcel, sem acoplamento técnico.
- A nota PARA VETO do §2.3 (função irmã para o DELETE), se aceita, entra
  na PR-3a (migração) + 3b (rota DELETE passa a usá-la); se vetada, nada
  muda no plano.

**Merge de cada PR: ação do Marcel, sempre** — checkpoint com diff
verbatim na resposta antes de cada pedido de merge (régua do B5 mantida).

---

## 10. Documentação

| Doc | Ação |
|---|---|
| `docs/api/SETLISTS.md` | **novo** (PR-3b): contrato de addSong (append-only, position aceita-e-recalculada, 201 fiel) + reorder em lote (URL, schema, invariante de permutação, mapa de erros do §1.3, resposta 200) + **invariante contíguo 1..N declarado como contrato da tabela** |
| `docs/api/STORAGE.md` | PR-1: regra whitespace→`_` no naming do upload |
| `docs/api/CONTRATO-DE-ERRO.md` | **sem mudança** — nenhum code novo (§1.3); a lista continua 5 |
| `CLAUDE.md` | PR-3a, se Q8=B: seção de banco ganha "migrações em `supabase/migrations/` (aplicação em prod = passo do Marcel)"; se Q8=A, sem mudança |
| `lib/api-schemas.ts` | PR-2: comentário do addSong (§4.2, exceção encerrada); PR-3b: schema `reorder` entra, `updateSongPosition` sai |
| `types/database.types.ts` | PR-3a: `pnpm db:types` pós-aplicação (a função aparece em `Functions` do types gerado) |

---

*Fase seguinte: aval deste desenho pelo Marcel (com decisão da Q8 e do
veto do §2.3), depois PR-0. Nenhuma linha dos §§1-7 vira código antes
disso.*
