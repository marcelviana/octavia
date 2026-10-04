# N4-PR5 — core da biblioteca (sem tela)

> **Bloco N4 · PR-5** (`n4/pr5-core-biblioteca`, PR [#361](https://github.com/marcelviana/octavia/pull/361), **sem
> merge**). Data: 2026-10-04. Base: `origin/main` = `364e5c7` (merge da #360, a N4-PR4). Árvore `../octavia-n4-pr5`;
> `pnpm install --frozen-lockfile --offline`.
> Commits: `d9a8a98` `test(n4): PR-5 — o core da biblioteca, reprovando` · `dead391` `feat(core): a lista, os filtros e a
> busca da biblioteca` · `e2f2e58` `feat(native): o favoritar — escrita, estado por música e cache` · `f5fb36d`
> `feat(native): todos os arquivos da biblioteca garantidos (N4-R26)` · `e33801e` docs · **o conserto antes do merge
> (N4-D91)**: `2d27ad3` `test(n4): o sync que atravessa um favoritar, reprovando` · `5e3bcdd` `fix(native): o cache não
> regride depois do favoritar (N4-D91)` · o de docs atualizado (§10).
> `[medido]` = comando + saída literal nesta sessão, nos arquivos desta pasta.
> Requisitos: N4-R4, N4-R5, N4-R7, N4-R11, N4-R26 (o core). Aceites: A-N4-4, A-N4-5, A-N4-7, A-N4-11, A-N4-26 na parte do
> core (§7).

**Nenhum arquivo de tela muda**: `git diff 364e5c7..HEAD -- apps/native/src/screens` vazio. Nenhum token, nenhum texto
visível, nenhum backend (`app/`, `components/`, `lib/`, `hooks/`, `supabase/` intocados). Zero request a prod, zero
escrita em prod; aparelho: só o AVD `octavia_tab32` (o Tab ficou conectado ao cabo e **não foi tocado**).

---

## 0. Decisões do Marcel nesta sessão `[Marcel, 2026-10-04]`

O §1 parou no item 6 (*"se não definir, pare e pergunte"*) e levou junto duas perguntas de contrato. As respostas,
verbatim da escolha (as três foram a opção recomendada):

- **N4-D88 — N4-R26: "7d primeiro, para no teto".** O plano baixa primeiro os arquivos da janela de 7 dias (sempre, como
  hoje), depois o resto da biblioteca em ordem alfabética; antes de cada arquivo só-da-biblioteca, se o total no disco
  já passou do teto, para — o resto fica *não baixado*. Todos protegidos do LRU. O último pode estourar o teto em até 3
  arquivos (a concorrência), e é isso que faz o `lru over` sair. (div. 1058)
- **N4-D89 — o log do favoritar: "como proposto".** `write op=favorite|unfavorite content=<id8> status=<s|net>
  code=<CODE|net|-> ms=<ms>`; `write blocked op=favorite|unfavorite reason=offline|ratelimit|busy`; o `cache write
  kind=content … invalidated=1` que já existe; e o `family=` do `mutate()` vem do chamador — errata em par do G3. (div.
  1061)
- **N4-D90 — a busca de L: "sem o corte de 50".** Mesmo predicado da S4, sem limite; o teste prova o mesmo conjunto da
  S4 quando os acertos são ≤ 50 e declara o corte da S4 como a única diferença. (div. 1062)

E uma autorização, no §4: **o `cp -p` do `apps/native/.env` para o Metro do AVD**, como na N4-PR4 (div. 1059).

**Do prompt do conserto antes do merge** `[Marcel, 2026-10-04]`: **N4-D91** — a div. 1065 se conserta nesta PR (§10);
**N4-D92** — a div. 1066 muda de destino para a **PR-7** (§10.4); a div. 1063 fica na PR-9; uma herança nova para o
encerramento (§10.5); a div. 1060 com a origem P e a PR-6 medindo o G-inv nos dois aparelhos.

---

## 1. O que se mediu antes de escrever

### 1.1 A ordem — o que o runtime oferece, e como o resultado é o mesmo no Node e no aparelho

- **O app roda Hermes** (`react-native` 0.86.3, `apps/native/package.json:26`; Expo ~57). `String.prototype.localeCompare`
  e `Intl.Collator` existem nele, mas a colação é a tabela de ICU que cada runtime carrega — o Hermes do Android e o
  Node (ICU completo) **não têm contrato de dar a mesma ordem** para acento, caixa e pontuação.
- **No core hoje só há um `localeCompare`** (`git grep -n "localeCompare\|Intl\." -- apps/native/src packages/core/src`):
  `packages/core/src/offline.ts:102`, e ele compara **datas ASCII** `YYYY-MM-DD` — o caso em que a colação não importa.
- **O que se usou**: a chave de cada música é o título pelo `normalizeForSearch` (`packages/core/src/normalize.ts:7-14`:
  NFD → tira U+0300–U+036F → minúsculas → junta espaços → trim), a mesma da busca que a S4 já roda no aparelho; e duas
  chaves se comparam **por unidade de código** (`<`, `porCodigo`, `packages/core/src/biblioteca.ts:39`), com o título cru e
  o `id` como desempate — a ordem é total (`ordenarBiblioteca`, `:47`). O NFD e a remoção das marcas são Unicode puro,
  e `<` entre duas cadeias é o mesmo em qualquer motor JavaScript: **o resultado do teste é o do aparelho**.
  O CN-a (§3) é a chave sem o NFD: reprova.

### 1.2 O favorito no dado

- **Chega e está no cache**: a B1 do pre-check (`N4-PRECHECK.md` §11) mediu `is_favorite` em **63 de 63** itens do
  `content.json` do Tab; o servidor manda a coluna (`select('*')`, `app/api/content/route.ts:67`) e o sync grava o item
  sem mapear (`apps/native/src/store.ts`, `JSON.stringify(snapshot.content)`).
- **Não estava no tipo**: o `ContentDTO` declarava 8 das 22 colunas (`packages/core/src/types.ts:19-37` na `main`).
- **Onde entra**: `is_favorite?: boolean | null` no `ContentDTO` (`types.ts:43`). Opcional porque a fixture do mock do N3
  (`N3-PRECHECK-anexos/instrumentos/fixture.py:73-85`) não traz a chave; ausente ou `null` = não favorita (`ehFavorita`,
  `biblioteca.ts:55`).

### 1.3 As escritas do N2, e o que o favoritar reaproveita

**Como uma escrita é feita hoje** (`apps/native/src/escrita.ts` + `packages/core/src/escrita.ts`): (1) **barrar** — `busy`
(outra escrita em voo: a trava é do app, `emVoo` booleano, conquistada antes do primeiro `await`), `ratelimit` (gate da
família `setlist-mutate`), `offline` (`estaOnline()`): `write blocked op=<op> reason=<r>` (`escrita.ts:164`), zero request;
(2) **enviar** — um request, sem retry, prazo de 20 s (N2-D35, `PRAZO_DE_REDE_MS`), pela instância de `authFetch` que não
desloga no 401 (N2-D9, `api.ts`); (3) **logar** `write op=<op> setlist=<id8|-> items=<n|-> status code ms`
(`escrita.ts:403`); (4) **reler** `GET /api/setlists` depois de todo 2xx e de todo 404, e só a releitura muda o cache
(T2-R9, N2-D13); (5) **classificar** em sete espécies fechadas (`ok`, `ok-nao-relido`, `sumiu`, `auth`, `limite`,
`servidor`, `rede`), com a frase do tablet (`frases.ts`).

**O que o favoritar reaproveita**: o `mutate()` (a camada de rede única), o `errorFrom`, o prazo de 20 s, o `authFetch`
de escrita (o 401 não desloga), o `rateLimitGate`, o molde do barrado com a trava antes do `await`, as frases das
espécies (`rede`, `sem-resposta`, `auth`, `limite-com-prazo`/`limite-sem-prazo`, `servidor`, `generica`) e o `compor` da
N4-PR3.

**O que a N4-D35 muda em relação ao molde**: **não há releitura**. O `PUT /api/content` devolve a linha inteira (B5: 22
de 22 colunas, `GET` seguinte igual à resposta) e é ESSA linha que entra no cache (`saveContent`, só o `content.json`) e
na raiz — sem `GET`, sem sync. Consequências: (a) o `ok` carrega a `linha`, e um 200 cuja linha não é a pedida vira
genérica (`classificarFavoritar`, `packages/core/src/favoritar.ts:121`); (b) não há `ok-nao-relido` nem `sumiu` (o 404
sem releitura não sabe de quem fala: vira genérica); (c) **a trava é por música** (N4-R7: as outras estrelas seguem
ativas), `Map<id, valor>` em módulo (`apps/native/src/favoritar.ts`); (d) a família do limite é **`content-mutate`**
(`route.ts:233`), com gate próprio — o que exigiu tirar o literal `family=setlist-mutate` do `mutate()` (div. 1061).

### 1.4 O mock

**Não atendia** o `PUT /api/content`: o `do_PUT` de `aceite.py` só conhecia as rotas de setlist e caía no `404 Not found`
(`apps/native/src/fixtures/aceite.py:652-685` na `main`), e o `content` era uma lista estática. **No commit 1**, antes de
qualquer código: `PUT /api/content` com a semântica da rota real (`route.ts:225-326`) — update por campo, `is_favorite:
null` não grava, `updated_at` sempre, 404 `NOT_FOUND` sem a linha, 400 `VALIDATION_ERROR` com chave fora do schema
(`.strict()`), e **200 com a linha inteira**, o mesmo objeto que o `GET /api/content` seguinte serve (a B5); e o modo
`escrita-lenta` (a janela do "em voo"). Os modos de falha das escritas do N2 (`escrita-401`, `-429`, `-500`, `-404`,
`-corta`, `-pendurada`) valem para a rota nova sem mudança. Conferido à mão antes do commit (`curl`: 200 com a linha,
400 com `chave_a_mais`, 404 com id desconhecido, o `GET` seguinte com `is_favorite: true`).

### 1.5 O prefetch de hoje, e a base do G-inv

- **Garantido** (`apps/native/src/prefetch.ts:61-68` na `main`): `urlsGarantidas` = a janela de 7 dias (`selectPrefetch`
  com "nada no disco"), razão `7d`; **teto de retenção** `CAP_BYTES` = 200 MB (`:34`); **despejo**: `aplicarLru`
  (`:273-283`) protege os garantidos, despeja o resto por desuso, e emite `lru over` quando só os protegidos passam do teto.
- **A base do G-inv depende de arquivo não baixado, sim** — em dois lugares:
  - `B3-referencia-paisagem/REF-S3-S3e-nao-baixado-{avd,tab}-pai.xml`, o S3e: a música 5 da fixture aponta para
    `nao-existe.pdf`, que o servidor de arquivos responde **404** (`fixture.py:13-16`, `:136`), e o roteiro a abre **em
    avião** (`roteiro.py:228-231`);
  - os seis S1 da `B5-baseline/` (`setlists`, `aviso-sem-rede`, `S1e-falha-com-cache`, AVD e Tab): o cartão da setlist 1
    diz *parcial · 1 de 2 arquivos baixados* — o `nao-existe.pdf` é o que falta (`grep` nos seis XML).
- **Com a garantia ligada o roteiro continua produzindo os dois estados**: o `nao-existe.pdf` dá 404 em todo plano e
  nunca chega ao disco (medido no §4: `download-error nao-existe.pdf …` e o arquivo ausente). E a garantia **dispensa**
  os dois remédios de estado de dado que a base pedia: a 12p não depende mais de o palco rodar antes do S1, e a 1p não
  depende mais do relógio (div. 1050, o `estado-1p.py` da N4-PR4) — as duas baixam no primeiro sync.

### 1.6 O N4-R26

Define: o conjunto garantido (todo `file_url` com `body === 'file'`, protegido do LRU), a linha do plano em par, os
estados transitórios, e — quando o teto não comporta — que *"os garantidos não se despejam; o que não coube fica arquivo
não baixado, e o sinal é a linha `lru over`"*. **Não define** como o plano decide o que "não coube" (o tamanho só se
conhece depois do download, div. 112), nem a **prioridade** entre arquivo de setlist garantida e arquivo só da
biblioteca. **Parei e perguntei** (opções: 7d primeiro e para no teto · baixa tudo sem parar · para no teto sem
prioridade) → **N4-D88** (§0).

### 1.7 As frases da tabela das que ficaram fora do core (N4-PR3 §1.1) que esta PR reusa

**Uma**: a linha 10, *{n} resultado(s)* — a P-F8 (N4-E5), `apps/native/src/screens/SearchScreen.tsx:156`, para a régua
de L. Passa ao core (`nResultados`, `packages/core/src/frases-content.ts`, na lista do G-tok). **A cópia da S4 fica**: o
molde da N4-PR3 (*"nenhuma cópia na tela"*) exigiria a S4 importar do core, e esta PR não muda tela (div. 1064). O gate
de igualdade lê o template **do fonte** da S4 e prova que ele e o core dão o mesmo texto para 0, 1, 2 e 57
(`apps/native/test/frases-n4.test.ts`, (3)); a PR-7 troca a cópia pela importação.
As frases de arquivo (*arquivo não baixado*, *baixando o arquivo…*, *não consegui baixar*, linhas 7–9) **não** entram:
o estado do arquivo do core é dado (`tipo` e o `motivo` do `files.ts`), não frase — quem as mostra é a tela, na PR-7.

---

## 2. O que a PR entrega

| | onde | o quê |
| --- | --- | --- |
| **a lista** (N4-R4) | `packages/core/src/biblioteca.ts` | `ordenarBiblioteca`: alfabética sem acento, por unidade de código; as favoritas não sobem |
| **os filtros e a busca** (N4-R5, N4-R11) | `biblioteca.ts:98` `consultarBiblioteca` | tipos por "ou" (nenhum = todos), *Favoritas* por "e", a busca da S4 sem o corte de 50 (N4-D90); devolve os itens, o `n` e as **cinco contagens da biblioteca inteira** |
| **a régua** (P-F8) | `frases-content.ts` `nResultados` | *1 resultado* · *{n} resultados* |
| **o favorito no tipo** | `types.ts:43` | `is_favorite?: boolean \| null` |
| **o favoritar, core** (N4-R7, R8) | `packages/core/src/favoritar.ts` | `pedidoFavoritar` (o corpo da fixture), `classificarFavoritar` (as seis espécies), `classificarFavoritarBarrado`, `avisoDoFavoritar` (o nome da estrela · a frase) |
| **o favoritar, tablet** (N4-R7, R9) | `apps/native/src/favoritar.ts` | só online; sem otimismo; a trava e o estado em voo **por música**, em módulo (`estadoDoFavoritar`, `assinarFavoritar`); gate `content-mutate`; a linha devolvida no `content.json` (`saveContent`) e na raiz (`ligarCacheDoFavoritar`, ligado no `App.tsx`) |
| **a garantia** (N4-R26, N4-D88) | `offline.ts` `urlsDaBiblioteca` · `planoDaBiblioteca`; `prefetch.ts` `prefetchDaBiblioteca` · `urlsGarantidas` · `aplicarLru` | todo arquivo da biblioteca garantido e protegido; 7d primeiro, a biblioteca até o teto; `prefetch plan … reason=library` |
| **o estado do arquivo** (N4-D43) | `offline.ts` `estadoDoArquivo` · `ehFormatoQueOAppMostra`; `files.ts` `estadoDosDownloads` · `assinarDownloads` | sem arquivo · formato (pela extensão: só `.pdf` se mostra) · baixado · baixando · falhou (com o motivo do `files.ts`) · não baixado |
| **o mock** | `apps/native/src/fixtures/aceite.py` | `PUT /api/content` e o modo `escrita-lenta` |
| **o catálogo** | `docs/native/LOGS-OCTAVIA.md` | a errata N4-PR5: `reason=7d` → `reason=library`; a família `content-mutate`; as duas linhas do favoritar |

**O teste da L2** (`apps/native/test/garantia.test.ts`, *"L2 — o `updated_at` muda…"*): um sync traz a música com outro
`updated_at` e o mesmo `file_url` — o arquivo fica no disco, o plano seguinte é `n=0`, nada baixa de novo e o LRU não
o toca.

---

## 3. Testes antes e depois, e os controles negativos

**Commit 1 sobre a `main`** `[medido: commit1-reprovando.txt]`: **9 de 9 arquivos reprovam**, 38 testes vermelhos (57 dos
testes vizinhos passam, 15 pulados — os do favoritar do tablet, que não sobem sem o módulo):

| arquivo | antes (commit 1) |
| --- | --- |
| `packages/core/src/biblioteca.test.ts` · `favoritar.test.ts` | o arquivo reprova na importação (os módulos não existem) |
| `packages/core/src/garantia.test.ts` | 11 ✗ |
| `apps/native/test/garantia.test.ts` | 12 ✗ · 1 ✓ (o teto continua 200 MB) |
| `apps/native/test/favoritar.test.ts` | o arquivo reprova (`src/favoritar` não existe; 15 pulados) |
| `apps/native/test/frases-n4.test.ts` | 2 ✗ (a P-F8: `nResultados` não existe, e o contador do instrumento — div. 1057) |
| `apps/native/test/prefetch-fila.test.ts` | 11 ✗ (o `prefetchDaBiblioteca` não existe) |
| `apps/native/test/apos-escrita.test.tsx` · `s2-edicao.test.tsx` | 1 ✗ cada (`reason=7d` ≠ `reason=library`) |

**Depois** `[medido: suite.txt]`: a suíte inteira **130 arquivos ✓ · 3 pulados; 1507 testes ✓ · 59 pulados; 0 ✗**, exit 0
(a N4-PR4 fechou em 125 · 1427).

**Controles negativos** (regra 4), cada um desfeito com `git checkout`, `git status --short` vazio depois `[medido: cn.txt]`:

| CN | o que se plantou | quem reprova |
| --- | --- | --- |
| a | a ordem com o acento pesando (a chave sem o NFD) | `biblioteca.test.ts`: 2 ✗ |
| b | os tipos combinando por "e" | `biblioteca.test.ts`: 8 ✗ (a tabela verdade) |
| c | uma contagem que muda com a busca (contada sobre o que sobrou) | `biblioteca.test.ts`: 1 ✗ (*as mesmas em toda consulta*) |
| d | uma chave a mais no corpo do favoritar | core 1 ✗ e tablet 6 ✗ — o corpo contra a fixture, e o mock recusa (400) |
| e | o cache atualizado antes da resposta (otimismo) | `favoritar.test.ts` (tablet): 7 ✗ — o *content.json intacto durante o voo* e o *cache não muda* de cada espécie |
| f | um arquivo da biblioteca fora do plano | 8 ✗ (core 2, tablet 6) |
| f2 | (a mais) o conjunto garantido de volta à janela de 7 dias | tablet: 4 ✗ — o que o LRU protege, a parada no teto, o órfão, a promoção; os do W4-b3 (`palco-divida.test.ts`) seguem verdes |

---

## 4. No AVD, com o mock

**O aparato** (`APARATO.md` lido inteiro antes): AVD `octavia_tab32` subido com `-no-snapshot-save`; estado lido
`stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, `reverse` vazio, dev client de `2026-09-24 14:00:01`
`DEBUGGABLE` `[medido: avd/avd-lido.txt]` — o mesmo da N4-PR4. Fixture do pre-check do N3 (`fixture.py`, *hoje* =
2026-09-23, a da base), mock `aceite.py` **desta árvore** na 8788, arquivos na 8790, Metro desta árvore **sem `CI=1`**,
`--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; `apps/native/.env` por `cp -p` do checkout principal
(sha256 `f2bfa179cd8e4b1f…`, o mesmo da N4-PR4; nenhum valor lido) **apagado no fim**. **O bundle servido conferido**
(regra 13) `[medido: avd/bundle-conferido.txt]`: `reason=library` 3 · `content-mutate` 7 · `prefetchDaBiblioteca` 8 ·
`localhost:8788` 1 · `octavia.rocks` **0** (os dois `reason=7d` do bundle são comentários: `apos-escrita.ts` e
`prefetch.ts`). Rede ligada pelo `ping` (2/2).

### 4.1 Um sync com rede `[medido: avd/sync-com-rede.txt, avd/arquivos-antes.txt, avd/arquivos-depois.txt]`

```
OCTAVIA: sync ok setlists=3 content=12 pages=1 t=108
OCTAVIA: prefetch plan n=3 reason=library
OCTAVIA: file src=download name=partitura-12p.pdf bytes=4198 total=4198 ms=118
OCTAVIA: file src=download name=partitura-1p.pdf bytes=643 total=643 ms=143
OCTAVIA: download-error nao-existe.pdf: Call to function 'FileSystemDownloadTask.start' has been rejected.
```

- **A razão nova no log**: `prefetch plan n=3 reason=library` — os três arquivos da fixture com `body === 'file'`.
- **Todo arquivo da fixture que existe no servidor está no disco**, no **durável** (`files/octavia-<uid>/files/`):
  `partitura-12p.pdf` 4198 B e `partitura-1p.pdf` 643 B, os tamanhos da fixture; o `nao-existe.pdf` dá 404 (o servidor
  de arquivos registrou o `GET … 404`) e fica fora — é o caso que a base precisa (§1.5). A 12p é da setlist 1 (sem
  data) e a 1p da setlist 2: **nenhuma das duas veio pela janela de 7 dias** (com o relógio de hoje, a setlist 2 está
  fora dela — div. 1050).
- **O teto respeitado**: 6 entradas no `files-index.json`, ≈ 270 KB contra 200 MB; nenhuma `lru evict`, nenhuma `lru
  over`. Os arquivos que o AVD já tinha (dois PDFs `ux-audit` da conta de audit, de 2026-09-14) são **órfãos** para a
  biblioteca do mock: ficaram (abaixo do teto o LRU não despeja), e o do purgável **não** foi promovido (não é da
  biblioteca). O host do bucket no `files-index.json` está trocado por `<host>` no anexo (regra 2, div. 137).
- `FATAL` **0**; o mock recebeu exatamente `GET /api/setlists` e `GET /api/content` — nenhum `PUT` (nada favorita sem
  tela).

### 4.2 Em avião, nada se perde (regra 11) `[medido: avd/aviao.txt]`

Avião ligado com o estado lido (`airplane=0 wifi=1 data=1` da sessão); a prova é o `ping` → `connect: Network is
unreachable`. App parado e aberto de novo: `cache hit kind=setlists n=3` · `cache hit kind=content n=12` · `sync skip
reason=offline`; os dois PDFs no durável com o **md5 igual ao da fixture** (`ad81bb81…`, `2437b35e…`); `FATAL` 0. O plano
roda também em avião (`prefetch plan n=1 reason=library` → `download-error nao-existe.pdf`) — comportamento de antes (o
`prefetch7Dias` rodava depois do sync pulado), agora sobre a biblioteca: div. 1066. Avião desligado e rádio religado
(`ping` 2/2) para a passada do G-inv.

### 4.3 G-inv e o `g-inv-par`

**O arnês** é o da N4-PR4: o `roteiro.py` do pre-check do N3, a `passada4-final.py` e o `n3pr6.py` da N3-PR6, com as
mesmas três mudanças declaradas (a árvore, a porta e o prefixo por variável de ambiente — `instrumentos/copias.diff`, o
mesmo conteúdo do `N4-PR4-anexos/copias.diff`; difere só a notação dos hunks). Prefixo `N4P5`, paisagem (`ROT=0`): palco,
S1f, S2 com edição, reordenar, picker, folha, diálogo, S4 (pelo caminho de hoje, S1 → `buscar`); depois a passada de S1
e o S0 frio, por último (derruba a sessão). **27 capturas**, os três passos com exit 0 `[medido: avd/roteiros/]`. **Sem o
`estado-1p.py`** da N4-PR4: com a garantia, a 1p já estava no disco.

`[medido: avd/g-inv.txt, avd/g-inv-par.txt; dumps em avd/dumps/ com SHA256SUMS.txt]`

| base | AVD | Tab |
| --- | --- | --- |
| `B5-baseline/` (34) | **18 de 18 idênticos** — os seis S1 (com o *parcial · 1 de 2* e o *garantida offline* da base), S2 ×3, S4 ×2, picker ×2, reordenar, folha ×3, diálogo, S0 ×2 | 16 sem dump novo (não medido — div. 1060) |
| `B3-referencia-paisagem/` (18) | **9 de 9 idênticos** — o palco inteiro, **inclusive o `S3e-nao-baixado`** | 9 sem dump novo (não medido) |
| `g-inv-par` (8 declarados) | **4 de 4** — S2 ×3 e S4-resultados, byte a byte fora dos `SvgView` de tipo | 4 sem dump novo |

O gate imprime `G-inv: 18 de 34 idênticos · REPROVA ✗` e `9 de 18 · REPROVA ✗` — **o "reprova" é a metade do Tab**,
que o gate trata como falta (*"a invariante é para toda tela e estado da base"*), e não uma diferença: nenhuma chave do
AVD diverge. É a div. 1060: o prompt pede 34/34 e 18/18 e restringe o aparelho ao AVD. **O que esta PR prova**: com a
garantia ligada, o roteiro continua produzindo o S3e (o `nao-existe.pdf` dá 404 em todo plano) e o *1 de 2* do S1, e
nenhuma tela que existe muda no AVD.

### 4.4 O fim

`[medido: avd/fim.txt]` App parado; `FATAL` **0** no logcat desde o `logcat -c` do teste de avião (que cobre a passada
inteira do G-inv), e 0 no sync com rede antes dele; `reverse` removido (`[]`); rádio desligado, avião ligado,
`accelerometer_rotation` devolvido a 1 — `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, **igual ao lido**; `ping`
→ `Network is unreachable`; AVD desligado sem salvar (`emu kill`; o `ram.bin` segue de 2026-09-24 14:00). Metro, mock e
servidor de arquivos parados; **`apps/native/.env` apagado** (`ls` → *No such file or directory*); `git status` só com
este diretório.

---

## 5. Gates `[medido: gates-nativos.txt, gates-web.txt, tsc-lint.txt, suite.txt; G1/G2/G3 abaixo]`

| gate | resultado |
| --- | --- |
| testes desta PR | core: `biblioteca.test.ts` 24 · `favoritar.test.ts` 15 · `garantia.test.ts` 11; tablet: `garantia.test.ts` 13 · `favoritar.test.ts` 15 · `frases-n4.test.ts` 35 (com a (3)) — todos verdes; suíte 1507 ✓ |
| **o corpo do favoritar** (o gate da N4-PR1, agora com o lado do tablet) | web: `tests/gates/n4-favoritar-put.test.tsx` verde (o site intocado); **tablet**: `apps/native/test/favoritar.test.ts`, *"o que sai pelo fio é o corpo da fixture"* — os dois `PUT` byte a byte `packages/core/fixtures/favoritar-put.json` (64 B e 65 B); CN-d reprova |
| igualdade das frases (N4-PR3) e G-tok | `frases-n4` web e tablet verdes, com a (3) da P-F8; **G-tok PASSA**, strings de `.ts` **456 → 457** (o template do `nResultados`), 133 arquivos; cobertura PASSA |
| G1a / G1b | com o bloco ```` ```gates ```` do corpo: `G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)` — 41 arquivos derivados, 14 exceções declaradas, todas usadas; `G1b: só adição ✓` (0 linhas removidas nos testes do core) |
| G2 / G3 | `testIDs antes=80 depois=80` ✓ · `log( antes=68 depois=70` — **dois pares** de errata usados (`reason=7d` → `reason=library`; `family=setlist-mutate` → `family=${familia}`), linhas novas: as duas do favoritar ✓ |
| `gate:a20` | 0 acusações (169 literais examinados) |
| `gate:icones` | 0 acusações · 0 avisos |
| G-par | itens 16 · pares 9 · iguais 9 · **0 reprovações, lista vazia** ✓ |
| G-inv · `g-inv-par` | AVD: B5 **18 de 18**, B3 **9 de 9**, `g-inv-par` **4 de 4**; o Tab não medido (div. 1060) — §4.3 |
| site: G-back · G-palco · G-tok · cobertura · G-faixa (veredito) · CSS gerado | PASSA · PASSA (0) · PASSA · PASSA · PASSA · 4/4 — nenhum arquivo do site muda |
| `SHA256SUMS` | `DESIGN-V1` · `-N2` · `-N3` · `-N4` · `docs/ux/DESIGN-I1`: todos OK; `N3-PRECHECK-anexos/SHA256SUMS.txt` 355 OK (a base do G-inv intacta) |
| `tsc` | raiz 0 · core 0 · identidade 0 · nativo 0 (o `tsconfig.test.json`, informativo no CI, acusa 3 erros pré-existentes em `tests/ux-audit/harvest-populated.spec.ts`, arquivo que esta PR não toca) |
| lint | *No ESLint warnings or errors* |
| CI (`f5fb36d`) | **10 de 10 verdes** — `android-debug-apk` **13m18s** (job; run `37235047533`) · `build` 3m21s · `gates-nativos` 9s · `g-back` 33s · `g-tok` 24s · `g-palco` 10s · `g-faixa` 9s · `mudou-nativo` 6s · Vercel |

A saída do G1/G2/G3 com o bloco do corpo:

```
G1a — diff vazio em 41 arquivos DERIVADOS de apps/native + packages/core/src
  G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)
G1b — linhas REMOVIDAS ou ALTERADAS nos testes do core: 0
  G1b: só adição ✓
G2 — testIDs  antes=80  depois=80
  G2: antes ⊆ depois ✓
G3 — linhas log( antes=68  depois=70
  linhas que SUMIRAM (cada uma precisa de um PAR de errata com a substituta, ou de uma REMOÇÃO declarada):
      apps/native/src/api.ts	if (prazo !== null) log(`ratelimit retry-after=${prazo} family=setlist-mutate`)
      apps/native/src/prefetch.ts	log(`prefetch plan n=${plano.length} reason=7d`)
  G3: cada linha que sumiu tem par de errata com a substituta, ou remoção declarada ✓
  linhas NOVAS (declarar no commit e no catálogo):
      apps/native/src/api.ts	if (prazo !== null) log(`ratelimit retry-after=${prazo} family=${familia}`)
      apps/native/src/favoritar.ts	log(`write blocked op=${op} reason=${motivo}`)
      apps/native/src/favoritar.ts	log(`write op=${pedido.op} content=${pedido.content} status=${status} code=${code} ms=${ms}`)
      apps/native/src/prefetch.ts	log(`prefetch plan n=${plano.length} reason=library`)
```

**Extras declarados** (além do que o prompt nomeia): o segundo par do G3 (`family=`) e a mudança de assinatura do
`mutate()` (`escrita.ts` passa a família — div. 1061); o parâmetro de teto em `prefetchDaBiblioteca` e `aplicarLru` (só
para o teste da N4-D88; no `aplicarLru` o nome `CAP_BYTES` é sombreado de propósito, no molde do `store.ts`, para as
linhas `lru` ficarem byte a byte as mesmas); o `saveContent` no `store.ts` (a linha `cache write kind=content` passa a
sair de `gravarContent`, o molde do `gravarSetlists`); o rename `prefetch7Dias` → `prefetchDaBiblioteca` (o nome
mentiria) com os dois chamadores (`App.tsx`, `apos-escrita.ts`) e o `prefetch-fila.test.ts`; a ligação do cache do
favoritar no `App.tsx` (sem ela a linha devolvida não chega ao que a raiz mostra — regra 15); o CN f2.

---

## 6. Os blocos de declaração desta PR

```gates
# N4-PR5 — core da biblioteca, sem tela (N4-R4, R5, R7, R11, R26; N4-D88, N4-D89, N4-D90).
# Core: a lista/filtros/busca (biblioteca.ts, novo), o favoritar (favoritar.ts, novo), a garantia e o estado do arquivo (offline.ts), is_favorite no tipo (types.ts), a P-F8 (frases-content.ts), as exportações (index.ts).
# Tablet: o favoritar (favoritar.ts, novo), saveContent (store.ts), a família no mutate (api.ts, escrita.ts), o plano da biblioteca e o teto (prefetch.ts), o estado de download (files.ts), o novo nome do plano (apos-escrita.ts, App.tsx) e a ligação do cache do favoritar (App.tsx). Nenhum arquivo de tela.
g1a: apps/native/App.tsx
g1a: apps/native/src/api.ts
g1a: apps/native/src/apos-escrita.ts
g1a: apps/native/src/escrita.ts
g1a: apps/native/src/favoritar.ts
g1a: apps/native/src/files.ts
g1a: apps/native/src/prefetch.ts
g1a: apps/native/src/store.ts
g1a: packages/core/src/biblioteca.ts
g1a: packages/core/src/favoritar.ts
g1a: packages/core/src/frases-content.ts
g1a: packages/core/src/index.ts
g1a: packages/core/src/offline.ts
g1a: packages/core/src/types.ts
g3-velha: log(`prefetch plan n=${plano.length} reason=7d`)
g3-nova: log(`prefetch plan n=${plano.length} reason=library`)
g3-velha: if (prazo !== null) log(`ratelimit retry-after=${prazo} family=setlist-mutate`)
g3-nova: if (prazo !== null) log(`ratelimit retry-after=${prazo} family=${familia}`)
```

```gates-web
# N4-PR5 — nenhum arquivo do núcleo do G-back tocado; nenhum arquivo do site (app/, components/, lib/, hooks/) muda.
# O core muda (packages/core/src): a P-F8 entra em frases-content.ts (na lista do G-tok desde a N4-PR3) — texto byte a byte o da S4 do tablet, sob o gate de igualdade (apps/native/test/frases-n4.test.ts (3)).
```

---

## 7. Por aceite: o que esta PR prova, e o que fica

| aceite | esta PR (core, executor) | fica para |
| --- | --- | --- |
| **A-N4-4** | a ordem sobre a fixture do N3 (os 12 títulos, *Águas* primeiro) e as regras (acento, caixa, favoritas não sobem, ordem total) — `biblioteca.test.ts`; CN-a | **PR-7**: o dump de L igual à ordem do teste |
| **A-N4-5** | a tabela verdade (16 conjuntos × Favoritas × 4 termos) contra o oráculo; as cinco contagens iguais em toda consulta; o tipo fora do enum; CN-b, CN-c | **PR-7**: os nomes acessíveis P-F9 no `content-desc` (as funções já são da N4-PR3) e os dumps |
| **A-N4-7** | o corpo pelo fio contra a fixture; durante o voo, o estado da música e o `content.json` intacto; depois do 200, a linha devolvida no cache, sem `GET`; a trava por música; sair (desassinar) não cancela; CN-d, CN-e — **tudo no mock, em teste** | **PR-7/PR-8**: a estrela `enabled=false` no dump, o logcat no aparelho; **PR-9**: em prod (A-N4-27) |
| **A-N4-11** | o mesmo conjunto da S4 para os mesmos termos (≤ 50 acertos), e o corte de 50 como a única diferença (N4-D90) | **PR-7**: os dumps de L com busca |
| **A-N4-26** | **core**: o conjunto garantido = todo `file_url` com `body === 'file'`; o LRU não despeja garantido (só o órfão); a parada no teto (N4-D88) com o `lru over`; a promoção; a L2; a linha `prefetch plan … reason=library` no G3 em par e no catálogo. **No AVD, além do que o prompt pedia ao core**: o sync com a razão nova, os arquivos no durável, o teto, o avião (§4) | **PR-9**: *baixando* e *falhou* vistos na linha e em V, o teto reduzido no mock com o *não baixado* na tela, o `run-as` do índice contra a fixture no Tab, e o olho do Marcel (o tempo até tudo baixar) |

E A-N4-8 e A-N4-9 têm aqui a parte de core que eles pressupõem (as seis espécies com a frase; o barrado `offline` sem
request), sem tela — os dumps são da PR-7/PR-8/PR-9.

---

## 8. Divergências — 1057 a 1068

A última usada era a **1056** (`N4-PR4-anexos/README.md` §8) `[medido: git grep -h -o -E '^\| \*\*1[0-9]{3}\*\*' -- docs
| sort -u | tail -4` → `1054 · 1055 · 1056 · 1138`, o último uma linha de medida]. Origem: **P** premissa do prompt ·
**D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
| --- | --- | --- | --- |
| **1057** | T | o teste (3) do `frases-n4` contava **duas** ocorrências do template da P-F8 na S4; há **uma** (a `Regua` exportada, que a S4 e o picker usam). No commit 1 ele reprovava também por isso — por uma razão errada | consertado no instrumento, no commit 2 (`dead391`), com o comentário no próprio teste (regra 32) |
| **1058** | D | o N4-R26 não define o mecanismo de "o que não coube" (o tamanho só existe depois do download, div. 112) nem a prioridade entre arquivo de setlist garantida e arquivo só da biblioteca; e, lido ao pé da letra, "o que não coube fica não baixado" + "o sinal é `lru over`" se contradizem (`lru over` só sai com o disco ACIMA do teto) | **N4-D88** (§0): 7d primeiro, a biblioteca para quando o total passa do teto; o estouro de até 3 arquivos é o que faz o `lru over` sair |
| **1059** | P | *"nenhum `.env*` real"* × *"No AVD, com o mock"*: o Metro do dev client precisa do `apps/native/.env` (as chaves públicas do Firebase em `firebase.ts`) para restaurar a sessão de audit do AVD | autorizado pelo Marcel nesta sessão: `cp -p`, sha256 no anexo, nenhum valor lido, **apagado no fim** (§4.4) |
| **1060** | P | o prompt da PR-5 excluiu o Tab (*"aparelho, nesta PR, é só o AVD"*) e pediu *"G-inv 34 de 34 e 18 de 18"*: metade da base é do Tab (B5: 18 AVD + 16 Tab; B3: 9 + 9) | o G-inv mediu a metade do AVD (§4.3, e de novo sobre o conserto, §10.3); **a PR-6 mede o G-inv nos dois aparelhos** |
| **1061** | D | o N4-R7 não diz que linha de log o favoritar emite (o `write op=` do catálogo é de setlist, com `setlist=` e `items=`), e o `mutate()` escrevia `family=setlist-mutate` literal — um 429 do favoritar sairia com a família errada | **N4-D89** (§0): duas linhas novas e o segundo par do G3 (`family=${familia}`); catálogo com a errata N4-PR5 |
| **1062** | D | *"a busca local de hoje (N4-R11)"* e o A-N4-11 (*"o mesmo conjunto de resultados da S4"*) × o `searchIndex` da S4 cortar em 50 (`search.ts:58`), o que, composto com filtros e ordem alfabética, esconderia músicas | **N4-D90** (§0): sem o corte; mesmo conjunto quando a S4 não corta |
| **1063** | A | no aparelho, o 404 do download chega como `Call to function 'FileSystemDownloadTask.start' has been rejected.` — sem o status; o `falha()` do `files.ts` não o reconhece, e a frase de tela é a genérica *não consegui baixar*. No teste (duplo) o mesmo 404 dá *o servidor respondeu 404*. O estado *falhou* tem motivo, mas no aparelho o motivo de um 404 é o genérico | **PR-9** (o aceite de *falhou* com mock de 404, A-N4-26): medir a mensagem inteira (`→ Caused by`) e decidir se o motivo do 404 se recupera; registro aqui |
| **1064** | P | o molde da N4-PR3 para a frase que vai ao core é *"nenhuma cópia na tela"* (a tela importa) × *"nenhum arquivo de tela muda"* | a P-F8 entra no core e a cópia da S4 fica, sob o gate de igualdade que lê o fonte da S4; a **PR-7** troca a cópia pela importação (§1.7) |
| **1065** | A | um sync cujo `GET /api/content` leu ANTES de um `PUT` do favoritar e termina DEPOIS dele aplica a foto velha: o `reconcileByUpdatedAt` substitui o que difere, não o que é mais novo, e a estrela volta ao estado de antes até o próximo sync (que traz o certo) | **fechada nesta PR pela N4-D91** (§10): medida reprovando (`2d27ad3`) e consertada (`5e3bcdd`) |
| **1066** | D | o plano roda também sem rede (o `prefetchEArrumar` corre depois do sync pulado — já era assim com o `prefetch7Dias`): em avião, cada arquivo que falta vira um `download-error` por abertura, e o estado do arquivo dessas músicas vira *falhou* com o motivo genérico (§10.4). Com a biblioteca inteira no plano, o número de linhas cresce com a biblioteca | **PR-7** (**N4-D92**): é na tela de L que isso apareceria como *não consegui baixar* quando o certo, sem rede, é *arquivo não baixado*. Nesta PR, só o registro (§10.4) |

| **1067** | T | o teste da N4-D91, na primeira corrida, esperava 5 s e estourava: o `syncSegurado` era `async` e devolvia a promise do sync, que a função adotava — o teste esperava o sync que ele mesmo segurava | consertado no instrumento antes do commit 1 do conserto (o voo devolvido dentro de um objeto, com o comentário no teste) |

| **1068** | T | o `gates` do corpo editado reprovou sobre o `e33801e` (run `37241700320`): editei o corpo da PR — o `sync.ts` como exceção do G1a — **antes** do push do `5e3bcdd`, e o evento `edited` rodou o gate contra o head velho, que ainda não tocava o `sync.ts` (exceção declarada e não usada reprova, div. 339). Classificação (regra 16): **(a) árvore** — a ordem do meu gesto, não o runner nem defeito; nenhum rerun | sobre o `5e3bcdd` o mesmo gate passa (run `37241704838`). A ordem certa é **push primeiro, corpo depois** quando a exceção nova é do commit novo |

**Contagem**: 12 — D 4 · P 3 · A 2 · T 3 · X 0. **Fechada nesta PR**: a 1065 (N4-D91). **Destino mudado**: a 1066
(N4-D92, PR-7). **Próxima divergência livre: 1069.**

---

## 9. Contabilidade

| | |
| --- | --- |
| requests a prod / escritas em prod | **0** / **0** |
| requests a terceiros | a renovação de token do Firebase do AVD (sessão de audit, `auth refresh=cached` no log: nenhuma renovação forçada) |
| mock | `GET /api/setlists` e `GET /api/content` por abertura; **0 `PUT`** no AVD (nada favorita sem tela); os `PUT` do favoritar só nos testes, contra o mock local |
| aparelho | AVD `octavia_tab32` com `-no-snapshot-save` (nada regravado; §4.4). **Tab S6: não tocado** (conectado ao cabo durante a sessão) |
| `.env*` | `apps/native/.env` por `cp -p` (sha256 `f2bfa179cd8e4b1f…`), só para o Metro, apagado no fim — autorizado (div. 1059) |
| temporários | o arnês (`roteiro.py`, `passada4-final.py`, `n3pr6.py`, `n3.py`, `cap.sh`, `fixture.py` — cópias declaradas, o mesmo `copias.diff` da N4-PR4, em `instrumentos/copias.diff`), a fixture gerada, o bundle baixado, os PNG das capturas, os logs do Metro e do mock: no scratchpad da sessão, fora do commit |
| agentes | 0 |

---

**Nota para a PR-6** (a primeira do bloco a mexer em tela): o arnês do G-N3 tem de **tirar os dumps rolados** (`ROLAR=1`
do `n3pr3.py`; `g-n3.mjs … --rolada <dir>`) e **fechar a ocorrência do índice em retrato** — a div. 1054: o G-N3 da
N4-PR4 deu (e) = 6 na S2 em retrato (a linha 8 abaixo da dobra), o mesmo com o código da `main`, porque o arnês não tirou
os rolados. Com a PR-6 mudando o palco avulso (a barra sem o índice), um (e) que já está lá esconderia um que nasça.
E: com a garantia desta PR, o `estado-1p.py` da div. 1050 deixa de ser preciso — a 1p e a 12p baixam no primeiro sync
(§1.5, §4.1).

---

## 10. O conserto antes do merge — N4-D91 `[Marcel, 2026-10-04]`

*"A div. 1065 se conserta nesta PR, não na PR-9: o favoritar e o cache dele nasceram aqui."*

### 10.1 O teste, primeiro `[medido: d91-reprovando.txt]`

`apps/native/test/favoritar-sync.test.ts`, contra o mock de verdade. O instrumento: o `fetch` do teste segura a resposta
do `GET /api/content` **já lida** do mock — a foto é de antes do `PUT` — até o favoritar terminar, como uma rede lenta
faz com a resposta de um servidor que leu na hora. Quatro casos:

| caso | sobre o `e33801e` (`2d27ad3`) | depois (`5e3bcdd`) |
| --- | --- | --- |
| favoritar no meio do sync: o disco e o que o sync devolve à raiz com `is_favorite=true`; as linhas `cache write kind=content` (a do favoritar `invalidated=1`, a do sync `invalidated=0`) | **✗** `expected false to be true` | ✓ |
| desfavoritar no meio do sync: `is_favorite=false` | **✗** `expected true to be false` | ✓ |
| o `PUT` falha no meio do sync (`escrita-500`): o cache fica com o que o sync trouxe | ✓ (controle) | ✓ |
| o caso normal: o site muda a música **depois** do favoritar (desfavorita e renomeia, `updated_at` maior) — a linha do sync vence | ✓ (controle) | ✓ |

### 10.2 O conserto, e o critério

**O critério é o `updated_at` da linha** (`naoRegredir`, `packages/core/src/favoritar.ts`). O favoritar guarda, por música,
a última linha que o servidor devolveu (`linhasConfirmadas`, `apps/native/src/favoritar.ts`); o sync, depois do
`reconcileByUpdatedAt` e antes de gravar, põe essa linha no lugar da que ele leu **só se o `updated_at` dela for
estritamente maior** (`apps/native/src/sync.ts`). O `PUT` sempre grava `updated_at` (`app/api/content/route.ts:282-284`)
e devolve o valor gravado; a linha que ele devolve é a última escrita do servidor *até ali*.

- **Por que não a ordem das respostas**: a ordem de chegada não é a ordem em que o servidor leu ou gravou (a div. 232 do
  N2 mediu isso com as releituras); o que conta é o que o servidor gravou por último — e é isso que o `updated_at` diz.
- **Por que não quebra o caso normal**: se o site mudou a música depois do favoritar, o servidor tem um `updated_at`
  **maior** que o da linha confirmada, e o sync vence (o 4º caso do teste); se o sync leu **depois** do `PUT`, os dois
  são **iguais**, e o sync vence (é a mesma linha). Música que o sync não trouxe (apagada no site) não volta: só se
  troca o que o sync trouxe. `updated_at` que não parseia: vence o sync.
- **O menor que fecha o teste**: nada se poda — uma linha confirmada velha nunca vence (o servidor já tem `updated_at`
  igual ou maior), e o mapa tem no máximo uma linha por música favoritada na sessão.
- **A contagem e o log**: o `invalidated` é o do `reconcileByUpdatedAt`, calculado **antes**, contra o conjunto que o app
  tinha ao começar o sync — o conserto não o toca (o 1º caso do teste fixa `invalidated=0` na linha do sync; no AVD o
  sync deu `invalidated=79` nas duas rodadas, §10.3). **Nenhuma linha de log mudou**: G3 `log( 68 → 70`, os mesmos dois
  pares e as mesmas duas linhas novas de antes; nenhuma errata a mais.

**Controle negativo** `[medido: cn-d91.txt]`: o conserto desfeito no `sync.ts` (o sync volta a gravar o que leu) →
`Tests 2 failed | 554 passed` no nativo e no core — **só os dois testes novos da corrida**; desfeito, `git status` limpo.

### 10.3 Sobre a ponta `[medido: suite-d91.txt, g1g2g3-d91.txt, tsc-lint-d91.txt, avd2/]`

- **Suíte inteira**: 131 arquivos ✓ · 3 pulados; **1511 testes ✓** · 59 pulados; 0 ✗.
- **G1a/G1b** com o bloco do corpo **atualizado** (o `sync.ts` entra como a 15ª exceção): `G1a: DIFF VAZIO ✓ (e nenhum
  arquivo novo no escopo)` · `G1b: só adição ✓`. **G2/G3**: `testIDs 80 = 80` ✓ · `log( 68 → 70`, os dois pares ✓.
- **O gate do corpo do favoritar** (site e tablet): 20 ✓. **`tsc`**: raiz 0 · core 0 · identidade 0 · nativo 0. **lint**:
  limpo.
- **No AVD, com o mock** (o mesmo aparato do §4, de novo do zero: estado lido igual, `.env` por `cp -p` com o mesmo
  sha256 e apagado no fim; bundle servido com `naoRegredir` 5 · `linhasConfirmadas` 3 · `localhost:8788` 1 ·
  `octavia.rocks` **0**): o sync com rede deu as **mesmas linhas** da primeira rodada — `cache write kind=content n=12
  invalidated=79`, `prefetch plan n=3 reason=library`, os dois PDFs no durável, o 404 do `nao-existe.pdf`, `FATAL` 0.
  **G-inv do AVD**: **B5 18 de 18** e **B3 9 de 9** idênticos, `g-inv-par` **4 de 4** (27 capturas, prefixo `N4P5B`; o Tab de novo fora, div. 1060) `[medido: avd2/g-inv.txt]`; fim: estado igual ao lido, `FATAL` 0, AVD desligado sem salvar, `.env` apagado `[medido: avd2/fim.txt]`.

### 10.4 A div. 1066 → PR-7 (N4-D92): o que o estado do arquivo devolve depois de um plano rodado sem rede

Lido no código, **sem conserto** nesta PR. Sem rede, o `prefetchEArrumar` roda depois do sync pulado
(`apps/native/App.tsx:239`, `await prefetchEArrumar(anterior.setlists, anterior.contentById)`), o plano tenta cada arquivo
que falta, e o download rejeita. No `ensureFile` a rejeição entra no estado de download com a frase de tela do
`files.ts`: `falhas.set(url, fraseDaFalha(erro))` (`apps/native/src/files.ts:232`). A mensagem do Android sem rede não
traz status — no AVD: `Call to function 'FileSystemDownloadTask.start' has been rejected.` (§4.2) —, então o `falha()`
(`files.ts:583-586`) não acha `status: NNN`, e o `fraseDaFalha` (`:509`) devolve a genérica `FALHA_GENERICA` = *não
consegui baixar* (`:477`). O `estadoDoArquivo` do core (`packages/core/src/offline.ts:271-283`) devolve então
**`{ tipo: 'falhou', motivo: 'não consegui baixar' }`** — e não `{ tipo: 'nao-baixado' }`, que é o certo sem rede.
**Teste que cobre hoje**: só o caminho do 404 (`apps/native/test/garantia.test.ts:240`, *"a falha do plano de prefetch
também fica registrada"*); nenhum cobre o plano sem rede. Destino: **PR-7**, a primeira tela que lê o estado.

### 10.5 Herança nova, para o encerramento carregar

| item | origem | destino |
| --- | --- | --- |
| **a busca que continua dentro do palco (S4) corta em 50 resultados** — a N4-D90 tirou o corte só da biblioteca (`consultarBiblioteca`); a S4 e o picker seguem com o `searchIndex(indice, termo)` no padrão de 50 (`apps/native/src/screens/SearchScreen.tsx:189`, `Picker.tsx:174`; `packages/core/src/search.ts:58`) | N4-D90, N4-PR5 | **a nomear no encerramento do N4** |

### 10.6 O bloco ```` ```gates ```` como ficou (a cópia da regra do W4-b2)

O ```` ```gates-web ```` não mudou (§6). O ```` ```gates ```` ganha o `sync.ts`:

```gates
# N4-PR5 — core da biblioteca, sem tela (N4-R4, R5, R7, R11, R26; N4-D88, N4-D89, N4-D90).
# Core: a lista/filtros/busca (biblioteca.ts, novo), o favoritar (favoritar.ts, novo), a garantia e o estado do arquivo (offline.ts), is_favorite no tipo (types.ts), a P-F8 (frases-content.ts), as exportações (index.ts).
# Tablet: o favoritar (favoritar.ts, novo), saveContent (store.ts), a família no mutate (api.ts, escrita.ts), o plano da biblioteca e o teto (prefetch.ts), o estado de download (files.ts), o novo nome do plano (apos-escrita.ts, App.tsx) e a ligação do cache do favoritar (App.tsx); o sync não regride a linha do favoritar (sync.ts, N4-D91). Nenhum arquivo de tela.
g1a: apps/native/App.tsx
g1a: apps/native/src/api.ts
g1a: apps/native/src/apos-escrita.ts
g1a: apps/native/src/escrita.ts
g1a: apps/native/src/favoritar.ts
g1a: apps/native/src/files.ts
g1a: apps/native/src/prefetch.ts
g1a: apps/native/src/store.ts
g1a: apps/native/src/sync.ts
g1a: packages/core/src/biblioteca.ts
g1a: packages/core/src/favoritar.ts
g1a: packages/core/src/frases-content.ts
g1a: packages/core/src/index.ts
g1a: packages/core/src/offline.ts
g1a: packages/core/src/types.ts
g3-velha: log(`prefetch plan n=${plano.length} reason=7d`)
g3-nova: log(`prefetch plan n=${plano.length} reason=library`)
g3-velha: if (prazo !== null) log(`ratelimit retry-after=${prazo} family=setlist-mutate`)
g3-nova: if (prazo !== null) log(`ratelimit retry-after=${prazo} family=${familia}`)
```

### 10.7 CI

Sobre o `5e3bcdd`, **10 de 10 verdes** `[medido: gh pr checks 361]`: `android-debug-apk` **10m48s** (job; run `37241704858`) ·
`build` 4m04s · `gates-nativos` 10s · `g-back` 23s · `g-tok` 26s · `g-faixa` 12s · `g-palco` 10s · `mudou-nativo` 8s · Vercel.
Uma corrida vermelha no meio, classificada (regra 16): o `gates` `37241700320`, sobre o `e33801e` — div. 1068.

---

**A próxima PR desta lista** (N4-D72): **PR-6 — o palco avulso sem hospedeira**.
