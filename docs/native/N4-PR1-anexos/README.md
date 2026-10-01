# N4-PR1-anexos — gates (instrumento primeiro)

**PR** #354, branch `n4/pr1-gates`, árvore `../octavia-n4-pr1` sobre `origin/main` = `ea34421` (o merge da #353, o
pre-check do N4). `pnpm install --frozen-lockfile --offline`. **Nenhum** `.env*`, **nenhuma** request a prod,
**nenhum** aparelho. Fonte do bloco: [`N4-PRECHECK.md`](../N4-PRECHECK.md); esta PR é a **PR-1** da N4-D45 (§16).

- **Commits**: `0975e96` `test(n4): G-par, entrando reprovado` · `d44271a` `test(n4): gate do corpo do favoritar` ·
  `955f8f8` `test(n4): G-par — tipo fora do enum fora do par` (N4-D47) · o de docs (este README e os anexos).
- **Código de produto tocado**: nenhum. Arquivos novos: `tests/gates/n4-g-par.test.tsx`,
  `tests/gates/n4-favoritar-put.test.tsx`, `packages/core/fixtures/{g-par.json, g-par-reprovados.txt,
  favoritar-put.json}` — `packages/core/src`, `apps/native/src`, `app/`, `components/`, `lib/`, `hooks/` com diff vazio.
- **Texto das fixtures**: fabricado pelo projeto (regra 10 não alcança); nenhum título, artista ou texto real.
- `[medido]` = comando + saída literal nesta sessão, no arquivo citado.

| arquivo | o quê |
|---|---|
| [`g-par-1-medicao-com-a-lista-do-prompt.txt`](g-par-1-medicao-com-a-lista-do-prompt.txt) | a 1ª corrida, com a lista que o prompt previa (só as 2 de `sections[]`): **reprovação não declarada** do `tipo-fora-do-enum` — a div. 983 |
| [`g-par-saida.txt`](g-par-saida.txt) | a saída do G-par sobre o `955f8f8` (N4-D47), verde: reprova exatamente a lista (2) |
| [`g-par-cn.txt`](g-par-cn.txt) | os três controles negativos do G-par sobre o `0975e96` (a lista de 3) e o `git status` depois |
| [`g-par-cn3-lista-nova.txt`](g-par-cn3-lista-nova.txt) | o CN3 (declaração órfã) repetido sobre a lista nova do `955f8f8`, com o item movido |
| [`suite-os-dois-gates.txt`](suite-os-dois-gates.txt) | a suíte inteira (`--reporter=verbose`): cada teste dos dois gates, com o estado, e o total |
| [`favoritar-gravacao.txt`](favoritar-gravacao.txt) | a gravação da fixture do favoritar sobre a `main` (`CN_GRAVAR=1`), idempotente (sha256 igual antes e depois) |
| [`favoritar-cn.txt`](favoritar-cn.txt) | o controle negativo do favoritar e o `git status` depois |

---

## 1. G-par — o que ele compara

`tests/gates/n4-g-par.test.tsx`, projeto `web` do Vitest (jsdom, alias `@`).

- **(web)** o corpo do **painel principal** do tipo, como o `ContentDisplay` real o desenha — conferido no código:
  `components/content-viewer/ContentDisplay.tsx:22` `normalizeContentType(content.content_type)` → `LyricsDisplay` /
  `ChordDisplay` / `TabDisplay` / `SheetMusicDisplay` → `components/content/corpo-de-texto.ts` (`textoDaLetra`,
  `textoDaCifra`, `textoDaTab`, `textoDaNotacao`). O gate **monta** o componente e lê o primeiro
  `section[data-testid^="painel-"]`: o visualizador de PDF/imagem → `arquivo` (a URL); o corpo mono → `texto` (o
  `textContent`); senão → `sem-corpo`. O **segundo painel *Cifra*** da Letra e da Tab (`textoDosAcordes`, I1-E18)
  fica **fora do par**, declarado.
- **(nativo)** a validade e o corpo do contrato de leitura do core — `packages/core/src/content-contract.ts`
  `isValidContent` (`:51-74`) e `bodyOf` (`:77-83`): `ok/text` → `texto` (o `bodyOf`); `ok/file` → `arquivo` (o
  `file_url`, o que o palco abre); inválido → `sem-corpo` com o motivo.
- **Comparação**: `texto × texto` byte a byte; `arquivo × arquivo` pela URL; `sem-corpo × sem-corpo` igual (o motivo
  do core é impresso, não comparado); classes diferentes, diferente. **Normalização: nenhuma** (declarado no
  cabeçalho do gate). O pre-check propunha uma de fim de linha (A12); não foi preciso: nenhum `\r` na fixture.
- **Por que montar o componente e não chamar `textoDa*`**: o esboço do pre-check (`a12-g-par-fixture.txt`) chamava
  `textoDaNotacao` para toda Partitura; o `SheetMusicDisplay` decide **pelo arquivo primeiro** (`arquivoDe(url)`) e só
  mostra a `notation` sem arquivo — div. 984. Montando, o gate mede o que a tela desenha, não uma cópia da decisão.

### 1.1 A fixture — `packages/core/fixtures/g-par.json`

**No par (9)**: `letra` · `cifra-texto` · `tab-texto` · `partitura-pdf` (`file_url` `.pdf`, `content_data` null) ·
`letra-poluida-editor` (a forma do caso *"letra"* do `tests/gates/fixtures/editor-put-antes.json`: a linha inteira
no `content_data`, o aninhado velho e `annotations`) · `cifra-secoes-acordes-vazios` (N4-D38, variante 1 — a forma
do ordinal 3 da B2: poluída, `sections[]` com `chords` `""` e `lyrics` preenchida, o `chords` do topo diferente) ·
`cifra-secoes-completas` (variante 2 — a do ordinal 8: `name`, `chords` e `lyrics` preenchidos, o topo diferente) ·
`so-aninhado`. **8** desde o `955f8f8`: o `tipo-fora-do-enum` saiu pela N4-D47 (§1.5).

**Fora do par (6)**, cada um com a razão e o destino **Bloco D**, impressos e contados em toda corrida:
`cifra-em-lista` · `cifra-com-progression` · `tab-em-lista` · `partitura-com-notation` (sem arquivo) · `tipo-legado`
(`Guitar Tab`) · `tipo-fora-do-enum` (`Piano`, com `lyrics`: a forma do pre-check, A12). A herança, em tabela: §1.6.

### 1.2 A saída `[medido: g-par-saida.txt]` — sobre o `955f8f8`

```
G-par — itens 14 · pares comparados 8 · iguais 6 · diferentes 2 · fora do par 6
  IGUAL     letra                        web=texto(108)       nativo=texto(108)             [painel-letra]
  IGUAL     cifra-texto                  web=texto(48)        nativo=texto(48)              [painel-cifra]
  IGUAL     tab-texto                    web=texto(92)        nativo=texto(92)              [painel-tab]
  IGUAL     partitura-pdf                web=arquivo(79)      nativo=arquivo(79)            [painel-partitura]
  IGUAL     letra-poluida-editor         web=texto(44)        nativo=texto(44)              [painel-letra]
  DIFERENTE cifra-secoes-acordes-vazios  web=texto(123)       nativo=texto(84)              [painel-cifra]
  DIFERENTE cifra-secoes-completas       web=texto(39)        nativo=texto(8)               [painel-cifra]
  IGUAL     so-aninhado                  web=sem-corpo        nativo=sem-corpo:no-key       [painel-letra]
fora do par (6) — impressos e contados, não reprovam:
  diferente cifra-em-lista               web=texto(15)        nativo=sem-corpo:not-string   — … → Bloco D
  diferente cifra-com-progression        web=texto(19)        nativo=texto(4)               — … → Bloco D
  diferente tab-em-lista                 web=texto(21)        nativo=sem-corpo:not-string   — … → Bloco D
  diferente partitura-com-notation       web=texto(31)        nativo=sem-corpo:no-body      — … → Bloco D
  diferente tipo-legado                  web=texto(10)        nativo=sem-corpo:unknown-type — … → Bloco D
  diferente tipo-fora-do-enum            web=texto(38)        nativo=sem-corpo:unknown-type — … → Bloco D
lista esperada (2): cifra-secoes-acordes-vazios, cifra-secoes-completas
reprovados     (2): cifra-secoes-acordes-vazios, cifra-secoes-completas
G-par: reprova exatamente a lista esperada (2) ✓
```

A corrida do `d44271a` (antes da N4-D47) dava `pares comparados 9 · iguais 6 · diferentes 3 · fora do par 5`, com o
`tipo-fora-do-enum` na lista — a saída completa daquela lista está nas corridas do `g-par-cn.txt` (CN 1–3 e o "desfeitos").

(As razões do fora do par estão inteiras no anexo.) Os comprimentos entre parênteses são `.length` da cadeia
(texto) ou da URL (arquivo).

### 1.3 Entrar reprovado — o molde e a regra

**O molde seguido**: os dois que o prompt nomeia **não** verificam no CI "reprova exatamente a lista" — o G-N3 entrou
reprovando **à mão**, sobre dumps (`N3-PR1-anexos/G-N3-main-*.txt`; ele não está no CI), e a linha de base do G-faixa
(`tests/gates-web/medicoes/cn-main/`) é **excluída** do veredito do CI (`g-faixa-veredito.mjs:3-5`, *"sem descer em
subpastas"*) — div. 985. O que se usou: **a linha de base que reprova por construção, commitada** (do G-faixa) com
**a regra de aceitação das listas de exceção do projeto** — declarado e não usado reprova (regra 14, *"declaração
órfã reprova"*, W4-b1; no web, a div. 929).

- a lista é `packages/core/fixtures/g-par-reprovados.txt` (um id por linha; `#` comenta);
- reprovado **fora** da lista → `✗ reprovação NÃO DECLARADA: <id>`; da lista que **passa** (ou não existe na
  fixture) → `✗ declaração ÓRFÃ: <id>`; qualquer dos dois reprova o teste e o job;
- a PR-2 (o leitor, N4-D40) tira da lista as duas de `sections[]`; **lista vazia = o gate exige zero reprovações**,
  sem mudar o gate.

**A lista esperada hoje** (`955f8f8`): `cifra-secoes-acordes-vazios`, `cifra-secoes-completas` — as duas variantes de
`sections[]` e nada mais. Um terceiro **não estava previsto** no prompt: a 1ª corrida, com a lista das duas, deu
`✗ reprovação NÃO DECLARADA: tipo-fora-do-enum` `[medido: g-par-1-medicao-com-a-lista-do-prompt.txt]`. Não se
ajustou a fixture: o item entrou na lista no `0975e96` com a div. **983**, e saiu do par pela **N4-D47** (§1.5).

### 1.4 Os controles negativos `[medido: g-par-cn.txt]` (regra 4)

| CN | o que muda | o gate | exit |
|---|---|---|---|
| 1 | um byte do corpo de um item igual, **num lado só**: o leitor do web, `TabDisplay.tsx` — `textoDaTab(dados)?.replace("-", "=")` | `✗ reprovação NÃO DECLARADA: tab-texto` — só ele (os outros 8 pares inalterados) | 1 |
| 2 | tira `cifra-secoes-completas` da lista esperada | `✗ reprovação NÃO DECLARADA: cifra-secoes-completas` | 1 |
| 3 | põe `letra` (que passa) na lista esperada | `✗ declaração ÓRFÃ: letra (passa)` | 1 |
| — | os três desfeitos com `git checkout` | `G-par: reprova exatamente a lista esperada (3) ✓`; `git status --short` → só `?? docs/native/N4-PR1-anexos/` (este diretório, que entra no commit de docs) | 0 |
| 3′ | **sobre a lista nova** (`955f8f8`): o item movido, `tipo-fora-do-enum`, de volta à lista esperada `[medido: g-par-cn3-lista-nova.txt]` | `lista esperada (3)` × `reprovados (2)` → `✗ declaração ÓRFÃ: tipo-fora-do-enum (não existe na fixture)` — o item movido **não** ficou declarado; desfeito: `(2) ✓`, `git status` só com os anexos | 1 |

Os CN 1–3 rodaram sobre o `0975e96` (lista de 3); o CN 3′ é o 3 repetido sobre a lista da N4-D47. **O texto da órfã
diz *"não existe na fixture"* e o id existe — no `fora_do_par`**: o gate procura só no par. O veredito está certo (é
órfã: não é par, não pode reprovar); a frase não — div. 987.

### 1.5 N4-D47 — o tipo fora do enum sai do par

**N4-D47** `[Marcel, 2026-10-01]` (opção a da div. 983): o `tipo-fora-do-enum` sai do par e vai para a lista *fora do
par*, com a razão — o web mostra tipo desconhecido como Letra, o core declara `unknown-type`; **o comportamento que
vale é o do core**; nenhum item da conta principal está nesse caso (B2: 63 de 63 no contrato) — e destino **Bloco D**.
A div. 983 fica registrada como P, com esta decisão como destino. Feito no `955f8f8` (o item muda de lista na
fixture; a lista esperada fica com as duas de `sections[]`); a saída nova bate com a pedida — `itens 14 · pares 8 ·
iguais 6 · diferentes 2 · fora do par 6`.

### 1.6 Os seis fora do par — herança do Bloco D

Para o encerramento do N4 carregar. A coluna do dado real é a **B2** (a conta principal, 63 itens,
`N4-PRECHECK.md` §11) e, onde ela não fala, o snapshot da audit (A2, 66 itens).

| # | forma | o que o web faz | o que o core faz | existe no dado real? |
|---|---|---|---|---|
| 1 | Cifra com `chords` em **lista** de `{name, diagram, fingering}` | mostra cada acorde (nome, diagrama, dedilhado) no painel *Cifra* (`textoDosAcordes`) | `not-string` → placeholder | **não** — B2: as 3 Cifras têm `chords` string; audit: `chords` string ou ausente |
| 2 | Cifra com **`progression`** (`{seção: acordes}`) ao lado do `chords` | acrescenta `Seção: A - B` depois do corpo (`textoDaProgressao`) | mostra só o `chords` | **não** — B2 não achou a chave |
| 3 | Tab com `tablature` em **lista** de linhas | junta as linhas com `\n` (`textoDaTab`) | `not-string` → placeholder | **não** — B2: as 2 Tabs com `tablature` string; audit: 8 de 8 string |
| 4 | Partitura **sem arquivo**, com `notation` em texto | mostra a `notation` no corpo mono (`textoDaNotacao`; só sem `file_url`) | `no-body` → placeholder | **não** — B2/B4: a única Partitura tem `.pdf` |
| 5 | `content_type` **legado** (`Guitar Tab`, `Chord Chart`, `sheet_music`…) | traduz para o tipo (`normalizeContentType`) e mostra | `unknown-type` → placeholder | **não** — B2: os 63 nos quatro tipos do enum |
| 6 | `content_type` **fora do enum** (nem os quatro, nem apelido) | cai em **Letra** (`default: LYRICS`) e mostra a `lyrics` | `unknown-type` → placeholder — **o que vale** (N4-D47) | **não** — B2: 63 de 63 no contrato |

Em todas: o G-par as imprime e conta em toda corrida (`fora do par (6)`), sem reprovar. O que o Bloco D decide é o
lado do **web** (ler como o core, ou o dado ser migrado) — o core é a referência (N4-D47; N4-D4: o N4 não reabre o
web).

---

## 2. Gate do corpo do favoritar

`tests/gates/n4-favoritar-put.test.tsx`, no molde do `tests/gates/i1-editor-put.test.tsx`.

- **O caminho**, conferido no código (N4-PRECHECK A5): `LinhaDaBiblioteca.tsx:44-49` (o botão, `aria-pressed`) →
  `use-content-actions.ts:74-87` (`!content.is_favorite`) → `content-service.ts:600-601` `toggleFavorite` →
  `:530-546` `updateContent` → `fetch("/api/content", { method: "PUT", body: JSON.stringify({ id, ...content }) })`.
  O gate monta a **`RefactoredLibrary` real** com uma linha, acha o botão pelo **nome acessível** da linha
  (`lib.favoritar.nome` / `lib.favorita.nome`), clica, e guarda o corpo do `PUT`; espera a recarga terminar e a linha
  mostrar o estado novo antes de acabar.
- **A fixture** — `packages/core/fixtures/favoritar-put.json`, gravada sobre o código da `main` (`CN_GRAVAR=1`,
  `[medido: favoritar-gravacao.txt]`; regravar dá o mesmo sha256):
  - favoritar: `{"id":"00000000-0000-4000-8000-0000000000f1","is_favorite":true}` (64 B)
  - desfavoritar: `{"id":"00000000-0000-4000-8000-0000000000f1","is_favorite":false}` (65 B)
  — o corpo da A5, **valor absoluto**, sem `content_data`, sem a linha.
- **O esquema**: a rota valida com `contentSchemas.update.safeParse(body)` (`app/api/content/route.ts:244`; o teste
  confere o texto da rota); os dois corpos passam; com `chave_desconhecida` não passam (`unrecognized_keys`, o
  `.strict()` de `lib/api-schemas.ts:197`). Uma chave **ignorada** (`user_id`, `created_at`, `updated_at`,
  `CONTENT_IGNORED_KEYS`, `:161`) seria descartada antes do `.strict()` — por isso a chave do teste não é uma delas.
- **O controle negativo** `[medido: favoritar-cn.txt]`: uma chave a mais (`"chave_a_mais":true`) no corpo
  **esperado** do favoritar → `× favoritar` (`enviado 64 B · fixture 84 B`, a diferença no `Expected`/`Received`) e,
  de quebra, `× favoritar: o corpo passa…` (o schema recusa a chave); desfeito → 5 passam, `git status` limpo fora
  este diretório.
- **Antes de commitar**: 1 falha em 5 corridas seguidas, depois 1 em 12 — o `desfavoritar` lia *"Favoritar"* num
  botão achado como *"Favorita"*. Causa: o **cache de módulo** do `content-service` e a recarga do teste anterior em
  voo. Consertado no instrumento (o cache limpo antes e depois de cada teste; o teste só acaba com a recarga
  terminada; o `GET` falso devolve o estado depois do `PUT`): **0 de 20** — div. 986.

### 2.1 O lado do nativo

**Não existe ainda e não se criou teste vazio nem `skip`.** A **PR-4** (core da biblioteca, N4-D45) traz o teste do
nativo — o corpo que a escrita do favoritar monta para `id` = o `id` da fixture — contra **esta mesma fixture**, byte
a byte.

**Onde a fixture mora, e por quê**: `packages/core/fixtures/` — fora do `src/` (não é código de produto: o
`tsconfig` do core inclui só `src`, e o G1 não a vê — *"nenhum arquivo novo no escopo"*), dentro do único pacote
que os três lados alcançam: os testes do core (`packages/core/**/*.test.ts`, projeto `core`) e os do nativo
(`apps/native/test/`, projeto `native`) a leem pelo caminho relativo com `fs`, e o web (`tests/gates/`) também. E
`packages/core/**` **não** está no `paths` do `native.yml` (recorte da N1-PR8): mexer na fixture não custa APK. A
fixture do G-par mora ao lado pelo mesmo motivo — e para que a PR-2, que esvazia a lista, toque **só**
`packages/core/**`.

---

## 3. CI

**O workflow escolhido: o `ci.yml`, job `build`** — nenhum YAML mudou nesta PR.

- `ci.yml`: `'on': pull_request: null` — **sem `paths`**: toda PR dispara o `build`. O passo
  `Test — a suíte, e com ela os gates embrulhados (W3, div. 129)` roda `pnpm test:unit` → `pnpm run test` →
  `pnpm exec vitest run` (`package.json:11,17`): **todos** os projetos, e o projeto `web` coleta `tests/gates/**`
  (`vitest.config.ts`: `include` padrão; o `exclude` tira `apps/**`, `packages/**`, `tests/ux-audit/**` e
  integração — não `tests/gates`). O passo não tem `continue-on-error`: reprovar reprova o job, que o ruleset exige.
  O `Test coverage` (`pnpm test:ci`) roda a suíte de novo.
- **A prova, por leitura do YAML**, de que uma PR que toque **só** `packages/core/**` dispara o G-par: o `ci.yml`
  não tem filtro de caminho nenhum (`pull_request: null`), então o `build` roda; o `build` roda o Vitest inteiro; o
  G-par está no projeto `web`, que não depende de quais arquivos mudaram. É o mesmo caminho que já embrulha o
  `gate:a20` e o `gate:icones` (W3). O que a PR-2 mudar em `packages/core/src/content-contract.ts` é importado pelo
  G-par (`../../packages/core/src/content-contract`) e medido na mesma corrida.
- **O mesmo vale** para o leitor do web (`components/**`), a rota e o schema do `PUT` (`app/api/content/route.ts`,
  `lib/api-schemas.ts`) e as fixtures: qualquer PR, qualquer caminho.
- **Esta PR não dispara o `native.yml`**: o `paths` dele é `apps/native/**`, `packages/identidade/**`,
  `.github/workflows/native.yml`, `.github/workflows/gates.yml` e `pnpm-workspace.yaml`; a PR toca `tests/gates/**`,
  `packages/core/fixtures/**` e `docs/**`. O `gates.yml` (G1/G2/G3) e o `gates-web.yml` rodam (sem `paths`).

**Os dois gates rodam na suíte** — não estão entre os 59 pulados `[medido: suite-os-dois-gates.txt]`, a suíte
inteira com `--reporter=verbose` sobre o `955f8f8`, exit 0:

```
 ✓  web  tests/gates/n4-favoritar-put.test.tsx > N4-PR1 — o corpo do PUT do favoritar da lista, byte a byte > favoritar (a linha com is_favorite=false)
 ✓  web  tests/gates/n4-favoritar-put.test.tsx > N4-PR1 — o corpo do PUT do favoritar da lista, byte a byte > desfavoritar (a linha com is_favorite=true)
 ↓  web  tests/gates/n4-favoritar-put.test.tsx > N4-PR1 — o corpo do PUT do favoritar da lista, byte a byte > grava a fixture (CN_GRAVAR=1, só no commit 2, sobre o código da main)
 ✓  web  tests/gates/n4-favoritar-put.test.tsx > N4-PR1 — o corpo da fixture contra o schema do PUT /api/content > a rota valida o corpo com contentSchemas.update
 ✓  web  tests/gates/n4-favoritar-put.test.tsx > N4-PR1 — o corpo da fixture contra o schema do PUT /api/content > favoritar: o corpo passa; com uma chave desconhecida, não passa (.strict())
 ✓  web  tests/gates/n4-favoritar-put.test.tsx > N4-PR1 — o corpo da fixture contra o schema do PUT /api/content > desfavoritar: o corpo passa; com uma chave desconhecida, não passa (.strict())
 ✓  web  tests/gates/n4-g-par.test.tsx > G-par (N4-PR1) — o mesmo content, o mesmo texto no web e no nativo > reprova exatamente a lista de g-par-reprovados.txt
 Test Files  120 passed | 3 skipped (123)
      Tests  1187 passed | 59 skipped (1246)
```

Dos 59 pulados, **1** é destes arquivos: o *"grava a fixture"*, `it.runIf(!!process.env.CN_GRAVAR)` — por desenho, só
roda para regravar a fixture; os 6 que provam (o G-par e os 5 do favoritar) rodam e passam.

**Gates locais sobre o commit 2** (base `ea34421`): G1a `DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)`, G1b
`só adição ✓`, G3 `nenhuma linha sumiu ✓`, G-back `PASSA` (núcleo intocado, nada novo no alcance), G-palco `PASSA
— 0`, G-tok `PASSA` (132 arquivos; 446 strings de `.ts`, o mesmo número do pre-check), cobertura `PASSA` (129 de
129). Suíte inteira: `Test Files 120 passed | 3 skipped (123)` · `Tests 1187 passed | 59 skipped (1246)`, exit 0.

**Checks da PR**: §7.

---

## 4. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# N4-PR1: nenhuma declaração — testes e fixtures; nenhum arquivo do escopo do G1/G2/G3.
```

```gates-web
# N4-PR1: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado; só tests/gates e packages/core/fixtures.
```

---

## 5. Divergências — 983 a 986

A última usada era a **982** (`N4-PRECHECK.md` §13; a §18 nomeia a 983 como a próxima livre)
`[medido: git grep -nE '^\| \*\*9[8-9][0-9]\*\*' -- docs]`.

Origem: **P** premissa do prompt · **D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **983** | P | *(fechada pela N4-D47 — o item vai ao fora do par, destino Bloco D; §1.5)* O prompt previa o G-par reprovando **nas variantes de `sections[]`**; a medição reprova também o **`tipo-fora-do-enum`**: o web cai em Letra no tipo desconhecido (`types/content.ts:19-42`, `default: return ContentType.LYRICS`) e mostra a `lyrics`; o core dá `unknown-type` (regra (d) do contrato). É o mesmo item que o pre-check já media diferente (A12, div. 965), com a forma da fixture de lá. **A PR-2 como a N4-D45 a descreve (só `sections[]`) não esvazia a lista** | **N4-D47** (opção a): sai do par para o fora do par, com a razão; vale o comportamento do core; destino **Bloco D** (§1.6, linha 6). Feito no `955f8f8` |
| **984** | D | O esboço do G-par no pre-check (`N4-PRECHECK-anexos/a12-g-par-fixture.txt`) lia a Partitura por `textoDaNotacao` mesmo com `file_url`; o `SheetMusicDisplay` decide pelo arquivo **primeiro** (`arquivoDe(url)`, `SheetMusicDisplay.tsx:24-27`) e só mostra a `notation` sem arquivo. O *"sheet-notation DIFERENTE"* do 6 de 13 media uma tela que não existe: com `.pdf`, o web mostra o PDF, como o palco | o G-par monta o componente (§1); a Partitura com notação entra no fora do par **sem** arquivo |
| **985** | P | *"siga o molde que o repositório já usa para gate que entra reprovando (G-N3, linha de base do G-faixa)"*: nenhum dos dois é verificado pelo CI como "reprova exatamente a lista" — o G-N3 roda à mão (`LOGS-OCTAVIA.md`, "Errata N3-PR1": *"não estão no CI"*), e a `cn-main/` fica fora do veredito do CI (`g-faixa-veredito.mjs:3-5`) | o molde declarado é a linha de base commitada (G-faixa) com a regra de aceitação da órfã (regra 14) — §1.3 |
| **986** | T | O gate do favoritar falhou **1 em 5** e **1 em 12** antes do commit: o cache de módulo do `content-service` e a recarga do teste anterior em voo trocavam a linha do teste seguinte | consertado no instrumento antes do commit 2 — 0 de 20 (§2) |
| **987** | T | A frase da órfã do G-par diz *"(não existe na fixture)"* para um id que existe no `fora_do_par` (CN 3′): o gate procura o id só no par. O veredito está certo; a frase afirma o que não é (caso 23: nome é afirmação) | **não consertado nesta PR** (o fecho não pedia commit de teste além do da N4-D47; extra não declarado não entra). Proposta para a PR-2, que mexe na lista: três textos — *"passa"*, *"está no fora do par"*, *"não existe na fixture"* |

**Contagem**: 5 — P 2 · D 1 · T 2. **Fechada**: a 983 (N4-D47). **Aberta**: a 987, com proposta para a PR-2.

---

## 6. Contabilidade

| | |
|---|---|
| requests a prod / a terceiros | **0** / **0** |
| aparelho · `adb` · Metro | **0** |
| `.env*` abertos | **0** |
| escritas | **0** |
| agentes | **0** |
| código de produto | **nenhum** (os três CNs que tocaram `TabDisplay.tsx` e as fixtures foram desfeitos com `git checkout`; `git status` no anexo) |
| arquivos | (commits de teste: `0975e96`, `d44271a`, `955f8f8`) `tests/gates/n4-g-par.test.tsx`, `tests/gates/n4-favoritar-put.test.tsx`, `packages/core/fixtures/g-par.json`, `g-par-reprovados.txt`, `favoritar-put.json`; `docs/native/N4-PR1-anexos/` |
| YAML | nenhum |
| APK | nenhum: a PR não toca caminho do `native.yml` |
| temporários | a cópia de segurança do teste do favoritar, as 12 saídas da caça ao flake e a saída inteira da suíte verbose, no scratchpad da sessão, fora do repositório |

---

## 7. Os checks da PR

Sobre o head `955f8f8` (o commit da N4-D47), **todos verdes**, antes deste commit de docs `[medido: gh pr checks 354]`
(duração no nível do **job**, como o `gh` a dá; `n=1` — não é referência):

| check | estado | duração |
|---|---|---|
| `build` (`ci.yml`: lint, type-check, `pnpm test:unit` com os dois gates, cobertura, `pnpm build`) | pass | 4m2s |
| `gates-nativos` (`gates.yml`: G1a/G1b, G2/G3, `shasum -c`) | pass | 10s |
| `g-back` · `g-palco` · `g-tok` · `g-faixa` (`gates-web.yml`) | pass | 29s · 14s · 28s · 10s |
| `Vercel` · `Vercel Preview Comments` | pass | — |

O `native.yml` **não** rodou (nenhum caminho dele na PR, §3). Sobre o `d44271a` o `build` também passou (4m21s).
O push deste commit (só `docs/**`) roda os mesmos workflows de novo.

---

**A próxima PR desta lista** (N4-D45): **PR-2 — o leitor** — o core lê `sections[]` (N4-D40). **Critério de saída**:
`packages/core/fixtures/g-par-reprovados.txt` **vazio** (só comentários) e o G-par, com a lista vazia, exigindo **zero
reprovações** — `G-par: reprova exatamente a lista esperada (0) ✓`, com `pares comparados 8 · iguais 8`.
