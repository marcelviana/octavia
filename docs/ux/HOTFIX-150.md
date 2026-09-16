# HOTFIX-150.md — `DELETE /api/setlists/[id]` sem checagem de dono (divs. 150 e 151)

> **Data**: 2026-09-16. **Origem**: pre-check do N2 (PR #306, `docs/native/N2-PRECHECK.md` §13), decisão do Marcel **N2-D6** (corrigir agora, PR própria, antes de qualquer escrita do nativo).
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

Nenhuma leitura das linhas afetadas → inexistente e alheia caem no mesmo `200` (div. 151).

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

Único caller do DELETE: `lib/setlist-service.ts:227` (`deleteSetlist`), que faz `if (!response.ok) throw` e não lê o corpo; chamado só por `components/setlist-manager.tsx:140` (`confirmDeleteSetlist`). Nenhum caller **depende** do 200 para inexistente. Mudança observável: se a setlist já tiver sumido (outra aba/aparelho apagou antes), o usuário vê o toast "Failed to delete setlist" e a setlist continua na lista local até recarregar — **div. 172**, declarada e **não** adaptada (o escopo é a rota).

### 2.6 Contrato `[medido]`

`docs/api/CONTRATO-DE-ERRO.md`:

```
51:| `NOT_FOUND` | 404 | Recurso inexistente **ou de outro usuário** — indistinguíveis por decisão (sem oráculo de existência). |
96:404  {"error":"Setlist not found","code":"NOT_FOUND"}
```

`docs/api/SETLISTS.md` (as linhas `41-43` citadas no prompt são da listagem GET — o texto está em `78-80`; **div. 171**):

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

- **170** — extra fora da lista fechada, declarado antes do commit: `app/api/setlists/[id]/__tests__/route.test.ts` muda 2 linhas — a asserção do teste "only deletes setlists owned by the authenticated user" (200 → 404) e o nome do teste vizinho, que afirmava "delete de inexistente real é 200 idempotente" (decisão do B3 PR-3a, derrubada pela N2-D6).
- **171** — o prompt cita `SETLISTS.md:41-43` para a regra "inexistente-ou-alheia → 404 sem oráculo"; o texto está em `:78-80` (e repetido em `:100` e `:113`).
- **172** — efeito observável no único caller web (2.5): delete de setlist já apagada vira toast de erro em vez de sucesso silencioso. Não adaptado nesta PR.
- **173** — o prompt pede `pnpm test <arquivo>`; o filtro do Vitest não casa caminho com `[id]` (`No test files found`, com e sem escape). Rodado por nome (`pnpm test delete-owner`), que casa só o arquivo novo.
- Numeração: a PR #306 (`n2/precheck`) usa até a div. 160 (`git grep -E "[Dd]iv\. ?1[5-9][0-9]" FETCH_HEAD -- docs` → maior = 160); 170+ sem colisão.
