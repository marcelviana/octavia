# B5-PRECHECK.md

> **Data**: 2026-08-29 · Sessão de pre-check do B5 (medição e inventário; zero correções, zero commits). Complemento de registro aplicado no mesmo dia (aval pendente): scripts/queries verbatim em §2 + Apêndice B; retag da causalidade do 500 do P2 (§4); íntegra da listagem do bucket no Apêndice C.
> Alvos: código no working tree da `main` (`adab4f0`, limpo), banco/bucket vivos (Supabase, service role local), prod via URL de branch `octavia-git-main-…` (leitura + probes mínimos de escrita com restauração provada).
> Regra de varredura em vigor: toda afirmação `[medido]` carrega comando + saída literal.

---

## ⚠️ Divergências entre o esperado e o encontrado (destaque, regra 7)

1. **O enunciado deste pre-check afirma "o plano descreve B5 como storage (listagem, órfãos, magic bytes)". O plano NÃO descreve assim nas seções de bloco**: a seção intitulada **B4** é a de storage; a seção intitulada **B5** é "Decisões de dados" (já ✅ decididas), que inclui a **busca** (LIB-04) como tarefa. A rotulagem "B5 = storage" nasceu **dentro do balanço do B2** (no mesmo arquivo do plano) e se propagou ao `B2-DESENHO.md` e às memórias do B3. Evidência completa no §1. `[medido]`
2. **`PLANO-TRANSICAO.md` não está na raiz** (o enunciado o cita sem caminho): vive em `docs/ux/PLANO-TRANSICAO.md`. `[medido: ls raiz → "No such file"; find → ./docs/ux/PLANO-TRANSICAO.md]`
3. **CLAUDE.md declara "Storage: Firebase Storage for file uploads" — é falso hoje**: as rotas de upload/delete usam **Supabase Storage** (bucket `content-files`). `[medido por código: app/api/storage/upload/route.ts:2,9,79-87]`
4. **O limite efetivo de upload NÃO é o da rota**: o bucket tem `file_size_limit: 1048576` (1MB) configurado no Supabase `[medido]` — menor que os 50MB do schema da rota. Um upload de 2MB morreu em **500 genérico** `[medido, P2 §4.2]`; a extrapolação para toda a faixa 1MB–4,5MB e a atribuição causal ao limite do bucket são `[análise]` (§4.4).
5. **"Guard de 1MB uniforme" (balanço do B3) tem uma exceção**: a rota de reorder (`app/api/setlists/songs/[songId]/route.ts:170`) usa `request.json()` cru, sem o guard de 1MB (fica coberta só pelo 413 de 4,5MB da plataforma). Fora do escopo storage; registrado por precisão. `[medido]`
   ```
   $ grep -n 'json()\|parseRequestBody\|1024' 'app/api/setlists/songs/[songId]/route.ts'
   170:    const body = await request.json()
   ```

---

## §1 — Resolução de escopo

### 1.1 O que o plano define, verbatim

**Seção de storage — intitulada B4** (`docs/ux/PLANO-TRANSICAO.md`, linhas 505–518):

> ### B4 — Storage: listagem e reconciliação de órfãos (ADD-15 / FASE-D-04)
>
> A API expõe só `upload` e `delete` por nome exato — **não há listagem do
> bucket**. Todo fluxo de import que morre entre upload e criação do content
> (exatamente o que ADD-01/ADD-02 produzem) vaza um arquivo **irrecuperável**.
> O cleanup do audit só funcionou porque instrumentou os nomes no momento do
> upload.
>
> **Tarefa**: endpoint de listagem por prefixo do usuário + rotina de
> reconciliação (arquivo sem linha de `content` correspondente → candidato a
> órfão, com idade mínima antes de remover). **Extra do mesmo pacote**: a
> validação de upload compara extensão com o MIME *declarado pelo cliente*
> (item 45b: `.zip` renomeado `.pdf` é aceito) — adicionar checagem de magic
> bytes server-side. O nativo herda esse endpoint tal como está.

**Seção intitulada B5** (linhas 520–528) — cabeçalho e a linha da busca:

> ### B5 — Decisões de dados (✅ decididas em 2026-08-10)
>
> | Decisão | Estado provado | **Decisão do Marcel** |
> | […] |
> | **Busca com acento/typo** (LIB-04) | `aguas` → 0, `Águas` → 2 (item 25). A busca é `ILIKE` no Postgres; o nativo herda `GET /api/content?search=`. | (tarefa, não decisão) `unaccent` no mínimo; `pg_trgm` se quiser tolerância a typo. Corrigir no backend serve web e nativo de uma vez. |

**Porém, o balanço do B2 — no MESMO arquivo do plano** (heranças nomeadas, linhas 456–460) — chama storage de B5:

> - **B5** (storage): listagem por prefixo, reconciliação de órfãos, magic
>   bytes (`.zip` renomeado `.pdf` com MIME certo ainda passa — declarado);
>   a rota `POST /api/storage/delete` teve o **primeiro uso real provado**
>   no cleanup da PR-4b (200×2).

E o `B2-DESENHO.md:664` idem:

> | Storage: listagem, órfãos, magic bytes; `POST /api/storage/delete` (mantida sem uso) | **B5** |

### 1.2 Busca no plano inteiro `[medido]`

```
$ grep -n -i 'busca\|search' docs/ux/PLANO-TRANSICAO.md
65:  (nota do ADD-13: "Item 46 (busca pelo título) atendido…")
95:  redesign de busca e filtros (LIB-05/06/07), … [seção "NÃO entra no Bloco A"]
335: | proxy | 120/min | biblioteca cheia busca dezenas de assets/load | [tabela de janelas B1.3]
528: | **Busca com acento/typo** (LIB-04) | … | — na tabela da SEÇÃO B5
669: | Busca do dashboard ao resultado | 3 taps, 1,5 s | [C2 baseline]
684: | Busca tolerante a acento/typo | item 25 (B5) | [C4, requisitos do nativo]
685: | Busca de dentro do palco ("toca aquela!") | item 26 | [C4]
731: - **Busca dentro do performance mode** (J5; item 26): … [C4]
809: | LIB-05 | Busca só no Enter … | [Bloco D]
1009: | LIB-04 | Busca sem tolerância a acento/typo | S2 | **B** | B5: unaccent/pg_trgm — nativo herda a API |
1010: | LIB-05 | Busca só no Enter | S2 | D | critérios do J5 cobrem o nativo |
```

Toda menção a busca **como tarefa de backend** (linhas 528, 684, 1009) está atribuída a **"B5"** — no sentido "B5 = decisões de dados" das seções do plano.

### 1.3 Veredito

**O plano é ambíguo — a decisão é do Marcel.** Os dois sentidos coexistem por escrito:

- **Pelo cabeçalho das seções**: storage = **B4**; "B5" = decisões de dados, e a única tarefa em aberto dentro dele é a **busca** (LIB-04, unaccent/pg_trgm).
- **Pelo uso pós-B2** (balanço do B2 no próprio plano, `B2-DESENHO.md` §herança, memória do B3 — "B5 (storage/busca)"): "B5" = o pacote de storage, possivelmente absorvendo a busca.

Nenhum documento funde explicitamente os dois; ninguém renumerou as seções. **Perguntas abertas nº 1** (fim do documento). O inventário de storage abaixo prossegue em qualquer caso (incontroverso). A busca **não foi medida** nesta sessão (nenhum probe de `?search=`) — se o Marcel a incluir no B5, o pre-check dela é medição adicional.

---

## §2 — Inventário bucket × tabela

> **Instrumento**: todo o §2 foi produzido por UM script ad-hoc somente-leitura (REST puro contra a API do Supabase com service role, sem dependências), colado **na íntegra no Apêndice B**, com o comando exato de execução. As saídas abaixo são literais dele.

### 2.1 Bucket(s) `[medido]`

Query de buckets (do script, Apêndice B): `GET ${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket` com headers `apikey`/`Authorization: Bearer` = service role. Equivalente reproduzível para a listagem de objetos:

```bash
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/list/content-files" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' -d '{"prefix":"","limit":1000}'
```

Saída literal:

```
== BUCKETS ==
{"name":"content-files","public":true,"file_size_limit":1048576,"allowed_mime_types":null,"created_at":"2025-06-16T21:42:37.403Z"}
```

**Um único bucket, `content-files`, PÚBLICO, com limite de 1MB por objeto e SEM restrição de MIME no nível do bucket.** Os três fatos são achados (o público e o 1MB não estavam registrados em nenhum documento do ciclo).

### 2.2 Objetos `[medido]` — 94 objetos, todos na raiz, padrão `<timestamp>-<nome>`

Total: **94** (`== OBJETOS content-files (94) ==` na saída do script). **A íntegra das 94 linhas está no Apêndice C.** Amostra (3 primeiras / 3 últimas):

```
{"path":"1750165612008-Easy - Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-17T13:06:52.690Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750167601323-Easy - Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-17T13:40:02.378Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750171474983-Easy - Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-17T14:44:36.087Z","updated":"2025-11-11T22:11:46.637Z"}
[… Apêndice C …]
{"path":"1786485287455-ux-audit-fase-d-cifra.pdf","size":1117,"contentType":"application/pdf","created":"2026-08-11T21:54:47.603Z","updated":"2026-08-11T21:54:47.603Z"}
{"path":"1786485330636-ux-audit-fase-d-cifra.pdf","size":1117,"contentType":"application/pdf","created":"2026-08-11T21:55:30.769Z","updated":"2026-08-11T21:55:30.769Z"}
{"path":"1786485432806-ux-audit-fase-d-offline.pdf","size":888,"contentType":"application/pdf","created":"2026-08-11T21:57:12.907Z","updated":"2026-08-11T21:57:12.907Z"}
```

Observações `[medido]`: maior objeto = 242.176 bytes (nenhum objeto perto do 1MB do bucket); épocas: jun–jul/2025 (uso inicial + testes de batch) e ago/2026 (ux-audit). O objeto `1786295958275-ux-audit-fase-d-zip-renomeado.pdf` (o `.zip` renomeado do item 45b) **segue no bucket armazenado como `application/pdf`** — prova histórica viva do furo de magic bytes.

### 2.3 Referências no banco `[medido]`

Colunas que apontam para storage, descobertas pelo dump:

```
$ grep -n 'file_url\|storage\|bucket' supabase/schema.dump.sql | head
59:    "file_url" "text",
$ grep -n 'url\|_file\|path' supabase/schema.dump.sql | grep -i '"'   # (recorte relevante)
59:    "file_url" "text",
60:    "thumbnail_url" "text",
77:    "avatar_url" "text",
```

→ `content.file_url` (59), `content.thumbnail_url` (60), `profiles.avatar_url` (77). Nenhuma outra tabela tem coluna de arquivo (5 tabelas no dump: annotations, content, profiles, setlist_songs, setlists — `grep -n 'CREATE TABLE' supabase/schema.dump.sql`).

Queries que produziram os números (PostgREST, service role — trecho literal do script do Apêndice B):

```ts
const content = await j(await fetch(`${url}/rest/v1/content?select=id,user_id,title,content_type,file_url,thumbnail_url,created_at&order=created_at.asc`, { headers: H }))
const profiles = await j(await fetch(`${url}/rest/v1/profiles?select=id,avatar_url`, { headers: H }))
```

Saída literal:

```
== CONTENT (194 linhas) ==
file_url NOT NULL: 8 · thumbnail_url NOT NULL: 0
== PROFILES (5 linhas) ==
{"id":"4166b6af-bc6a-4795-8082-fe1032da1846","avatar_url":null}
{"id":"6b2da77b-c2ae-487b-a302-9a70d0a2a512","avatar_url":null}
{"id":"xVDJRBh1WpPOatbfWahOLttYn1E3","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLMolq-AbV-8H1xiWnO6zkvVW8drpSXfoDXRt9Tg5ntcqHu920g=s96-c"}
{"id":"auvL2KKsYBVdvvnc83faOJM8rLi1","avatar_url":null}
{"id":"Pw3bxXZw0iT3WwyL7kxGtGJIJH83","avatar_url":null}
```

As 8 linhas de `content` com `file_url` (íntegra):

```
{"id":"97555956-…","title":"Easy","file_url":"…/content-files/1750171474983-Easy%20-%20Guitar.pdf"}
{"id":"ef95db03-…","title":"Fly Me To The Moon","file_url":"…/content-files/1750546056712-flyme.jpg"}
{"id":"b23a3803-…","file_url":"…/content-files/1751910900697-Easy_-_Guitar.pdf"}
{"id":"e50f0f23-…","file_url":"…/content-files/1786218427769-ux-audit-partitura-1p.pdf"}
{"id":"2e98efc7-…","file_url":"…/content-files/1786218429715-ux-audit-partitura-12p.pdf"}
{"id":"79579f63-…","file_url":"…/content-files/1786295844475-ux-audit-fase-d-cifra.pdf"}
{"id":"97256d70-…","file_url":"…/content-files/1786295884124-ux-audit-fase-d-offline.pdf"}
{"id":"13303251-…","file_url":"…/content-files/1786295884124-ux-audit-fase-d-offline.pdf"}
```

### 2.4 Cruzamento `[medido]`

Lógica do cruzamento (trecho literal do script do Apêndice B — o parse da URL e os dois sentidos):

```ts
const parseRef = (u: string): { bucket: string; path: string } | null => {
  const m = u.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/)
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null
}
// … allRefs = file_url + thumbnail_url + avatar_url não-nulos …
for (const ref of allRefs) {
  if (!ref.ref) { foraDoStorage.push(ref); continue }
  if (objSet.has(`${ref.ref.bucket}/${ref.ref.path}`)) casados.push(ref)
  else orfaosB.push(ref)
}
const referenced = new Set(allRefs.filter(r => r.ref).map(r => `${r.ref!.bucket}/${r.ref!.path}`))
const orfaosA: string[] = [...objSet].filter(k => !referenced.has(k))
```

Saída literal:

```
refs totais no banco (file_url+thumbnail_url+avatar_url não-nulos): 9
-- ÓRFÃOS TIPO A (objeto sem linha): 87
-- ÓRFÃOS TIPO B (linha sem objeto): 0
-- REFS FORA DO PADRÃO DE URL DO STORAGE: 1   (profiles.avatar_url → lh3.googleusercontent.com)
-- CASADOS (ref ↔ objeto): 8
```

- **Órfãos tipo A: 87 de 94 objetos (92,5%)**. A lista é derivável por diferença: 94 objetos do Apêndice C menos os 7 caminhos referenciados dos "casados" abaixo; a saída literal dos 87 caminhos foi colada na íntegra na saída do script desta sessão. Primeiras/últimas 10:
  ```
  1750165612008-Easy - Guitar.pdf · 1750167601323-Easy - Guitar.pdf · 1750188908482-letrasv2_teste.pdf ·
  1750189474633-Copia_Letras_v2.pdf · 1750189647958-Copia_Letras_v2.pdf · 1750189680045-teste_batch_letras.docx ·
  1750189947482-Copia_Letras_v2.pdf · 1750189993212-teste_batch_letras.docx · 1750190186047-Letras_v2.txt ·
  1750190417318-Letras_v2.txt
  […]
  1786295908931-ux-audit-fase-d-batch.txt · 1786295958275-ux-audit-fase-d-zip-renomeado.pdf ·
  1786296073893-ux-audit-fase-d-drop-1.pdf · 1786483430083-ux-audit-pr3-cifra.pdf ·
  1786485255176-ux-audit-pr3-cifra.pdf · 1786485287455-ux-audit-fase-d-cifra.pdf ·
  1786485330636-ux-audit-fase-d-cifra.pdf · 1786485432806-ux-audit-fase-d-offline.pdf
  ```
- **Órfãos tipo B: ZERO** — toda `file_url` não-nula aponta para objeto existente. Consequência para o §5: o probe de objeto sumido usou caminho inventado (não havia cenário real).
- **Sãos: 8 refs ↔ 7 objetos distintos** — saída literal dos casados:
  ```
  {"origem":"content.file_url","id":"97555956-0308-4d3f-bb90-4e38485fd753","path":"1750171474983-Easy - Guitar.pdf"}
  {"origem":"content.file_url","id":"ef95db03-0bb4-4b37-b9b2-bb219a3e5040","path":"1750546056712-flyme.jpg"}
  {"origem":"content.file_url","id":"b23a3803-33fc-42d2-a943-32a564dadee4","path":"1751910900697-Easy_-_Guitar.pdf"}
  {"origem":"content.file_url","id":"e50f0f23-d583-4d43-a136-8808f9946f0f","path":"1786218427769-ux-audit-partitura-1p.pdf"}
  {"origem":"content.file_url","id":"2e98efc7-92ec-4a2b-b11f-8e2a92a9d46f","path":"1786218429715-ux-audit-partitura-12p.pdf"}
  {"origem":"content.file_url","id":"79579f63-10d2-43d5-b811-f1e6e1c8378b","path":"1786295844475-ux-audit-fase-d-cifra.pdf"}
  {"origem":"content.file_url","id":"97256d70-9f2e-4947-9c7e-f7a8d0811990","path":"1786295884124-ux-audit-fase-d-offline.pdf"}
  {"origem":"content.file_url","id":"13303251-c67d-402b-bb16-57523333697d","path":"1786295884124-ux-audit-fase-d-offline.pdf"}
  ```
  Duas linhas (`97256d70`, `13303251`) apontam para o MESMO objeto. Conferência aritmética: 94 objetos − 7 referenciados = 87 órfãos ✓.
- `[análise]` Fonte estrutural do órfão tipo A, além do import interrompido (ADD-15): **o DELETE de content apaga só a linha, nunca o objeto** — verbatim de `app/api/content/route.ts:324-329`:
  ```ts
  const { error } = await supabase
    .from('content')
    .delete()
    .eq('id', idValidation.data)
    .eq('user_id', user.uid)
  ```
  Nenhuma chamada a `storage.remove` em nenhum handler de content `[medido: grep 'storage' app/api/content/route.ts → só imports; nenhum hit de remove]`.

---

## §3 — Validação efetiva do upload hoje

### 3.1 O que a rota valida, verbatim (`app/api/storage/upload/route.ts:29-68`)

```ts
    if (!file) {
      return validationError([
        { code: 'invalid_type', path: ['file'], message: 'No file provided' } as never,
      ])
    }

    if (!filename) {
      return validationError([
        { code: 'invalid_type', path: ['filename'], message: 'No filename provided' } as never,
      ])
    }

    // Validate file using storage schema
    const fileValidation = storageSchemas.upload.safeParse({
      filename,
      contentType: file.type,
      size: file.size
    })

    if (!fileValidation.success) {
      return validationError(fileValidation.error)
    }

    // Additional security checks - basic filename sanitization
    const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').trim()
    if (sanitizedFilename.length === 0) {
      return validationError([
        { code: 'custom', path: ['filename'], message: 'Invalid filename after sanitization' } as never,
      ])
    }

    // Consistência extensão × MIME — MESMA tabela do schema (b8: …)
    if (!mimeMatchesExtension(sanitizedFilename, file.type)) {
      return validationError([
        { code: 'custom', path: ['contentType'], message: 'File extension does not match MIME type' } as never,
      ])
    }
```

Com o schema (`lib/api-schemas.ts:226-236`): `filename` = `min(1).max(255).regex(/^[^<>:"/\\|?*]+$/)` + extensão na lista `ALLOWED_UPLOADS` (pdf/txt/docx/png/jpg/jpeg); `contentType` = MIME na mesma lista (`image/jpg` aceito); `size` = `int().min(1).max(50*1024*1024)`.

| # | Checagem que EXISTE | Camada | Sobre o quê |
|---|---|---|---|
| 1 | Presença de `file` (400 `field:"file"`) | rota | multipart |
| 2 | Presença de `filename` (400 `field:"filename"`) | rota | multipart |
| 3 | Extensão ∈ {pdf,txt,docx,png,jpg,jpeg} | schema | **nome declarado** |
| 4 | MIME ∈ lista única | schema | **`file.type` DECLARADO pelo cliente** |
| 5 | `size` 1 byte–50MB | schema | tamanho real recebido |
| 6 | Sanitização de chars `<>:"/\\|?*` no filename (+vazio → 400) | rota | nome |
| 7 | Extensão × MIME declarado (`mimeMatchesExtension`) | rota | nome × declaração |
| 8 | Nome único `${Date.now()}-${sanitized}` + `upsert:false` | rota | colisão/traversal |

**O que NÃO existe** `[medido]`: nenhuma inspeção de bytes em camada nenhuma —

```
$ grep -rn 'magic' lib/ app/ components/ hooks/ --include='*.ts' --include='*.tsx' | grep -v test
(zero hits — exit code 1)
```

Constante morta na rota: `MAX_FILE_SIZE = 50*1024*1024` (linha 10) declarada e **nunca usada** `[medido: grep -n MAX_FILE_SIZE → só a linha 10]` (o limite operante é o do schema).

### 3.2 Config do bucket `[medido]` (§2.1)

`public: true` · `file_size_limit: 1048576` · `allowed_mime_types: null` — o bucket **não restringe MIME** e **não inspeciona conteúdo**; restringe só tamanho (1MB).

### 3.3 Probe de magic bytes (P1) `[medido em prod, 2026-08-29, restaurado com prova — Apêndice A]`

Arquivo de **17 bytes de texto** (`this is not a png`) declarado `image/png`, nome `b5-precheck-magic.png`, enviado à rota real:

```
--- P1 upload response ---
status: 201
content-type: application/json
body: {"url":"https://mlxjmpbdchmwplcfislt.supabase.co/storage/v1/object/public/content-files/1788036210070-b5-precheck-magic.png","path":"1788036210070-b5-precheck-magic.png","originalFilename":"b5-precheck-magic.png","size":17,"type":"image/png","success":true}

--- P1 GET público do objeto armazenado ---
status: 200
content-type: image/png
body: this is not a png
P1 bytes armazenados === enviados: true
```

### 3.4 Veredito `[medido]`

**Magic bytes NÃO são verificados em NENHUMA camada** — nem rota (só `file.type` declarado, checagens 4 e 7 acima), nem bucket (`allowed_mime_types: null`), nem plataforma. A mentira passa **na checagem 4/7 da rota** (que compara a declaração consigo mesma) e o Supabase **armazena e serve o contentType mentiroso** (`content-type: image/png` no GET público, bytes de texto intactos). A hipótese herdada do B2 (item 45b, `.zip`→`.pdf`) está **confirmada por probe novo E pelo objeto histórico** `1786295958275-ux-audit-fase-d-zip-renomeado.pdf` ainda armazenado como `application/pdf` (§2.2).

---

## §4 — Limites (multipart × plataforma)

### 4.1 O guard de 1MB, verbatim (`lib/api-validation-middleware.ts:29-41`)

```ts
export async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const text = await request.text()

      // Security: Limit JSON size
      if (text.length > 1024 * 1024) { // 1MB limit
        throw new Error('Request body too large')
      }
```

**A quem se aplica** `[medido por código + teste]`: só a corpos **`application/json`**. Consumidores (grep):

```
$ grep -rn "api-validation-middleware" app/ --include='*.ts' | grep -v test
app/api/content/route.ts:13:        import { parseRequestBody, ValidationError } …   (POST linha 162, PUT linha 236)
app/api/auth/session/route.ts:5:    import { withPublicBodyValidation } …
app/api/profile/route.ts:6:         import { withBodyValidation } …
app/api/setlists/route.ts:6:        import { withBodyValidation } …
app/api/setlists/[id]/route.ts:6:   import { withBodyValidation } …
app/api/setlists/[id]/songs/route.ts:6: import { withBodyValidation } …
```

Teste existente que o prova: `app/api/content/__tests__/route.test.ts:464` — `'G-guard (decisão B): corpo de 2MB no POST → 400 field:""'` (assert do literal `{"field":"","message":"Invalid request body format","code":"invalid_type"}`); mais a linha `[medido]` do `B3-ENCERRAMENTO.md` ("400 corpo >1MB (guard, decisão B)"). **O ramo multipart do próprio `parseRequestBody` não tem limite** (cai em `request.formData()`), e a rota de upload chama `request.formData()` direto — **nenhum guard de tamanho de requisição multipart nosso** (só o `size` do schema, 50MB, sobre o arquivo já recebido). Exceção já registrada nas divergências: reorder usa `request.json()` sem guard.

### 4.2 Probe multipart ~2MB (P2)

Upload **legítimo** (txt de 2MB, `text/plain`, dentro dos 50MB do schema). Status, corpo e ausência de persistência `[medido em prod, 2026-08-29 — Apêndice A]`:

```
--- P2 upload response ---
status: 500
content-type: application/json
body: {"error":"File upload failed","code":"INTERNAL_ERROR"}
P2 objetos "b5-precheck-2mb" no bucket: []
```

`[análise]` A atribuição causal — o Supabase recusou o objeto pelo `file_size_limit` de 1MB do bucket e o ramo `if (error)` da rota converteu em `internalError()` — é inferência dos dois fatos medidos (limite do bucket em §2.1 + este 500 sem persistência), não observação direta: o corpo do erro upstream no ponto do catch fica só no log server-side (por construção do contrato, D6) e não foi capturado para a request do P2.

### 4.3 O 413 de 4,5MB

Já medido e registrado no contrato (cláusula não-JSON do `CONTRATO-DE-ERRO.md`: `413 text/plain "Request Entity Too Large FUNCTION_PAYLOAD_TOO_LARGE …"`) — **referenciado, não repetido**.

### 4.4 Veredito

**Existe faixa sem guard nosso, e ela é toda a faixa útil acima de 1MB:**

| Tamanho do upload | Quem barra | Resposta real | Tag |
|---|---|---|---|
| ≤ 1MB (e válido) | ninguém | 201 | `[medido, P1 a 17 bytes]` |
| > 1MB e < ~4,5MB | `file_size_limit` do bucket Supabase | **500 `INTERNAL_ERROR`** genérico | resposta `[medido a 2MB, P2]`; atribuição ao bucket e extrapolação à faixa inteira `[análise]` (§4.2) |
| ≥ ~4,5MB | plataforma Vercel | 413 text/plain | `[medido no B3 — contrato, cláusula não-JSON; referenciado]` |

O "50MB" do schema e o `MAX_FILE_SIZE` órfão **prometem um teto que nenhuma requisição alcança** `[análise, decorrência da tabela]`. Um arquivo real de 2MB (partitura escaneada comum) hoje é **impossível de subir** `[medido, P2]`, e a falha se apresenta como erro interno do servidor, não como rejeição explicada — reedição do anti-padrão C3-5 (ADD-07: "413 mudo"), agora em 500. `[análise]` Não está determinado nesta medição se o 1MB do bucket foi intencional (data de criação do bucket: 2025-06-16, muito anterior ao Bloco B) — pergunta aberta nº 4.

---

## §5 — Ramo da decisão A: objeto sumido no bucket

§2 achou **zero órfãos tipo B**, então o probe usou caminho inventado (`b5-precheck-inexistente.pdf`), leitura pura. As duas pontas `[medido em prod, 2026-08-29]`:

**Ponta upstream** (GET direto na URL pública do Supabase):

```
--- P5 upstream direto (Supabase público) ---
status: 400
content-type: application/json; charset=utf-8
body: {"statusCode":"404","error":"not_found","message":"Object not found","code":"NoSuchKey"}
```

**Ponta nossa** (GET `/api/proxy?url=<a mesma URL>`, autenticado):

```
--- P5 nossa rota /api/proxy ---
status: 500
content-type: application/json
body: {"error":"Internal server error","code":"INTERNAL_ERROR"}
```

**Confirmado o registro do B3** (aval do PR-4, `B3-ENCERRAMENTO.md` §2 registro 1): o Supabase sinaliza objeto inexistente com **HTTP 400** (o corpo até diz `"statusCode":"404"`/`NoSuchKey`, mas o status HTTP é 400) → nosso ramo `res.status === 404 ? notFound() : internalError()` (`app/api/proxy/route.ts:69`) cai no `internalError()` → **500**. O ramo `upstream 404 → nosso 404` é **inerte com o upstream atual**, como suspeitado. "Objeto sumido" é hoje indistinguível de falha real de upstream para qualquer cliente.

---

## §6 — Uso real pelo cliente web

Grep-base `[medido]`:

```
$ grep -rn 'storage/upload\|storage/delete\|api/proxy' --include='*.ts' --include='*.tsx' app components lib hooks contexts | grep -v test | grep -v 'app/api/'
components/add-content/upload-to-storage.ts:36:  const response = await fetch("/api/storage/upload", {
lib/offline-cache.ts:173:            : `/api/proxy?url=${encodeURIComponent(item.file_url)}`;
lib/advanced-content-cache.ts:310:      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`)
(+ hits de comentário/monitor sem chamada: user-rate-limit.ts:57, api-errors.ts:5, performance-monitor.ts:409, security-headers.ts:81)

$ grep -rn 'storage/delete' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
→ hits APENAS em: testes da própria rota, .audit/* (grafos/logs), docs, tests/security,
  e UM caller executável: scripts/ux-audit/cleanup.ts:152 (tooling)
```

Rota a rota:

| Rota | Caller(s) de cliente | Fluxo de UI `[medido por código]` |
|---|---|---|
| `POST /api/storage/upload` | `components/add-content/upload-to-storage.ts:36` ← `FileUploadZone.tsx:39` ← `RefactoredAddContent.tsx:169` | **Único fluxo**: add-content, aba de upload de arquivo |
| `POST /api/storage/delete` | **NENHUM código de app.** Único caller executável: `scripts/ux-audit/cleanup.ts:152` (tooling de auditoria) | Rota que nenhum fluxo de UI dispara. O "primeiro uso real" do B2 foi o cleanup (tooling) — **segue sendo o único caminho**, confirmado |
| `GET /api/proxy` | `lib/advanced-content-cache.ts:310` (`fetchFromNetwork`) ← `getCachedContent` ← `hooks/use-content-loading.ts:49` e `hooks/use-performance-effects.ts` ← `components/optimized-performance-mode.tsx` | **Palco (performance mode)**: todo `file_url` de música com arquivo passa pelo proxy → blob → `createObjectURL`. Segundo caller: `lib/offline-cache.ts:173`, mas só como **fallback quando `file_url` NÃO é URL pública do Supabase** — com o bucket público, toda `file_url` é pública → **ramo praticamente inerte** `[análise]` |
| Listagem | — | **Rota não existe** `[medido: find app/api/storage → só upload/ e delete/]` |

Achado colateral `[medido por código]`: o **viewer** (`components/content-viewer/SheetMusicDisplay.tsx:35-76`, `components/editors/content-type-editor.tsx:52-71`) e o cache offline usam a **URL pública DIRETA** do bucket (`offlineUrl || content.file_url`), sem proxy e sem auth — **o app web depende funcionalmente de o bucket ser público** (§2.1). Só o palco proxeia.

---

## §7 — Bypass secret do Vercel

Inventário `[medido]`:

```
$ grep -rln 'octavia-vercel-bypass\|x-vercel-protection-bypass\|vercel_jwt\|VERCEL_AUTOMATION_BYPASS' . \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
playwright.ux-audit.config.ts
tests/ux-audit/auth.setup.ts
docs/ux/PLANO-TRANSICAO.md
docs/ux/B3-PRECHECK.md
scripts/ux-audit/auth.ts
```

Usos executáveis, com papel:

| Arquivo | Linhas | Papel |
|---|---|---|
| `scripts/ux-audit/auth.ts` | 27-33, 115, 172 | `bypassHeaders()` — header `x-vercel-protection-bypass` lido de env no momento da execução; usado no login REST e no `apiFetch` de todos os probes/validações Node |
| `tests/ux-audit/auth.setup.ts` | 33, 47-52 | Semeia o cookie `_vercel_jwt` por query param (`VERCEL_AUTOMATION_BYPASS_SECRET`) para os gates Playwright |
| `playwright.ux-audit.config.ts` | 41-46 | Só comentário normativo (nunca por `extraHTTPHeaders`) |

Docs: `PLANO-TRANSICAO.md` (decisão de 2026-08-13: revogação no **fim do Bloco B**; padrão cookie-nunca-header-global) e `B3-PRECHECK.md` (registro de uso). **Nada foi revogado nesta sessão.** Esta própria sessão usou o secret (inline de `~/.octavia-vercel-bypass`) nos probes P1/P2/P5. `[análise]` O inventário mostra que o bypass é a espinha da validação preview-first — que os blocos B6/B9 presumivelmente ainda usarão; a decisão "revogar no B5 ou no B9, e quem documenta o procedimento" é do Marcel (pergunta aberta nº 5).

---

## §8 — Meta-pergunta do bloco `[análise]`

O que o app nativo vai precisar do storage que hoje não existe ou não é confiável — lacunas com a evidência que as sustenta, sem desenho de solução:

1. **Confiança no conteúdo do bucket: inexistente.** Nenhuma camada olha os bytes (§3: grep `magic` zero; probe P1: texto servido como `image/png` com 201; objeto histórico `zip-renomeado.pdf` ainda armazenado). O renderer nativo de PDF/imagem consumirá o que quer que o cliente tenha declarado — todo consumidor precisa tratar o contentType do bucket como não-confiável.
2. **Integridade referencial: 92,5% do bucket é órfão** (87/94, §2.4) e a produção de órfãos é estrutural: import interrompido (ADD-15) E delete de content que nunca remove o objeto (§2.4, código). Zero órfãos tipo B hoje — mas nada impede um (delete de storage por tooling sem tocar a linha produziria um).
3. **Entrega do arquivo: o modelo atual é "bucket público para o mundo"** (§2.1, §6). O viewer e o cache offline dependem da URL pública sem auth; só o palco proxeia (com auth + rate limit). O nativo precisa de UMA forma contratada de entrega (proxy autenticado × URL assinada × público assumido) — hoje coexistem duas de fato, e a rota `file_url` gravada no banco é uma URL pública permanente (rotação de bucket/visibilidade quebraria as 8 refs).
4. **Listagem: não existe** (§6) — o órfão continua irrecuperável por API; qualquer reconciliação nativa exigiria o endpoint que o plano (seção B4) já especifica.
5. **Limites: o teto real observado (1MB, bucket) contradiz o contratado na rota (50MB)** e um upload de 2MB responde 500 genérico (§4). O nativo herdaria um upload que mente sobre o próprio limite e falha sem explicação exatamente no tamanho típico de PDF escaneado.
6. **Erro fim a fim: "objeto sumido" = 500** (§5) — indistinguível de pane; o ramo 404 do proxy é inerte. O contrato de erro do B3 está íntegro na superfície (envelope correto), mas a semântica embaixo dele não discrimina o caso.
7. **Delete de storage: rota viva sem consumidor de produto** (§6) — se o nativo for gerenciar arquivos (trocar arquivo de um content, limpar no delete), o contrato dela (por `filename` com regex de convenção) nunca foi exercitado por fluxo real de usuário.

---

## Apêndice A — registro dos probes de escrita e prova de restauração

**Ambiente**: prod via `https://octavia-git-main-marcelvianas-projects.vercel.app` (mesmo deployment de produção; leitura + 3 requests da família storage [limite 60/h] + 1 do proxy — nenhuma provocação de rate limit). Auth: usuário de audit existente (regra 9 respeitada — nenhum usuário criado; `profiles` intocada). Secret do bypass lido inline, nunca gravado/logado. Banco e bucket: tabelas **não tocadas** (probes só de storage); zero retries.

| Passo | Ação | Resultado literal |
|---|---|---|
| Leitura-antes | contagem do bucket + busca por `b5-precheck` | `objetos no bucket ANTES: 94` · `objetos com "b5-precheck" ANTES: []` |
| P1 write | upload texto-como-png | `201` + `path: 1788036210070-b5-precheck-magic.png` (corpo no §3.3) |
| P1 verify | GET público | `200`, `content-type: image/png`, bytes idênticos |
| P2 write (tentado) | upload txt 2MB | `500 {"error":"File upload failed","code":"INTERNAL_ERROR"}` — **nada criado**: `objetos "b5-precheck-2mb": []` |
| P5 (leitura) | upstream + proxy, caminho inexistente | `400` upstream / `500` nosso (§5) |
| Restauração | `POST /api/storage/delete` do artefato P1 (rota real — 2º uso do caminho de tooling) | `200 {"success":true,"filename":"1788036210070-b5-precheck-magic.png"}` |
| Prova de saldo | re-listagem | `objetos com "b5-precheck" DEPOIS: []` · `objetos no bucket DEPOIS: 94 (antes: 94) — saldo 0` · GET público do deletado: `400 …"NoSuchKey"` |

**Balanço: criados = 1, deletados = 1, tentados-e-recusados = 1 (nada persistiu), saldo zero no bucket; zero escritas em tabela.** Nota de ferramenta: a listagem com `search: "b5-precheck"` do endpoint do Supabase retornou `[]` até com o objeto presente (comportamento do parâmetro `search` da API de list); a existência/ausência do objeto foi provada pelo GET público (200 antes / 400-NoSuchKey depois) e pela contagem total 94→94.

---

## Apêndice B — script do inventário (§2), verbatim

Executado como script ad-hoc no scratchpad da sessão, com env do projeto sourced inline. Comando exato:

```bash
set -a && source .env.local && set +a && npx tsx <scratchpad>/b5-inventario.ts
```

Conteúdo integral do `b5-inventario.ts`:

```ts
/**
 * B5 pre-check §2 — inventário bucket × tabela (SOMENTE LEITURA).
 * REST puro (sem deps): storage API + PostgREST com service role.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const H = { apikey: key, Authorization: `Bearer ${key}` }

type Obj = { path: string; size: number | null; contentType: string | null; created: string | null; updated: string | null }

async function j(res: Response): Promise<any> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)
  return res.json()
}

async function listRecursive(bucket: string, prefix: string, acc: Obj[]): Promise<void> {
  const data = await j(await fetch(`${url}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: 'name', order: 'asc' } }),
  }))
  for (const item of data) {
    const full = prefix ? `${prefix}/${item.name}` : item.name
    if (item.id === null) {
      await listRecursive(bucket, full, acc)
    } else {
      acc.push({
        path: full,
        size: item.metadata?.size ?? null,
        contentType: item.metadata?.mimetype ?? null,
        created: item.created_at ?? null,
        updated: item.updated_at ?? null,
      })
    }
  }
}

async function main() {
  const buckets = await j(await fetch(`${url}/storage/v1/bucket`, { headers: H }))
  console.log('== BUCKETS ==')
  for (const b of buckets) {
    console.log(JSON.stringify({ name: b.name, public: b.public, file_size_limit: b.file_size_limit ?? null, allowed_mime_types: b.allowed_mime_types ?? null, created_at: b.created_at }))
  }

  const objsByBucket: Record<string, Obj[]> = {}
  for (const b of buckets) {
    const acc: Obj[] = []
    await listRecursive(b.name, '', acc)
    objsByBucket[b.name] = acc
    console.log(`\n== OBJETOS ${b.name} (${acc.length}) ==`)
    for (const o of acc) console.log(JSON.stringify(o))
  }

  const content = await j(await fetch(`${url}/rest/v1/content?select=id,user_id,title,content_type,file_url,thumbnail_url,created_at&order=created_at.asc`, { headers: H }))
  console.log(`\n== CONTENT (${content.length} linhas) ==`)
  const withFile = content.filter((r: any) => r.file_url !== null)
  const withThumb = content.filter((r: any) => r.thumbnail_url !== null)
  console.log(`file_url NOT NULL: ${withFile.length} · thumbnail_url NOT NULL: ${withThumb.length}`)
  for (const r of content) console.log(JSON.stringify({ id: r.id, title: r.title, content_type: r.content_type, file_url: r.file_url, thumbnail_url: r.thumbnail_url, created_at: r.created_at }))

  const profiles = await j(await fetch(`${url}/rest/v1/profiles?select=id,avatar_url`, { headers: H }))
  console.log(`\n== PROFILES (${profiles.length} linhas) ==`)
  for (const r of profiles) console.log(JSON.stringify(r))

  const parseRef = (u: string): { bucket: string; path: string } | null => {
    const m = u.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/)
    return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null
  }
  const allRefs: { origem: string; id: string; url: string; ref: ReturnType<typeof parseRef> }[] = []
  for (const r of withFile) allRefs.push({ origem: 'content.file_url', id: r.id, url: r.file_url, ref: parseRef(r.file_url) })
  for (const r of withThumb) allRefs.push({ origem: 'content.thumbnail_url', id: r.id, url: r.thumbnail_url, ref: parseRef(r.thumbnail_url) })
  for (const r of profiles.filter((p: any) => p.avatar_url)) allRefs.push({ origem: 'profiles.avatar_url', id: r.id, url: r.avatar_url, ref: parseRef(r.avatar_url) })

  console.log(`\n== CRUZAMENTO ==`)
  console.log(`refs totais no banco (file_url+thumbnail_url+avatar_url não-nulos): ${allRefs.length}`)
  const objSet = new Set<string>()
  for (const [b, objs] of Object.entries(objsByBucket)) for (const o of objs) objSet.add(`${b}/${o.path}`)

  const orfaosB: typeof allRefs = []
  const casados: typeof allRefs = []
  const foraDoStorage: typeof allRefs = []
  for (const ref of allRefs) {
    if (!ref.ref) { foraDoStorage.push(ref); continue }
    if (objSet.has(`${ref.ref.bucket}/${ref.ref.path}`)) casados.push(ref)
    else orfaosB.push(ref)
  }
  const referenced = new Set(allRefs.filter(r => r.ref).map(r => `${r.ref!.bucket}/${r.ref!.path}`))
  const orfaosA: string[] = [...objSet].filter(k => !referenced.has(k))

  console.log(`\n-- ÓRFÃOS TIPO A (objeto sem linha): ${orfaosA.length}`)
  for (const k of orfaosA) console.log(k)
  console.log(`\n-- ÓRFÃOS TIPO B (linha sem objeto): ${orfaosB.length}`)
  for (const r of orfaosB) console.log(JSON.stringify(r))
  console.log(`\n-- REFS FORA DO PADRÃO DE URL DO STORAGE: ${foraDoStorage.length}`)
  for (const r of foraDoStorage) console.log(JSON.stringify(r))
  console.log(`\n-- CASADOS (ref ↔ objeto): ${casados.length}`)
  for (const r of casados) console.log(JSON.stringify({ origem: r.origem, id: r.id, path: r.ref!.path }))
}

main().catch(e => { console.error('ERRO:', e); process.exit(1) })
```

Nota de execução: uma primeira versão do script usava `@supabase/supabase-js` e falhou na resolução de módulo a partir do scratchpad (`Cannot find module '@supabase/supabase-js'`); foi reescrita para REST puro (a versão acima) — nenhuma diferença de semântica, só de transporte.

Os probes do §3/§4/§5 (P1/P2/P5) rodaram por um segundo script ad-hoc no mesmo padrão (`b5-probes.ts`: auth por `signInWithPassword` REST com `USER_AUDIT`/`PASSWORD_AUDIT`, header de bypass lido de env inline, `FormData`/`Blob` nativos do Node 22; saídas literais nos §3.3, §4.2, §5 e Apêndice A), executado com:

```bash
set -a && source .env.local && source .env.uxaudit && set +a && \
  BYPASS=$(cat ~/.octavia-vercel-bypass) npx tsx <scratchpad>/b5-probes.ts
```

---

## Apêndice C — íntegra da listagem do bucket `content-files` (94 objetos) `[medido, 2026-08-29]`

Saída literal do script do Apêndice B (seção `== OBJETOS content-files (94) ==`):

```
{"path":"1750165612008-Easy - Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-17T13:06:52.690Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750167601323-Easy - Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-17T13:40:02.378Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750171474983-Easy - Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-17T14:44:36.087Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750188908482-letrasv2_teste.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-17T19:35:09.216Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750189474633-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-17T19:44:35.341Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750189647958-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-17T19:47:28.389Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750189680045-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T19:48:00.631Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750189947482-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-17T19:52:27.887Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750189993212-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T19:53:13.801Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750190186047-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T19:56:26.337Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750190417318-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T20:00:17.632Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750190554469-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T20:02:35.122Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750190751507-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T20:05:52.094Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750190884277-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T20:08:04.897Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750190909630-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:08:30.193Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750191051894-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:10:52.459Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750191067504-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T20:11:08.017Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750191080999-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-17T20:11:21.682Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750191246068-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T20:14:06.560Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750191253268-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:14:13.781Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750191305479-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:15:06.054Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750192026536-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:27:07.064Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750192137973-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:28:58.479Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750192197413-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:29:57.925Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750192318800-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:31:59.279Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750192352753-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T20:32:33.318Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750192454285-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T20:34:14.902Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750195044085-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T21:17:24.573Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750195069174-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-17T21:17:49.958Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750195083031-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-17T21:18:03.528Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750202274200-teste_batch_letras.docx","size":9011,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-17T23:17:54.853Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750205622581-Letras_v2.docx","size":47459,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-18T00:13:43.486Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750546034659-flyme.jpg","size":52302,"contentType":"image/jpeg","created":"2025-06-21T22:47:15.713Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750546056712-flyme.jpg","size":52302,"contentType":"image/jpeg","created":"2025-06-21T22:47:37.407Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750546311266-flyme.jpg","size":52302,"contentType":"image/jpeg","created":"2025-06-21T22:51:52.167Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750546645683-flyme.jpg","size":52302,"contentType":"image/jpeg","created":"2025-06-21T22:57:26.606Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750604564895-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:02:45.722Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750604908865-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:08:29.613Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750604960657-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T15:09:21.611Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750604978464-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:09:39.257Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605283119-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:14:43.915Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605584874-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T15:19:46.057Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605595428-Easy_-_Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-22T15:19:56.540Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605614082-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T15:20:14.991Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605627288-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:20:28.062Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605640852-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T15:20:41.526Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605665340-Easy_-_Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-22T15:21:06.735Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605695722-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T15:21:36.326Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605944810-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:25:45.311Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605953317-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T15:25:53.962Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750605982622-Letras_v2.docx","size":47459,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-22T15:26:23.179Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750606014790-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:26:55.570Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750606047568-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:27:28.117Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750606105963-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T15:28:27.169Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750606155216-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T15:29:16.038Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750610956999-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T16:49:17.770Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750611081879-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T16:51:22.387Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750611092289-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T16:51:33.233Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750611105097-Easy_-_Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-22T16:51:46.078Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750611121481-Easy_-_Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-06-22T16:52:02.784Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750611138304-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T16:52:19.428Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750615392315-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:03:13.156Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750615400182-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T18:03:21.188Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750615413660-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T18:03:34.804Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750615434148-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:03:55.003Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750615615129-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:06:56.163Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750615806021-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:10:06.891Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750615903915-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:11:44.996Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750616526321-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:22:06.977Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750616623608-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:23:44.718Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750616818755-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:26:59.631Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750616844925-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:27:25.521Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750616901635-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:28:22.287Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750616917668-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:28:38.291Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750616926732-Copia_Letras_v2.pdf","size":72207,"contentType":"application/pdf","created":"2025-06-22T18:28:48.016Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750616963586-Letras_v2.txt","size":11955,"contentType":"text/plain","created":"2025-06-22T18:29:24.494Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750800029778-Letras_v2_1.docx","size":47459,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-24T21:20:30.246Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1750802379454-Letras_v2_1.docx","size":47459,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-06-24T21:59:40.237Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1751897946656-Letras_v2.docx","size":47452,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-07-07T14:19:07.567Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1751898412367-Letras_v2.docx","size":47452,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-07-07T14:26:53.317Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1751898773786-Letras_v2.docx","size":47452,"contentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","created":"2025-07-07T14:32:54.649Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1751910900697-Easy_-_Guitar.pdf","size":138916,"contentType":"application/pdf","created":"2025-07-07T17:55:01.770Z","updated":"2025-11-11T22:11:46.637Z"}
{"path":"1786218427769-ux-audit-partitura-1p.pdf","size":20821,"contentType":"application/pdf","created":"2026-08-08T19:47:08.064Z","updated":"2026-08-08T19:47:08.064Z"}
{"path":"1786218429715-ux-audit-partitura-12p.pdf","size":242176,"contentType":"application/pdf","created":"2026-08-08T19:47:09.926Z","updated":"2026-08-08T19:47:09.926Z"}
{"path":"1786295844475-ux-audit-fase-d-cifra.pdf","size":1117,"contentType":"application/pdf","created":"2026-08-09T17:17:25.416Z","updated":"2026-08-09T17:17:25.416Z"}
{"path":"1786295884124-ux-audit-fase-d-offline.pdf","size":888,"contentType":"application/pdf","created":"2026-08-09T17:18:06.894Z","updated":"2026-08-09T17:18:06.894Z"}
{"path":"1786295908931-ux-audit-fase-d-batch.txt","size":188,"contentType":"text/plain","created":"2026-08-09T17:18:29.133Z","updated":"2026-08-09T17:18:29.133Z"}
{"path":"1786295958275-ux-audit-fase-d-zip-renomeado.pdf","size":2052,"contentType":"application/pdf","created":"2026-08-09T17:19:18.464Z","updated":"2026-08-09T17:19:18.464Z"}
{"path":"1786296073893-ux-audit-fase-d-drop-1.pdf","size":888,"contentType":"application/pdf","created":"2026-08-09T17:21:14.057Z","updated":"2026-08-09T17:21:14.057Z"}
{"path":"1786483430083-ux-audit-pr3-cifra.pdf","size":192,"contentType":"application/pdf","created":"2026-08-11T21:23:50.409Z","updated":"2026-08-11T21:23:50.409Z"}
{"path":"1786485255176-ux-audit-pr3-cifra.pdf","size":192,"contentType":"application/pdf","created":"2026-08-11T21:54:15.436Z","updated":"2026-08-11T21:54:15.436Z"}
{"path":"1786485287455-ux-audit-fase-d-cifra.pdf","size":1117,"contentType":"application/pdf","created":"2026-08-11T21:54:47.603Z","updated":"2026-08-11T21:54:47.603Z"}
{"path":"1786485330636-ux-audit-fase-d-cifra.pdf","size":1117,"contentType":"application/pdf","created":"2026-08-11T21:55:30.769Z","updated":"2026-08-11T21:55:30.769Z"}
{"path":"1786485432806-ux-audit-fase-d-offline.pdf","size":888,"contentType":"application/pdf","created":"2026-08-11T21:57:12.907Z","updated":"2026-08-11T21:57:12.907Z"}
```

(94 linhas; a listagem foi tirada ANTES dos probes — o artefato do P1 não aparece, e a prova de saldo 94→94 está no Apêndice A.)

---

## Perguntas abertas que exigem decisão do Marcel

1. **Escopo do B5**: storage apenas (texto da seção B4 do plano), ou storage + busca LIB-04 (rotulagem pós-B2 "B5 storage/busca" + linha 528/1009 do plano)? Se busca entra, o pre-check dela (probe de `?search=`, `unaccent`/`pg_trgm` no banco) ainda não foi feito.
2. **Os 87 órfãos tipo A**: limpar? Com que critério (todos são pré-nativo; 82 de jun–jul/2025, 5 do ux-audit de ago/2026)? Nada foi tocado.
3. **Bucket público**: manter como contrato (o web depende dele — viewer e offline usam URL pública direta) ou virar privado + entrega contratada no desenho do nativo? Decisão de desenho, não deste pre-check.
4. **Teto de upload**: o `file_size_limit` de 1MB do bucket é intencional? Qual é o teto de produto a contratar (a rota promete 50MB, a plataforma corta em 4,5MB, o bucket em 1MB)? Mudar config de bucket é console (regra 8) — nada foi alterado.
5. **Bypass secret**: a revogação (prevista para o fim do Bloco B) acontece no B5 ou fica para o B9? O inventário do §7 mostra o tooling de validação preview-first ainda dependente dele.
6. **`POST /api/storage/delete`**: entra no contrato do nativo (e ganha consumidor real) ou permanece tooling-only?
