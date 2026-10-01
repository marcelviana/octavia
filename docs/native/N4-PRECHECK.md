# N4 — PRE-CHECK (PR-0)

**Bloco**: N4 — **content nos apps**. Recorte (N4-D5): **a biblioteca no tablet**.
**Esta PR**: só docs, só leitura. Árvore `../octavia-n4-precheck`, branch `n4/precheck`, sobre
`origin/main` = `046797e` (o merge da #350, o encerramento do I1). `pnpm install --frozen-lockfile
--offline`. **Nenhuma** request a prod, **nenhum** `adb`, **nenhum** `.env*` aberto (a árvore só tem o
`.env.example` versionado), **nenhum** login, **nenhuma** linha de código fora dos anexos.

- **Convenção**: `[medido]` = comando + saída literal nesta sessão, no anexo citado; `[lido]` = tirado do
  documento citado, sem medir de novo; sem um dos dois, `[hipótese]`. Toda seção de documento citada aqui foi
  conferida com `grep` do cabeçalho ([`cabecalhos.txt`](N4-PRECHECK-anexos/cabecalhos.txt)).
- **Leitura**: os seis documentos do §0 do prompt, inteiros, pelo executor. A Fase A do lado **nativo** foi
  lida pelo executor; o lado **web** (favoritar, `GET /api/content`, o cadastro, as folhas 4 e 5, as frases,
  a `LinhaDeAviso`, os leitores de corpo) foi mapeado por três agentes de leitura em paralelo e **cada linha
  citada aqui foi conferida pelo executor** com `awk 'NR>=a&&NR<=b'` no anexo correspondente — o relatório de
  agente não é fonte.
- **Divergências desta PR**: **956–973** (§4). A última usada era a **955** (`I1-ENCERRAMENTO.md` §15)
  `[medido: git grep -nE '^\| \*\*9[5-9][0-9]\*\*' -- docs]`; nenhuma acima dela.
- **Anexos**: [`N4-PRECHECK-anexos/`](N4-PRECHECK-anexos/README.md). Nenhum carrega texto de música: as
  fixtures dos scripts são escritas pelo projeto (*"Quando a noite chega"*, *"[Intro] C Am F G"*, `e|---0`), e
  as contagens sobre JSON já commitado imprimem só números e nomes de chave.

> **O QUE O PRE-CHECK ACHOU, EM UMA FRASE**: o nativo **já tem a biblioteca inteira no aparelho** — metadados e
> corpo de texto de todo content, paginado até o fim, sem teto de 100 —, já tem **busca local** sobre ela (S4) e
> já tem **palco avulso** (pela busca). O que falta é a **tela** (lista com filtro, visualização, a entrada), o
> **favoritar**, o **palco sem setlist hospedeira** e a decisão de **quem lê o corpo** — porque o web e o nativo
> não leem o mesmo `content_data` (G-par 6 de 13 sobre fixture).

---

## 0. Decisões N4-D1…D21

`[Marcel, 2026-10-01]` — registradas como vieram no prompt do PR-0, sem reescrever o alcance. Onde a Fase A
achou algo que toca uma delas, a decisão fica como está e a divergência aponta para a pergunta do §5.

| # | decisão |
|---|---|
| **N4-D1** | Ordem depois do I1: N4 → N5 (celular) → iOS. W5 é instrumento, em paralelo. |
| **N4-D2** | O N4 recebe as heranças que o `I1-ENCERRAMENTO.md` §10.2 lhe destina (itens 1–4). |
| **N4-D3** | O nativo consome `packages/identidade`; o N4 não cria token fora do pacote (div. 713: pare e pergunte). |
| **N4-D4** | O web é só online; o nativo é o palco e o offline. O N4 não reabre nada do web. O que o content no nativo exigir do backend é Bloco D. |
| **N4-D5** | Recorte: **a biblioteca no tablet**. Entra: lista de content (busca, filtro por tipo), visualização, abrir uma música avulsa no palco, offline da biblioteca, favoritar/desfavoritar, a entrada de navegação. Fora: edição, criação, upload, apagar. |
| **N4-D6** | Os quatro tipos entram, com o PDF — condicionado ao que o pre-check medir no palco, tipo por tipo. |
| **N4-D7** | Errata do `N2-ENCERRAMENTO.md` §10.2: os itens 1–5 mudam de destino para o Bloco D; o item 6 (C-D7) fica no N4 só como medição. **A errata se escreve nesta PR**, no topo daquela seção, no molde da errata do N3 que já está lá. *(Escrita: ver §3.3.)* |
| **N4-D8** | A visualização é **tela própria, diferente do palco**: mostra as informações cadastradas da música que o palco não mostra (e não deve mostrar). Da lista, o usuário pode **só visualizar** ou **abrir direto no palco**. |
| **N4-D9** | Offline: tudo garantido se o pre-check medir que cabe no teto de download; se não couber, lista em cache e corpo só do que está em setlist garantida, com o estado "não baixada" desenhado. *(Ver divs. 959, 960; Q6.)* |
| ↳ *errata* | **Errata da N4-D9 pela N4-D27** `[Marcel, 2026-10-01]`: o texto de toda a biblioteca já é offline; a garantia e o estado "não baixada" dizem respeito só a arquivos. A escolha entre as duas opções se decide depois da B3 (§9, §12 Q6). |
| **N4-D10** | O teto de 100 do `GET /api/content` fica (herança D): a lista mostra o que veio e uma linha de aviso quando o total passar do recebido. Sem paginação no N4. *(Ver div. 958; Q7.)* |
| ↳ *errata* | **Errata da N4-D10 pela N4-D28** `[Marcel, 2026-10-01]`: a linha de aviso do teto sai do recorte do nativo (div. 958; §9). |
| **N4-D11** | A entrada da biblioteca é decisão do desenho, com restrição: S1 continua a tela inicial e a composição de S1 em C não muda fora o controle novo, que entra como errata declarada do G-inv. |
| **N4-D12** | Faixas: a folha desenha A, B e C; a implementação cobre C e B; A só "não quebra", com a lista de inalcançáveis como herança do N5. |
| **N4-D13** | A quebra de linha na letra (N3-D15) segue bloco próprio entre o N4 e o N5. |
| **N4-D14** | Frases: unifica-se só o vocabulário de content que o nativo vai usar, num módulo do `packages/core` que o web importa com texto byte a byte igual. As demais frases do web ficam onde estão, com destino nomeado no encerramento. |
| **N4-D15** | O motivo (travessão × vírgula): vence a forma que o nativo já usa; se a troca cair no web, sai em PR própria. *(Ver div. 961; Q8.)* |
| ↳ *errata* | **Errata da N4-D15 pela N4-D29** `[Marcel, 2026-10-01]`: o core guarda o motivo isolado e cada lado compõe do seu jeito; nenhuma troca de texto no web no N4; as duas formas do motivo dentro do web vão ao bloco seguinte ao I1 (§9). |
| **N4-D16** | `LinhaDeAviso`: compartilha-se só o contrato (props e espécies) no core; duas implementações. |
| **N4-D17** | Os três `undefined` do `TokensDaFaixa` se decidem no congelamento. |
| **N4-D18** | Brief e desenho próprios: `docs/native/DESIGN-N4/`, duas rodadas, requisitos no lugar de PRD. |
| **N4-D19** | Gates do bloco: G-inv, G-N3 estendido às telas novas, **G-par** (novo: o mesmo content fabricado mostra o mesmo texto no web e no nativo) e G-back verde em toda PR. Escrita em prod: **só o favoritar**, pela regra 12, na conta de audit, em recurso descartável. |
| **N4-D20** | Fatiamento: PR-0 pre-check · brief/desenho/congelamento · PR-1 gates (entram reprovando) · PR-2 frases e contrato da linha de aviso · PR-3 core da biblioteca sem tela · PR-4 a tela da biblioteca · PR-5 visualização e palco avulso · PR-6 navegação, estados transversais e aceite completo · encerramento. O pre-check pode propor outra fatia, como pergunta. *(Ver Q11.)* |
| ↳ *errata* | **Errata da N4-D20 pela N4-D32** `[Marcel, 2026-10-01]`: o fatiamento passa a ser o da N4-D32 (§9) — PR-1 gates · PR-2 core de frases e contrato · PR-3 core da biblioteca · PR-4 a tela da biblioteca com a entrada em S1 · PR-5 o palco avulso sem hospedeira · PR-6 a visualização · PR-7 estados transversais, espécies e aceite · encerramento. |
| ↳ *errata* | **Errata da N4-D20, de novo, pela N4-D45** `[Marcel, 2026-10-01]`: o fatiamento que vale é o da **N4-D45** (§16), que substitui o da N4-D32. |
| **N4-D21** | Favoritar e desfavoritar ficam disponíveis no tablet. |

---

## 1. Fase A — leitura estática

### A1 — o content no nativo hoje

**Uma porta de entrada, uma cópia local, todo mundo lê da cópia.** O nativo lê content por **uma** chamada,
`GET /api/content?pageSize=100&page=<p>&sortBy=recent` (`apps/native/src/api.ts:227-229`), e **pagina até o
fim**: o `buscarContent` do sync repete enquanto `hasMore` (`apps/native/src/sync.ts:28-47`; *"Custo por sync:
1 + ⌈N/100⌉ requests"*, `:6`). O conjunto passa pelo `planSync` do core (substitui só com todas as páginas,
`packages/core/src/sync.ts:61-80`), pelo `reconcileByUpdatedAt` (T1-R10, `:127-135`) e vai **inteiro** para o
`content.json` (`apps/native/src/store.ts:147`) — o item da API sem mapeamento de campo: `JSON.stringify(
snapshot.content)`. Daí a raiz (`App.tsx`) monta `contents` e `contentById` e os passa às telas
`[medido: a1-content-no-nativo.txt]`.

| arquivo:linha | o que lê | de onde |
|---|---|---|
| `apps/native/src/api.ts:213-229` | `GET /api/content` paginado; o corpo `{data,total,page,pageSize,hasMore,totalPages}` | API |
| `apps/native/src/sync.ts:28-47`, `:101-110` | todas as páginas → `reconcileByUpdatedAt` → `save` | `api.ts` |
| `packages/core/src/sync.ts:21-36`, `:61-80` | `mergePages` (dedupe por `id`), `planSync` (substitui ou mantém inteiro) | as páginas |
| `apps/native/src/store.ts:92-112`, `:143-149` | `content.json` em `Paths.document/octavia-<uid>/`; `contentById` montado no load | disco |
| `apps/native/App.tsx:316-329` | `contents: dados.content`, `contentById` → `Navigation` | o cache carregado |
| `apps/native/src/navigation.tsx:62-76` | `dados.contents` (*"A biblioteca inteira, em ordem — o que a busca indexa"*) e `contentById` | raiz |
| `packages/core/src/song.ts:19-29`, `:41-49` | `resolveSong` / `labelFor`: o corpo **sempre** do cache por `content_id` (T1-R8) | `contentById` |
| `packages/core/src/content-contract.ts:51-83` | `isValidContent` / `bodyOf` — o **contrato de leitura** por tipo | o item do cache |
| `apps/native/src/screens/StageScreen.tsx:284-290` | o item da posição (ou o avulso), a validade e o corpo | `contentById` |
| `apps/native/src/screens/IndexScreen.tsx` (S2) | título, artista, tipo e o rótulo da linha (`labelFor`) | `contentById` |
| `apps/native/src/screens/SearchScreen.tsx:176-177` | `buildIndex(contents)` — **busca local na biblioteca inteira** (T1-R20–R23) | `contents` |
| `apps/native/src/screens/Picker.tsx:155-156` | `const biblioteca = estado.content` → `buildIndex` | o cache (não a API) |
| `packages/core/src/offline.ts:20-41` | `fileUrlsOf`: só os itens com `body === 'file'` têm arquivo a baixar | `contentById` |
| `apps/native/src/prefetch.ts:47-53`, `:61-68` | `urlDe`, `urlsGarantidas` (a janela de 7 dias) | `contentById` |

O `ContentDTO` do core declara **8 das 22 colunas** (`packages/core/src/types.ts:19-37`); as outras chegam e
são gravadas sem tipo — inclusive `is_favorite`, que **nenhum arquivo do nativo nem do core lê**
(`git grep -n is_favorite -- apps/native packages/core` → só `content-contract.test.ts:62`)
`[medido: a1-content-no-nativo.txt]`. Que o `is_favorite` está no `content.json` do aparelho é leitura do código
(sem mapeamento entre a API e o disco), **não medição** — H-N4-16.

### A2 — o palco por tipo

O palco decide pela **validade do core**, não pelo tipo: `isValidContent(...)` diz `body: 'text'` ou
`body: 'file'` ou o motivo do placeholder (`StageScreen.tsx:289-290`, `:314-327`)
`[medido: a2-palco-por-tipo.txt]`.

| tipo | ramo do palco (arquivo:linha) | dado | o que o cobre hoje |
|---|---|---|---|
| **Letra** (`Lyrics`) | texto: `<Text testID="corpo">{corpo}</Text>` (`StageScreen.tsx:597-598`), mono, entrelinha `text` (`:488-496`) | `content_data.lyrics` (string) | jsdom: `palco-faixa.test.tsx:53`; aparelho: `REF-S3-S3a-letra-1a` (mock, `B3-referencia-paisagem/`) |
| **Cifra texto** (`Chords`) | o mesmo ramo de texto | `content_data.chords` (string) | aparelho: `REF-S3-S3b-cifra-claro`/`-escuro`; **nenhum** teste de tela monta Cifra |
| **Tab** (`Tab`) | o mesmo ramo, entrelinha `tab` (`:494`) | `content_data.tablature` (string) | aparelho: `REF-S3-S3c-tab-autoscroll`; nenhum teste de tela |
| **Partitura** (`Sheet`, PDF) | `Arquivo` → `<Pdf>` do `react-native-pdf` (`:744-790`), S3d; S3e quando não está no disco | `file_url` → `ensureFile` (disco primeiro, `:349-374`) | jsdom: `palco-faixa.test.tsx:58` (duplo do `react-native-pdf`); aparelho: `REF-S3-S3d-pdf-12p`, `REF-S3-S3e-nao-baixado` |
| **Cifra escaneada** (`Chords`, `content_data` null + `file_url`) | o mesmo `Arquivo`/`Pdf` (`content-contract.ts:65-67`) | `file_url` | core: `content-contract.test.ts`; a fixture do V1-PR5 tem 3 (`a2-palco-por-tipo.txt`); **nenhum** dump do palco com ela |
| inválidos (`no-body`, `no-key`, `not-string`, `unknown-type`, `content-missing`) | placeholder `MOTIVO` (`StageScreen.tsx:114-139`), nunca tela vazia | — | aparelho: A6/A8 do V1 (`invalidos-content`); core: `content-contract.test.ts` (15 casos, verdes nesta sessão) |

**O que não abre, declarado e não consertado:**

1. **Partitura em imagem** (`.png`, `.jpg`, `.jpeg`): o web aceita no upload (`components/upload/frases-upload.ts:107`
   `EXTENSOES_PARTITURA`) e a visualização do web a mostra (`SheetMusicDisplay.tsx:53-66`); **o palco manda todo
   arquivo ao `react-native-pdf`** — não há ramo de imagem (`git grep -nE "Image|\.png" StageScreen.tsx files.ts`
   → nada). `[hipótese, não medida no aparelho]`: abre como `pdf-error`. **Div. 963.**
2. **Letra/Cifra importadas de `.docx`/`.txt`** (o lote grava só `file_url`, `I1-ENCERRAMENTO.md` §10.1 item 4,
   div. 823): `Lyrics` com `content_data` null é `no-body` (placeholder); `Chords` null com `file_url` é tratada
   como **arquivo** e vai ao `<Pdf>`. Mesma hipótese. **Div. 963.**
3. **Formas que só o web lê** (cifra em `sections[]`, acordes em lista, `progression`, tab em lista, partitura
   com `notation`): no palco viram placeholder `no-key`/`not-string`, ou perdem a parte que o web mostra
   (A12, div. 965).

**Quantas existem no dado real é a Fase B** (B2). No **snapshot da conta de audit já commitado**
(`docs/ux/C-PRECHECK-anexos/B-P5-content.json`, 66 itens) a contagem é: arquivos **5 de 5 `.pdf`**, `tablature`
**8 de 8 string**, `Chords` só com a chave `chords` (string) ou sem chave — **nenhuma** das formas do item 3
`[medido: a2-palco-por-tipo.txt]`. É um snapshot, de outra conta; não responde pela principal.

### A3 — o palco sem setlist

**O palco avulso já existe** (T1-R22, desde a N1): `Stage: { setlistId: string; position: number; avulsa?: string }`
(`navigation.tsx:32`), aberto pela busca (`:260-276`) e mostrado com `AVULSA` na barra (`StageScreen.tsx:513`),
bordas que não navegam (`:405-418`) e `Voltar para a busca` no lugar de sair (`:720-721`). **Mas não existe palco
sem setlist hospedeira** `[medido: a3-palco-sem-setlist.txt]`:

| o que o `StageScreen` exige | arquivo:linha | o que acontece sem setlist |
|---|---|---|
| `setlist: SetlistDTO` (não opcional) | `StageScreen.tsx:77-79` | a rota acha a setlist por id; sem ela, `<Placeholder titulo="SETLIST" nota="não está no cache" />` (`navigation.tsx:183-186`) |
| a hospedeira do avulso aberto **de S1** | `navigation.tsx:271-275`: `setlistId: setlist?.id ?? dados.lista[0]?.id ?? ''` | com **zero** setlists, `''` → o placeholder acima; com setlists, **a primeira da lista**, sem relação com a música |
| o nome da hospedeira na barra | `StageScreen.tsx:550-551`, `:560-561` (`{setlist.name}`) | o avulso de S1 mostra o nome de uma setlist alheia |
| o prefetch sob demanda | `StageScreen.tsx:392-395` (`prefetchDemanda(setlist, …, posicao)`) | baixa os arquivos da hospedeira a partir da posição — o avulso não deveria baixar nada além do próprio |
| o `stage restore` / `nav` | `:204-206` (pula no avulso), `:336-338` (`nav … setlist=<id8>`) | o `nav` não sai no avulso (as bordas não navegam); o `keepawake on/off` sai normal |

**O que mudaria** (só leitura; a decisão é a Q9): `navigation.tsx:32` (`setlistId` opcional quando `avulsa`),
`:181-219` (renderizar o palco sem hospedeira), `:271-275` (não inventar `lista[0]`); `StageScreen.tsx:77-79`
(`setlist: SetlistDTO | null`), `:284-287` (`songs`/`n` com setlist nula), `:392-395` (sem prefetch da hospedeira
no avulso), `:545-563` (a barra sem nome de setlist), `:336-338`. **Nenhuma linha de log nova é obrigatória**: o
avulso já não emite `stage restore` nem `nav`; o `placeholder kind=…` e o `file …` saem iguais. O leitor do
`apps/native/test/palco-faixa.test.tsx:197` (*"avulsa (aberta pela busca): `AVULSA` na linha 1"*) já monta o
avulso — com hospedeira.

Os três sintomas da linha 2 da tabela são **defeito presumido por leitura, não medido no aparelho** — **div. 964**.

### A4 — o cadastro inteiro

**22 colunas** no banco (`supabase/schema.dump.sql:75-98`; `types/database.types.ts:60-83`); o Zod de escrita
(`lib/api-schemas.ts:139-199`) cobre 18 delas (sem `thumbnail_url`, `user_id`, `created_at`, `updated_at`)
`[medido: a4-cadastro.txt]`. A coluna "salvo de verdade?" é o `I1-ENCERRAMENTO.md` §10.1 item 2 (o prompt chama
de "§10.1.2"; a seção é a tabela da `### 10.1 Bloco D`, linha 503) conferido no código de hoje.

| campo | o palco mostra? | a visualização do web mostra? (folha 5) | salvo de verdade? |
|---|---|---|---|
| `title` | **sim** — `StageScreen.tsx:517` | sim — `ContentHeader.tsx:33` (todos os `VIEW-*`) | sim |
| `artist` | **sim** — `:519` (` · artista`) | sim — `ContentHeader.tsx:36`, *"artista desconhecido"* se nulo (`:25`) | sim; o lote grava *Unknown Artist* (§10.1 item 5) |
| `content_type` | **sim** — `:520`, rótulo `TIPO` (`:107-112`) | sim — ícone + rótulo (`ContentHeader.tsx:35-36`) | sim |
| `content_data` (o corpo) | **sim**, por `bodyOf` (uma chave por tipo) | sim, por `corpo-de-texto.ts` (várias formas; + 2º painel *Cifra* na letra e na tab, I1-E18) | sim, **poluído** pelo editor (§10.1 item 1) |
| `file_url` | **sim** (S3d/S3e) | sim — PDF ou imagem (`SheetMusicDisplay.tsx:32-66`) | sim (o lote de texto grava **só** ele, div. 823) |
| `album` | não | sim — *Detalhes* (`frases-visualizacao.ts:123`) | sim |
| `difficulty` | não | sim — *Detalhes* (`:124`) | sim |
| `genre` | não | sim — *Detalhes* (`:125`) | sim |
| `key` (tom) | não | sim — *Detalhes* (`:126`) | sim |
| `time_signature` (compasso) | não | sim — *Detalhes* (`:127`) | **não** — o editor não o envia (div. 771), o upload o perde pelo nome (div. 820) |
| `bpm` | não | sim — *Detalhes* (`:128`) | sim |
| `tags` | não | sim — *Detalhes* (`:129`) | sim |
| `created_at` / `updated_at` | não | sim — *Detalhes* (`:130-131`) | do servidor |
| `notes` (do content) | **não** — a nota do palco é `setlist_songs.notes`, por posição (`:536`) | sim — painel de notas (`ContentSidebar.tsx:31`) | sim |
| `capo` | não | só na Tab (`TabDisplay.tsx:28`) | **não** como coluna (o editor o põe só no `content_data`; o upload não o envia, div. 820) |
| `tuning` (afinação) | não | só na Tab (`TabDisplay.tsx:29`), *"padrão (EADGBE)"* se nulo | **não** (div. 820) |
| `is_favorite` | não | **não** — o favoritar da visualização era falso e saiu (div. 737); a folha tirou `VIEW-favorita` | sim, pela lista (A5); o upload o perde pelo nome (div. 820) |
| `is_public` | não | não | o editor o repassa; nenhuma tela o mostra |
| `thumbnail_url` | não | não | nunca — fora de todo Zod |
| `id`, `user_id` | não | `id` só no link *Editar* | do servidor |

**O que a visualização do nativo poderia mostrar que o palco não mostra** (N4-D8) é a coluna 3 menos a 2:
álbum, dificuldade, gênero, tom, compasso, andamento, etiquetas, datas, notas do content, capo e afinação — **com
a ressalva da coluna 4**: compasso, capo e afinação **não se salvam de verdade** hoje, e mostrá-los no nativo é
mostrar um valor que o músico talvez não tenha conseguido gravar. Pergunta do brief (Q10).

### A5 — favoritar

**O web favorita sem mudar backend e sem o corpo do editor** — não houve parada neste item
`[medido: a5-a6-favoritar-get.txt]`:

| lado | arquivo:linha | o quê |
|---|---|---|
| botão | `components/library/LinhaDaBiblioteca.tsx:44-49` | `aria-pressed={item.is_favorite}`, `onClick={() => acoes.onToggleFavorite(item)}`; rótulo *Favoritar*/*Favorita* lido da linha do servidor — sem estado local |
| hook | `hooks/use-content-actions.ts:77-87` | `const newFavoriteStatus = !content.is_favorite` → `toggleFavorite(id, novo)` → `onReload()`; o `catch` só faz `console.error` |
| serviço | `lib/content-service.ts:600-601` → `:540-546` | `updateContent(id, { is_favorite })` → `fetch("/api/content", { method: "PUT", body: JSON.stringify({ id, ...content }) })` |
| corpo | — | **`{"id":"<uuid>","is_favorite":true|false}`** — **valor absoluto**, calculado no cliente como a negação da linha que ele tem; **sem** `content_data`, sem a linha |
| rota | `app/api/content/route.ts:225-326` (`export const PUT`, `:328`) | `enforceUserLimit(user.uid, 'content-mutate', RATE_LIMITS.MUTATE)` (`:233`); `contentSchemas.update.safeParse` (`:244`); **update por campo** (`:280-301`: *"undefined = 'não mexer' … null = 'limpar'"*), o favorito em `:300`; `.update(...).eq('id', id).eq('user_id', user.uid).select().single()` (`:303-309`); resposta = a linha inteira atualizada (`:321`); 404 por PGRST116 (`:312-316`) |
| Zod | `lib/api-schemas.ts:190-199` | `update`: `id` obrigatório, o resto opcional, `is_favorite: z.boolean().nullish()`, `.strict()` |
| limite | `lib/user-rate-limit.ts:51-52` | `MUTATE: { windowMs: 15 * 60_000, max: 120 }` — **120 por 15 min**, por usuário, família `content-mutate`, mapa em memória por instância |

- **Existe caminho que grava só o favorito?** Sim: **o mesmo `PUT /api/content`**, com corpo parcial. Não há
  rota dedicada (`app/api/content/[id]/route.ts` só tem `GET` e `DELETE`, `:158-159`).
- **O corpo é valor absoluto.** A alternância é do cliente; o servidor grava o que vem.
- **O `PUT` sempre grava `updated_at`** (`route.ts:282-284`): favoritar **bumpa** o `updated_at`, e o próximo
  sync do nativo conta o item como mudado (`invalidated` +1) — correto pelo T1-R10, e a ordem `sortBy=recent` não
  muda (é `created_at`, `route.ts:106-115`).
- **O que o `I1-ENCERRAMENTO.md` §10.1 item 12 registra, conferido**: *"apagar e favoritar: mudos na lista (os
  erros são produzidos e ninguém lê)"* — produzidos em `content-service.ts:549-554`, engolidos em
  `use-content-actions.ts:86-87`; o retorno do hook não expõe erro. **Confirma.**
- **O gate `tests/gates/i1-editor-put.test.tsx`** prova o corpo **do editor** (a linha inteira, com o
  `content_data` poluído) byte a byte contra `tests/gates/fixtures/editor-put-antes.json`; **o corpo da lista
  (`{id,is_favorite}`) não está sob gate nenhum** — **div. 966**.
- **"Passando pelo PUT do editor"** — o prompt separa os dois; no código eles são **a mesma rota e o mesmo
  schema**, com corpos diferentes. O favoritar do nativo pelo corpo parcial **não passa pelo corpo do editor nem
  muda backend**, mas passa pela rota que o editor usa — **div. 969**. A pergunta com as opções é a **Q1**.

### A6 — o `GET /api/content`

`[medido: a5-a6-favoritar-get.txt]` — `app/api/content/route.ts:18-146`:

- **Parâmetros** (Zod `lib/api-schemas.ts:203-212`, **não** `.strict()`: parâmetro desconhecido some calado):
  `page` (padrão 1), `pageSize` (padrão **20**), `search` (≤ 100; ILIKE em título, artista e álbum, `%`/`_`
  escapados, `:71-77`), `sortBy` (`recent` | `title` | `artist` | `updated`, padrão `recent`), `contentType`
  (lista por vírgula, filtrada pelo enum, `:82-85`), `difficulty`, `key`, `favorite` (`'true'` filtra; `'false'` não
  filtra nada, `:101-103`).
- **Teto**: `const safePageSize = Math.min(Math.max(1, pageSize), 100)` (`:119`).
- **Ordem**: `recent` = `created_at` desc, com desempate por `id` (`:106-115`).
- **Resposta** (`:130-139`): `{ data, total, page, pageSize, hasMore, totalPages }` — **inclui o total**.
- **Limite**: `content-read`, `READ: { windowMs: 60_000, max: 300 }` (`lib/user-rate-limit.ts:50`).
- **`GET /api/content/[id]`**: a linha nua, 404 por PGRST116 (`app/api/content/[id]/route.ts:11-70`).

**O que o picker do nativo pede hoje: nada.** Ele lê `estado.content`, o cache (`Picker.tsx:155-156`). O "pedido
de 1000 do picker" do `I1-ENCERRAMENTO.md` §10.1 item 7 é o **picker do web** (`hooks/use-setlist-data.ts:70-77`,
`pageSize: 1000`, clampado a 100 pelo servidor, sem pedir a página 2) — **div. 957**. O nativo pede
`pageSize=100&page=<p>&sortBy=recent` até `hasMore === false` — **o teto de 100 não limita a biblioteca do
nativo** — **div. 958**.

### A7 — o offline

`[medido: a7-offline.txt]`

**O que já está no aparelho, sempre**: o **`content.json` inteiro** — metadados e `content_data` de **todo**
content da conta (`store.ts:143-149`), gravado atômico, mantido inteiro se o sync falha (`planSync`). Logo **o
corpo de texto de toda Letra, Cifra-texto e Tab já é offline hoje**, esteja ou não numa setlist — a busca (S4)
funciona em avião por isso (`SearchScreen.tsx:6-8`). **O offline do N4 é só o dos ARQUIVOS** (Partitura e Cifra
escaneada) — **div. 960**.

**O mecanismo dos arquivos, como está:**

| peça | arquivo:linha | o que faz |
|---|---|---|
| garantido | `prefetch.ts:61-68` `urlsGarantidas` = `selectPrefetch` com "nada no disco" | os arquivos das setlists com data **hoje…hoje+7** (`offline.ts:83-113`) |
| prefetch de 7 dias | `prefetch.ts:153-198` | baixa o que falta da janela no **durável** (`Paths.document/octavia-<uid>/files`, `files.ts:53-54`); promove o que veio por demanda (`promoteList`) |
| sob demanda | `prefetch.ts:203-221` | no palco: atual, +1, +2, +3, −1, resto — no **purgável** (`Paths.cache/…/files`, `files.ts:57-58`) |
| manual | `prefetch.ts:243-259` | *"baixar esta setlist"* (só em setlist sem data) — no durável, **fora** do `protectedUrls` |
| LRU | `prefetch.ts:273-283` → `offline.ts:166-194` | **teto de RETENÇÃO** `CAP_BYTES = 200 * 1024 * 1024` (`prefetch.ts:34`); despeja por desuso, nunca os garantidos; o estouro vira `lru over` |
| **teto de download** | `files.ts:247-295` | **não existe** — saiu no W1 (div. 126): *"UM TETO QUE NÃO PODE DISPARAR É PIOR QUE TETO NENHUM"* |
| o estado do item | `offline.ts:43-64` `offlineStatus` | `guaranteed` / `partial` (`n de m`) / `never` — **por setlist**, não por música |
| linhas de log | `LOGS-OCTAVIA.md` catálogo | `prefetch plan n= reason=7d\|manual\|demand`, `prefetch promote n=`, `file src=disk\|download …`, `file-reject …`, `lru evict …`, `lru over …`, `download-error …` |

O "teto de download" da N4-D9 só pode ser lido como o **teto de retenção de 200 MB** — **div. 959**. O
`prefetch.ts:28-33` registra a medida que existe: *"o N0-H16 mediu o repertório inteiro da conta de audit em
265.002 B"* `[lido]` — da **audit**, em 2026-09; a principal é a Fase B (B3).

**O que seria preciso para garantir a biblioteca inteira** (os arquivos), em arquivo:linha:

1. **o conjunto garantido** — `urlsGarantidas` (`prefetch.ts:61-68`) passa a incluir todo `file_url` com
   `body === 'file'`, não só a janela de 7 dias; ou um conjunto novo no core ao lado do `selectPrefetch`
   (`offline.ts:90-113`) — a definição única da janela (o comentário de `prefetch.ts:55-60`) tem de continuar
   única;
2. **o plano** — um `prefetch plan n=<n> reason=<novo>` (o catálogo hoje tem `7d|manual|demand`): **errata do
   G3 em par** (regra 14) e linha nova no `LOGS-OCTAVIA.md`;
3. **o LRU** — tudo garantido vira `protectedUrls`: o LRU deixa de despejar e o `lru over` passa a ser o único
   sinal de que não coube (`prefetch.ts:273-283`) — com 200 MB de teto, a pergunta é se a soma da Fase B passa
   perto;
4. **o estado "não baixada"** — o `offlineStatus` é por setlist; para a lista, um estado **por música** é novo no
   core (hoje só o palco sabe, pelo S3e: `StageScreen.tsx:349-354`).

### A8 — a navegação

`[medido: a8-navegacao.txt]`

- **Como troca de tela**: um `native-stack` (`@react-navigation/native-stack`), seis rotas — `Login`, `Setlists`
  (S1), `Index` (S2), `Stage` (S3), `Search` (S4), `End` (S5) (`navigation.tsx:1-9`, `:23-36`). Sem header; as
  barras são do desenho. A raiz (`App.tsx:305-347`) segura os dados e o `SafeAreaView`.
- **S1 é a tela inicial**: o primeiro `Stack.Screen` do grupo com sessão (`navigation.tsx:121-136`).
- **O que S1 tem em cada faixa** (tokens em `packages/identidade/src/tokens.ts:346`, `:366`):
  - **C** (> 960): barra de **120**, uma linha — título, chip de sync, `Nova setlist`, `Buscar música`
    (`SetlistsScreen.tsx:561-565`; *"Ordem do congelado: status de sync · ESCREVER · ler"*);
  - **B** (700–960): barra de **144**, o título em linha própria e chip + botões na segunda (`empilha: true`);
  - **A** (< 700): **os tokens de B** (`faixas = { A: faixaB, B: faixaB, C: faixaC }`, `tokens.ts:385`) — e S1 em
    A **não cabe** (`N3-ENCERRAMENTO.md` §10.1, item 1).
- **A entrada da biblioteca já tem um parente**: `Buscar música` (`testID="buscar"`) abre a S4, **a busca na
  biblioteca inteira** — local, offline, com o chip de tipo e o abrir avulso. A entrada nova convive com ela ou a
  absorve — decisão do desenho (Q12).
- **Onde uma entrada nova toca o G-inv**: um controle a mais na barra de S1 muda a geometria de **8 dos 34
  dumps** da base `N3-PRECHECK-anexos/B5-baseline/` — `B5-S1-setlists`, `-aviso-sem-rede`, `-S1e-falha-com-cache`
  e `-S1f-vazia`, nos dois aparelhos; as folhas (`folha-criar`, `-falhou`, `-validacao`) são janela modal e **não**
  trazem nó de S1 (0 nós de S1 nos 6 dumps de folha). A base do palco (`B3-referencia-paisagem/`, 18) não muda se
  o palco com setlist não mudar. A errata declarada da N4-D11 é sobre esses 8.

### A9 — as frases

`[medido: a9-frases.txt]` — contagem por script (`tsx`, as folhas de texto dos objetos exportados):

| lado | arquivo(s) | contagem |
|---|---|---|
| nativo, conjunto fechado | `packages/core/src/frases.ts` | `FRASES`: **45** chaves; 17 exports em tempo de execução (`perguntaDeApagar`, `tituloDoReordenar`, os construtores do picker, `frase()`…) |
| nativo, fora do conjunto | `StageScreen.tsx:107-139` (`TIPO`, `MOTIVO`), `IndexScreen.tsx:165-205`, `SearchScreen.tsx:79-91`, `SetlistsScreen.tsx:183-191` (`TEXTO_DE_ERRO`), `LoginScreen.tsx:55-60` | os rótulos de tipo, os placeholders, os erros de sync — **o vocabulário de content do nativo mora nas telas, não no core** |
| web | os dez `components/*/frases-*.ts` | **421** folhas nos `FRASES_*` (o número do `I1-ENCERRAMENTO.md` §1, conferido); **626** contando `TIPOS`, `DIFICULDADES`, `MESES`, `TONS`, `GENEROS`… |

**A interseção do vocabulário de content:**

| sentido | web | nativo | igual? |
|---|---|---|---|
| os quatro tipos | `TIPOS` (`frases-lista.ts:76-80`): *Cifra · Letra · Tab · Partitura* | `TIPO` (`StageScreen.tsx:107-112`; `IndexScreen.tsx`, `SearchScreen.tsx`): *Letra · Cifra · Tab · Partitura* | **igual** (ordem à parte) |
| tipo desconhecido | `tipoDe` → rótulo `""`, ícone `tipo-desconhecido` (`frases-lista.ts:83-85`) | *"tipo não reconhecido — edite na versão web"* (S2); *"tipo desconhecido"* (palco) | diferente |
| corpo vazio | *"nenhuma partitura/letra/tablatura/cifra"* (`frases-visualizacao.ts:32-37`) | *"este item não tem conteúdo"* (palco); *"nada para mostrar — edite na versão web"* (S2) | diferente |
| carregando | *"carregando a biblioteca…"* (`frases-lista.ts:55`) | *"carregando…"* (S2, `IndexScreen.tsx:202`); S1a *"baixando suas setlists pela primeira vez"* | diferente |
| sem rede | `motivo.rede`: *"sem conexão"* | *"sem conexão"* (S1, S4) | **igual** |
| servidor | *"falha no servidor"* | *"falha no servidor"* (S1); *"falha no servidor — nada foi alterado aqui"* (escrita) | igual na leitura |
| sessão | *"o servidor não aceitou a sessão — entre de novo"* (lista) / *", entre de novo"* (editor) | *"sua sessão expirou"* (sync); *"não foi possível salvar — confira sua conta no site"* (escrita) | diferente |
| limite | *"muitas tentativas — tente de novo em instantes"* / *", tente…"* | *"servidor ocupado · tente em instantes"* (sync); *"muitas alterações seguidas — tente de novo em {N} s"* (escrita) | diferente |
| vazio de busca | *"nada encontrado"* / *"mude a busca ou os filtros"* | S4b (busca local) | a medir no brief |
| favoritar | *Favoritar* / *Favorita* / *Favoritar "{título}"* / *Tirar "{título}" das favoritas* (`frases-lista.ts:44-47`) | — (não existe) | só web |

**A forma do motivo no nativo** — nem travessão nem vírgula **na composição**:

- o motivo **isolado** carrega o travessão por dentro: `'sem conexão — nada foi salvo'` (`frases.ts:226`),
  `'não foi possível salvar — confira sua conta no site'` (`:229`), `'a setlist mudou — a ordem foi recarregada'`
  (`:234`), `'falha no servidor — nada foi alterado aqui'` (`:237`);
- a **composição** "o que não deu certo + o motivo" junta orações com **`'  ·  '`**:
  `oracoes.join('  ·  ')` (`IndexScreen.tsx:587`, `ModoDeReordenar.tsx:511`; também `IndexScreen.tsx:207`,
  `SearchScreen.tsx:91`);
- no web a composição é **`"não foi possível … — {motivo}"`** (`frases-lista.ts:34`, `:60`; e as das PR-11…13),
  e é ali que nasce o conflito: o motivo com travessão dentro de uma frase que já tem travessão — a PR-9 deixou
  dois (`lib.erro` + `motivo.auth`), a PR-11 trocou o de dentro por vírgula (`frases-editor.ts:80-82`).

A N4-D15 manda vencer *"a forma que o nativo já usa"*; o nativo não tem a forma composta com travessão — **div.
961**, **Q8**.

### A10 — a `LinhaDeAviso`

`[medido: a10-linha-de-aviso.txt]`

| | web — `components/identidade/linha-de-aviso.tsx` | nativo — `apps/native/src/screens/LinhaDeAviso.tsx` |
|---|---|---|
| props | `motivo: string`, `tipo?: TipoDeAviso`, `detalhe?: string`, `acao?: AcaoDoAviso`, `className?` (`:27`) | `icone: NomeIcone`, `cor: string`, `motivo: string`, `acao?: AcaoDoAviso`, `recuo?: number` (`:46`) |
| ação | `{ rotulo, onPress, inativo? }` (`:21`) | `{ rotulo, onPress, inativo?, motivoInativo? }` (`:38`) |
| espécies | **`"falha" | "rede" | "limite" | "sucesso"`** (`:19`), padrão `falha`; o mapa `ICONE` (`:35-40`) dá ícone e cor; papel `status` no sucesso, `alert` no resto | **nenhuma** — quem chama passa ícone e cor; os pares em uso: `sem-conexao`+`offlineInk`, `ultima-sincronizacao`+`offlineInk` (limite), `falha`+`errorInk`, `n-de-musicas`+`muted` (teto de 100), `ultima-sincronizacao`+`muted` (salvo-não-relido) |
| usos | 17 `<LinhaDeAviso` em 13 arquivos de `app/` e `components/` (`git grep -c`) | 4 telas (`IndexScreen.tsx:784`, `ModoDeReordenar.tsx:641`, `Picker.tsx:421`, `SetlistsScreen.tsx:595`) |

**O que um contrato comum conteria** (N4-D16): `motivo: string` (a frase inteira, nunca elidida — N3-D19); a
**espécie** como união fechada — as três que os dois têm (`falha`, `rede`, `limite`) mais as duas que só o nativo
usa (`teto`, `salvo-nao-relido`) e a que só o web usa (`sucesso`) —, e **cada implementação mapeia espécie → ícone
e cor** (o que hoje o nativo faz em cada tela e o web no `ICONE`); `acao?: { rotulo, onPress, inativo?,
motivoInativo? }` (a união dos dois). Ficam fora do contrato: `detalhe` e `className` (web), `recuo` (nativo).
Mudar o nativo de `icone`/`cor` para `especie` toca as quatro telas — **é tela**, não só core (Q-fatia, Q11).

### A11 — os três `undefined` do `TokensDaFaixa`

`[medido: a11-undefined.txt]`

| chave | literal | quem lê | o que o CSS faz |
|---|---|---|---|
| `faixas.C.reordenar.artistaMin` | `tokens.ts:350` `artistaCede: 1, artistaMin: undefined` | `ModoDeReordenar.tsx:229`: `artistaMin !== undefined ? { flexShrink, minWidth } : null` — em C o artista não tem mínimo | **nada**: o gerador só emite `web.*` e `folha.*` (`gerar-css.mjs:19-20`, `:58`) |
| `faixas.B.folha.alturaMin` | `tokens.ts:372` `folha: { largura: 663, topo: 96, alturaMin: undefined }` | `FolhaDeCriar.tsx:311` `minHeight: f.alturaMin` — em B a folha não tem altura mínima | omite a propriedade (`gerar-css.mjs:83-85`, `if (v !== undefined)`): `--faixa-folha-altura-min` só em C (`identidade.css:105`) |
| `faixas.A.folha.alturaMin` | **a mesma linha 372** — `faixas = { A: faixaB, … }` (`:385`) | o mesmo | o mesmo (`identidade.css:156-157`: A sem `altura-min`) |

São **três chaves e duas literais** — a de A é a de B por referência; decidir uma decide a outra enquanto A for
`faixaB` (**div. 962**). **Nenhum código do web lê `alturaMin`/`artistaMin`** (`git grep` em `app`, `components`,
`lib`, `hooks` → nada); as variáveis geradas existem no CSS e ninguém as consome. O teste
`packages/identidade/test/igualdade.test.ts:33` guarda o `undefined` com o marcador `{"$indefinido": true}`.

### A12 — os gates

**O estado na `main` `046797e`, nesta árvore, sem aparelho** `[medido: a12-gates.txt]`:

| gate | comando | resultado |
|---|---|---|
| G-inv | `g-inv.sh B5-baseline N3-PR6c-anexos/dumps-final` · `… B3-referencia-paisagem …` | **34 de 34** · **18 de 18**, exit 0 |
| G-N3 | `g-n3.mjs --pai N3-PR6c/dumps-n-pai --faixa …/dumps-n-ret` | (e)=0 · (b)=0, exit 0 |
| G1a/G1b | `g1.sh 046797e WORKTREE` | diff vazio em 50 derivados; só adição; exit 0 |
| G2/G3 | `g2g3.sh 046797e WORKTREE` | G2 80 = 80; G3 68 = 68; exit 0 |
| `gate:a20` · `gate:icones` | `node scripts/a20.mjs` · `icones.mjs` | 0 acusações · 0 acusações, 0 avisos |
| G-palco · G-tok · cobertura · G-faixa | `scripts/gates-web/*` | PASSA · PASSA (132 arquivos) · PASSA · PASSA, exit 0 em todos |
| `SHA256SUMS` | `DESIGN-V1`, `-N2`, `-N3`, `docs/ux/DESIGN-I1` | todos `OK` |
| G-back | lê o corpo da PR (`gates-web-decl.sh`) | roda no CI desta PR |

**Como cada um se estende a telas novas:**

- **G-inv** (T3-R2): a base é o mock (regra 20). Uma tela **nova** não tem chave na base — fica *"fora da conta"*
  (é o que o gate imprime hoje para os `N3P6CF-…` sem base). O que ele prova no N4 é que **as telas que existem
  não mudam em C** — fora os 8 de S1 da errata declarada (A8) e o palco, se a Q9 mexer na barra do avulso (o
  avulso **não está** na base `B3-referencia-paisagem/`, que é só palco com setlist: 18 dumps, `REF-S3-*` e S5).
- **G-N3** (T3-R4): par (paisagem, retrato) do mesmo estado; telas novas entram com par **desde a primeira
  captura** — o (e), o (b) e o nome-acessível valem como estão.
- **G5/G6** (T3-R5): alvo ≥ 48 e `testID` por estado, nas quatro colunas — estados novos entram na matriz.
- **G2/G3**: `testID` novo é adição (G2 aceita); **linha de log nova** é adição no G3; mudar a `prefetch plan
  reason=` é **errata em par** (A7 item 2).
- **web**: o N4 não reabre o web (N4-D4); o que toca o web é a PR das frases (N4-D14), sob G-tok (a lista e a
  828) e G-back (se o `package.json` raiz ganhar `@octavia/core`, ver H-N4-15).

**O G-par** (N4-D19, novo):

- **Quem produz o texto visível de cada tipo** `[medido: a12-g-par.txt]`:
  - **web** — `ContentDisplay.tsx:22` `normalizeContentType(content.content_type)` (`types/content.ts:19-42`: aceita
    apelidos legados e **cai em `LYRICS`** no desconhecido) → `textoDaCifra` / `textoDaTab` / `textoDaLetra` /
    `textoDaNotacao` (`components/content/corpo-de-texto.ts:47-66`): cifra por `sections[]` ou `chords` (texto
    **ou lista** de `{name, diagram, fingering}`) + `progression`; tab por `tablature` (texto **ou lista**); letra
    por `lyrics`; partitura por `notation`; e o **segundo painel *Cifra*** (`textoDosAcordes`) na letra e na tab;
  - **nativo** — `bodyOf(type, data)` (`packages/core/src/content-contract.ts:77-83`): **uma chave string por
    tipo** (`CONTENT_DATA_KEY`, `:21-26`), tipo fora do enum exato = `unknown-type`.
- **Partem do mesmo `normalize`? Não.** Nem do mesmo leitor: **o web não importa nada do `packages/core`**
  (`git grep -nE '@octavia/core|packages/core' -- app components lib hooks` → só um comentário em
  `components/auth/frases-sessao.ts:4-5`).
- **Medido sobre fixture fabricada** `[medido: a12-g-par-fixture.txt]`: **6 de 13 iguais**. Diferem: cifra em
  `sections`, cifra em lista, cifra com `progression`, tab em lista, partitura com `notation`, tipo legado
  (`Guitar Tab`), tipo fora do enum (`Piano` — o web mostra como letra). Iguais: letra, cifra-texto, tab-texto, a
  letra poluída pelo editor, a só-aninhada (as duas `null`) — **div. 965**. **O G-par entra reprovando por
  construção** se a fixture tiver qualquer forma de fora do contrato do core.
- **Proposta de fixture** (fabricada, regra 10 não alcança): um content por tipo na forma do contrato
  (`lyrics`/`chords`/`tablature` string, `Sheet` com `file_url` PDF), um **poluído pelo editor** (a forma do
  `editor-put-antes.json`: `content_data` aninhado + `annotations: []`), e — conforme a Q4 — um por forma que só o
  web lê. O par é **(web) o texto do painel do tipo** × **(nativo) o texto do nó `corpo`** da tela de visualização,
  comparados byte a byte depois de uma normalização declarada (fim de linha).
- **Controle negativo** (o prompt diz "regra 7" — **não existe regra 7**, `LOGS-OCTAVIA.md` *"Não existem regras
  6, 7 e 8"*; o controle é a **regra 4**, *"um CN que passa é tão suspeito quanto um gate que nunca acusa"*) —
  **div. 972**: trocar um byte do corpo num lado só → o G-par reprova naquele item e só nele; e o gate imprime o
  **tamanho** do que comparou (*"n itens, k pares"*), não só o veredito.

### A13 — inventário por estado para o brief

Folha 4 (`DESIGN-I1/README-design.md:190`, 15 estados, `:213`) e folha 5 (`:215`, 15 seções, **13 válidas** —
a I1-E15 tirou `VIEW-carregando-arquivo` e `VIEW-erro-cache`, `README.md:608`) `[lido: DESIGN-I1]`, ao lado do
estado equivalente no nativo:

| estado do web | no nativo hoje | para o N4 |
|---|---|---|
| `DASH`, `DASH-vazio`, `DASH-vazio-favoritas`, `DASH-erro` | **não existe** (o nativo não tem painel) | fora do recorte, salvo a Q10 querer *"Favoritas"* como filtro |
| `SESSAO-nao-renovada` | existe com outro desenho: `auth-failure` → S0 (T1-R3) | herdado |
| `LIB` | **não existe**; o mais próximo é `S4a-resultados` (busca) | **novo** |
| `LIB-filtros` | **não existe** (a S4 não filtra) | **novo** — por tipo (N4-D5); dificuldade, ordem e *Só as favoritas*: Q10 |
| `LIB-mais` (abrir, editar, apagar) | não existe | **novo e menor**: *Visualizar* / *Tocar* (N4-D8); editar e apagar fora |
| `LIB-salvo` | — | fora (sem edição) |
| `LIB-carregando-chunk` | — (é do Next) | sem objeto |
| `LIB-carregando` | o análogo é S1a (*primeira sincronização*) | **novo** para a lista: sem cache e sincronizando |
| `LIB-vazio` | o análogo é S1f | **novo** |
| `LIB-vazio-busca` | existe: `S4b` | herdado da S4 |
| `LIB-erro` | os análogos são S1d (sem rede, sem cache) e S1e (falha com cache) | **novo** para a lista |
| `LIB-apagar` | — | fora |
| `VIEW-cifra`, `-letra`, `-tab`, `-partitura` | existem **no palco** (S3a/S3b/S3c/S3d) | **novo** como visualização (N4-D8: tela própria) |
| `VIEW-partitura-cheia` | o S3d é tela cheia | a decidir: a visualização abre o PDF ou manda ao palco (Q3, Q5) |
| `VIEW-carregando-pdf` | `fase: 'buscando'` no palco | novo na visualização |
| `VIEW-vazio-*` (4) | o placeholder `MOTIVO` do palco | novo na visualização |
| `VIEW-erro-formato` | **não existe** (o palco manda tudo ao PDF, div. 963) | **novo** se a Q13 declarar a imagem/docx |
| `VIEW-erro-pdf` | `download-error` → S3e com a frase (W2); `pdf-error` só no log | novo na visualização |
| `VIEW-erro-render` | — (o limite global) | a decidir |
| — | — | **novos sem par no web**: *não baixada* (o S3e por música, na lista e na visualização), *sem rede* (o chip; a lista funciona), *teto atingido* (inalcançável no nativo, div. 958), *favoritando…*, *favoritar falhou* (as espécies do N2: `rede`, `sem-resposta`, `auth`, `limite`, `servidor`, `generica`), *favoritar barrado* (sem rede: `write blocked reason=offline`), *favorita* × *não favorita* na linha |

### A14 — C-D7 sobre fixture

O "`normalize` do core" que o prompt cita **não lê content**: `packages/core/src/normalize.ts` é só
`normalizeForSearch` (NFD, sem diacríticos, minúsculas, espaço colapsado — a busca, T1-R21) — **div. 956**. O que
o core faz com cada tipo é o **contrato de leitura** (`content-contract.ts`). Sobre fixture fabricada
`[medido: a14-contrato-fixture.txt]`; os 15 casos do `content-contract.test.ts` e os 4 do `normalize.test.ts`
passam nesta árvore (19/19, `npx vitest run` da raiz):

| fixture | `isValidContent` | `bodyOf` |
|---|---|---|
| Letra / Cifra / Tab, chave string | `{ok, body:'text'}` | a string |
| Partitura com `file_url` | `{ok, body:'file'}` | `null` |
| Partitura sem `file_url` (com `content_data`) | `no-body` | `null` |
| Cifra `null` + `file_url` (escaneada) | `{ok, body:'file'}` | `null` |
| Cifra objeto **sem** `chords` + `file_url` | `no-key` (a regra (c) é literal) | `null` |
| Letra `null` + `file_url` | `no-body` | `null` |
| Tab com `tablature` objeto | `not-string` | `null` |
| **poluída pelo editor** (`lyrics` no topo + `content_data` aninhado + `annotations`) | `{ok, body:'text'}` — a regra (a) ignora o resto | a string **do topo** |
| **só aninhada** (sem `lyrics` no topo) | `no-key` | `null` |
| tipo fora do enum (`Piano`) e em minúsculas (`lyrics`) | `unknown-type` | `null` |

**C-D7 como está** (`PRD-TELA-1.md` §4 e `N2-ENCERRAMENTO.md` §10.2 item 6, *"Zod por tipo; modelo de
anotação"*): o **Zod por tipo na escrita já existe** no web — `refineContentData` (`lib/api-schemas.ts:169-177`)
sobre `lib/content-data-contract.ts`, que exige `lyrics`/`chords`/`tablature` string para o tipo — `[lido:
a4-cadastro.txt]`; o **modelo de anotação** não existe (`annotations` segue não-contrato). A medição sobre o
dado real é a **B2**.

### A15 — o aparato

`[medido: a15-capturas.txt]` — o que o brief precisaria e o que já está commitado:

| superfície | C (paisagem) | B (tablet em pé, composição do N3) | A (celular) |
|---|---|---|---|
| S1 (onde entra a entrada) | PNG + dump: `B5-baseline/` (4 estados × 2 aparelhos) | **só dump**: `N3-PR6-anexos/dumps-ret/` (`N3P6-S1-*`, 6 estados); PNG não | `B4/` (53 PNG + dump, **com os tokens de B**, antes do N3 — não é composição de A) |
| S4 (a busca, o parente da lista) | PNG + dump: `B5-baseline/` (`S4-resultados`, `-vazio`) | só dump: `N3P6-S4-*` | `B4/` |
| palco (S3a–e, título longo, placeholder) | PNG + dump: `B3-referencia-paisagem/` (18) | só dump: `N3P6-S3-*` | `B4/` |
| palco **avulso** | **nenhuma** captura | nenhuma | nenhuma |
| picker | PNG + dump: `B5-baseline/` | só dump: `N3P6-picker-*` (13 estados) | `B4/` |

- **Os PNG de B que existem são da composição VELHA**: `N3-PRECHECK-anexos/B2/` (52 PNG, retrato **antes** da
  N3-PR2). Das PRs do N3 só a 6b (16 PNG) e a 6c (8 PNG) commitaram imagem — o resto (PR-2…PR-6) é dump puro
  (68, 96, 102, 97, 234 XML; 0 PNG). **Para o brief mostrar B como ele é hoje, faltam capturas de B.**
- **Nenhuma captura do palco avulso** em faixa nenhuma.
- As molduras do web (`DESIGN-I1` folhas 4 e 5) estão commitadas e servem como **referência de estados**, não de
  composição (o web não é o tablet).
- As capturas novas saem do **mock** (`aceite.py`), nos dois aparelhos, pela receita do `APARATO.md` (o cache do
  Tab guardado arquivo a arquivo; o AVD em avião no repouso) — e com o PNG **recortado** onde houver corpo de
  música que não seja fixture do projeto (regra 10).

---

## 2. Hipóteses H-N4

Toda premissa do prompt e do recorte, com veredito.

| id | hipótese | veredito | evidência |
|---|---|---|---|
| H-N4-1 | o nativo lê content por `GET /api/content` e guarda localmente | **confirmada** — e guarda **tudo**, paginado até o fim | A1; `sync.ts:28-47`, `store.ts:147` |
| H-N4-2 | existe um `normalize` de content no core, que C-D7 e o G-par usam | **falsa** — `normalize.ts` é só busca; o leitor é o `content-contract.ts` | A14; div. 956 |
| H-N4-3 | os quatro tipos abrem no palco | **confirmada** na forma do contrato (Letra, Cifra-texto, Tab, Partitura PDF, Cifra escaneada PDF); **não medida** para partitura em imagem e importados de `.docx`/`.txt` (provável `pdf-error`) | A2; div. 963 |
| ↳ H-N4-3, *errata do commit 2* | na conta principal | **confirmada no dado real**: B4 — 1 arquivo, `.pdf`; nenhuma imagem, `.docx` ou `.txt` (a hipótese sobre imagem segue não medida, sem objeto na principal) | §11 B4 |
| H-N4-4 | o palco abre com uma fila de uma música que não vem de setlist | **falsa** — o avulso existe, mas exige setlist hospedeira (`lista[0]` quando vem de S1) | A3; div. 964 |
| H-N4-5 | o favoritar é possível sem mudar backend nem passar pelo corpo do editor | **confirmada** — `PUT /api/content` com `{id, is_favorite}`, update por campo; mesma rota do editor (div. 969) | A5 |
| H-N4-6 | o corpo do favoritar é valor absoluto | **confirmada** — a negação é calculada no cliente | A5 |
| H-N4-7 | o teto de 100 limita a lista do nativo | **falsa** — o nativo pagina até `hasMore=false` | A6; div. 958 |
| H-N4-8 | o `GET /api/content` informa o total | **confirmada** — `total`, `hasMore`, `totalPages` | A6 |
| H-N4-9 | existe um "teto de download" | **falsa** — saiu no W1; existe o teto de **retenção** (200 MB) | A7; div. 959 |
| H-N4-10 | a biblioteca inteira cabe no teto | **não medida** — `[lido]` 265.002 B no repertório da **audit** (N0-H16); a principal é a B3 | A7; §6 |
| ↳ H-N4-10, *errata do commit 2* | — | **confirmada**: B3 — 1 arquivo, 138.916 B = **0,066 %** do `CAP_BYTES` (209.715.200 B); 0 `HEAD` | §11 B3 |
| H-N4-11 | o corpo fora de setlist precisa de download para ser offline | **falsa** para texto (o `content.json` tem todos); **verdadeira** só para arquivos | A7; div. 960 |
| H-N4-12 | o web e o nativo partem do mesmo leitor de corpo | **falsa** — 6 de 13 iguais sobre fixture; o web não importa o core | A12; div. 965 |
| ↳ H-N4-12, *errata do commit 2* | — | **falsa também no dado real, em 2 de 63**: B2 — 61 iguais; 2 Cifras com `sections[]` diferem; nenhum item com um lado vazio e o outro com texto | §11 B2 |
| H-N4-13 | o nativo usa travessão ou vírgula no motivo | **falsa na forma** — motivo com travessão por dentro; composição com `·` | A9; div. 961 |
| H-N4-14 | são três `undefined` | **confirmada** como três chaves; **duas** literais (A = B por referência) | A11; div. 962 |
| H-N4-15 | o web pode importar um módulo do core | **não medida** — hoje o web não importa nada do core; o `package.json` raiz só ganhou `@octavia/identidade` (`I1-ENCERRAMENTO.md` §1). Custo (dependência de workspace, `tsconfig`, G-back) é da PR-2 | A12 |
| ↳ H-N4-15, *errata do commit 2* | — | **confirmada, com custo medido**: L3 — `pnpm build` passa, 27 rotas, +2 kB em 3 rotas, `package.json` +1 e lockfile +3, nenhum arquivo do núcleo do G-back; e a frase que vai ao core **sai do G-tok** (446 → 445, div. 977) | §10 L3 |
| H-N4-16 | o `is_favorite` chega ao aparelho | **não medida** — lido: o servidor manda (`select('*')`, `route.ts:67`), o sync grava o item sem mapear, o snapshot da audit tem `is_favorite` em 66/66; no aparelho, B1 | A1; A5 |
| ↳ H-N4-16, *errata do commit 2* | — | **confirmada**: B1 — `is_favorite` presente em 63 de 63 no `content.json` do Tab; 1 `true` | §11 B1 |
| H-N4-17 | a `LinhaDeAviso` tem contrato comum possível | **confirmada em parte** — nome, `motivo` e ação comuns; espécies: o web tem 4 por `tipo`, o nativo 0 (ícone + cor livres) | A10 |
| H-N4-18 | busca e filtro por tipo são novos | **meio falsa** — a busca na biblioteca inteira existe (S4, local, offline); o filtro não | A1; A8 |
| H-N4-19 | a visualização do web mostra campos que o palco não mostra | **confirmada** — 11 campos (A4), três deles não salvos de verdade | A4 |
| H-N4-20 | os gates estão verdes na `main` | **confirmada** — nativos e web, todos exit 0 | A12 |
| H-N4-21 | as capturas commitadas servem ao brief | **em parte** — C sim; B atual só em dump; o avulso em nenhuma | A15 |
| H-N4-22 | C-D7 (Zod por tipo; anotação) está em aberto | **meio falsa** — o Zod de escrita por tipo existe (`refineContentData`); o modelo de anotação não | A14 |
| H-N4-23 | S1 continua a tela inicial e a entrada nova só toca a barra | **confirmada** — 8 dumps de C mudam (A8) | A8 |

---

## 3. O que o N4 herda, item por item

### 3.1 `I1-ENCERRAMENTO.md` §10.2 (N4-D2)

| # | item | onde se paga no N4 |
|---|---|---|
| 1 | frases unificadas web × nativo | **PR-2**, só o vocabulário de content (N4-D14); o resto com destino no encerramento |
| 2 | a harmonização do motivo (travessão × vírgula) | **PR-2** (o core) e a PR própria do web, se cair lá (N4-D15) — depende da **Q8** (div. 961) |
| 3 | a `LinhaDeAviso` como contrato do core | **PR-2** (o contrato) + as telas que trocam `icone`/`cor` por espécie (**Q11**) |
| 4 | os três `undefined` do `TokensDaFaixa` | **congelamento do desenho** (N4-D17); a implementação na PR da tela que usar a folha/reordenar em A (se nenhuma, segue herança, nomeada no encerramento) |

### 3.2 `N3-ENCERRAMENTO.md` §10.6

| item | onde se paga |
|---|---|
| **nasce adaptativo** — as telas de content desenhadas nas três faixas desde a folha, tokens por faixa (N3-D28), regra única da folha | brief e desenho (N4-D12, N4-D18); PR-4/PR-5 implementam C e B; A "não quebra" com a lista do N5 |
| *"o que o N2 deixou para o content segue no `N2-ENCERRAMENTO.md` §10.2 (itens 1–6, destino N4…)"* | **mudou pela errata desta PR** (§3.3): 1–5 vão ao Bloco D; o §10.6 do N3 e o §10.7 dele (*"1–6 (N4)"*) não se reescrevem (div. 971) |

### 3.3 `N2-ENCERRAMENTO.md` §10.2, depois da errata (N4-D7)

**Escrita nesta PR**, no topo da `### 10.2 N3 (content nos apps)`, abaixo da errata do N3, no molde dela — sem
reescrever os itens nem o título.

| # | item | destino depois da errata |
|---|---|---|
| 1 | B9 na frente | **Bloco D** |
| 2 | `DELETE /api/content/[id]` 200 para inexistente | **Bloco D** |
| 3 | B5-D6: cascata content × storage e órfãos | **Bloco D** |
| 4 | B1.5 | **Bloco D** |
| 5 | B10: referrer da API key | **Bloco D** |
| 6 | C-D7 (Zod por tipo; modelo de anotação) | **N4, só medição**: A14 (fixture) e **B2** (dado real); o Zod de escrita já existe (H-N4-22), o modelo de anotação não é do N4 |

### 3.4 O que mais toca o N4 sem ser dele

- **`I1-ENCERRAMENTO.md` §10.1 item 7** (o teto de 100 × o pedido de 1000) é do **picker do web** — Bloco D, não
  N4 (div. 957). **Item 12** (favoritar mudo na lista do web) — Bloco D; o N4 não o conserta (N4-D4), mas o
  favoritar do nativo **não pode** nascer mudo (as espécies do N2, A13).
- **`N3-ENCERRAMENTO.md` §10.1 item 13** (quebra de linha na letra) — bloco próprio entre o N4 e o N5 (N4-D13): a
  visualização e o palco do N4 **não quebram linha**.

---

## 4. Divergências desta PR — 956 a 973

Origem: **P** premissa do prompt · **D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros (`N1-ENCERRAMENTO.md` §7).

| div. | origem | o quê | destino |
|---|---|---|---|
| **956** | P | *"o que o `normalize` do core faz com cada tipo"* (A14, A12) — `packages/core/src/normalize.ts` é só `normalizeForSearch` (a busca, T1-R21); o leitor de content é `content-contract.ts` (`isValidContent`/`bodyOf`) | o documento mede o contrato; C-D7 e o G-par se escrevem sobre ele |
| **957** | P | *"o que o picker do nativo pede hoje e o que recebe"* — o picker do nativo **não pede nada**: lê o cache (`Picker.tsx:155-156`); o "pedido de 1000" do `I1-ENCERRAMENTO.md` §10.1 item 7 é do **picker do web** (`hooks/use-setlist-data.ts:70-77`) | registrado em A6; a herança fica no Bloco D |
| **958** | P | N4-D10 — *"a lista mostra o que veio e uma linha de aviso quando o total passar do recebido"*: no nativo **o teto de 100 não limita** — o sync pede `pageSize=100` e pagina até `hasMore=false` (`sync.ts:28-47`); a lista lê o cache, que tem a biblioteca inteira; a linha de aviso seria **inalcançável** | **Q7** |
| **959** | P | N4-D9 — *"o teto de download"*: não existe desde o W1 (`files.ts:247-295`, div. 126); existe o teto de **retenção** `CAP_BYTES` = 200 MB (`prefetch.ts:34`) e o LRU | lido como o `CAP_BYTES`; **Q6** |
| **960** | P | N4-D9 — *"corpo só do que está em setlist garantida"*: o **corpo de texto de toda a biblioteca já está no aparelho** (`content.json` com o `content_data` de todos, `store.ts:147`); o offline em jogo é só o dos **arquivos** (Partitura e Cifra escaneada) | **Q6** |
| **961** | P | N4-D15 — *"vence a forma que o nativo já usa"* (travessão × vírgula): o nativo **não tem a forma composta** `"não foi possível … — {motivo}"`; o motivo isolado leva o travessão por dentro (`frases.ts:226,229,234,237`) e a composição junta orações com `'  ·  '` (`IndexScreen.tsx:587`, `ModoDeReordenar.tsx:511`) | **Q8** |
| **962** | D | `I1-ENCERRAMENTO.md` §10.2 item 4 lista **três** `undefined`; são três **chaves** e **duas** literais (`tokens.ts:350`, `:372`) — `faixas.A` é `faixaB` por referência (`:385`), e decidir o de B decide o de A | registrado em A11; o congelamento decide as duas literais (N4-D17) |
| **963** | A | **partitura em imagem** (`.png`/`.jpg`, aceitas no upload, `frases-upload.ts:107`) e **Letra/Cifra importadas de `.docx`/`.txt`** (só `file_url`, div. 823): o palco manda todo arquivo ao `react-native-pdf`, sem ramo de imagem `[hipótese de leitura, não medida no aparelho]` | **B2/B4** contam; **Q13** |
| **964** | A | o **palco avulso aberto de S1** usa `dados.lista[0]` como hospedeira (`navigation.tsx:271-275`): a barra mostra o nome de uma setlist alheia (`StageScreen.tsx:551`, `:561`), o `prefetchDemanda` roda sobre ela (`:394`), e com zero setlists cai no placeholder *"SETLIST não está no cache"* (`navigation.tsx:183-186`) — defeito do produto **presumido por leitura**, não medido no aparelho | declarado, **não consertado**; **Q9** (PR-5) |
| **965** | A | o web e o nativo **não leem o corpo do mesmo jeito**: sobre fixture fabricada, **6 de 13 iguais** (`a12-g-par-fixture.txt`) — `sections`, acordes em lista, `progression`, tab em lista, `notation`, tipo legado, tipo fora do enum (o web cai em letra) | **Q4**; a contagem real é a **B2** |
| **966** | A | o **corpo do favoritar da lista** (`{id,is_favorite}`) não está sob gate nenhum — o `i1-editor-put.test.tsx` prova só o corpo do editor; e o `PUT` bumpa o `updated_at` (`route.ts:283`) | **PR-1** (proposta de gate do corpo do nativo, byte a byte, como os do I1) |
| **967** | P | N4-D5 lista *"abrir uma música avulsa no palco"* como entrada nova — o **palco avulso existe desde a N1** (T1-R22, `navigation.tsx:27-32`); o que não existe é o palco **sem hospedeira** (A3) | registrado; Q9 |
| **968** | P | N4-D5 lista *"lista de content (busca, …)"* — a **busca na biblioteca inteira existe** (S4, `SearchScreen.tsx:1-16`: local, offline, chip de tipo, abrir avulso); o que não existe é a **lista** e o **filtro** | registrado; **Q12** (a entrada nova × `Buscar música`) |
| **969** | P | A5 separa *"o `PUT` do editor"* de um caminho que grave só o favorito — no código são **a mesma rota** (`PUT /api/content`) e o **mesmo schema** (`contentSchemas.update`), com update por campo; o favoritar parcial não passa pelo **corpo** do editor nem muda backend | não parei no A5 (não é nenhum dos dois casos de parada); a escolha é a **Q1** |
| **970** | T | `npx vitest run src/content-contract.test.ts` **dentro de `packages/core`** dá *"2 failed, no tests"* — a configuração de projetos do Vitest vive na raiz; da raiz, `npx vitest run packages/core/src/…` dá **19 passed** | registrado (o comando certo no anexo A14) |
| **971** | D | a errata desta PR no `N2-ENCERRAMENTO.md` §10.2 muda o destino dos itens 1–5; o `N3-ENCERRAMENTO.md` §10.6 e §10.7 seguem dizendo *"itens 1–6, destino N4"* e *"1–6 (N4)"* — o prompt restringe esta PR ao `N4-PRECHECK*` e ao §10.2 do N2 | **não tocados**; a errata do N2 é a fonte (a regra do índice: onde a prosa diverge, vale a fonte). Se o Marcel quiser a nota no N3, é uma linha no commit 2 |
| **972** | P | A12 — *"controle negativo (regra 7)"*: **não existe regra 7** (`LOGS-OCTAVIA.md`: *"Não existem regras 6, 7 e 8"*, div. 335); o controle negativo é a **regra 4** | o G-par se propõe com a regra 4 (A12) |
| **973** | P | A4 — *"salvo de verdade? (I1 §10.1.2)"*: o `I1-ENCERRAMENTO.md` não tem seção `10.1.2`; é a **linha 2 da tabela** da `### 10.1 Bloco D` (`:503`). A numeração "§10.<bloco>.<n>" do próprio documento a autoriza; registrado porque o `grep` do cabeçalho não acha | citado como "§10.1 item 2" |

**Contagem**: 18 — P 11 · A 4 · D 2 · T 1 · X 0.

---

## 5. Perguntas para o aval

Cada uma com as opções e a recomendação. Nenhuma está decidida.

**Q1 — o caminho do favoritar** (A5, divs. 966, 969).
- **(a) `PUT /api/content` com `{"id","is_favorite"}`**, o corpo exato da lista do web — rota, schema e limite
  existentes, update por campo, **sem mudar backend**; um gate byte a byte do corpo do nativo na PR-1 (o molde do
  `i1-editor-put.test.tsx`); a releitura é a do item (o `PUT` devolve a linha) ou um sync. **Recomendada.**
- (b) uma rota dedicada (`PATCH /api/content/[id]/favorite` ou similar) — é **Bloco D** (N4-D4); o N4 esperaria.
- (c) favoritar fora do N4 — contra a N4-D21.

**Q2 — o favoritar sem rede.**
- **(a) só online, como as escritas do N2** (N2-D2): sem rede o controle fica inerte com o motivo (`write blocked
  reason=offline`), e a falha é uma espécie do conjunto do N2 (`rede`, `sem-resposta`, `auth`, `limite`,
  `servidor`, `generica`). **Recomendada** — uma fila offline seria a primeira do app e reabre a N2-D2.
- (b) fila local, aplicada no próximo sync — exige estado de conflito (o web pode ter mudado) e uma linha de log
  nova.

**Q3 — o corpo da música na visualização usa o mesmo renderizador do palco?**
- **(a) sim**: o mesmo `bodyOf` e o mesmo texto mono (sem os controles de palco, sem bordas, sem auto-scroll), o
  PDF pelo mesmo `react-native-pdf` — um leitor só no nativo, e o G-par compara um nó só. **Recomendada.**
- (b) um leitor próprio da visualização, como o web (várias formas, 2º painel *Cifra*) — dois leitores no
  nativo; depende da Q4.

**Q4 — qual leitor de corpo vale para o G-par** (div. 965).
- **(a) o contrato do core** (`bodyOf`, uma chave por tipo): o G-par compara onde os dois deveriam concordar; as
  formas que só o web lê ficam **declaradas** como herança (Bloco D / C-D7) **se a B2 achar alguma** no dado real;
  se a B2 achar zero, o custo é nulo. **Recomendada, condicionada à B2.**
- (b) o core aprende as formas do web (`sections`, listas, `progression`, `notation`) — muda o contrato de
  leitura (errata do T1-R7) e o palco passa a mostrar mais.
- (c) o web passa a ler pelo core — reabre o web (contra a N4-D4).

**Q5 — a visualização também leva ao palco?**
- **(a) sim**: um controle *Tocar* que abre o palco avulso (o mesmo da lista). **Recomendada** — é o caminho
  natural de "conferir e tocar", e o avulso é uma tela só.
- (b) não: da visualização só se volta.

**Q6 — qual opção da N4-D9 a leitura do código sustenta** (divs. 959, 960).
- O **texto** de toda a biblioteca já é offline (A7). A pergunta da D9 é só sobre **arquivos**.
- **(a) decidir depois da B3**, com o número: se a soma dos arquivos da principal ficar **bem abaixo** do
  `CAP_BYTES` (a audit tinha 265.002 B), garantir todos (A7 itens 1–4: conjunto garantido, plano com razão nova e
  errata em par do G3, LRU protegendo tudo, estado por música); se não, a segunda opção da D9 **só para
  arquivos** — o estado "não baixada" vale para Partitura e Cifra escaneada, nunca para texto. **Recomendada.**
- (b) a segunda opção da D9 já, sem medir — o estado "não baixada" é desenhado de qualquer jeito (A13) e o
  prefetch não muda.

**Q7 — a N4-D10 com a div. 958.**
- **(a) a linha de aviso do teto sai do recorte do nativo** — inalcançável (o nativo pagina); a herança D do teto
  segue sendo do picker do web. **Recomendada.**
- (b) a linha fica desenhada e **inalcançável**, como o estado de limite que S1 não tem (div. 413 do N3) — custa
  uma moldura sem aceite.
- (c) o nativo passa a pedir só a página 1 — regressão da T1-R9.

**Q8 — a forma do motivo** (div. 961).
- **(a) o vocabulário de content do core leva o motivo isolado** (com o travessão por dentro, como o nativo) e
  **cada lado compõe** do seu jeito — o nativo com `'  ·  '`, o web com o que a folha dele manda; **a troca no
  web não acontece no N4**. **Recomendada** — é o que o nativo "já usa" de verdade.
- (b) a composição do nativo (`·`) vira a forma do web — PR própria do web (N4-D15), toca as PR-9…13.
- (c) a vírgula da PR-11 vira a forma — o nativo muda as orações dele.

**Q9 — o palco sem setlist** (div. 964, A3).
- **(a) o avulso deixa de ter hospedeira quando vem da lista, da visualização ou de S1**: `setlistId` opcional,
  `setlist: SetlistDTO | null`, a barra sem nome de setlist, sem `prefetchDemanda` no avulso — os arquivos em
  arquivo:linha no A3; o avulso **do palco** (pela busca dentro de uma setlist) continua como está, voltando à
  posição. **Recomendada** — conserta os três sintomas e não toca o palco com setlist (o G-inv da
  `B3-referencia-paisagem/` fica intacto).
- (b) manter a hospedeira `lista[0]` e só esconder o nome — o prefetch alheio e o placeholder com zero setlists
  ficam.

**Q10 — o que entra no brief.** Proposta no §7. Em particular: (i) **quais campos** a visualização mostra —
os 11 da A4, ou só os **salvos de verdade** (sem compasso, capo, afinação — div. 771/820)? **Recomendada: os
salvos de verdade**, os outros declarados como herança D; (ii) os filtros além de **tipo** (N4-D5): *Só as
favoritas* (o favoritar existe — **recomendado sim**), dificuldade e ordem (**recomendado não**, fora do recorte).

**Q11 — o fatiamento da N4-D20.**
- **(a) mantém**, com três ajustes: (1) **a PR-1 de gates** entra com o G-par **e** o gate do corpo do favoritar
  (div. 966); (2) **a PR-2** é só core (frases de content e o contrato da `LinhaDeAviso`); **a troca do
  `icone`/`cor` por espécie nas quatro telas** vai na PR-6 (estados transversais), que já toca as telas; (3) **as
  capturas de B e do avulso** (A15) entram na PR do brief, no molde do `N2-BRIEF-anexos/`. **Recomendada.**
- (b) a PR-5 (visualização e palco avulso) se parte em duas — o palco avulso sem hospedeira primeiro, porque é
  palco (a área que o G-inv guarda) e é independente da visualização.

**Q12 — a entrada nova × `Buscar música`** (div. 968).
- **(a) a entrada da biblioteca convive** com `Buscar música`: a biblioteca é a lista com filtro; a busca é a S4,
  que já existe e funciona offline — decisão do desenho, com a restrição da N4-D11. **Recomendada para o brief
  perguntar ao desenho.**
- (b) a biblioteca **absorve** a busca (o campo de busca dentro da lista) e `Buscar música` passa a abrir a
  biblioteca — muda o S4 e o G-inv dele (4 dumps).

**Q13 — partitura em imagem e importados de `.docx`/`.txt`** (div. 963).
- **(a) decidir depois da B2/B4**: se o dado real tiver algum, o N4 declara um estado *"formato que o app ainda não
  mostra"* (o par do `VIEW-erro-formato`) no palco e na visualização, sem ramo de imagem; se tiver zero, fica
  como herança nomeada. **Recomendada.**
- (b) ramo de imagem no palco já (o `Image` do RN) — tela nova no palco, fora da N4-D6 como está.

**Q14 — a Fase B** (§6): aprovar os probes, quem roda cada um, e a autorização do `.env.uxaudit`.

---

## 6. Orçamento da Fase B

**Nada aqui rodou.** Cada probe com o que mede, contra o quê, quantas requests, em qual conta, se lê ou escreve, e
o que desfaz. Os números de request são pisos calculados do código (A1, A6).

| probe | o que mede | contra o quê | requests | conta | lê/escreve | quem roda | o que desfaz / o que fica |
|---|---|---|---|---|---|---|---|
| **B1** — a biblioteca da principal | contagem de content por tipo, total, bytes do `content.json`, `is_favorite` presente e quantos `true` (H-N4-16) | o **cache do Tab S6** depois de **um sync de leitura** com rede | 1 `GET /api/setlists` + ⌈N/100⌉ `GET /api/content` (o sync normal do app; N ≈ 63 no N1 → 2) | **principal** | lê (o sync grava só o cache local, como todo uso) | o executor, com o Marcel destravando o Tab (`APARATO.md`, repouso do Tab) | o cache do Tab é o do uso real — **não se restaura**; declara-se o antes (md5 dos quatro arquivos, a receita do `APARATO.md`) e o depois; **nenhum corpo sai do aparelho para o repositório**: o `content.json` é lido em memória no host e apagado no fim (regra 10) |
| **B2** — os inválidos e as formas | `isValidContent` por item (motivo × tipo); as **formas** do `content_data` (conjuntos de chaves, tipo de `tablature`/`chords`, `sections`, `progression`, `notation`); o **G-par** web × core sobre o dado real (iguais / diferentes por forma) | o `content.json` do B1, no host | **0** | principal | lê | executor | anexo só com **contagens e nomes de chave** — nenhum texto |
| **B3** — o tamanho dos arquivos | soma e maior arquivo dos `file_url` distintos com `body === 'file'`, contra o `CAP_BYTES` (Q6) | os **já baixados**: `files-index.json` do Tab (0 request); os **não baixados**: `HEAD` no Storage público (`Content-Length`) | **0** a `/api/*`; **k** `HEAD` ao Supabase Storage (X), k = arquivos distintos não baixados | principal | lê | executor | nada a desfazer; os nomes de objeto **não** vão ao anexo (só tamanho e extensão) |
| **B4** — os formatos | extensão de cada `file_url` (`.pdf`/`.png`/`.jpg`/`.docx`/`.txt`) × tipo (Q13, div. 963) | o `content.json` do B1 | **0** | principal | lê | executor | — |
| **B5** — favoritar e desfavoritar | o corpo, o status, a resposta (a linha inteira?), o `updated_at` bumpado, a releitura pelo `GET`, e o 429 **não** (2 de 120) | `PUT /api/content` em prod, num content **descartável** criado pelo Marcel no web (*"DESCARTÁVEL N4"*), regra 12 | **2 `PUT`** (`true`, depois `false`) + **2 `GET /api/content/[id]`** (releitura) + login | **audit** | **escreve (2)** | o Marcel, por script dele com o `.env.uxaudit` — **ou** o executor, se o Marcel autorizar o `.env.uxaudit` (não aberto até aqui) | o `is_favorite` volta ao inicial; o `updated_at` **não volta** (declarado); o descartável é apagado pelo Marcel no web no fim (o destino é dele, como a `DESCARTÁVEL N2`) |
| **B6** (opcional) — a biblioteca da audit | o mesmo do B1/B2 na conta de audit, para a fixture do mock refletir as formas reais | o AVD (em repouso: audit, em avião) — um sync de leitura **saindo do avião** pela regra 11 | 1 + ⌈N/100⌉ `GET` (N ≈ 66 → 2) | audit | lê | executor | avião lido, declarado e restaurado (regra 11); o snapshot do AVD **não** se regrava (`-no-snapshot-save`) |

**Total**: leitura **≈ 6–8** requests a `/api/*` (B1 + B6) mais **k** `HEAD` ao Storage; escrita **2** (B5), na
audit, desfeita salvo o `updated_at`. **Zero** contas criadas. `.env.uxaudit` **só com autorização do Marcel**
(B5). **Recomendação**: B1–B4 primeiro (decidem Q4, Q6, Q13 sem escrever nada), B5 depois do aval da Q1.

---

## 7. Proposta de conteúdo do brief do Claude Design

**Proposta, não o brief** — o brief é a PR seguinte (N4-D18), e o que ele leva depende do aval.

**Superfícies**

1. **L — a biblioteca**: a lista de content (título, artista, tipo, favorita, *não baixada*), a busca, o filtro
   por tipo (e *Só as favoritas*, Q10), o favoritar na linha, e as duas ações por item: **Visualizar** e **Tocar**
   (N4-D8). Referência de estados: folha 4 do `DESIGN-I1` (`LIB`, `-filtros`, `-carregando`, `-vazio`,
   `-vazio-busca`, `-erro`) e a S4 do nativo.
2. **V — a visualização**: o cabeçalho (título · artista · tipo), os campos da A4 (Q10), as notas do content, o
   corpo pelo leitor do palco (Q3), o favoritar, e **Tocar** (Q5). Referência: folha 5 do `DESIGN-I1` (os 13).
3. **A entrada em S1**: um controle novo na barra de 120 (C) e de 144 (B); a composição de S1 em C não muda fora
   ele (N4-D11) — e a relação com `Buscar música` (Q12).
4. **O palco avulso sem hospedeira**: a barra (`AVULSA`, título · artista · tipo, sem nome de setlist), em C e B
   (Q9).

**Faixas**: C (1138 × 627), B (711 × 1054) e A (411 × 874) — a folha desenha as três; o N4 implementa C e B (N4-D12),
com os canvas do `APARATO.md` e a regra única da folha (*"quando não cabe, a composição empilha; o conteúdo não
sai"*). Os tokens novos **por faixa**, no pacote (N4-D3), com os três `undefined` decididos (N4-D17, A11).

**Estados** (a regra 17: "passa" sem estados não é passa) — por superfície, os da A13: o base; sincronizando sem
cache; vazia; vazio de busca; filtro sem resultado; sem rede (a lista funciona; o favoritar fica inerte com o
motivo); falha de sync com e sem cache; *não baixada* (por música, só arquivo); favoritando; favoritar falhou (as
espécies); título longo, artista ausente, tipo desconhecido, item inválido (os motivos do contrato); N grande
(a biblioteca da principal, B1); e, na visualização, os vazios por tipo, o PDF carregando, o PDF com erro, e o
formato que o app ainda não mostra (Q13).

**Anexos do brief**

- capturas **novas** do mock, C e B, nos dois aparelhos, PNG + dump: S1 (os 4 estados da base), S4 (resultados,
  vazio, sem rede), o palco avulso, o picker (para a régua de linha) — A15;
- as folhas 4 e 5 do `DESIGN-I1` como referência de estados (com o aviso: o web não é o tablet);
- a tabela de campos da A4 (com a coluna "salvo de verdade?");
- o vocabulário de content da A9 (o que já existe nos dois lados, para o designer não inventar frase — N2-D23,
  N3-D17);
- as medidas da Fase B que afetam desenho: N (quantos content), o maior título, quantos sem artista, quantos
  arquivos não baixados;
- `MEDIDAS.md` no molde do `N2-BRIEF-anexos/` — os canvas e as alturas de barra por faixa (tokens).

---

## 8. Contabilidade desta PR

| | |
|---|---|
| requests a prod / a terceiros | **0** / **0** |
| `adb` · aparelho | **0** |
| `.env*` abertos | **0** (a árvore só tem `.env.example`) |
| logins | **0** |
| escritas | **0** |
| agentes de leitura | **3**, só leitura, em paralelo (web: favoritar e `GET`; cadastro e folhas; frases, `LinhaDeAviso`, tokens e leitores) — cada citação conferida pelo executor nos anexos |
| scripts | 3 `tsx` temporários na raiz (A9, A12/G-par, A14), **apagados** depois de rodar; o texto de cada um está verbatim no anexo que ele produziu |
| testes rodados | `npx vitest run packages/core/src/content-contract.test.ts packages/core/src/normalize.test.ts` → **19 passed** |
| gates rodados | os da A12, todos exit 0 |
| arquivos | `docs/native/N4-PRECHECK.md` (novo), `docs/native/N4-PRECHECK-anexos/` (novos), `docs/native/N2-ENCERRAMENTO.md` §10.2 (a errata da N4-D7) |
| código | nenhum |
| APK | nenhum: a PR não toca caminho do `native.yml` |

O bloco ```` ```gates ```` e o ```` ```gates-web ```` desta PR, verbatim (a cópia que a regra do W4-b2 pede mora no
[`README.md`](N4-PRECHECK-anexos/README.md) dos anexos).

---

# Commit 2 — o aval e a Fase B

**Este commit** (só docs) registra o aval do Marcel `[2026-10-01]`, quatro leituras (L1–L3 antes da Fase B; a L4
depois da parada da B2, pedida no aval seguinte) e a Fase B (B1–B5; a B6 dispensada). O texto do commit 1 não foi
reescrito: as decisões que mudaram ganharam linha de errata no `## 0` (↳), e as hipóteses que mudaram de veredito,
linha de errata no `## 2`. Divergências **974–982** (§13). Nenhum texto de música, título, artista ou nome de
objeto do Storage vai a anexo: dos dados reais só saem contagens, nomes de chave, extensões, tamanhos em bytes e
comprimentos em caracteres.

---

## 9. O aval — N4-D22…D39

`[Marcel, 2026-10-01]`. As N4-D22…D37 vieram com o prompt do commit 2; a N4-D38 com a resposta à parada da B2; a
N4-D39 com a resposta às leituras.

| # | decisão |
|---|---|
| **N4-D22** | (Q1) Favoritar pelo `PUT /api/content` com `{"id","is_favorite"}`, sem mudar backend. O gate byte a byte do corpo do nativo entra na PR-1. |
| **N4-D23** | (Q2) Favoritar só online, como as escritas do N2. |
| **N4-D24** | (Q3) O corpo da música na visualização usa o mesmo leitor do palco. |
| **N4-D25** | (Q4) O leitor que vale para o G-par se decide depois da B2. A opção (c), o web ler pelo core, está descartada. *(Reescrita com os números: §12 Q4.)* |
| **N4-D26** | (Q5) A visualização leva ao palco por um controle *Tocar*. |
| **N4-D27** | (Q6) Decide-se depois da B3. **Errata da N4-D9**: o texto de toda a biblioteca já é offline; a garantia e o estado "não baixada" dizem respeito só a arquivos. *(§12 Q6.)* |
| **N4-D28** | (Q7) **Errata da N4-D10**: a linha de aviso do teto sai do recorte do nativo. |
| **N4-D29** | (Q8) O core guarda o motivo isolado e cada lado compõe do seu jeito; nenhuma troca de texto no web no N4. **Errata da N4-D15.** O item 2 do `I1-ENCERRAMENTO.md` §10.2 (as duas formas do motivo dentro do web) muda de destino para o bloco seguinte ao I1. *(A nota está lá, e o item novo no §10.5 de lá.)* |
| **N4-D30** | (Q9) O palco avulso deixa de ter setlist hospedeira quando vem da lista, da visualização ou de S1; o avulso aberto pela busca dentro de uma setlist fica como está. |
| **N4-D31** | (Q10) A visualização mostra só os campos salvos de verdade (sem compasso, capo e afinação, que ficam declarados como herança D), com as notas do content. Filtros: tipo e *Só as favoritas*; sem dificuldade e sem ordem. As datas de criação e alteração: o desenho propõe. |
| **N4-D32** | (Q11) **Errata da N4-D20**, o fatiamento passa a ser: PR-0 pre-check · brief (com as capturas de B e do palco avulso), desenho e congelamento · **PR-1** gates (G-par e o gate do corpo do favoritar, entrando reprovados) · **PR-2** core: frases de content e o contrato da `LinhaDeAviso` · **PR-3** core da biblioteca, sem tela · **PR-4** a tela da biblioteca, com a entrada em S1 (sem ela a tela não se alcança no aparelho; a errata declarada do G-inv sobre os 8 dumps vai aqui) · **PR-5** o palco avulso sem hospedeira · **PR-6** a visualização · **PR-7** estados transversais, a troca de `icone`/`cor` por espécie nas quatro telas e o aceite completo · encerramento. A troca por espécie só entra se o mapa devolver **os mesmos pares** de ícone e cor de hoje, com G-inv e `gate:icones` intactos. |
| ↳ *errata* | **Errata da N4-D32 pela N4-D45** `[Marcel, 2026-10-01]`: o fatiamento passa a ser o da N4-D45 (§16) — gates e o leitor primeiro, em paralelo ao brief; as frases, a biblioteca, a tela, o palco avulso, a visualização e os transversais depois do congelamento. |
| **N4-D33** | (Q12) A entrada da biblioteca convive com `Buscar música`; o brief pede ao desenho as duas alternativas lado a lado (conviver × a biblioteca absorver a busca). |
| **N4-D34** | (Q13) Imagem e `.docx`/`.txt` se decidem depois da B2 e da B4. *(§12 Q13.)* |
| **N4-D35** | Releitura do favoritar: o cache se atualiza com a linha que o `PUT` devolve, sem sync, **se a B5 confirmar** que a resposta é a linha inteira. Se não confirmar, vira pergunta. *(**Confirmado pela B5**: o `PUT` devolve as 22 colunas, as mesmas do `GET`, e o `GET` seguinte é igual à resposta do `PUT` em todas — §11 B5.)* |
| **N4-D36** | (Q14) Fase B aprovada: B1 a B4 agora; B5 depois das leituras do §2 do prompt; B6 dispensada, salvo se a B2 achar forma legada no dado real — nesse caso pare e pergunte. O `.env.uxaudit` está autorizado **só para a B5**. *(Ampliações na sessão, pelo Marcel: o `apps/native/.env` para o Metro da B1 — "eu autorizo o sync"; o `.env.local` só para a `NEXT_PUBLIC_FIREBASE_API_KEY` na B5 — "Autorizo". Divs. 979, 982.)* |
| **N4-D37** | A div. 970 tem destino W5. A div. 971 se paga neste commit (§5 do prompt: as notas no `N3-ENCERRAMENTO.md` §10.6 e §10.7). |
| **N4-D38** | **B6 dispensada** (a parada da B2, opção a): a forma legada está medida no dado real pela B2; a fixture do G-par ganha o caso que apareceu — **Cifra com `sections[]` e `chords` em texto no mesmo `content_data`**. |
| **N4-D39** | **L1 aceita**: favoritar no tablet reordena o "Recentes" do painel do web, como o favoritar do web já faz; aceita-se, declara-se no brief, e o `PUT` do favorito mexer no `updated_at` vira **herança do Bloco D**. |

E dois registros do aval que não são decisão numerada:

- **L3 → requisito da PR-2** `[Marcel, 2026-10-01]`: a frase que passar ao core precisa continuar sob gate (o G-tok
  estendido ao módulo do core, ou um gate de igualdade); **a forma é pergunta da PR-2**, não se decide aqui (div. 977).
- **A div. 970** (o `vitest` dentro de `packages/core`) → **W5** (N4-D37).

---

## 10. As leituras L1 a L4

### L1 — quem ordena por `updated_at` `[medido: l1-ordem-updated-at.txt]`

- **Ninguém pede `sortBy=updated`**: a rota o aceita (`app/api/content/route.ts:110`; `lib/api-schemas.ts:207`), mas a
  biblioteca do web só tem `recent`/`title`/`artist` (`hooks/use-library-data.ts:43`, `:75`), o picker do web pede
  `recent` (`hooks/use-setlist-data.ts:74`) e o nativo `sortBy=recent` = `created_at` (`apps/native/src/api.ts:228`;
  `route.ts:106-115`).
- **Uma ordenação por `updated_at`**: o painel do web, `app/dashboard/page.tsx:33-37` (desc., os 5 primeiros → o
  "Recentes", `components/dashboard.tsx:56`). **O nativo não ordena por `updated_at` em lugar nenhum.**
- **Efeito do favoritar**: o item sobe ao topo do "Recentes" do painel do web — já é o que o favoritar do web faz;
  nenhuma lista do nativo e nenhuma outra do web muda. **Aceito pela N4-D39.**

### L2 — um item mudado com o mesmo `file_url` `[medido: l2-item-mudado-arquivo.txt]`

- **O arquivo é reaproveitado**: o disco é endereçado pelo último segmento da URL (`files.ts:30-33`, o `localizar`
  em `:122-152`); o sync e o store não tocam arquivos (`sync.ts:98-110`; o `reconcileByUpdatedAt` só conta,
  `core/sync.ts:127-135`); o único caminho que apaga é o despejo do LRU (`prefetch.ts:277`).
- **Nenhum teste cobre o caso** (o `offline.test.ts` usa `updated_at` só como dado de fixture).
- **Efeito do favoritar no nativo**: nenhum além do `invalidated` +1 no sync seguinte (o T1-R10 funcionando).

### L3 — a H-N4-15 `[medido: l3-h15-core-no-web.txt]`

Árvore de rascunho `../octavia-n4-h15` (`git worktree add --detach`, sobre `2fce586`, sem `.env*`): o
`frases-editor.ts` passa a tirar `edit.nada-mudou` do `FRASES["nada-mudou"]` do core (texto byte a byte igual), com
`"@octavia/core": "workspace:*"` no `package.json` e `pnpm install --offline`.

| | antes | depois |
|---|---|---|
| `pnpm build` | passa | passa |
| rotas | 27 | 27 |
| primeiro carregamento | `/add-content` 277 kB · `/content/[id]/edit` 279 kB · `/setlists` 275 kB | 279 · 281 · 277 kB (**+2 kB** nas três; as outras 24 iguais; o compartilhado 102 kB igual) |
| `package.json` · lockfile | — | +1 linha · +3 linhas (`link:packages/core`) |
| núcleo do G-back | — | **0 de 3** arquivos tocados |
| G-tok | PASSA, 446 strings de `.ts` | PASSA, **445** — a frase que foi ao core **sai do alcance do gate** (div. 977) |

Removida no fim: `git worktree list` sem `octavia-n4-h15`, `ls` → *No such file or directory* (no anexo).

### L4 — o que o editor do web grava e lê numa Cifra `[medido: l4-editor-cifra.txt]`

- **Abrir uma Cifra**: `sections[]` **primeiro** (`components/chord-editor.tsx:21-22`); sem seções, o `chords` do
  topo vira uma seção `"Content"` com o texto na `lyrics` (`:25-28`); sem nada, `"Verse 1"` vazia (`:32-35`). O editor
  recebe `{ ...content, ...content.content_data }` (`components/editors/content-type-editor.tsx:45`).
- **Salvar**: cada mudança devolve `{ ...content, ...newData }` com `newData = { title, artist, key, capo, bpm,
  sections }` (`chord-editor.tsx:38-41`), espalhado dentro do `content_data` (`content-type-editor.tsx:31-38`); o
  corpo do `PUT` acrescenta `sections` (`components/content-editor.tsx:64-68`). **O `chords` do topo nunca é
  reescrito** — vai ao `PUT` como estava.
- **O gate do `PUT` guarda exatamente isso** (`tests/gates/fixtures/editor-put-antes.json`, texto-fixture do
  projeto): no caso *"cifra em texto"* a seção ganhou a linha editada e o `chords` do topo ficou o de antes; no caso
  *"cifra em seções"* a entrada tinha topo e seção iguais (`C7M G7`), a seção ganhou `Dm7`, o topo ficou `C7M G7`.
- **Letra**: lê e grava `lyrics` (`components/lyrics-editor.tsx:18-22`) — o palco recebe o texto novo.
- **Tab**: lê e grava `measures` (`components/tab-editor.tsx:25-50`; sem `measures` abre o compasso-fixture, div.
  776); **`tablature` fica intocado** — a edição não chega nem ao palco nem à visualização do web, que leem os dois
  `tablature` (div. 976).
- **Upload e lote não escrevem `sections`**: criar do zero grava `{ <chave do tipo>: "" }`
  (`components/content-creator.tsx:32`); o lote grava `song.body` (`hooks/useAddContentLogic.ts:170`);
  `git grep sections` em `hooks`, `components/upload`, `components/add-content`, `lib` → exit 1.

**Conclusão: uma Cifra editada hoje no web chega ao palco com o texto VELHO** — o palco lê o `chords` do topo
(`content-contract.ts:21-26`), que o editor não atualiza; a visualização do web, que lê `sections` primeiro
(`corpo-de-texto.ts:47-55`), mostra o novo. A leitura basta para afirmar o mecanismo (o gate o fixa byte a byte); o
que ela **não** diz é **quantas** Cifras da principal foram editadas depois de ganhar seções — e isso não se mede no
dado: o B2 vê 2 Cifras com `sections`, em ambas o topo diverge da seção, e nada no registro diz qual veio por último
além do próprio mecanismo (div. 975).

---

## 11. Fase B — resultado, com a contabilidade ao lado do orçamento

### B1 — a biblioteca da principal, pelo cache do Tab `[medido: b1-b4-biblioteca-principal.txt]`

- O Marcel destravou o Tab; o `stay_on` foi a 7 e voltou a 0; `accelerometer_rotation` **1**, `user_rotation` 0,
  avião desligado — lidos e deixados como estavam (div. 980); o app subiu em **B** (`faixa=B w=711.1 h=1137.8`).
- Metro sem `CI=1`, com o `apps/native/.env` copiado por `cp -p` do checkout principal (origem, comando e os **nomes**
  das 7 chaves no anexo; nenhum valor lido nem impresso; o host da API, `octavia.rocks`; apagado no fim); o bundle
  servido conferido pela regra 13 (`octavia.rocks: 1 · localhost:8788: 0`).
- **O sync**: `api status=200 path=/api/setlists` · `api status=200 path=/api/content` · `cache write kind=content
  n=63 invalidated=0` · `sync ok setlists=2 content=63 pages=1 t=3310`.
- **md5 antes → depois**: `content.json`, `files-index.json` e o PDF **iguais**; `setlists.json` **mudou** (o
  `syncedAtMs`, com `invalidated=0`) — div. 981.
- **Medida**: **63** itens — Letra **57**, Cifra **3**, Tab **2**, Partitura **1**; `content.json` **111.580 B**;
  `is_favorite` presente em **63 de 63**, **1** `true` (uma Letra).
- O `content.json` e o resto copiados foram para um diretório temporário **fora do repositório** e apagados (`ls` →
  *No such file or directory*, no anexo); uma segunda leitura, para o complemento da B2 pedido no aval, idem.

### B2 — inválidos, formas e o G-par no dado real (0 requests)

- **Validade**: **63 de 63 válidos** — Letra 57 `ok-text`, Cifra 3 `ok-text`, Tab 2 `ok-text`, Partitura 1 `ok-file`.
- **Formas**: **6 de 63 poluídos pelo editor** (a linha inteira dentro do `content_data`, com `content_data`
  aninhado e `annotations`): 4 Letras e 2 Cifras; as **2 Cifras poluídas têm `sections[]`**; a Partitura traz uma chave
  legada `file` (string) ao lado de `annotations`; as Tabs só `tablature` string.
- **G-par web × core**: **61 iguais de 63**; **2 diferentes** (as duas Cifras com `sections`); **0** com o core vazio
  e o web com texto, **0** com o inverso.
- **As duas Cifras** (ordinais 3 e 8 de 63 no `content.json`): `content_data` com as mesmas 25 chaves (a linha +
  `annotations`, `sections`, `content_data` aninhado só com `chords`); seção com `chords`, `id` (número), `lyrics`,
  `name`.
  - **ordinal 3**: o core lê o `chords` do topo (**2.027** caracteres) = uma linha de 6 + `\n` + a letra da seção
    (2.020); o web lê `name` (7) + `\n` + `lyrics` (2.020) = **2.028** — a mesma letra; **a diferença de 1 não é fim
    de linha** (os dois têm 104 `\n`, 0 `\r`, nenhum termina em `\n`): é a 1ª linha, 6 caracteres no core × o `name`
    de 7 no web, cadeias diferentes;
  - **ordinal 8**: o core lê o `chords` do topo (**10**, sem `\n`); o web lê `name` (7) + `chords` da seção (8) +
    `lyrics` (15) = **32** — nenhuma das três partes está no `chords` do topo: dois conteúdos diferentes no mesmo
    `content_data`.
- **Sentinelas e artista**: `Unknown Artist` 0, `Unknown Title` 0; artista `null` 49, `""` 3.

### B4 — formatos (0 requests)

**1** arquivo, `Partitura:.pdf`, que o contrato trata como arquivo. **Nenhuma** imagem, `.docx` ou `.txt`.

### B3 — o tamanho dos arquivos

**1** arquivo distinto com `body === 'file'`, **já baixado** (pelo `files-index.json`): **138.916 B** = **0,066 %** do
`CAP_BYTES` (209.715.200 B). **0** não baixados → **0 `HEAD`** ao Storage.

### Medidas para o brief

N = **63**; Letra 57 · Cifra 3 · Tab 2 · Partitura 1; **maior título: 27 caracteres**; **maior artista: 13**; **sem
artista: 52** (49 `null` + 3 `""`); **arquivos não baixados: 0**; **favoritas: 1**.

### B5 — favoritar e desfavoritar em prod, conta de audit `[medido: b5-favoritar-prod.txt]`

Content `"DESCARTÁVEL N4"` criado pelo Marcel no web (id `4dadcb78…`). Um script fora do repositório: login no
Firebase (`signInWithPassword`, terceiro) com o `.env.uxaudit` e a `NEXT_PUBLIC_FIREBASE_API_KEY` do `.env.local`
(nenhum valor impresso); **sem** `POST /api/auth/session` (o `Bearer` basta).

| passo | requisição | status | ms | resposta | `is_favorite` | `updated_at` |
|---|---|---|---|---|---|---|
| GET 1 (antes) | `GET /api/content/<id>` | **200** | 584 | 22 chaves (a linha) | `false` | `…15:00:00.754` |
| PUT 1 | `PUT /api/content` `{"id":"<id>","is_favorite":true}` | **200** | 280 | **22 chaves** — as mesmas do `GET` | `true` | `…15:48:59.295` |
| PUT 2 | `PUT /api/content` `{"id":"<id>","is_favorite":false}` | **200** | 258 | 22 chaves | `false` | `…15:48:59.572` |
| GET 2 (depois) | `GET /api/content/<id>` | **200** | 205 | 22 chaves; **igual à resposta do PUT 2 em todas** | `false` | `…15:48:59.572` |

- **O `PUT` devolve a linha inteira** → a N4-D35 vale (o cache se atualiza com a resposta, sem sync).
- Entre o GET 1 e o GET 2 **só o `updated_at` mudou** — o `is_favorite` voltou ao inicial; o `updated_at` não volta
  (declarado no orçamento; herança D pela N4-D39).
- Nenhum 4xx/5xx, nenhum 429; a resposta **não** traz `X-RateLimit-*` no 2xx (o cabeçalho só vem no 429,
  `lib/user-rate-limit.ts:124-134`). O descartável **fica para o Marcel apagar**.

### Contabilidade real × orçamento

| probe | orçado | real | escritas | o que ficou |
|---|---|---|---|---|
| B1 | 1 + ⌈N/100⌉ `GET` (≈3) | **2 `GET`** (`/api/setlists`, `/api/content` p. 1) | 0 (só o cache local) | o `setlists.json` do Tab com o `syncedAtMs` novo |
| B2 | 0 | 0 (+1 releitura do cache do Tab, local) | 0 | — |
| B3 | k `HEAD` ao Storage | **0** (k = 0) | 0 | — |
| B4 | 0 | 0 | 0 | — |
| B5 | 2 `PUT` + 2 `GET` + login | **2 `PUT` + 2 `GET`** + 1 login Firebase | **2** (audit) | o `updated_at` do descartável; o descartável, para o Marcel |
| B6 | ≈3 `GET` | **dispensada** (N4-D38) | — | — |
| **total** | ≈ 7–9 a `/api/*` + k | **6 a `/api/*`** (4 `GET` + 2 `PUT`) + **1** login a terceiro | **2** | — |

Também, fora de prod: 2 `pnpm build` na árvore de rascunho (L3); `adb` no Tab (estado, `stay_on`, `reverse`,
`force-stop`, `logcat`, duas leituras `run-as cat`); **`.env*`**: `apps/native/.env` (copiado, nomes e host lidos),
`.env.uxaudit` e `.env.local` (carregados pelo script da B5) — todos com autorização do Marcel nesta sessão;
**contas criadas: 0**.

---

## 12. As perguntas que sobram

**Q4 — o leitor do G-par** (N4-D25; B2; L4).
- **Números**: 63 de 63 válidos; **61 iguais**, **2 diferentes** — as 2 Cifras com `sections[]` (de 3 Cifras). E a
  L4: **o editor do web grava `sections` e nunca atualiza o `chords` do topo** — toda Cifra editada no web depois de
  ter seções (e toda Cifra-texto editada, que ganha a seção `"Content"`) chega ao palco com o texto **velho**.
- **(a) o contrato do core como está**, com as 2 Cifras **declaradas** (herança D: o editor que não atualiza o
  `chords`); o G-par compara 61 e lista as 2 como exceção nomeada; o palco continua a mostrar o `chords` do topo.
- **(b) o core aprende a ler `sections[]`**, com a **mesma precedência e a mesma junção do web** (`sections`
  primeiro: `name`/`chords`/`lyrics` por `"\n"`, seções por `"\n\n"`, `corpo-de-texto.ts:47-55`), e o `chords` do topo
  só quando não há seções: o G-par dá **63 de 63**, e o palco passa a mostrar **o que o músico editou**; custa a errata
  do T1-R7 (e do C-D7), um caso novo na fixture do G-par (já decidido, N4-D38) e muda o texto do palco nas 2 Cifras da
  principal (a base do G-inv, que é mock, não tem `sections` — não muda).
- **Recomendação: (b)**, na **PR-3** (core), com o G-par da PR-1 entrando reprovado pelas 2. Pela L4, (a) mantém o
  palco mostrando o texto que o músico já trocou — o defeito que o G-par existe para pegar. O editor que não atualiza
  o `chords` segue herança D em qualquer das duas.

> **Respondida** `[Marcel, 2026-10-01]`: N4-D40 (opção b) — o core lê `sections[]` com a precedência e a junção do web (§16).

**Q6 — a N4-D9 com a B3** (N4-D27).
- **Número**: **1** arquivo na principal, **138.916 B = 0,066 %** do teto, já baixado; nenhum por baixar.
- **(a) garantir todos os arquivos** (a primeira opção da D9): a soma cabe com folga de três ordens de grandeza; custa
  os itens 1–4 da A7 (conjunto garantido, `prefetch plan reason=<novo>` com errata em par do G3, LRU protegendo
  tudo, estado por música).
- **(b) não mudar o mecanismo** e desenhar só o estado "não baixada" por música (Partitura e Cifra escaneada): hoje
  ele seria inalcançável na principal (0 não baixados), mas não na audit nem numa conta que suba PDFs.
- **Recomendação: (a)**, com o `lru over` como o sinal de que deixou de caber, e o estado "não baixada" **desenhado
  mesmo assim** (é o estado entre a criação no web e o próximo sync com rede — regra 17).

> **Respondida** `[Marcel, 2026-10-01]`: N4-D42 (opção a) — todos os arquivos garantidos; "não baixada" para antes do download e para a falha (§16).

**Q13 — imagem e `.docx`/`.txt`** (N4-D34).
- **Número**: B4 — **só `.pdf`** (1 de 1) na principal; o snapshot da audit já commitado, 5 de 5 `.pdf` (A2).
- **(a) herança nomeada**, sem estado novo no N4: o palco segue mandando arquivo ao `react-native-pdf`, e o primeiro
  arquivo não-PDF que aparecer é `pdf-error` — declarado no brief como estado conhecido e fora do recorte.
- **(b) o estado "formato que o app ainda não mostra"** no palco e na visualização (o par do `VIEW-erro-formato`),
  sem ramo de imagem — uma decisão pela extensão, antes do `<Pdf>`.
- **Recomendação: (b)**: é barato (uma condição sobre a extensão, que o web já aceita no upload,
  `frases-upload.ts:107`), troca uma falha muda por uma frase, e não depende de o dado existir hoje. Se o aval
  preferir não ter estado sem dado, (a).

> **Respondida** `[Marcel, 2026-10-01]`: N4-D43 (opção b) — o estado "formato que o app ainda não mostra", pela extensão (§16).

**Q15 — a Tab editada no web** (L4, div. 976). O editor grava `measures` e deixa `tablature`; a edição não chega a
leitor nenhum. **Recomendação**: herança **Bloco D**, junto do §10.1 item 3 do I1 (div. 776), com uma linha no
brief: *"a tab é mostrada como foi importada"*.

> **Respondida** `[Marcel, 2026-10-01]`: N4-D44 — Bloco D, primeira da fila (§16).

**Q16 — o editor da Cifra no Bloco D** (L4, div. 975). Com a Q4 em (b), o palco deixa de depender do `chords` do
topo; o `chords` desatualizado continua no banco e é o que o `checkContentData` do `PUT` valida
(`route.ts:260-278`). **Recomendação**: herança **Bloco D** — o editor passa a escrever o `chords` do topo (ou o
contrato de escrita passa a aceitar `sections` como corpo da Cifra) —, nomeada no encerramento do N4.

> **Respondida** `[Marcel, 2026-10-01]`: N4-D44 — Bloco D (§16).

---

## 13. Divergências deste commit — 974 a 982

A última do commit 1 é a **973** `[medido: grep -noE '^\| \*\*9[5-9][0-9]\*\*' docs/native/N4-PRECHECK.md]`.

| div. | origem | o quê | destino |
|---|---|---|---|
| **974** | P | O prompt da resposta à parada da B2 presumiu que as leituras **L1–L3** não tinham sido feitas (*"o teu relatório não as traz"*); foram, **antes da B1**, e estavam na mensagem que pediu o destravar do Tab | registrado (pedido do Marcel); a ordem do §2 do prompt foi cumprida |
| **975** | A | **A Cifra editada no web chega ao palco com o texto velho**: o editor grava `sections` e nunca reescreve o `chords` do topo (`chord-editor.tsx:38-41`; `content-editor.tsx:64-68`), que é o que o palco lê; o gate do `PUT` fixa isso nos dois casos de Cifra (`editor-put-antes.json`) | §12 Q4 (b) e Q16 (Bloco D) |
| **976** | A | **A Tab editada no web não chega a leitor nenhum**: o editor grava `measures` e deixa `tablature` (`tab-editor.tsx:25-50`); o palco e a visualização do web leem `tablature` | §12 Q15 (Bloco D, com o §10.1 item 3 do I1) |
| **977** | A | **A frase que vai ao core sai do G-tok** (446 → 445 strings de `.ts` examinadas, L3): o gate do web varre os arquivos da lista, não o `packages/core` — o caso do padrão *"instrumento com escopo menor do que parece"* | **requisito da PR-2** (aval): a forma do gate é pergunta da PR-2 |
| **978** | A | **Forma legada no dado real**: 2 das 3 Cifras da principal com `sections[]` e `chords` em texto, com textos diferentes nos dois leitores (B2); 6 de 63 poluídos pelo editor | **N4-D38** (B6 dispensada; o caso na fixture do G-par) |
| **979** | P | O aval autorizou o `.env.uxaudit` **só** para a B5, mas o login da audit pelo caminho do projeto (`scripts/ux-audit/auth.ts:14-16`) lê também o **`.env.local`** (a `NEXT_PUBLIC_FIREBASE_API_KEY`) | autorizado pelo Marcel na sessão ("Autorizo"); o script da B5 os carregou sem imprimir valor |
| **980** | A | O `accelerometer_rotation` do Tab estava **1** (o `APARATO.md`, *"Rotação por aparelho"*, descreve o retrato com `accelerometer_rotation=0`); o app subiu em B | lido e deixado como estava; nenhum dump comparado contra base nesta PR (sem objeto para o G-inv) |
| **981** | A | O *"md5 antes e depois"* da receita do `APARATO.md` dá **um arquivo mudado**: o `setlists.json` (o `syncedAtMs` do sync, com `invalidated=0`); os outros três iguais. O cache do Tab é o do uso real e **não se restaura** (orçamento, B1) | declarado no anexo |
| **982** | P | A B1 orçada como *"o sync normal do app"* pressupunha o app de pé; o app do Tab é o **dev client**, que só sincroniza com o Metro, e o Metro precisa do **`apps/native/.env`** — fora da autorização do `.env.uxaudit` | parei e perguntei; autorizado pelo Marcel ("eu autorizo o sync"); cópia por `cp -p`, nomes e host no anexo, apagado no fim |

**Contagem**: 9 — A 6 · P 3. **Fechadas neste commit**: a **971** (as notas no `N3-ENCERRAMENTO.md`, N4-D37); a
**970** recebe destino W5 (N4-D37).

---

## 14. A proposta de brief revista

O `## 7` fica como está; o que muda:

- **As medidas da B1, que mudam desenho**: a lista tem **63** itens na principal — **57 de 63 Letras** (o filtro por
  tipo separa um grupo dominante de três pequenos: Cifra 3, Tab 2, Partitura 1); **52 de 63 sem artista** (a linha
  sem artista é o caso **comum**, não o raro — o "· artista" do palco e o *"artista desconhecido"* do web se
  desenham como estado principal); **1 favorita** (*Só as favoritas* com um item é o caso real; o vazio dele, o mais
  provável numa conta nova).
- **O comprimento no lugar do "maior título"**: maior título **27** caracteres, maior artista **13** — números, não
  o texto; o pior caso desenhado continua sendo o do N3 (o título longo da fixture), não o da principal.
- **As duas alternativas da N4-D33**, lado a lado: a biblioteca **convivendo** com `Buscar música` × a biblioteca
  **absorvendo** a busca.
- **A faixa A**: referência = as molduras `N3-A-*` do `DESIGN-N3`, porque em A as telas de hoje usam os tokens de B
  (`faixas.A = faixaB`) e a captura do celular **não é** a composição de A.
- **Os campos da N4-D31**: só os salvos de verdade — álbum, dificuldade, gênero, tom, andamento, etiquetas, as notas
  do content (e as datas, se o desenho propuser); compasso, capo e afinação **fora** (herança D).
- **Filtros**: tipo e *Só as favoritas*; sem dificuldade, sem ordem.
- **O favoritar**: só online (N4-D23), com as espécies do N2; e a nota da **N4-D39** — favoritar no tablet reordena o
  "Recentes" do painel do web.
- **O corpo**: o leitor do palco (N4-D24) — e, conforme a Q4, a Cifra com seções mostra as seções; a Tab é mostrada
  como foi importada (Q15).
- **O offline**: o texto é sempre local; o estado "não baixada" é só de arquivo (N4-D27), desenhado mesmo com 0 na
  principal (Q6).
- **O formato não-PDF**: conforme a Q13.
- **A ordem de PRs** é a da **N4-D32**: o brief e o congelamento vêm antes da PR-1; as capturas novas de B e do palco
  avulso entram no brief.
- **Fora do brief**: a linha do teto de 100 (N4-D28).

---

## 15. Contabilidade do commit 2

| | |
|---|---|
| requests a `/api/*` em prod | **6**: B1 2 `GET`; B5 2 `GET` + 2 `PUT` |
| requests a terceiros | **1** login Firebase (B5); **0** `HEAD` ao Storage |
| escritas em prod | **2** (B5, conta de audit, no descartável; `is_favorite` desfeito; `updated_at` não) |
| contas criadas | **0** |
| aparelho | Tab S6 (destravado pelo Marcel); `stay_on` 0 → 7 → 0; nada mais mudado |
| `.env*` | `apps/native/.env` (B1), `.env.uxaudit` e `.env.local` (B5) — autorizados pelo Marcel; **nenhum valor** impresso, colado ou commitado |
| temporários | o `content.json` (duas cópias), o índice, o `setlists.json`, o logcat e o bundle: fora do repositório, **apagados**; a árvore `../octavia-n4-h15`: **removida** |
| arquivos | `docs/native/N4-PRECHECK.md` (§0 e §2 com erratas; §9–§15 novos); anexos novos `l1`…`l4`, `b1-b4`, `b5`; `docs/native/N3-ENCERRAMENTO.md` §10.6 e §10.7 (nota); `docs/ux/I1-ENCERRAMENTO.md` §10.2 item 2 (nota) e §10.5 item 11 (novo) |
| código | nenhum |

---

# Commit 3 — as decisões do aval do commit 2

Só docs: nenhuma request, nenhum aparelho, nenhum `.env*`, nenhuma linha de código. Os commits 1 e 2 não foram
reescritos: as decisões que mudaram ganharam linha de errata (↳) no `## 0` (N4-D20) e no `## 9` (N4-D32); as
perguntas do `## 12`, uma linha *"Respondida"* apontando para a decisão.

---

## 16. Decisões N4-D40…D46

`[Marcel, 2026-10-01]`.

| # | decisão |
|---|---|
| **N4-D40** | (Q4, opção b) O contrato de leitura do core passa a ler `sections[]` da Cifra com a mesma precedência, a mesma ordem e a mesma junção do leitor do web. O G-par vale sobre esse leitor. O nome da seção aparece no palco como aparece no web; o nome padrão que o editor grava é herança do Bloco D. A errata do requisito de leitura que isso exigir se escreve na PR do leitor, não aqui. *(Onde o contrato está escrito `[medido: grep]`: o **T1-R7** do `docs/native/PRD-TELA-1.md` §4 (*"Contrato de `content_data` (C-D7)"*, `:84`, `:100`) e o cabeçalho de `packages/core/src/content-contract.ts` (*"Mudança de um lado é errata declarada nos dois documentos"* — o lado de escrita é `docs/api/CONTENT-DATA.md` e `lib/content-data-contract.ts`). O nome padrão gravado já é herança D: `I1-ENCERRAMENTO.md` §10.1 item 3, div. 784 — sem item novo.)* |
| **N4-D41** | O conserto do palco não espera o desenho: a PR dos gates e a PR do leitor saem logo depois do merge deste pre-check e correm enquanto o brief e o desenho andam. |
| **N4-D42** | (Q6, opção a) Todos os arquivos da biblioteca ficam garantidos. O estado "não baixada" se desenha para o intervalo antes do download e para a falha. |
| **N4-D43** | (Q13, opção b) Estado "formato que o app ainda não mostra", decidido pela extensão do arquivo, no palco e na visualização. Sem ramo de imagem no N4. |
| **N4-D44** | (Q15 e Q16) Bloco D para as duas: a Tab editada no web que nenhum leitor vê (div. 976), marcada como **primeira da fila do D**, e o editor da Cifra que não atualiza o `chords` do topo (div. 975). *(Escritas no `I1-ENCERRAMENTO.md` §10.1, itens 17 e 18.)* |
| **N4-D45** | **Errata da N4-D32** — o fatiamento passa a ser, nesta ordem e com estes nomes: **PR-1 — gates**: o G-par, entrando reprovado, com a fixture que inclui a Cifra com `sections[]` e `chords` em texto (N4-D38); e o gate byte a byte do corpo do favoritar. · **PR-2 — o leitor**: o core lê `sections[]` (N4-D40); o G-par fica verde; aceite do Marcel no Tab. · *(brief, desenho e congelamento correm em paralelo às duas acima; as PRs seguintes só começam depois do congelamento)* · **PR-3 — core das frases**: o vocabulário de content e o contrato da `LinhaDeAviso`, com a frase que passa ao core mantida sob gate (div. 977). · **PR-4 — core da biblioteca, sem tela**: a lista e o filtro, a escrita do favoritar (N4-D22, D23, D35), a garantia de todos os arquivos e o estado por música (N4-D42), e o teste do caso da L2 (o `updated_at` muda, o arquivo fica). · **PR-5 — a tela da biblioteca**, com a entrada em S1 e o favoritar na linha. · **PR-6 — o palco avulso sem hospedeira**, com o estado da N4-D43 no palco. · **PR-7 — a visualização**, com o favoritar, o *Tocar* e o estado da N4-D43. · **PR-8 — estados transversais**, a troca por espécie nas quatro telas (com a condição da N4-D32) e o aceite completo. · **encerramento**. Todo documento de PR do bloco termina nomeando **a próxima PR desta lista**; pular uma é divergência no ato, não no encerramento. |
| **N4-D46** | As autorizações das divs. 979 e 982 (o `.env.local` para o login da audit e o `apps/native/.env` para o Metro) foram dadas pelo Marcel na sessão; as duas ficam como estão. |

**As heranças do Bloco D escritas neste commit** — `docs/ux/I1-ENCERRAMENTO.md`, tabela da `### 10.1 Bloco D`
(`:498`), itens novos no fim, sem renumerar: **17** a Tab editada que nenhum leitor vê (div. 976, **primeira da fila
do D**, N4-D44); **18** o editor da Cifra que não atualiza o `chords` do topo (div. 975, N4-D44); **19** o `PUT` do
favorito que mexe no `updated_at` (N4-D39). O commit 2 **não** o tinha posto lá (`grep -n 'N4-D39\|updated_at'
docs/ux/I1-ENCERRAMENTO.md` → nada antes deste commit): sem duplicata.

---

## 17. A proposta de brief — revisão final

O `## 7` e o `## 14` ficam como estão; o que esta revisão muda:

- **Estados da N4-D42** — "não baixada" por música (Partitura e Cifra escaneada), em dois casos: **antes do
  download** (o intervalo entre o sync que trouxe o item e o arquivo no disco) e **a falha** do download (com a
  frase do conjunto fechado do W2: *não consegui baixar*, *o arquivo chegou vazio*…). Com a garantia de todos os
  arquivos, nenhum dos dois é o estado de repouso — e os dois se desenham (regra 17).
- **Estado da N4-D43** — *"formato que o app ainda não mostra"*, pela extensão, no **palco** e na **visualização**
  (o par do `VIEW-erro-formato` do web, com o título e o tipo do item).
- **O nome de seção no corpo da Cifra** (N4-D40) — a Cifra com seções mostra, no palco e na visualização, o nome
  de cada seção antes dos acordes e da letra, como o web (`name` · `chords` · `lyrics` por linha; seções separadas
  por uma linha em branco). O nome pode ser o padrão que o editor grava (*"Content"*, *"Verse 1"* — herança D,
  §10.1 item 3 do I1): o desenho não o esconde.
- **A nota da N4-D39** — favoritar no tablet reordena o "Recentes" do painel do web.
- **A ordem de PRs** é a da **N4-D45**, no lugar da N4-D32: PR-1 gates e PR-2 o leitor correm **em paralelo** ao
  brief; o desenho congelado é pré-requisito da PR-3 em diante. As capturas novas de B e do palco avulso continuam
  no brief.

---

## 18. Divergências deste commit

A última usada é a **982** `[medido: grep -noE '^\| \*\*9[5-9][0-9]\*\*' docs/native/N4-PRECHECK.md]`.
**Nenhuma** neste commit: as premissas do prompt conferiram com o repositório (o contrato de leitura no T1-R7 do
`PRD-TELA-1.md` §4; as divs. 975, 976, 979 e 982 como descritas; a N4-D39 ainda fora do §10.1 do I1). A próxima
livre segue sendo a **983**.

---

## 19. Contabilidade do commit 3

| | |
|---|---|
| requests · aparelho · `.env*` · logins · escritas | **0** · **0** · **0** · **0** · **0** |
| arquivos | `docs/native/N4-PRECHECK.md` (§0 e §9 com erratas; §12 com as respostas; §16–§19 novos); `docs/ux/I1-ENCERRAMENTO.md` §10.1, itens 17–19 |
| código | nenhum |

**A próxima PR desta lista** (N4-D45): **PR-1 — gates**.
