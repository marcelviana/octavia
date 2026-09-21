# HOTFIX-150.md — `DELETE /api/setlists/[id]` sem checagem de dono (div. 150) e 404 do inexistente (div. 151 → N2-D12)

> **Data**: 2026-09-16. **Origem**: pre-check do N2 (PR #306, `docs/native/N2-PRECHECK.md` §13), decisão do Marcel **N2-D6** (corrigir agora, PR própria, antes de qualquer escrita do nativo). O 404 do inexistente é a decisão **N2-D12** (Marcel, 2026-09-16), §1.1.
> **Base**: `origin/main` = `9e14042b95d09c56b77afa7a8a2439d798c96127`; worktree `../octavia-hotfix150`, branch `fix/setlist-delete-owner`.
> **Escopo**: só a rota. Não toca `apps/native/`, `packages/`, `docs/native/`. Zero migração, zero escrita em prod.
> Convenção: `[medido]` = comando + saída literal; `[análise]` = inferência sobre o medido.

## 1. Veredito de gravidade

**Explorável** (não é só defesa em profundidade). Três fatos medidos fecham:

1. O handler usa o **cliente service role** (`app/api/setlists/[id]/route.ts:337` → `lib/supabase-service.ts:7` `SUPABASE_SERVICE_ROLE_KEY`, `:25` `createClient`). O papel `service_role` ignora RLS no Supabase — a policy `"User owns setlist songs"` (`schema.dump.sql:526`) **não** protege esta chamada.
2. O delete de `setlist_songs` (`route.ts:340-343`, pré-fix) filtrava só por `setlist_id` da URL e rodava **antes** do delete de `setlists` filtrado por `user_id`.
3. Nenhuma camada abaixo barra: não há trigger nem checagem no banco para o delete direto de `setlist_songs`.

**Efeito**: um usuário logado (qualquer conta) que conheça o uuid de uma setlist alheia **esvazia** essa setlist (todas as músicas somem) e recebe `200 {success:true}`; a linha de `setlists` da vítima sobrevive (o 2º delete filtra por dono). Integridade, não confidencialidade — nada é lido.

**Limitante** `[análise]`: o atacante precisa do uuid (v4, não enumerável). O código web não expõe setlist de um usuário a outro (sem rota de compartilhamento; `is_public` de setlists não é usado por nenhum caller — `grep -rn is_public app lib components hooks` só acha `content`). Gravidade: **média** — bypass real de autorização, baixa probabilidade de descoberta do id.

Esse veredito vale só para a **div. 150**. A **151 não é defeito** (§1.1).

### 1.1 Div. 151 — decisão revista (N2-D12), não defeito

O `200 {success:true}` para setlist inexistente **era contrato decidido** na B3 PR-3a (#245, merge `effe847`, 2026-08-29). Onde a decisão está `[medido]`:

```
$ git log -S"idempotente" --oneline -- app/api/setlists
790b527 fix(api): DELETE /api/setlists/[id] checa dono e devolve 404 (divs. 150, 151)
effe847 B3 PR-3a — semântica: D2 + PGRST116→404 + paridade 400 (setlists/songs) (#245)
```

`docs/ux/B3-DESENHO.md:312-317` (registro da execução, aval do PR-3a, 2026-08-29):

> (b) **Comportamento observável do contrato**: `DELETE` de recurso inexistente (setlist E content, rotas sem `.single()` no delete) é **200 idempotente** `{success:true}` — o cliente nativo O VERÁ; se um dia virar 404, é **mudança de contrato**, não bugfix.

No código, a PR-3a renomeou o teste legado para "…delete de inexistente real é 200 idempotente, sem .single()…" (`effe847`, `route.test.ts`). O `B3-ENCERRAMENTO.md` **não** registra a decisão (`grep -n -i idempotente docs/ux/B3-*` → só `B3-DESENHO.md:316`) — div. 176.

**N2-D12** (Marcel, 2026-09-16): `DELETE /api/setlists/[id]` devolve **404** para inexistente e alheia, byte-idêntico (sem oráculo), **superando a B3 PR-3a**. Razões:
- consistência com `SETLISTS.md:78-80` na main (`:98-100` nesta branch, depois do parágrafo novo) (setlist inexistente-ou-alheia → 404 nas rotas de song);
- o nativo lê 404 como "ressincroniza" (T1-R9);
- repetir o DELETE continua sem efeito no banco — só o status muda.

Por ser mudança de contrato (a própria PR-3a disse), ela é decidida, não "corrigida".

## 2. Medições antes de mexer

### 2.1 O DELETE inteiro `[medido]`

`git show origin/main:app/api/setlists/[id]/route.ts`, linhas 314-383 (handler `315-367`, wrapper `370-383`). Trecho do defeito:

```
337	    const supabase = getSupabaseServiceClient()
338
339	    // Delete all songs in the setlist first
340	    const { error: songsError } = await supabase
341	      .from("setlist_songs")
342	      .delete()
343	      .eq("setlist_id", setlistId)
...
350	    // Then delete the setlist
351	    const { error } = await supabase
352	      .from("setlists")
353	      .delete()
354	      .eq("id", setlistId)
355	      .eq("user_id", user.uid)
...
362	    return NextResponse.json({ success: true })
```

Nenhuma leitura das linhas afetadas → inexistente e alheia caem no mesmo `200` (div. 151 — o 200 do inexistente era contrato da B3 PR-3a; o do alheio não).

### 2.2 Cliente Supabase `[medido]`

```
$ grep -n "createClient\|SERVICE_ROLE\|export function getSupabaseServiceClient" lib/supabase-service.ts
1:import { createClient } from "@supabase/supabase-js"
7:const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
18:export function getSupabaseServiceClient(): SupabaseClient<Database> {
25:    supabaseServiceClient = createClient<Database>(
```

Instância no handler: `route.ts:337` (`getSupabaseServiceClient()`). **Service role**, não JWT do usuário.

### 2.3 Schema (`supabase/schema.dump.sql`) `[medido]`

```
467:ALTER TABLE ONLY "public"."setlist_songs"
468:    ADD CONSTRAINT "setlist_songs_setlist_id_fkey" FOREIGN KEY ("setlist_id") REFERENCES "public"."setlists"("id") ON DELETE CASCADE;
485:CREATE POLICY "Service role access to setlist songs" ON "public"."setlist_songs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));
505:CREATE POLICY "User can insert setlist songs" ON "public"."setlist_songs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
526:CREATE POLICY "User owns setlist songs" ON "public"."setlist_songs" USING ((EXISTS ( SELECT 1
547:ALTER TABLE "public"."setlist_songs" ENABLE ROW LEVEL SECURITY;
```

- `ON DELETE CASCADE`: **sim** (:468) → o delete explícito de `setlist_songs` é **redundante** e sai no fix. O `B6-DESENHO.md` (tabela do §0.1, linha do `route.ts:341`) já registrava a redundância e a deixara "fora do escopo".
- RLS habilitada: **sim** (:547). Policy de DELETE: `"User owns setlist songs"` (:526, sem `FOR` → vale para todos os comandos, inclusive DELETE) — **irrelevante** aqui, porque o cliente é service role (2.2).
- Concorrência `[análise]`: com o fix, o único escritor desta rota é o `DELETE` da linha de `setlists`, que pega o lock da linha-pai — o mesmo que as RPCs do B6 pegam com `FOR UPDATE` (invariante D10). O delete explícito antigo mexia em `setlist_songs` **sem** esse lock.

### 2.4 Mecanismo de teste de route handler `[medido]`

```
$ git ls-files | grep -i "setlists" | grep -i test
app/api/setlists/[id]/__tests__/route.test.ts
app/api/setlists/[id]/songs/__tests__/route-rpc.test.ts
app/api/setlists/[id]/songs/__tests__/route.test.ts
app/api/setlists/[id]/songs/order/__tests__/route.test.ts
app/api/setlists/__tests__/create-compensating.test.ts
app/api/setlists/__tests__/get-shape.test.ts
app/api/setlists/__tests__/route.test.ts
app/api/setlists/songs/[songId]/__tests__/route-rpc.test.ts
app/api/setlists/songs/[songId]/__tests__/route.test.ts
tests/ux-audit/fase-d/e-setlists.spec.ts
```

Mecanismo (`app/api/setlists/[id]/__tests__/route.test.ts`): Vitest; `vi.mock('@/lib/supabase-service')` devolvendo o cliente falso de `lib/test-utils/supabase-mock-factory.ts` (`SupabaseMockFactory`, via `createAPIMockData()` de `api-test-helpers.ts`), que filtra dados em memória por `.eq()`; auth via `mockRequireAuthServerSecure` de `@/src/test-setup`. O teste novo usa o mesmo mecanismo e conta os `supabaseMock.from('setlist_songs')`.

Limite do instrumento `[análise]`: o factory **não** muta os dados e `.select()` sobrescreve a `operation` para `'select'` — por isso a prova de "zero delete em setlist_songs" conta chamadas a `from('setlist_songs')` (qualquer operação), que é mais forte. O retorno do `delete().eq().eq().select('id')` no Postgres real (linhas apagadas via `return=representation`, supabase-js 2.89.0) **não** foi medido contra banco nesta PR — é o comportamento documentado do PostgREST, não prova local.

### 2.5 Callers do DELETE no web `[medido]`

```
$ grep -rn "api/setlists" app/ components/ hooks/ lib/ | grep -v "^app/api"
lib/setlist-service.ts:52:    const response = await fetch('/api/setlists', {
lib/setlist-service.ts:95:    const response = await fetch(`/api/setlists/${id}`, {
lib/setlist-service.ts:139:    const response = await fetch('/api/setlists', {
lib/setlist-service.ts:187:    const response = await fetch(`/api/setlists/${id}`, {
lib/setlist-service.ts:227:    const response = await fetch(`/api/setlists/${id}`, {
lib/setlist-service.ts:265:    const response = await fetch(`/api/setlists/${setlistId}/songs`, {
lib/setlist-service.ts:313:    const response = await fetch(`/api/setlists/songs/${songId}`, {
lib/__tests__/contract-setlist.test.ts:5: * B2 PR-5 — contrato de /api/setlists: SET-01 fechado, songs[] real (D2).
lib/__tests__/setlist-service.test.ts:101:      expect(fetch).toHaveBeenCalledWith('/api/setlists', {
```

Único caller do DELETE: `lib/setlist-service.ts:227` (`deleteSetlist`), que faz `if (!response.ok) throw` e não lê o corpo; chamado só por `components/setlist-manager.tsx:140` (`confirmDeleteSetlist`). Nenhum caller **depende** do 200 para inexistente. Mudança observável: se a setlist já tiver sumido (outra aba/aparelho apagou antes), o usuário vê o toast "Failed to delete setlist" e a setlist continua na lista local até recarregar — **div. 172**, declarada e **não** adaptada (o escopo é a rota); destino: **Bloco D**.

### 2.6 Contrato `[medido]`

`docs/api/CONTRATO-DE-ERRO.md`:

```
51:| `NOT_FOUND` | 404 | Recurso inexistente **ou de outro usuário** — indistinguíveis por decisão (sem oráculo de existência). |
96:404  {"error":"Setlist not found","code":"NOT_FOUND"}
```

`docs/api/SETLISTS.md` (as linhas `41-43` citadas no prompt são da listagem GET — o texto está em `78-80` na main — `:98-100` nesta branch; **div. 171**):

```
78:- Gates na rota: setlist inexistente-ou-alheia → `404 Setlist not
79:  found`; content inexistente-ou-alheio → `404 Content not found`
80:  (sem oráculo, byte-idênticos por construção).
```

O fix usa o mesmo `notFound('Setlist not found')` de `route.ts:49/56` (GET) e `songs/route.ts:36` (addSong).

## 3. Controle negativo — antes do fix

Arquivo: `app/api/setlists/[id]/__tests__/delete-owner.test.ts`, rodado com o handler **intocado** (`git status` só com o teste novo). Reprovou como esperado; a 3ª asserção (setlist própria → 200) passou, que é o controle positivo. `[medido]`

```
$ NO_COLOR=1 pnpm test delete-owner

> octavia@0.1.0 test /Users/marcelviana/projects/octavia-hotfix150
> pnpm exec vitest run delete-owner

 RUN  v4.0.16 /Users/marcelviana/projects/octavia-hotfix150

 ❯ |web| app/api/setlists/[id]/__tests__/delete-owner.test.ts (3 tests | 2 failed) 13ms
     × CN-150: B apaga setlist de A → 404 NOT_FOUND e zero toques em setlist_songs 10ms
     × CN-151: uuid inexistente → 404 byte-idêntico ao do CN-150 (sem oráculo) 2ms
     ✓ setlist própria → 200 {success:true} (comportamento inalterado) 1ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |web| app/api/setlists/[id]/__tests__/delete-owner.test.ts > DELETE /api/setlists/[id] — gate de dono (divs. 150/151) > CN-150: B apaga setlist de A → 404 NOT_FOUND e zero toques em setlist_songs
AssertionError: expected 1 to be +0 // Object.is equality

- Expected
+ Received

- 0
+ 1

 ❯ app/api/setlists/[id]/__tests__/delete-owner.test.ts:53:40
     51| 
     52|     // soft: o controle negativo mostra as DUAS falhas de uma vez
     53|     expect.soft(touchedSetlistSongs()).toBe(0)
       |                                        ^
     54|     expect.soft(response.status).toBe(404)
     55|     expect.soft(await response.json()).toEqual({ error: 'Setlist not f…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯

 FAIL  |web| app/api/setlists/[id]/__tests__/delete-owner.test.ts > DELETE /api/setlists/[id] — gate de dono (divs. 150/151) > CN-150: B apaga setlist de A → 404 NOT_FOUND e zero toques em setlist_songs
AssertionError: expected 200 to be 404 // Object.is equality

- Expected
+ Received

- 404
+ 200

 ❯ app/api/setlists/[id]/__tests__/delete-owner.test.ts:54:34
     52|     // soft: o controle negativo mostra as DUAS falhas de uma vez
     53|     expect.soft(touchedSetlistSongs()).toBe(0)
     54|     expect.soft(response.status).toBe(404)
       |                                  ^
     55|     expect.soft(await response.json()).toEqual({ error: 'Setlist not f…
     56|   })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/4]⎯

 FAIL  |web| app/api/setlists/[id]/__tests__/delete-owner.test.ts > DELETE /api/setlists/[id] — gate de dono (divs. 150/151) > CN-150: B apaga setlist de A → 404 NOT_FOUND e zero toques em setlist_songs
AssertionError: expected { success: true } to deeply equal { error: 'Setlist not found', …(1) }

- Expected
+ Received

  {
-   "code": "NOT_FOUND",
-   "error": "Setlist not found",
+   "success": true,
  }

 ❯ app/api/setlists/[id]/__tests__/delete-owner.test.ts:55:40
     53|     expect.soft(touchedSetlistSongs()).toBe(0)
     54|     expect.soft(response.status).toBe(404)
     55|     expect.soft(await response.json()).toEqual({ error: 'Setlist not f…
       |                                        ^
     56|   })
     57| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/4]⎯

 FAIL  |web| app/api/setlists/[id]/__tests__/delete-owner.test.ts > DELETE /api/setlists/[id] — gate de dono (divs. 150/151) > CN-151: uuid inexistente → 404 byte-idêntico ao do CN-150 (sem oráculo)
AssertionError: expected 200 to be 404 // Object.is equality

- Expected
+ Received

- 404
+ 200

 ❯ app/api/setlists/[id]/__tests__/delete-owner.test.ts:65:32
     63|     const inexistente = await del(MISSING_ID)
     64| 
     65|     expect(inexistente.status).toBe(404)
       |                                ^
     66|     expect(inexistente.status).toBe(alheia.status)
     67|     expect(await inexistente.text()).toBe(await alheia.text())

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯

 Test Files  1 failed (1)
      Tests  2 failed | 1 passed (3)
   Start at  15:10:08
   Duration  945ms (transform 149ms, setup 217ms, import 205ms, tests 13ms, environment 400ms)

 ELIFECYCLE  Test failed. See above for more details.
```

### 3.1 Prova do `.select('id')` em banco real

**2.1 — alvo** `[medido pelo Marcel]`, 2026-09-16: no painel da Vercel, `NEXT_PUBLIC_SUPABASE_URL` do ambiente **Preview** é o **mesmo host da produção**. Esta é a variável que o servidor lê (`lib/supabase-service.ts:6`). A sessão não conseguiu medir por conta própria (div. 175) e não repetiu a tentativa.

**2.2 — um request, sem repetição** `[medido]`. Preview da #307 (`790b527`): `https://octavia-806juh765-marcelvianas-projects.vercel.app`. Token da conta de audit via Firebase REST (`signInWithPassword`), sem sessão da app. Bypass do Deployment Protection lido inline. Uuid novo de `uuidgen`: `978bd206-b55d-4016-a145-8dc4022ceda7`.

```
$ curl -sS -i -X DELETE -H "Authorization: Bearer <idToken audit>" -H "x-vercel-protection-bypass: <inline>" \
    https://octavia-806juh765-marcelvianas-projects.vercel.app/api/setlists/978bd206-b55d-4016-a145-8dc4022ceda7
HTTP/2 404 
cache-control: private, no-store
content-type: application/json
date: Wed, 16 Sep 2026 18:36:21 GMT
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains; preload
vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch
x-matched-path: /api/setlists/[id]
x-robots-tag: noindex
x-vercel-cache: MISS
x-vercel-id: gru1::iad1::fw2wg-1789583779079-91846097a481

{"error":"Setlist not found","code":"NOT_FOUND"}
```

- Corpo: **48 bytes**, sha256 `9b7d9169b47bce3aa6be7f11883f6c5a2c1b58dd71135bbe1a4a3348e01e86bd`. É o mesmo sha de `printf '%s' '{"error":"Setlist not found","code":"NOT_FOUND"}'`, o literal do `CONTRATO-DE-ERRO.md:96` que o CN-151 exige.
- Zero linhas tocadas por construção: o único efeito do handler é o `.delete().eq("id", setlistId).eq("user_id", user.uid).select("id")` (`route.ts:344-348`; os `.eq` estão em `:346-347`). Para um uuid recém-gerado ele casa zero linhas, e o `RETURNING` vazio vira o 404 (`route.ts:355-357`).
- **O que isto prova**: no Postgres real, o `.delete()…select("id")` sem linha casada volta **sem erro** (senão seria 500) e com zero linhas, e o ramo de 404 é alcançado. Array vazio e `null` não se distinguem por aqui, porque o guard `!deleted || deleted.length === 0` cobre os dois. O caso "alheia" usa o mesmo ramo e não foi provocado contra dado real: exigiria uma setlist de outra conta.

### 3.2 Ramo "alheia" `[medido em prod]`

**2026-09-21**, base `https://octavia.rocks` (prod; o fix da #307 está na `main`
desde `e20c0a4`). O Marcel criou na **conta principal** uma setlist descartável
(`b100382e-e41d-4845-b332-c089109174f3`); o request abaixo sai com o token da
**conta de audit** — outra conta, que não é dona dela. **Um request, sem
repetição e sem retries.**

**Token** `[medido]`: `set -a; source .env.uxaudit; source .env.local; set +a`,
e um script que faz **só** o `signInWithPassword` do Firebase REST (a mesma
chamada de `scripts/ux-audit/auth.ts:67-75`), **sem** o `POST /api/auth/session`
que aquele módulo faz em seguida — o mesmo mecanismo da Fase B do N2
(`docs/native/N2-PRECHECK.md` §11, div. 159), pelo mesmo motivo: aquele POST
seria uma request a prod fora do orçamento e traria cookie, que o probe não
pode ter. Saída:

```
signInWithPassword status=200
uid=Pw3bxXZw0iT3WwyL7kxGtGJIJH83 claim.email_verified=true claim.sign_in_provider=password
```

**O request** `[medido]`, `2026-09-21T19:07:34Z`–`19:07:37Z`:

```
$ curl -sS -i -X DELETE -H "Authorization: Bearer $TOKEN" \
    https://octavia.rocks/api/setlists/b100382e-e41d-4845-b332-c089109174f3
[curl exit 0]
HTTP/2 404 
cache-control: private, no-store
content-type: application/json
date: Mon, 21 Sep 2026 19:07:36 GMT
server: Vercel
strict-transport-security: max-age=63072000
vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch
x-matched-path: /api/setlists/[id]
x-vercel-cache: MISS
x-vercel-id: gru1::iad1::6bjnq-1790017654969-7a7b431a5da9

{"error":"Setlist not found","code":"NOT_FOUND"}
```

- **Corpo**: **48 bytes**, sha256
  `9b7d9169b47bce3aa6be7f11883f6c5a2c1b58dd71135bbe1a4a3348e01e86bd` —
  **o mesmo sha do ramo "inexistente"** medido no preview (§3.1) e
  o mesmo de `printf '%s' '{"error":"Setlist not found","code":"NOT_FOUND"}'`,
  o literal do `CONTRATO-DE-ERRO.md:96`. Bruto (headers+corpo): 431 B, sha256
  `653182c34831ddaca2e2df89b69cc96b2395ccd12abd58b232eb1392c2e81faa`
  (os headers diferem entre preview e prod — div. 213; só o **corpo** se compara).
- **Zero linhas** `[análise]`: o único efeito do handler é
  `.delete().eq("id", setlistId).eq("user_id", user.uid).select("id")`
  (`app/api/setlists/[id]/route.ts:343-348` **na `main`** — a §3.1 cita a
  numeração da branch da #307, uma linha acima). A setlist é de outro usuário,
  o `.eq("user_id")` de `:347` não casa, o `RETURNING` volta vazio e o guard
  `!deleted || deleted.length === 0` (`:356-357`) devolve o 404. O delete
  explícito de `setlist_songs` saiu no fix (§2.3), então não há nada mais a
  tocar.
- **O que isto prova**: contra dado real, o ramo "alheia" devolve **404
  byte-idêntico** ao do inexistente — o sem-oráculo da **N2-D12** vale em prod,
  e o bypass da div. 150 está fechado onde o usuário o exploraria.
- **O que isto NÃO prova sozinho** `[análise]`: a resposta é byte-idêntica à do
  inexistente **por construção** — é o que "sem oráculo" quer dizer. Logo o
  request, isolado, não distingue "a setlist existe e é de outro" de "o uuid não
  existe", e não pode certificar por si que a linha sobreviveu. Isso é a
  confirmação do Marcel abaixo (div. 212).
- **Custo em prod**: 1 login no Firebase + 1 request `setlist-mutate`. Escrita
  em prod: **zero**.

**Confirmação de que a setlist `b100382e…` continua existindo** (conta principal,
no web): confirmação: Marcel, 2026-09-21 — a setlist `DESCARTÁVEL N2`
(`b100382e-e41d-4845-b332-c089109174f3`) **continua existindo, vazia**.

Com isso o ramo "alheia" está fechado: a medição (404, 48 B, sha `9b7d9169…`)
mais a confirmação de que a linha sobreviveu ao request. **Limite do que prod
prova** `[análise]`: a setlist estava **vazia**, então o segundo observável do
defeito original — as músicas de uma setlist alheia sumirem (§1, efeito da div.
150) — não tinha como aparecer aqui; quem prova esse é o CN-150 no mock
(`touchedSetlistSongs() === 0`, §3 e §4). Em prod ficou provado o que prod podia
provar: 404 sem oráculo e a linha de `setlists` intacta (div. 214).

## 4. Depois do fix

`[medido]`

```
$ NO_COLOR=1 pnpm test delete-owner

> octavia@0.1.0 test /Users/marcelviana/projects/octavia-hotfix150
> pnpm exec vitest run delete-owner

 RUN  v4.0.16 /Users/marcelviana/projects/octavia-hotfix150

 ✓ |web| app/api/setlists/[id]/__tests__/delete-owner.test.ts (3 tests) 8ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  15:10:33
   Duration  942ms (transform 145ms, setup 221ms, import 199ms, tests 8ms, environment 405ms)
```

Suíte inteira `[medido]`:

```
$ NO_COLOR=1 pnpm test
 Test Files  94 passed | 4 skipped (98)
      Tests  827 passed | 85 skipped (912)
```

Primeira rodada da suíte (antes de ajustar o teste existente) `[medido]`:

```
 ❯ |web| app/api/setlists/[id]/__tests__/route.test.ts (23 tests | 1 failed | 1 skipped) 45ms
       × only deletes setlists owned by the authenticated user 5ms
 Test Files  1 failed | 93 passed | 4 skipped (98)
      Tests  1 failed | 826 passed | 85 skipped (912)
```

Esse teste existente **fixava o bug** (`expect(response.status).toBe(200) // API handles this gracefully` para setlist alheia) → virou `404` (div. 170).

## 5. Divergências

- **170** — extra fora da lista fechada, declarado antes do commit: `app/api/setlists/[id]/__tests__/route.test.ts` muda 2 linhas — a asserção do teste "only deletes setlists owned by the authenticated user" (200 → 404) e o nome do teste vizinho, que afirmava "delete de inexistente real é 200 idempotente" (decisão da B3 PR-3a, superada pela **N2-D12** — §1.1).
- **171** — o prompt cita `SETLISTS.md:41-43` para a regra "inexistente-ou-alheia → 404 sem oráculo"; o texto está em `:78-80` na main (e repetido em `:100` e `:113`); nesta branch, deslocado +20 linhas pelo parágrafo do DELETE.
- **172** — efeito observável no único caller web (2.5): delete de setlist já apagada vira toast de erro em vez de sucesso silencioso. Não adaptado nesta PR. **Destino: Bloco D.**
- **173** — o prompt pede `pnpm test <arquivo>`; o filtro do Vitest não casa caminho com `[id]` (`No test files found`, com e sem escape). Rodado por nome (`pnpm test delete-owner`), que casa só o arquivo novo.
- Numeração: a PR #306 (`n2/precheck`) usa até a div. 160 (`git grep -E "[Dd]iv\. ?1[5-9][0-9]" FETCH_HEAD -- docs` → maior = 160); 170+ sem colisão.
- **174** — a decisão da B3 PR-3a cobria **setlist E content**. A N2-D12 supera só a de setlist: `DELETE /api/content/[id]` segue com o 200 idempotente para inexistente. É assimetria de contrato entre as duas rotas, registrada sem mexer em content. **Destino: pre-check do N3, junto do B9.**
- **175** — o 2.1 do complemento (para qual Supabase o preview aponta) **não foi medido pela sessão** (depois, o Marcel mediu no painel, §3.1):
  - a CLI `vercel` não está instalada (`which vercel` → `vercel not found`), e instalar ou fazer `vercel link` mexeria em config local;
  - os chunks JS do `/login` do preview não contêm host `*.supabase.co` (o cliente não usa Supabase);
  - a prova alternativa (`GET /api/setlists` da conta de audit no preview **e** na prod, comparando o sha dos ids) foi **negada** na leitura de prod pelo classificador de permissões da sessão.

  Pelo prompt, o 2.2 ficou parado até o Marcel medir o 2.1 no painel da Vercel (2026-09-16). Depois disso, o 2.2 rodou uma vez (§3.1).
- **176** — a decisão do 200 idempotente (B3 PR-3a) vive só no `B3-DESENHO.md:312-317` e no commit `effe847`; o `B3-ENCERRAMENTO.md` não a cita. **Vira regra 9 na PR-0 do N2.**
- Numeração (2026-09-21, §3.2): o maior número na `main` é **211**
  (`git grep -hoE "div\. ?2[0-9][0-9]" origin/main -- docs` → 201, 202, 203,
  204, 208, 210, 211); esta sessão começa em **212**.
- **212** — **FECHADA** (confirmação do Marcel, 2026-09-21, §3.2: a setlist
  continua existindo, vazia). **O request do ramo "alheia", sozinho, não prova
  que a linha sobreviveu.** O 404 é byte-idêntico ao do inexistente por decisão (N2-D12,
  §1.1), então a própria resposta não distingue "alheia" de "inexistente". A
  prova do ramo é a soma de duas partes: a medição da §3.2 (a sessão) e a
  confirmação de que `b100382e…` continua na conta principal (o Marcel, no
  web) — as duas partes estão na §3.2, e o ramo está fechado.
- **213** — **os headers de prod e do preview diferem; só o corpo se compara.**
  Em prod (§3.2): `strict-transport-security: max-age=63072000`, sem
  `x-robots-tag`. No preview (§3.1): `max-age=63072000; includeSubDomains; preload`
  e `x-robots-tag: noindex`. É da plataforma, não do código: o matcher do
  middleware exclui `/api`, então o HSTS de `lib/security-headers.ts:213-218`
  **não** alcança estas respostas (`next.config.mjs:5-12` registra o mesmo
  para o `Cache-Control`). O valor de prod bate com as oito medições
  de prod anteriores (cinco em `N2-PRECHECK-anexos/B-{a-1,b-1,b-2,c-1,d-1}.txt`,
  três em `B7-PRECHECK-anexos/prod-probes-headers.txt`). Consequência prática: **não
  comparar sha do arquivo bruto entre preview e prod** — o do corpo é o que
  vale (48 B, `9b7d9169…`, igual nos dois). Nada adaptado aqui.
- **214** — **a setlist descartável estava vazia**, então o request de prod não
  pôde exercer o observável mais visível da div. 150 (setlist alheia esvaziada).
  O 404 e a sobrevivência da linha de `setlists` foram medidos; "zero toques em
  `setlist_songs`" continua provado só no mock (CN-150, §3/§4) e pelo código (o
  delete explícito saiu; o CASCADE do FK é o único caminho — §2.3). Registrado
  sem repetir o request: exercer o outro observável exigiria uma setlist alheia
  **com músicas**, e um request a mais em prod, que esta sessão não fez.

