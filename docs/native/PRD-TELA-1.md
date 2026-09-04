# PRD — Tela 1 do nativo: modo performance + setlists (somente leitura)

> **Bloco C · PR-0** (desenho). Data: 2026-09-04. Fonte de fatos: [`docs/ux/C-PRECHECK.md`](../ux/C-PRECHECK.md) (Fases A e B, commit `bba5b2e`) e os contratos [`docs/api/SETLISTS.md`](../api/SETLISTS.md), [`docs/api/STORAGE.md`](../api/STORAGE.md), [`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md). Fonte de requisitos: decisões **C-D1…C-D8** (Marcel, 2026-09-04) e os IDs do [`docs/ux/PLANO-TRANSICAO.md`](../ux/PLANO-TRANSICAO.md) / [`docs/ux/JOBS.md`](../ux/JOBS.md).
> **Regras de forma**: todo fato leva `[medido: C-PRECHECK §x]` ou `[contrato: …]`; todo requisito `T1-Rn` cita a decisão ou o ID do plano de onde deriva e tem critério de aceite verificável. Divergência plano × pre-check é declarada (§12), nunca acomodada. O que não foi medido é `[hipótese]` com a medição que o fecharia (§9).
> **O que este documento NÃO decide**: stack, bibliotecas, scaffold do monorepo (bloco posterior); nada de código.

---

## 0. Escopo e premissas

**Escopo em uma frase**: um app nativo (Android e iOS) que, autenticado pela conta Firebase existente, lê as setlists e a biblioteca do usuário pelo backend atual, guarda tudo localmente e toca a setlist no palco — offline por padrão — **sem criar, editar ou apagar nada**.

**Premissas** (do plano, não reabertas aqui):
- **Usuário único** (JOBS.md "O que este arquivo NÃO cobre"; PLANO C1 — anti-jobs). Multiusuário não é requisito; onde ele mudaria uma decisão, o documento diz.
- **A tela 1 não tem uso em palco hoje**: o web segue em produção e é o instrumento do show semanal até a substituição (PLANO, enquadramento). A tela 1 entra em palco só quando cumprir os critérios do §10.
- **Backend intacto**: Next.js API + Supabase + Firebase Auth, "com o mínimo de mudança necessária" (PLANO, enquadramento). A tela 1 exige **zero** mudança de backend `[medido: C-PRECHECK B.6 — todas as leituras passam com bearer hoje]`; o que ela pede ao Bloco B está classificado no §11, não agendado.
- **Base de referência**: 3 setlists / 69 songs / 66 content / 5 arquivos da conta de audit `[medido: C-PRECHECK B.2, B.3]`. A tabela `content` inteira tinha **194 linhas em 2026-08-24** `[referência: comentário do B2 em lib/api-schemas.ts:132-133 — nota N4]`; descontados os 66 da conta de audit, o repertório principal tem **~128 itens** — acima do `pageSize` máximo de 100, logo **⌈N/100⌉ = 2 páginas** de `GET /api/content` por sync com a conta principal (H14; a medição que fecha é o `total` da resposta com a conta principal).

---

## 1. Decisões vigentes

| Decisão | Uma linha | Fundamento no pre-check |
|---|---|---|
| **C-D1** | Bearer direto pelo SDK Firebase, exclusivo; o nativo nunca chama `/api/auth/session`; B1.5 desejável, fila da tela 2; pendência do Marcel: restrição de referrer da web API key | §1.3 (20/26 handlers `ambos`, zero `cookie-only`), §1.4, §1.5, §1.6; **B.2 P2/P2b/P3×P2/P3b** |
| **C-D2** | Bucket público mantido; nativo baixa `file_url` direto, sem proxy; URL imutável = chave de cache | §3.2–3.3; **B.2 P4/P4b**; B.5 achado 2 |
| **C-D3** | Busca client-side sobre o cache local, acentos normalizados no cliente; B11 (servidor) sai do caminho do nativo | §2.3 (ILIKE sem unaccent); **B.3** (19.481 B de corpos, 465 B máximo) |
| **C-D4** | Setlists só para ordem/ids/metadados; corpo sempre do cache de content por `content_id`, versionado por `content.updated_at`; substituição sem merge; cache-first com revalidação atrás; B9 não bloqueia | §2.1, §2.5, **B.4** (69/69 idênticos; 21.423 B embutidos); dump: RPCs bumpam `setlists.updated_at` |
| **C-D5** | Cascata content×storage fora da tela 1; reabre na tela 2 | §3.3; B.6 (órfãos tipo B = 0, referência B5) |
| **C-D6** | Sync completo de metadados ao abrir (2 requests) + prefetch dos arquivos das setlists com `performance_date` nos próximos 7 dias + resto sob demanda; zero retry com token que recebeu 401; renovação pelo SDK com buffer < 5 min | §4.2–4.3; **B.2** (latências); B.5 achado 4 |
| **C-D7** | Contrato de `content_data` por `content_type` escrito a partir do medido; `annotations` é não-contrato; chaves desconhecidas ignoradas; `content_data null` sem `file_url` é estado inválido a reportar | §2.6; **B.3** (inventário de chaves reais) |
| **C-D8** | Pre-check commitado docs-only na main (`bba5b2e`) | — |

---

## 2. Superfície de backend consumida

A tela 1 consome **quatro rotas de leitura** e **o bucket direto**. Nenhuma outra rota é chamada (em particular: não `/api/auth/session`, não `/api/proxy`, não `/api/profile`, não `/api/storage/*`).

Envelope de erro comum a todas as rotas `[contrato: CONTRATO-DE-ERRO.md]`: `{ error, code, details? }`, `code` ∈ {`AUTH_REQUIRED` 401, `VALIDATION_ERROR` 400, `NOT_FOUND` 404, `RATE_LIMITED` 429, `INTERNAL_ERROR` 500}, mapeamento 1:1 com o status; 429 traz `Retry-After` no header (`lib/user-rate-limit.ts:134`) **e** `retryAfter` no corpo (via `extra` → `lib/api-errors.ts:57`) `[medido: nota N3]`. Não-2xx cujo corpo não parseia como envelope (405 vazio, 404 HTML de rota inexistente, 413 text/plain) = erro genérico, sem retry `[contrato: cláusula não-JSON]`.

| Rota | Método | Auth (cadeia) | Família / janela | Shape | Paginação | Erros esperados |
|---|---|---|---|---|---|---|
| `/api/setlists` | GET | A (`requireAuthServer`, `lib/firebase-server-utils.ts:137`) — bearer, **sem** exigir email verificado `[medido: §1.3]` | `setlist-read` 300/min por uid `[medido: §4.2]` | array de `setlists.*` + `setlist_songs[]{id, setlist_id, content_id, position, notes, content{id,title,artist,content_type,key,bpm,file_url,content_data}}` `[medido: §2.1; B-P2 = 49.983 B]` | **nenhuma** — tudo do usuário `[medido: §2.1]` | 401; 429; 500 |
| `/api/setlists/[id]` | GET | A `[medido: §1.3]` | `setlist-read` | `{...setlist, setlist_songs[]}` mesmo shape `[medido: §2.2; B.2 P6 idêntico ao item do P2]` | — | 400 `field:"id"` (uuid malformado); 401; 404 `Setlist not found` (inexistente OU alheia, sem oráculo); 429; 500 |
| `/api/content` | GET | A `[medido: §1.3]` | `content-read` 300/min por uid | `{ data: content.Row[] (todas as colunas, inclusive content_data), total, page, pageSize, hasMore, totalPages }` `[medido: §2.3; B-P5 = 52.941 B]` | `page ≥ 1`, `pageSize` clampado a **[1,100]**; `sortBy ∈ {recent,title,artist,updated}` `[medido: §2.3]` | 400 (query inválida); 401; 429; 500 |
| `/api/content/[id]` | GET | A `[medido: §1.3]` | `content-read` | uma `content.Row` `[medido: §2.4; B.2 P7]` | — | 400 `field:"id"`; 401; 404 `Content not found`; 429; 500 |
| bucket `content-files` | GET direto da `file_url` | **nenhuma** (bucket público, contrato B5-D3) `[medido: §3, B.2 P4]` | nenhuma família da API | bytes do objeto; `Content-Type` e `Content-Length` presentes; `Cache-Control: public, max-age=3600` `[medido: B.2 P4]` | — | 400/404 do Supabase (objeto ausente) — tratar como "arquivo indisponível" |

Fatos que condicionam o cliente:
- `Cache-Control` das quatro rotas é `public, max-age=0, must-revalidate`, sem `ETag`/`Last-Modified` `[medido: B.5 achado 1; §2.3]` → **o cliente não usa cache HTTP** (§5).
- `Content-Length` ausente nas respostas JSON `[medido: B.5 achado 3]` → progresso de download só nos arquivos.
- Headers `X-RateLimit-*` só no 429 `[medido: B.5 achado 4]` → o cliente não observa saldo; opera pelo orçamento do §6.
- O invariante `position` = 1..N contíguo é contrato da tabela `[contrato: SETLISTS.md "Invariante contíguo 1..N"; medido: B.2 P2 — 0 violações em 69 songs]`.
- Bis é permitido: o mesmo `content_id` pode aparecer mais de uma vez numa setlist `[contrato: SETLISTS.md addSong; medido: B.4 — 69 songs, 60 content_id distintos]`.

---

## 3. Contrato de auth do cliente (C-D1)

**T1-R1 — Transporte** `[C-D1; PLANO B7]`. Toda chamada às rotas do §2 leva exatamente um header `Authorization: Bearer <Firebase ID token>`, com o prefixo **`Bearer `** literal (maiúscula inicial, um espaço): a cadeia A compara com `startsWith('Bearer ')`, case-sensitive `[medido: §1.4]`. Nenhum cookie é enviado nem armazenado; `/api/auth/session` nunca é chamado `[C-D1; §1.5 — o cookie É o idToken, ganho zero]`.
*Aceite*: captura de tráfego de uma abertura completa mostra `Authorization: Bearer …` em 100% das chamadas a `/api/*` e zero chamadas a `/api/auth/session`; zero header `Cookie`.

**T1-R2 — Obtenção e renovação do token** `[C-D1, C-D6; PLANO AUTH-02 (morre com o cookie)]`. O ID token vem do SDK do Firebase, que o renova sozinho; o cliente pede o token ao SDK **antes de cada request** e força renovação quando faltarem **< 5 min** para o `exp` (o mesmo buffer do web, `lib/auth-manager.ts:10` `[medido: §C-D6]`). O cliente **não** conta com a vida efetiva de ~2h do cache do servidor `[medido: §1.4 — cache por string de token, TTL 1h contado da verificação]`.
*Aceite*: com relógio do device avançado para simular token a 4 min do `exp`, a próxima request sai com token novo (jti/iat diferente); nenhuma request sai com token já expirado pelo `exp` do JWT.

**T1-R3 — Tratamento de 401** `[C-D6; medido: §4.2 authfail 30/5min por IP; B.5 achado 6]`. Um 401 (`AUTH_REQUIRED`) **nunca** é retentado com o mesmo token. Comportamento: renovar pelo SDK (uma vez) e retentar (uma vez); se o segundo 401 vier, o app entra em estado "sessão inválida" (login) sem mais requests. Motivo: cada 401 com token inválido conta na janela `authfail` por IP (30/5 min) e o deny-fast nega **sem verificar** para todo o IP — sob CGNAT, um loop derruba outros clientes do mesmo IP (`[análise: §4.3; hipótese 10]`). O corpo do 401 é byte-idêntico para "sem token" e "token inválido" `[medido: B.5 achado 6]` — o cliente não tenta distinguir.
*Aceite*: com um token forjado inválido injetado, o app faz no máximo 2 requests à mesma rota (a original + 1 após renovação) e mostra o estado de login; log de rede prova que não houve terceira tentativa.

**T1-R4 — Tratamento de 429** `[contrato: CONTRATO-DE-ERRO.md RATE_LIMITED; medido: nota N3]`. O cliente lê `Retry-After` (segundos, inteiro; o mesmo valor vem em `retryAfter` no corpo — `lib/user-rate-limit.ts:126-128` + `lib/api-errors.ts:57`) e **não** reenvia antes desse prazo; a UI mostra "servidor ocupado, tentando em N s" (regra C3-1: toda falha aparece). Com os orçamentos do §6 o 429 é teoricamente inalcançável na tela 1; o requisito é de robustez.
*Aceite*: resposta 429 simulada (mock) com `Retry-After: 30` → nenhuma request à mesma família nos 30 s seguintes; mensagem visível.

**T1-R5 — Email verificado (registro de fato, sem aceite)** `[medido: §1.3]`. Nenhuma rota da tela 1 exige email verificado (todas na cadeia A). Registrado porque as rotas da cadeia B (`/api/profile` GET/PATCH, `/api/storage/*`, todas as mutações via `withBodyValidation`) exigem — a tela 2 herdará isso. A tela 1 **não chama** `/api/profile`; a existência ou não de perfil não a bloqueia. Sem critério de aceite: não existe conta sem email verificado e criar uma violaria o rito (usuário único); nenhum item de §10 depende deste requisito.

**T1-R6 — Login e provedores** `[C-D1]`. O login é pelo SDK do Firebase, com os provedores que a conta já usa no web. **Cadastro (signup) fica no web** (§13). Quais provedores o app oferece é decisão do desenho de UI da tela 1, não deste PRD; o fato medido é que a conta principal tem `avatar_url` do Google `[medido: B5-PRECHECK §2.3, referência]` — logo Google e email/senha são candidatos.
*Aceite*: login com a conta de audit (email/senha) → token válido → `GET /api/setlists` 200.

**Pré-requisito de console (fora do repo)** `[C-D1; C-PRECHECK hipótese 11]`: se a web API key do Firebase tiver restrição por HTTP referrer, o `signInWithPassword`/refresh do app (sem `Referer`) falha. Checagem do Marcel no Google Cloud antes da primeira build. Efeito se falsa: nenhum login no nativo até ajustar a key (ou criar uma key própria para o app) — não bloqueia o PRD, bloqueia a primeira semana de implementação.

---

## 4. Contrato de `content_data` (C-D7)

**Estado hoje** `[medido: §2.6]`: o backend valida `content_data` só como "objeto JSON qualquer ou null" (`z.record(jsonValueSchema).nullish()`, `lib/api-schemas.ts:145`); nenhuma chave é declarada. O consumidor de referência do web (`hooks/use-songs-transformation.ts:26-49`) lê `lyrics`, `file`, `chords`, `sections` e ignora `tablature`.

**Inventário real** `[medido: B.3 — 66 itens]`:

| `content_type` | n | Chave real de `content_data` (tipo) | `file_url` | Observação |
|---|---|---|---|---|
| `Lyrics` | 38 | `lyrics` (string, máx. 307 B) | nunca | — |
| `Chords` | 18 | `chords` (**string**, cifra-texto; máx. 465 B) em 15; `content_data null` em 3 | 3 (os 3 com `content_data null`) | Chords com arquivo = cifra escaneada |
| `Tab` | 8 | `tablature` (string) | nunca | **o palco web não lê esta chave** (C4: TAB nunca renderizou) |
| `Sheet` | 2 | `null` | sempre | partitura em PDF |
| (qualquer) | 1 | `annotations` (array) | — | não-contrato (C-D7) |

Chaves que o web lê e **não existem** em nenhum item: `sections`, `file` `[medido: B.3]`.

**T1-R7 — Contrato por tipo** `[C-D7; PLANO C4 "renderer cobrindo TODOS os content types"]`:

| `content_type` | O cliente lê | Renderiza como |
|---|---|---|
| `Lyrics` | `content_data.lyrics: string` | texto, `white-space: pre` (CONT-01) |
| `Chords` | `content_data.chords: string` **ou**, se `content_data` for `null`, `file_url` | texto monoespaçado sem quebra de linha automática (CONT-01/02) **ou** arquivo (PDF/imagem) |
| `Tab` | `content_data.tablature: string` | texto monoespaçado sem quebra, 6 cordas alinhadas (CONT-02) |
| `Sheet` | `file_url` (`content_data` é `null`) | arquivo (PDF/imagem) |

Regras: (a) **chaves desconhecidas são ignoradas** (inclusive `annotations`, `sections`, `file`); (b) **`content_data null` E `file_url null` é estado inválido**: o item aparece na lista com marca "sem conteúdo" e, no palco, um placeholder explícito — nunca renderiza vazio em silêncio (C3-1, C3-6; PERF-09); (c) chave esperada ausente com `content_data` não-nulo (ex.: `Lyrics` sem `lyrics`) = mesmo tratamento de (b); (d) `content_type` fora do enum canônico `{Lyrics, Chords, Tab, Sheet}` (`types/content.ts`) = placeholder "tipo desconhecido" (dado do B2, 2026-08-24: 194/194 linhas dentro do enum `[referência: lib/api-schemas.ts:132-133 — nota N4]`, mas o cliente não confia).
*Aceite*: os 66 itens da conta de audit `[B-P5-content.json]` renderizam sem placeholder (61 texto + 5 arquivo); um item sintético `{content_type:"Lyrics", content_data:null, file_url:null}` injetado no cache local renderiza o placeholder de (b), não tela vazia; um item com `content_data.foo` extra renderiza normalmente.

O Zod por tipo na **escrita** é mini-item do Bloco B (§11), não pré-requisito da tela 1 `[C-D7]`.

---

## 5. Modelo de dados local (C-D4)

Quatro entidades, chaves e versões:

| Entidade local | Fonte | Chave | Versão | Conteúdo guardado |
|---|---|---|---|---|
| `setlist` | `GET /api/setlists` (item) | `setlist.id` | `setlists.updated_at` | `name, description, performance_date, venue, notes, created_at, updated_at` + lista ordenada de `song` |
| `song` (linha de setlist) | idem, `setlist_songs[]` | `setlist_songs.id` | herda a da setlist | `content_id, position, notes` — **e só**; o `content{…}` embutido é **descartado** (21.423 B por abertura hoje `[medido: B.4]`) |
| `content` | `GET /api/content` (item) | `content.id` | `content.updated_at` | todas as colunas da `content.Row` (inclusive `content_data`, `file_url`) |
| `file` | GET direto da `file_url` | a própria `file_url` (imutável `[C-D2; medido: B.5 achado 2]`) | nenhuma (imutável) | bytes + `Content-Type` + tamanho + data de download |

**T1-R8 — Fonte única do corpo** `[C-D4]`. O palco e a busca leem `content_data`/`file_url` **exclusivamente** de `content` (por `content_id`), nunca do `content{…}` embutido na resposta de setlists. Motivo medido: editar o texto de um content não bumpa `setlists.updated_at` (as RPCs do B6 só bumpam em escrita de `setlist_songs` `[medido: dump, citado em §C-D4]`); duas cópias = dois relógios.
*Aceite*: teste de unidade do repositório local: após gravar uma resposta de setlists com `content.title = "A"` e um content com `title = "B"` para o mesmo id, a tela mostra "B".

**T1-R9 — Substituição sem merge, atômica por conjunto** `[C-D4; PLANO SET-14 (fila A #5): "deleções em outro dispositivo não ressuscitam"]`. Uma resposta 200 de `GET /api/setlists` **substitui** o conjunto inteiro de `setlist`+`song` do usuário. O conjunto de `content` só é substituído quando **todas** as páginas de `GET /api/content` chegaram (página 1, 2, … até `hasMore == false`); se qualquer página falhar (não-2xx, rede), **o cache anterior de content permanece inteiro** e o indicador de falha de sincronização (T1-R18) aparece — nunca um conjunto parcial. Nada é mesclado; o que não veio numa substituição completa, some. Arquivos (`file`) **não** são apagados na substituição (são imutáveis por URL; limpeza é por LRU, T1-R14).
*Aceite*: (a) cache com 4 setlists; servidor devolve 3 → a UI lista 3; a 4ª não existe mais localmente; (b) mock de 500 na página 2 de content → o cache de content é byte a byte igual ao anterior e o indicador de falha aparece.

**T1-R9b — Paginação estável e corrida entre páginas** `[C-D4; medido: app/api/content/route.ts:105-113 — nota N6]`. O sync de content usa sempre `sortBy=recent`, que o handler mapeia para `order('created_at', { ascending: false })` `[medido: nota N6]` — chave estável entre páginas (o `created_at` de um item não muda; `updated` mudaria a ordem a cada edição). Corrida declarada: uma criação ou exclusão feita no web **entre** a página 1 e a página 2 desloca a janela e pode **duplicar** um item (aparece nas duas páginas) ou **omitir** um (cai entre elas) nesse sync. Mitigação: (i) dedupe por `id` na montagem do conjunto — o item entra uma vez; (ii) o item omitido volta no próximo sync completo (T1-R13 passo 4 / abertura seguinte) — não há perda persistente, só atraso. Uma edição (PUT) entre as páginas não desloca a janela (`created_at` não muda) e o item vem com o `updated_at` novo ou velho conforme a página — corrigido no próximo sync.
*Aceite*: montar o conjunto a partir de duas páginas mockadas com um `id` repetido → o cache tem o item **uma vez**; uma página com 100 e outra com 28 (N=128) → `total` do cache = 128 se não houver repetição.

**T1-R10 — Versionamento por `updated_at`** `[C-D4]`. Cada gravação compara `updated_at` do item novo com o local: igual → não re-renderiza nem re-baixa; diferente → substitui e invalida derivados (índice de busca, layout renderizado). `updated_at` de `content` é bumpado **no handler** do `PUT /api/content` `[medido: app/api/content/route.ts:255 — nota N1]`; a coluna tem apenas `DEFAULT now()` (vale no INSERT) e o dump **não tem trigger nenhum** `[medido: dump:97; `grep -i TRIGGER` → exit=1 — nota N1]`. Consequência declarada: **edição fora da API (console/SQL) não bumpa `updated_at`, e o cliente não detecta** — só um PUT pela API invalida o item no nativo. É risco aceito (o console não é caminho de edição do produto).
*Aceite*: duas sincronizações consecutivas sem mudança no servidor produzem zero re-renderizações (contador de invalidações = 0).

**T1-R11 — `content_id` fora do cache de content** `[C-D4 — "estado inalcançável pelos escritores"]`. Pelo backend, toda `song` aponta para content do mesmo usuário — é contrato do addSong: "Gates na rota: setlist inexistente-ou-alheia → `404 Setlist not found`; content inexistente-ou-alheio → `404 Content not found` (sem oráculo, byte-idênticos por construção)" `[contrato: docs/api/SETLISTS.md:41-43]`; o create com `songs[]` valida posse dos `content_id` antes de inserir `[medido: app/api/setlists/route.ts:99-121, citado em C-PRECHECK anexo A7]`. (A nota de delta do §2.1 do pre-check diz outra coisa: que o embedding da listagem NÃO filtra `content.user_id` — inofensivo justamente porque a posse é garantida na escrita.) A listagem de content é completa quando `hasMore == false`. Logo o caso "song sem content local" só ocorre por **sync parcial** (content ainda não sincronizado, ou falha entre os dois requests). Comportamento: a song aparece na setlist com `title` = "(carregando…)" enquanto o sync de content não terminou e "(indisponível)" se o sync terminou e o id não existe; nunca é omitida (a posição 1..N não pode ter buraco visual — SETLISTS.md); no palco, placeholder da regra 4(b). Na próxima sincronização completa, resolve-se sozinho.
*Aceite*: cache com setlist cujo `content_id` X não existe em `content` → a lista mostra a song na posição certa com o rótulo, o palco mostra o placeholder, e após um sync completo com X presente ela renderiza.

**T1-R12 — Sem cache HTTP** `[medido: B.5 achado 1 — `public, max-age=0, must-revalidate`, sem ETag]`. O cliente desliga qualquer cache HTTP do runtime para `/api/*` e trata o payload inteiro como verdade a cada sync. (Se o Bloco B mudar para `private`/`no-store` — §11 — nada muda no cliente.)
*Aceite*: duas chamadas consecutivas a `/api/setlists` geram duas requests reais no servidor (log do proxy de captura), não um hit de cache.

**Namespace por usuário** `[C-D4; PLANO: web usa `<store>-<uid>` — medido §2.5]`: todo o cache local é chaveado pelo `uid`; trocar de conta no device não mistura dados.

---

## 6. Sync e rede (C-D6)

**T1-R13 — Sequência de abertura (cache-first)** `[C-D6; PLANO C2 baseline "app aberto → 1ª música: 3 taps, 5,4 s"; SET-14]`:
1. Renderizar **imediatamente** do cache local (lista de setlists e conteúdo), sem esperar rede. Se o cache está vazio (primeira abertura), mostrar estado "sincronizando…" — nunca o empty state de "você não tem setlists" antes do primeiro sync bem-sucedido (lição do SET-14: "`[]` silencioso nunca").
2. Em paralelo, se há rede: `GET /api/setlists` (1 request, `setlist-read`) e `GET /api/content?pageSize=100&page=1` (+ páginas até `hasMore == false`; 1 request para ≤100 itens, `content-read`). Aplicar T1-R9/R10.
3. Depois: prefetch de arquivos (T1-R15) em background, concorrência ≤ 3 (o web usa 3 `[medido: lib/advanced-content-cache.ts:158 — nota N2]`).
4. Ao voltar do background com > 30 s ausente ou ao recuperar rede: repetir 2 (o web usa 30 s `[medido: hooks/use-setlist-data.ts:172 — nota N2]`).

Orçamento por abertura `[medido: §4.3; B.2]`:

| Família | Janela | Custo por abertura | % |
|---|---|---|---|
| `setlist-read` | 300/min | 1 | 0,3% |
| `content-read` | 300/min | ⌈N/100⌉ — **1** com a conta de audit (66), **2** com a principal (~128, H14) | 0,3–0,7% |
| `proxy` | 120/min | **0** (C-D2) | 0 |
| `session` | 120/15min | **0** (C-D1) | 0 |
| bucket direto | sem família | ≤ nº de `file_url` não cacheadas (5 hoje) | — |

Latência de referência `[medido: B.2]`: 150–340 ms por request quente; 1,5–2 s nos dois primeiros hits da campanha (`[hipótese 12: cold start]`). Payload: 49.983 B + 52.941 B ≈ 103 KB por abertura com a conta de audit (com a principal, ~2× a parte de content `[análise sobre H14]`).
*Aceite*: (a) em modo avião, com cache populado, a lista de setlists aparece em < 1 s após o launch e a setlist de 60 músicas (`UX-AUDIT Estresse` `[B-P6]`) abre completa; (b) online, a captura de tráfego de uma abertura mostra exatamente **1 + ⌈N/100⌉** requests a `/api/*` (2 com a conta de audit, 3 com a principal) e nenhuma a `/api/proxy`; (c) primeira abertura sem cache mostra "sincronizando…", nunca "sem setlists", até o primeiro 200.

**T1-R14 — Arquivos: download e retenção** `[C-D2; C-D6]`. Arquivo é baixado direto da `file_url` (sem header de auth), gravado por URL, servido do disco dali em diante. Retenção LRU com teto configurável (o web usa 50 MB e 100 MB nos dois caches `[medido: §2.5]`; propor 200 MB no tablet — `[hipótese: tamanho real dos PDFs do repertório do Marcel; o maior objeto medido no B5 tem 242.176 B]`). Arquivos das setlists dos próximos 7 dias nunca são vítimas do LRU.
*Aceite*: a `file_url` do P4 `[B.2]` baixada uma vez; a segunda abertura da música não gera request (captura de tráfego); os bytes servidos têm o sha256 `3d42199b…` `[medido: B.2 P4]`.

**T1-R15 — Prefetch de 7 dias** `[C-D6; PLANO J6 "indicação antes do show"]`. Após cada sync, para toda setlist com `performance_date` (date-only `YYYY-MM-DD` — decisão da seção "B5 — Decisões de dados" do plano, 2026-08-10, implementada no B2 PR-5 (#240); schema em `lib/api-schemas.ts:297-310` — nota N5) entre hoje e hoje+7, baixar todos os `file_url` das suas songs ainda não cacheados, em background, com prioridade pela data mais próxima (mesma heurística do web, `lib/advanced-content-cache.ts:183-204` `[medido: §C-D4]`). Setlists sem `performance_date` (as 3 da conta de audit `[medido: B.2 — `performance_date: null` nas três]`) **não** entram no prefetch automático; entram sob demanda (T1-R16) ou por ação explícita "baixar esta setlist".
*Aceite*: setlist com `performance_date` = amanhã e 3 songs com `file_url` → após o sync e ≤ 60 s online, as 3 estão no cache sem o usuário abrir a setlist; setlist sem data → nada baixado automaticamente; "baixar esta setlist" baixa tudo.

**T1-R16 — Sob demanda** `[C-D6]`. Ao entrar numa setlist no palco, os arquivos das músicas atual, próximas 3 e anterior 1 são baixados/priorizados (o web usa 3/1 `[medido: lib/advanced-content-cache.ts:15-16, §2.5]`); o restante em ordem de `position`.
*Aceite*: online, abrir a música 1 de uma setlist com 10 PDFs não cacheados → a música 2 abre sem espera perceptível (< 1 s, J1) quando o usuário avança após 5 s.

**T1-R17 — Indicador "garantido offline"** `[C-D6; PLANO J6 (ponto de observação "baixada ✓"); C4 "indicador garantido offline antes do show"]`. Definição **verificável**: uma setlist está garantida offline sse (i) todas as suas `song.content_id` existem no cache de `content` com `updated_at` igual ao do último sync e (ii) todas as `file_url` não-nulas dessas contents existem no cache de `file`. O indicador tem três estados: ✓ garantida · ◔ parcial (mostra "n de m arquivos") · ✗ nunca sincronizada. O estado é recalculado a cada gravação no cache, não a cada render.
*Aceite*: setlist de 8 músicas com 2 PDFs: antes do download → "◔ 0 de 2"; após → "✓"; apagar um arquivo do cache (LRU forçado) → volta a "◔ 1 de 2"; em modo avião, toda setlist "✓" abre completa incluindo PDFs (J6 critério 2).

**T1-R18 — Estado de rede comunicado, nunca bloqueante** `[PLANO J6 critério 3; C3-1]`. Offline é um indicador discreto; falha de sync com cache presente mantém a tela e mostra "última sincronização há X"; falha de sync **sem** cache mostra erro acionável ("sem conexão — tente novamente"), nunca o empty state.
*Aceite*: modo avião + cache → sem modal, indicador visível; modo avião + cache vazio → mensagem de erro com botão "tentar novamente".

**T1-R19 — Sessão offline** `[PLANO J6 (ponto "login offline")]`. Com cache populado, o app abre e opera **sem** pedir token ao servidor; o token só é necessário quando há rede e sync. Se o SDK não conseguir renovar o token offline, o app **não** desloga: usa o cache. `[hipótese: o SDK do Firebase no runtime nativo escolhido persiste o usuário e devolve o último token sem rede — medição na primeira semana do nativo: kill + reopen em modo avião com conta logada]`.
*Aceite*: kill + reopen em modo avião (J6 passo 3) → a tela 1 abre com as setlists cacheadas sem tela de login.

---

## 7. Busca (C-D3)

**T1-R20 — Índice local** `[C-D3; PLANO LIB-04 (B11 sai do caminho do nativo); J5]`. Campos indexados: `title`, `artist`, `album` (os mesmos do ILIKE do servidor `[medido: §2.3]`) **mais** o corpo de texto (`lyrics`/`chords`/`tablature` do contrato §4) — o corpo é barato (19.481 B no total `[medido: B.3]`) e resolve "lembro de um verso". Índice reconstruído por item a cada invalidação (T1-R10).

**T1-R21 — Normalização** `[C-D3 — mesma classe da D5′ do B6]`. Consulta e índice passam por: NFD → remoção de U+0300–U+036F → minúsculas → colapso de espaços. Assim `aguas` casa `Águas` (o caso do item 25 do plano). Tolerância a typo (`ipanma` → Ipanema, J5 passo 3) **não** é requisito da tela 1 (§13; classificado em §11).
*Aceite*: com a biblioteca da conta de audit `[B-P5]`, `garota` e `GAROTA` e `garôta` retornam "[UX-AUDIT] Garota de Ipanema"; `aguas` retorna todo item cujo título/artista/corpo contenha "Águas"; busca sem resultado mostra "nada encontrado para X" (J5 critério 3), não tela vazia.

**T1-R22 — Escopo e acesso** `[C-D3; PLANO C4 "busca dentro do performance mode (J5; item 26)"; JOBS J5 "toca aquela!"]`. Escopo é a **biblioteca inteira**, com os resultados que pertencem à setlist atual agrupados primeiro (quando a busca é aberta de dentro do palco). Justificativa: o caso real do J5 é uma música que **não** está na setlist; restringir à setlist mataria o caso. A busca é acessível do palco em **1 tap**, e abrir um resultado de dentro do palco **não perde** a posição na setlist (o item 26 do plano mede "4 taps e perde o contexto"): ao sair da música avulsa, o palco volta à posição em que estava.
*Aceite*: no palco na música 4 de 12, buscar e abrir uma música fora da setlist e voltar → o palco está na música 4 de 12; custo total ≤ 3 taps para chegar ao resultado (J5 "≤ 4 taps" do dashboard; do palco, menos).

**T1-R23 — Offline** `[C-D3]`. A busca funciona integralmente em modo avião (é local).
*Aceite*: modo avião, mesmos resultados do T1-R21.

---

## 8. Modo performance

Herança do plano: a tela 1 **iguala ou supera cada ✅ e fecha cada ❌/⚠️** da tabela C2 que diga respeito ao palco e à leitura; os requisitos abaixo citam a linha.

**T1-R24 — Ordem e identidade** `[contrato: SETLISTS.md 1..N; medido: B.4 bis]`. A ordem do palco é `position` ascendente. A identidade de uma "música na setlist" é `setlist_songs.id`, **não** `content_id`: um bis (mesmo `content_id` duas vezes) são duas posições distintas, cada uma com suas `notes`.
*Aceite*: setlist com o mesmo content nas posições 2 e 7 → "2 de N" e "7 de N" são telas distintas, navegáveis, ambas renderizam o mesmo conteúdo.

**T1-R25 — Renderização por tipo** `[C-D7 (§4); PLANO C4 "renderer cobrindo TODOS os content types desde o design"; CONT-01/02]`. Lyrics, Chords-texto e Tab renderizam como texto monoespaçado/`pre` (Tab com as 6 cordas alinhadas — CONT-02); Chords-arquivo e Sheet renderizam o arquivo. **O TAB desligado do web é defeito do web** (o consumidor de referência `hooks/use-songs-transformation.ts:26-49` só extrai `lyrics`/`file`/`chords`/`sections` e ignora `tablature` `[medido: §2.6]`), não requisito herdado: no nativo, Tab renderiza desde o primeiro build.
*Aceite*: os 8 Tab da conta de audit `[B.3]` renderizam no palco com as linhas de corda alinhadas em fonte monoespaçada (largura igual entre as 6 linhas — o critério do gate CONT-02 do web).

**T1-R26 — PDF e imagem do cache** `[C-D2; PLANO C2 "PDF no palco" (item 4, fechado na web pelo PERF-02); C4 "PDF: caso menor, due diligence na 1ª semana"]`. Arquivo é renderizado do disco (T1-R14); se não estiver no cache e não houver rede → placeholder "arquivo não baixado" com ação "baixar" (J6 ponto "placeholder claro ou quebra silenciosa"). PDF de 12 páginas (`[medido: B.2 P7 — file_url …partitura-12p.pdf; 242.176 B por B5-PRECHECK §2.2, referência]`) rola por página.
*Aceite*: o PDF de 12 páginas da conta de audit abre do cache em modo avião e todas as 12 páginas são navegáveis; sem cache e offline → placeholder, não tela branca.

**T1-R27 — Navegação às cegas** `[PLANO C3-3; PERF-04; JOBS J1 critérios "1 tap, ≥ 48 px, borda inteira"]`. Avançar/voltar: 1 tap ou 1 gesto; alvos ≥ 48 px de altura ocupando a borda lateral inteira da tela; nenhuma função exclusiva de hover; controles em posição fixa. Landscape em tablet é o layout primário (J1 contexto); rotação no meio da música preserva a posição (J1 ponto de observação).
*Aceite*: no tablet em landscape, tocar em qualquer ponto dos 15% laterais da tela avança/volta; medição de alvo ≥ 48 px; girar o device na música 4 → continua na 4.

**T1-R28 — Posição e salto** `[PLANO PERF-05, PERF-06; C2 "Posição na setlist ('4 de 12') e salto direto ≤ 3 taps"; JOBS J2 critério 1]`. "n de N" sempre visível; um índice da setlist acessível de dentro do palco em 1 tap, com salto para qualquer música em ≤ 3 taps no total; alvos ≥ 48 px (os dots de 8 px do web são o anti-padrão).
*Aceite*: na setlist de 60 músicas `[B-P6]`, da música 1 até a 47 em ≤ 3 taps; o rótulo mostra "47 de 60".

**T1-R29 — Fim de setlist** `[JOBS J1 ponto de observação "última música: beco sem saída ou fim elegante"; PLANO PERF-07 é D (web), o comportamento nativo é novo]`. Na última música, "avançar" mostra "fim da setlist" com ações "voltar ao início" e "sair" — nunca tela em branco nem saída acidental.
*Aceite*: avançar na música N → tela de fim; nenhuma navegação para fora do app.

**T1-R30 — Auto-scroll com estado por tipo** `[JOBS J1 passo 5 e critério 3; PLANO PERF-09; C3-5]`. Play/pause do auto-scroll em 1 tap com resposta < 100 ms para conteúdo de texto; em PDF/imagem o controle aparece **desabilitado com motivo** ("auto-scroll só em texto"), não mudo.
*Aceite*: em Lyrics, play inicia rolagem visível em < 100 ms; em Sheet, o botão está desabilitado e mostra o motivo ao toque.

**T1-R31 — Zoom com layout estável** `[PLANO PERF-10, CONT-01/02; JOBS J1 critério "zoom ≤ 2 taps"]`. Zoom de texto por pinça ou ±, sem re-quebra de linha (linhas longas rolam horizontalmente, como o `white-space: pre` da fila A #8); zoom de PDF com pan. Estado de zoom persiste por música durante a sessão.
*Aceite*: em cifra com linha de 120 colunas, zoom 150% mantém cada linha em uma linha (scroll horizontal), nenhuma quebra nova; ≤ 2 taps para chegar ao controle.

**T1-R32 — Dark sheet** `[JOBS J1 passo 7 e critério "≤ 2 taps"; PLANO C2 "dark sheet e zoom: 1 tap cada (não regredir)"]`. Alternância claro/escuro do conteúdo em **1 tap** (o web já faz em 1 — C2 baseline a não regredir).
*Aceite*: 1 tap alterna; o estado persiste ao trocar de música.

**T1-R33 — Wake lock nativo** `[PLANO C4 "wake lock nativo (J1)"; PERF-08 morre com isso]`. Tela nunca apaga enquanto o palco está aberto; sem toast cobrindo controles.
*Aceite*: 15 min no palco sem toque → tela acesa (Android e iOS).

**T1-R34 — Troca de música < 1 s, do cache** `[PLANO C2 "troca 46–126 ms (não regredir)"; JOBS J1 critério 4]`. Com o conteúdo no cache local, a troca renderiza em < 1 s no pior caso (PDF) e < 100 ms percebido em texto.
*Aceite*: instrumentação de tempo entre o tap e o primeiro frame do conteúdo novo: p95 < 100 ms em texto, < 1 s em PDF cacheado, na setlist de 60.

**T1-R35 — Notas da música** `[contrato: SETLISTS.md — `setlist_songs.notes`; JOBS J2 "anotação visível em modo performance" é tela 2 para ESCRITA; leitura já existe]`. `song.notes` (texto livre por posição na setlist) é exibido no palco, discreto, se não-nulo. (Anotações de `content_data.annotations` **não** são renderizadas — C-D7.)
*Aceite*: song com `notes: "entrar mais suave"` mostra o texto no palco; song com `notes: null` não mostra área vazia.

**T1-R36 — pt-BR** `[PLANO GLOB-01; C4 "pt-BR desde o dia 1"; CONTRATO-DE-ERRO: `code` é a chave de i18n]`. Toda string de UI em pt-BR; mensagens de erro derivadas de `code`, nunca de `error` (que é inglês e "dado de UI, não parsear").
*Aceite*: nenhum literal em inglês na tela 1; um 429 mostra texto pt-BR derivado de `RATE_LIMITED`.

**T1-R37 — Toda falha aparece** `[PLANO C3-1; CONTRATO-DE-ERRO "toda não-2xx aparece por default"]`. Camada de rede única: qualquer não-2xx vira mensagem visível por default; silenciar é opt-in por caso (ex.: revalidação em background com cache presente mostra "última sincronização há X" em vez de modal).
*Aceite*: mock de 500 no `GET /api/content` durante a revalidação → indicador de "falha ao sincronizar" visível; a lista cacheada permanece.

---

## 9. Riscos e hipóteses remanescentes

| # | Hipótese (origem) | Dono | Efeito se falsa | Medição que fecha |
|---|---|---|---|---|
| H8 | Mecanismo do item 9 (setlist nunca visitada offline no web) — `[C-PRECHECK hipótese 8]` | aceito (web) | nenhum na tela 1 (o modelo do §5 não depende do web) | não fechar |
| H9 | Teto efetivo de rate limit = limite × instâncias — `[hipótese 9]` | aceito | só afrouxa | não fechar |
| H10 | `authfail` sob CGNAT é risco real — `[hipótese 10]` | tela 1 (T1-R3) | um loop de 401 derruba o IP por 5 min | nenhuma; T1-R3 elimina o loop por construção |
| H11 | Web API key sem restrição de referrer — `[hipótese 11]` | **Marcel / console** | login nativo falha até ajustar a key | checagem no Google Cloud antes da primeira build |
| H12 | Cold start explica 1,5–2 s dos dois primeiros hits — `[hipótese 12]` | aceito | abertura online mais lenta; o cache-first (T1-R13) esconde | 10 aberturas medidas na primeira semana |
| H13 | Origem do `Cache-Control: public, max-age=0` (Next × Vercel) — `[hipótese 13]` | Bloco B (§11) | nenhum na tela 1 (T1-R12 ignora cache HTTP) | ler config do Next/Vercel quando o item do B abrir |
| H14 | Repertório principal ≈ 194 − 66 = **~128 itens** `[referência B2, 2026-08-24 — nota N4]` → ⌈N/100⌉ = **2 páginas** hoje; assume-se que não cresceu além de 200 (3 páginas) | Marcel | mais páginas por sync (cada uma 1/300 de `content-read`); a busca local ainda cabe até ~5 MB de corpos (C-D3) | `total` de `GET /api/content` com a conta principal |
| H15 | SDK do Firebase no runtime nativo persiste sessão e opera offline (T1-R19) | primeira semana do nativo | app pede login offline → J6 falha | kill + reopen em modo avião |
| H16 | Tamanho real dos PDFs do repertório (T1-R14, teto de 200 MB) | primeira semana | LRU expulsa arquivos de setlists futuras | somatório de `Content-Length` das `file_url` da conta principal |
| H17 | `performance_date` é preenchida no uso real (T1-R15 depende dela) | Marcel | prefetch automático não dispara; resta o "baixar esta setlist" manual | contar `performance_date != null` nas setlists da conta principal |
| H18 | Provedores de login da conta principal (T1-R6): email/senha e Google | Marcel | app sem o provedor certo não loga | console do Firebase Auth |

---

## 10. Critérios de aceite da tela 1 (lista fechada)

A tela 1 está pronta para o palco quando **todos** abaixo passam no tablet do Marcel, em landscape, com a conta principal:

| # | Critério | Rastreio |
|---|---|---|
| A1 | Login com a conta principal; 100% das requests com `Authorization: Bearer`; zero chamadas a `/api/auth/session`, `/api/proxy`, `/api/profile` | T1-R1, T1-R6 |
| A2 | Token forjado inválido → no máximo 2 requests à rota e tela de login | T1-R3 |
| A3 | 429 simulado com `Retry-After: 30` → sem request por 30 s, mensagem pt-BR | T1-R4, T1-R36 |
| A4 | Abertura online: exatamente **1 + ⌈N/100⌉** requests a `/api/*` (3 com a conta principal, ~128 itens) e lista visível do cache em < 1 s | T1-R13 |
| A5 | Modo avião com cache: kill + reopen, sem login, setlist de 60 músicas abre completa | T1-R13, T1-R19 |
| A6 | Todo item da biblioteca renderiza por tipo (Lyrics/Chords/Tab/Sheet); item inválido mostra placeholder, nunca vazio | T1-R7, T1-R25 |
| A7 | Título do content vence o embutido da setlist; servidor com 3 setlists após cache com 4 → lista 3 | T1-R8, T1-R9 |
| A8 | Song com `content_id` ausente do cache aparece na posição certa com rótulo, sem buraco | T1-R11 |
| A9 | Arquivo baixado uma vez, servido do disco depois (sha256 igual ao do servidor) | T1-R14 |
| A10 | Setlist com `performance_date` amanhã → arquivos baixados em background sem abrir; indicador ✓/◔/✗ correto e recalculado | T1-R15, T1-R17 |
| A11 | Busca local: `aguas` acha `Águas`; sem resultado mostra mensagem; funciona offline; do palco, abrir resultado e voltar mantém "n de N" | T1-R20–R23 |
| A12 | Bis: mesmo content em duas posições = duas telas | T1-R24 |
| A13 | PDF de 12 páginas do cache em modo avião, 12 páginas navegáveis | T1-R26 |
| A14 | Avançar/voltar pela borda (≥ 48 px, 15% laterais); "n de N" visível; salto 1→47 em ≤ 3 taps; fim de setlist elegante; rotação preserva posição | T1-R27, R28, R29 |
| A15 | Auto-scroll < 100 ms em texto, desabilitado com motivo em PDF; zoom sem re-quebra; dark sheet em 1 tap | T1-R30, R31, R32 |
| A16 | 15 min sem toque no palco → tela acesa | T1-R33 |
| A17 | Troca de música p95 < 100 ms (texto) / < 1 s (PDF cacheado) na setlist de 60 | T1-R34 |
| A18 | `notes` da song visível no palco; `annotations` não renderizadas | T1-R35 |
| A19 | Falha de revalidação com cache → indicador, lista permanece; sem cache → erro acionável | T1-R18, T1-R37 |
| A20 | Nenhum literal de UI em inglês | T1-R36 |
| A21 | Mock de 500 na página 2 de content → cache de content byte a byte inalterado + indicador de falha | T1-R9, T1-R18 |
| A22 | Duas páginas com um `id` repetido → item uma vez no cache; sync sempre com `sortBy=recent` (captura de tráfego) | T1-R9b |

Baselines do web a **não regredir** (PLANO C2): 1ª música em tela cheia ≤ 3 taps / 5,4 s (aqui: ≤ 3 taps do launch com cache, A4+A14); troca 46–126 ms (A17); play/pause 41–57 ms (A15); dark sheet e zoom 1 tap (A15); scroll da setlist de 60 a 60 fps (A5 — verificar com o profiler do device `[hipótese: instrumento a definir no bloco de stack]`).

---

## 11. Backlog derivado — classificado, não agendado

| Item | Origem | Classe | Destino |
|---|---|---|---|
| `Cache-Control: private` ou `no-store` emitido pelas rotas de `/api/*` (hoje `public, max-age=0, must-revalidate`) | C-PRECHECK B.5 achado 1 | higiene de contrato / segurança baixa | Bloco B (mini-item; ponto único em `lib/api-errors.ts` + `NextResponse.json` das rotas) |
| Zod de `content_data` por `content_type` na escrita | C-D7; §2.6 | contrato | Bloco B (mini-item; não pré-requisito da tela 1) |
| `GET /api/debug/config` sem auth (404 só por `NODE_ENV`) | Fase A divergência 4 | superfície | Bloco B (classe da B1.0 — remoção) |
| `STORAGE.md` diz "Bearer" onde a rota aceita ambos e exige email verificado | divergência 5 | doc | Bloco B (correção de contrato, junto do contrato de auth B7) |
| `types/setlist.ts:40 event_date` (coluna inexistente, sem consumidor) | divergência 6 | dead code | Bloco B (housekeeping) |
| `lib/api-schemas.ts:34` enum falso `commonSchemas.contentType` (sem consumidor) | divergência 7 | dead code | Bloco B (housekeeping) |
| `scripts/ux-audit/auth.ts:109` comentário stale (5/15min) | divergência 8 | doc | Bloco B (housekeeping) |
| Contrato escrito de auth do cliente (header, prefixo literal, rotas com email verificado) | C-D1; PLANO B7 | doc | Bloco B (B7 — pode nascer copiando o §3 deste PRD) |
| B1.5 — fusão das cadeias A/B (email verificado, tolerância do header, TTL; cache respeitar `exp` do JWT) | C-D1; §1.4 | backend | fila da tela 2 |
| B9 — idempotência do `POST /api/content` | C-D4 | backend | pré-requisito da tela 2 (primeiro POST do nativo) |
| B11 — busca no servidor (`unaccent`/`pg_trgm`), tolerância a typo | C-D3 | backend | web (o nativo busca local); typo no nativo = índice local futuro, não bloqueia |
| B5-D6 — cascata content×storage (delete apaga objeto) + reconciliação | C-D5 | backend | tela 2 |
| Revogação do bypass secret da Vercel | B5-D5 | operação | B-final (fim do Bloco B) |
| Shape enxuto de listagem de setlists (SET-22, B7) | §2.1; B.4 (21.423 B descartados) | otimização | Bloco B, quando a listagem pesar (hoje 49.983 B) |
| `GET /api/storage/list` para recontar o bucket (hipótese 5: bucket=7) | C-PRECHECK B.7 | medição | tela 2 / reconciliação |

---

## 12. Divergências declaradas (plano × pre-check × este PRD)

1. **O plano trata bearer como "contrato a documentar" (B7)**; o pre-check mediu que **é o transporte primário do web hoje** e que passa em prod sem cookie `[medido: Fase A div. 3; B.2 P2]`. Este PRD assume bearer como fato, não como plano.
2. **O plano (C4) descreve o offline do web como "conteúdo textual cacheado por atacado, setlist nunca visitada renderizando offline"**; o pre-check mediu que o palco web só recebe dados por props do servidor e que o offline de palco é cache de HTML por URL + cache de arquivos `[medido: §2.5; hipótese 8]`. O §5 deste PRD **não herda** o modelo do web: define um modelo de dados local próprio.
3. **JOBS.md J6 pré-condição: "a setlist foi aberta pelo menos uma vez com conexão"**; neste PRD a garantia offline vem do **sync ao abrir + prefetch por data** (T1-R15/R17), não de "abrir a setlist" — a pré-condição do J6 vira "o app foi aberto online após a última mudança e a setlist tem data nos próximos 7 dias, ou foi baixada manualmente".
4. **JOBS.md J5 pede tolerância a typo**; C-D3 fixa normalização de acentos e o PRD deixa typo fora da tela 1 (§13). Registrado como gap consciente, não como requisito atendido.
5. **JOBS.md J2 pede anotação criável e visível no palco**; C-D7 declara `content_data.annotations` não-contrato e a tabela `annotations` tem 0 linhas `[medido: B2, referência]`. Na tela 1 só `setlist_songs.notes` é lido (T1-R35); anotações são tela 2 com modelo de dados a decidir (B5 decisão "greenfield").
6. **`Cache-Control` medido (`public`) contradiz a intenção do código (`no-store` em `lib/security-headers.ts:256`)** `[medido: B.5 achado 1]` — declarado no §11; o cliente não depende de nenhum dos dois (T1-R12).

---

## 13. O que a tela 1 NÃO faz

| Exclusão | Destino |
|---|---|
| Criar, editar, apagar **content** (texto ou arquivo); upload; import em lote; share target do WhatsApp (J4, C4) | **tela 2** (escrita; depende de B9) — upload/import seguem no **web** até lá |
| Criar, editar, apagar, **reordenar** setlists; adicionar/remover músicas (J3, B6 reorder em lote) | **tela 2** |
| Anotações (criar ou renderizar; J2, CONT-03) | **tela 2**, com modelo de dados decidido lá (B5 "greenfield"; C-D7) |
| Transposição de tom (J2) | **tela 2** ou posterior — não há requisito no plano para a tela 1 |
| Favoritar (CONT-05) | **tela 2** |
| Cadastro de conta (signup), verificação de email, edição de perfil | **web** (a tela 1 só faz login; não chama `/api/profile`) |
| Busca no servidor / tolerância a typo (LIB-04, B11) | **web**; no nativo, busca local sem typo (C-D3) — typo é backlog do índice local |
| Chamar `/api/proxy` para arquivos | **nunca** (C-D2) — o proxy é do web |
| Chamar `/api/auth/session` / cookie | **nunca** (C-D1) |
| Renderizar `content_data.annotations`, `sections`, `file` | **nunca** (C-D7 — não-contrato / inexistentes) |
| Cache HTTP de `/api/*` | **nunca** (T1-R12) |
| Fila de escrita offline, idempotência (J6 critério 4, B9) | **tela 2** |
| Multiusuário, onboarding, descobribilidade | **nunca** (anti-jobs do JOBS.md) |
| Reconciliação de órfãos do bucket, delete de objetos (B5-D2/D6) | **tela 2 / Bloco B** |
| Métricas/telemetria de uso | fora deste PRD; decisão do bloco de stack |

---

## Notas de rodapé — trechos verbatim citados fora do pre-check

Comandos executados na revisão 1 (2026-09-04), HEAD `bba5b2e`; o que está aqui é o que sustenta cada `[medido]` que não tinha linha colada no `C-PRECHECK.md`.

**N1 — bump de `updated_at` só no handler; sem trigger; default só no INSERT** (T1-R10)
```
$ sed -n 252,256p app/api/content/route.ts
252	    // Política D1 + semântica SET-23 por campo: undefined = "não mexer"
253	    // (fica fora do UPDATE), null = "limpar".
254	    const contentData: Database['public']['Tables']['content']['Update'] = {
255	      updated_at: new Date().toISOString(),
256	    }
$ sed -n 95,97p supabase/schema.dump.sql
95	    "is_public" boolean DEFAULT false,
96	    "created_at" timestamp with time zone DEFAULT "now"(),
97	    "updated_at" timestamp with time zone DEFAULT "now"()
$ grep -n -i "TRIGGER" supabase/schema.dump.sql; echo "exit=$?"
exit=1
```
(Os únicos `update … set updated_at = now()` do dump — linhas 67, 199, 265, 337 — são das RPCs do B6 e tocam `setlists`, não `content`. O B2 já registrara que os triggers de `updated_at` do antigo `schema.sql` nunca existiram no banco — PLANO, balanço do B2.)

**N2 — concorrência 3 e 30 s do web** (T1-R13)
```
$ sed -n 157,159p lib/advanced-content-cache.ts
157	      // Execute preloading with concurrency limit
158	      const PRELOAD_CONCURRENCY = 3
159	      for (let i = 0; i < preloadTasks.length; i += PRELOAD_CONCURRENCY) {
$ sed -n 169,176p hooks/use-setlist-data.ts
169	  useEffect(() => {
170	    const handleWindowFocus = () => {
171	      const now = Date.now()
172	      if (ready && user && user.uid && (now - lastFocusTimeRef.current) > 30000) {
173	        load(true) // Force refresh to bypass cache
174	      }
175	      lastFocusTimeRef.current = now
176	    }
```

**N3 — `Retry-After` no header e `retryAfter` no corpo** (§2, T1-R4)
```
$ sed -n 125,137p lib/user-rate-limit.ts
125	export function rateLimited(result: RateLimitResult): Response {
126	  const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000))
127	  return apiError('RATE_LIMITED', 'Rate limit exceeded', {
128	    extra: { retryAfter },
129	    headers: {
130	      'X-RateLimit-Limit': String(result.limit),
131	      'X-RateLimit-Remaining': String(result.remaining),
132	      'X-RateLimit-Reset': String(result.resetTime),
133	      'X-RateLimit-Scope': result.scope,
134	      'Retry-After': String(retryAfter),
135	    },
136	  })
137	}
$ sed -n 46,57p lib/api-errors.ts
46	export function apiError(
47	  code: ApiErrorCode,
48	  error: string,
49	  opts?: {
50	    details?: ApiErrorDetail[]
51	    headers?: Record<string, string>
52	    extra?: { retryAfter?: number }
53	  }
54	): Response {
55	  const body: Record<string, unknown> = { error, code }
56	  if (opts?.details) body.details = opts.details
57	  if (opts?.extra?.retryAfter !== undefined) body.retryAfter = opts.extra.retryAfter
```
O corpo tem `retryAfter` (linha 57, alimentada pelo `extra` da linha 128); o header tem `Retry-After` (linha 134). O exemplo normativo do CONTRATO-DE-ERRO.md (`429 {"error":"Rate limit exceeded","code":"RATE_LIMITED","retryAfter":868}`) é coerente.

**N4 — 194 linhas de `content` em 2026-08-24** (§0, §4 regra d, H14)
```
$ sed -n 130,134p lib/api-schemas.ts
130	// Enum canônico ÚNICO (D4): types/content.ts é a fonte — Lyrics|Chords|Tab|
131	// Sheet. Os quatro enums divergentes do achado c2 (10 valores fantasma como
132	// 'song'/'pdf' num; 'Tabs'/'Piano'/'Drums' noutro) morrem aqui. Contagem no
133	// banco (2026-08-24): 194 linhas, TODAS dentro deste enum — sem migration.
134	export const contentTypeSchema = z.nativeEnum(ContentType)
```
O B5-PRECHECK §2.3 (2026-08-29) mediu o mesmo `== CONTENT (194 linhas) ==` `[referência]`. 194 − 66 (conta de audit, medido em B.3) = ~128 na(s) outra(s) conta(s) — o B5 lista 5 profiles; quantos desses 128 são da conta principal é `[hipótese]` (fecha com o `total` da conta principal).

**N5 — `performance_date` date-only: origem e schema** (T1-R15)
```
$ grep -n '^### B5 — Decisões de dados\|^### B4 — Storage' docs/ux/PLANO-TRANSICAO.md
505:### B4 — Storage: listagem e reconciliação de órfãos (ADD-15 / FASE-D-04)
527:### B5 — Decisões de dados (✅ decididas em 2026-08-10)
$ sed -n 297,310p lib/api-schemas.ts
297	// performance_date é DATE-ONLY por decisão de produto (B5, 2026-08-10):
298	// YYYY-MM-DD, sem hora, sem fuso — a coluna já é `date` no banco (dump).
299	// Timestamp completo → 400 (elimina o off-by-one do SET-17 no contrato;
300	// a exibição web mantém o bug até morrer — Bloco D).
301	// ---------------------------------------------------------------------------
302	const setlistMetadataFields = {
303	  // name 1..255: alinhado à coluna varchar(255) do dump (era 100)
304	  name: commonSchemas.createSafeText(1, 255),
305	  // .nullish() em tudo: SET-23 — null = limpar, undefined = não mexer
306	  description: commonSchemas.safeHtml.nullish(),
307	  venue: commonSchemas.createSafeText(0, 255).nullish(),
308	  performance_date: z.string()
309	    .regex(/^\d{4}-\d{2}-\d{2}$/, 'performance_date must be date-only (YYYY-MM-DD)')
310	    .nullish(),
```
"B5" aqui é a **seção "B5 — Decisões de dados"** do plano (linha 527; decisão de 2026-08-10, linha 540: "✅ Date-only"), não o bloco de storage que passou a usar o mesmo nome (a ambiguidade está declarada no próprio plano e no B5-PRECHECK, divergência 1). Implementação: B2 PR-5 (#240), plano linha 414. Coluna `performance_date date` no dump:385.

**N6 — `sortBy=recent` → `created_at desc`** (T1-R9b)
```
$ sed -n 104,113p app/api/content/route.ts
104	    // Apply sorting
105	    const sortMap = {
106	      recent: ['created_at', false],
107	      title: ['title', true],
108	      artist: ['artist', true],
109	      updated: ['updated_at', false]
110	    } as const
111	
112	    const [sortColumn, ascending] = sortMap[sortBy] || sortMap.recent
113	    query = query.order(sortColumn, { ascending })
```
Sem desempate secundário (`id`) no `order`: dois itens com o mesmo `created_at` têm ordem não garantida entre páginas — mais um motivo para o dedupe por `id` do T1-R9b `[análise]`.

---

## Apêndice — rastreabilidade rápida

- Fatos por seção do pre-check usados: §1.3, §1.4, §1.5, §1.6, §2.1–2.6, §3.2–3.3, §4.1–4.3, B.2, B.3, B.4, B.5 (achados 1–6), B.6, B.7.
- Contratos: SETLISTS.md (1..N, addSong/bis, `notes`), STORAGE.md (B5-D3 público, URL permanente, namespace flat), CONTRATO-DE-ERRO.md (envelope, taxonomia, cláusula não-JSON, 429).
- Notas de rodapé N1–N6: trechos verbatim de `app/api/content/route.ts`, `supabase/schema.dump.sql`, `lib/advanced-content-cache.ts`, `hooks/use-setlist-data.ts`, `lib/user-rate-limit.ts`, `lib/api-errors.ts`, `lib/api-schemas.ts`, `docs/ux/PLANO-TRANSICAO.md` (comandos colados).
- IDs do plano citados: B7, B9, B11, B1.5, B5-D2/D3/D5/D6, C1, C2, C3-1/3/5/6, C4, SET-14, SET-22, LIB-04, AUTH-02, CONT-01/02/03/05, PERF-02/04/05/06/07/08/09/10, GLOB-01; JOBS J1, J2, J3, J4, J5, J6; itens 4, 9, 10, 25, 26 da Fase D.
