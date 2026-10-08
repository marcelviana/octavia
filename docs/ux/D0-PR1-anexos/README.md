# D-0-PR1 — o editor do site volta a salvar

> **Data**: 2026-10-08. **Base**: `origin/main` = `a613b1d` (o merge da #367, o pre-check da D-0). **Árvore**:
> `../octavia-d0-pr1`, branch `d0/pr1-editor-salva` (a árvore já existia, criada por uma tentativa anterior: `= origin/main`,
> limpa, sem commit, sem remoto, sem PR — usada como estava). **PR**: [#368](https://github.com/marcelviana/octavia/pull/368).
> **Fonte das decisões**: [`../D0-PRECHECK.md`](../D0-PRECHECK.md) (D0-D1…D20) e a §1 abaixo (D0-D21, D0-D22).
> `[medido]` = comando + saída nesta sessão, com o bruto em [`bruto/`](bruto/). Todo dado é **fabricado** (*Tab de régua
> D0*, *Autor fabricado*, `e|--1--3--|`); o compasso de exemplo que aparece no *antes* é texto do projeto.
> **Backend intocado** (G-back sem declaração) e **tablet intocado** (nenhum arquivo de `apps/native` nem de
> `packages/core/src`, §7).

## 0. Os commits

| sha | o quê |
|---|---|
| `9be3503` | **commit 1** — os gates, reprovando na `main` (§2) |
| `f5e2542` | **commit 2** — o conserto (§3) |
| `2d90f60` | **extra declarado** — o gravar do gate do `PUT` recusa com caso faltando (div. 1161, §2.3) |
| `08cdca6` | **commit 3** — o `EDIT-tab` remedido no G-faixa e as erratas da folha (§5) |
| `67e15b6` | docs — este anexo, depois do CI verde |
| `349b9c5` | **a conferência antes do merge** — o grupo (g) do gate da D-0: o editor não apaga o que não conhece (§13) |
| (este) | docs — a §13, depois do CI verde |

## 1. As decisões desta PR

| # | decisão | origem |
|---|---|---|
| **D0-D21** `[Marcel, 2026-10-08]` | A div. 1156 entra na D-0: o salvar de uma Cifra com `content_data` nulo falha pelo mesmo desenho da 1149. A D0-D3 continua valendo para o que excluiu: a inconsistência entre as seções e o `chords` antigo. | o prompt |
| **D0-D22** `[Marcel, 2026-10-08]` | **Null fica null**: o `content_data` nulo da linha que nenhum editor de tipo tocou vai `null` no corpo (o dado fica como está). Quando o `content_data` vai como objeto, a chave do tipo vai **sempre** (string; `""` se a linha não a tinha). | pergunta desta sessão, pela div. 1160 |

**Por que a D0-D22** (div. 1160): a premissa da D0-D21 — *"o mesmo conserto a resolve"* — contradiz o repositório. O core
lê a **Cifra escaneada** (`content_data` nulo + `file_url`) como **arquivo**: o palco mostra o PDF
(`packages/core/src/content-contract.ts`, `isValidContent`; N4-D49; o item `cifra-escaneada` do fora do par do G-par; 3 em
prod, M1). Mandar `chords: ""` em todo salvar faria um salvar só em *Detalhes* gravar `{ annotations: [], chords: "" }`, e o
palco passaria a mostrar texto vazio no lugar do PDF — **o tablet piora sem que um arquivo dele mude**. O mesmo desenho na
Tab de upload a levaria ao estado da div. 1148 (o core: texto de comprimento 0; o site: o vazio). Perguntado antes de
qualquer gate; a resposta é a D0-D22. A prova está no gate da D-0, grupo (c): a escaneada salva com 200 e o core segue
dizendo `{ ok: true, body: 'file' }`.

## 2. Commit 1 — os gates, sobre a `main` `[medido: bruto/c1-gates-sobre-a-main.txt]`

### 2.1 O gate do `PUT` do editor prova que o corpo salva (div. 1157)

`tests/gates/i1-editor-put.test.tsx` deixa de usar o `fetch` que devolvia 200 a qualquer corpo. O `PUT` vai ao **handler
real** de `app/api/content/route.ts` — o esquema `contentSchemas.update` e o contrato de escrita com o tipo da linha —, com
só a autenticação e o banco simulados (`tests/gates/rota-real.ts`, o molde do M0). O gate exige **200 antes dos bytes**, e
nada que a rota recuse se grava como fixture.

| caso | sobre a `main` |
|---|---|
| cifra em texto | **400** `VALIDATION_ERROR · difficulty: Invalid enum value. Expected 'Beginner' \| 'Intermediate' \| 'Advanced' \| 'Expert', received ''` |
| cifra em seções | **400** — idem |
| letra | **400** — idem |
| tab (tablatura em texto) | 200 (a linha tem `difficulty: 'Advanced'`) |
| partitura (PDF) | **400** — idem |

**4 de 5 corpos que o gate do I1 travava byte a byte o servidor recusava.**

Um detalhe do instrumento, registrado: o primeiro rodar travou sem sair nada — o `vi.mock` do `supabase-service` importa
`rota-real.ts`, que importava a rota no topo, e a rota importa o `supabase-service`; um esperava o outro. A rota passou a
ser importada dentro do `fetch` (comentário no arquivo).

### 2.2 O gate da D-0 — `tests/gates/d0-editor-salva.test.tsx` (novo)

| grupo | casos | sobre a `main` |
|---|---|---|
| (a) tipo × dificuldade (Letra, Cifra, Tab, Partitura × `null`, `'Intermediate'`) | 8 | **4 ✗** — os quatro `null`: `400 difficulty … received ''` · 4 ✓ |
| (b) Tab de upload (`content_data: null`, com arquivo): *Detalhes* · *Informações* · o painel de texto | 3 | **3 ✗** — `400 content_data.tablature: obrigatória para Tab` (×2); *o editor de Tab não tem painel de texto* |
| (c) Cifra com `content_data` nulo: sem arquivo (*Detalhes*) · escaneada (*Detalhes*, o core segue arquivo) · uma seção editada | 3 | **3 ✗** — `400 content_data.chords: obrigatória para Chords` |
| (d) editar o texto de uma Tab: a `tablature` no corpo, `textoDaTab` (o site) e `bodyOf` (o core), e o `content_data` gravado = o item `tab-editada-no-site` do G-par, byte a byte | 1 | **✗** — sem painel de texto |
| (e) as três classes do pre-check (sem `measures`; `measures` = o exemplo; `measures` ≠ o exemplo): abre a `tablature`; salvar não apaga nem altera o `measures` | 3 | **3 ✗** — sem painel de texto |
| (f) o compasso de exemplo em nenhum arquivo do código do site (180 arquivos lidos) | 1 | **✗** — as 6 cordas em `components/tab-editor.tsx` |

**15 de 19 reprovam na `main`.** O G-par ganha o item **`tab-editada-no-site`** no par (`packages/core/fixtures/g-par.json`)
e o retrato do site é refeito (`g-par-site.json`, `G_PAR_SITE_GRAVAR=1`). O valor do item foi **gravado do editor
consertado** (como o `CN_GRAVAR` grava), na árvore, antes do commit 1; o conserto ficou fora do commit 1 e o gate reprova
sobre a `main` por isso. Na `main`, o G-par passa com ele (os dois leitores já leem a `tablature` igual — o item é dado).

### 2.3 Os controles negativos (regra 4) `[medido: bruto/cn-*.txt]`

Cada um sobre o commit 2, rodado (os dois gates) e desfeito com `git checkout -- .`; `git status --short` = 0 linhas depois
de cada.

| # | o que se plantou | reprova |
|---|---|---|
| 1 | a dificuldade de volta a `""` (`difficulty: editedContent.difficulty`) | **8**: os 4 do `PUT` com dificuldade vazia e os 4 `(a)` com `null` |
| 2 | a garantia da `tablature` sai do `corpoDoPut` | **1**: `(b)` *Informações* (a única forma de Tab sem a chave na linha) |
| 2b | a `tablature` fora de **todo** corpo de Tab | **9**: o caso Tab do `PUT`, os dois `(a)` Tab, `(b)` ×2, `(d)`, `(e)` ×3 |
| 3 | a edição indo para `measures` (o `onMudar` grava `measures`) | **6**: o caso Tab do `PUT`, `(b)` painel, `(d)`, `(e)` ×3 |
| 4 | o editor abrindo o exemplo (o painel com as 6 cordas do exemplo) | **6**: o caso Tab do `PUT`, `(d)`, `(e)` ×3, `(f)` |
| 5 | **um corpo que o esquema recusa passando no gate do `PUT`** — o editor mandando `""` de novo **e** o `editor-put-depois.json` e os `PARES` concordando com `""` | **4** (`5a`): `o servidor recusou o corpo: 400 … received ''` — o status vem da rota, não da fixture. **Impossível por construção.** |
| 5b | o mesmo, tentando gravar a fixture (`CN_GRAVAR=1`) | o corpo recusado **não** entrou — mas o passo de gravar **escreveu o depois com só o caso que passou** (1 de 5), sem vermelho: **defeito do instrumento (div. 1161)** |
| 5c | o mesmo, depois do conserto do instrumento (`2d90f60`) | **5**: os 4 casos e o passo de gravar (`casos sem corpo aceito pela rota — o depois NÃO se grava`); o sha256 do depois **igual** antes e depois |

## 3. Commit 2 — o conserto

| arquivo | o quê |
|---|---|
| `components/content-editor.tsx` | `corpoDoPut`: `difficulty || null` (D0-D19); `content_data: null` quando a linha era nula e nenhum editor de tipo a tocou (D0-D22); a `tablature` da Tab (D0-D13) e o `chords` da Cifra (D0-D21) sempre que o `content_data` vai objeto. A linha morta `editedContent.measures` saiu |
| `components/tab-editor.tsx` | o editor abre a `tablature` (a lista, linhas juntas por `"\n"`, pelo `textoDaTab` do leitor do site; sem ela, vazio) e cada mudança devolve `{ ...content, ...tabData, tablature }` — o mesmo desenho de antes, com a `tablature` no lugar dos compassos; o `measures` gravado viaja intacto no `content` (D0-D8). O compasso de exemplo e as ações de compasso saíram (D0-D7) |
| `components/editors/partes-da-tab.tsx` | `TablaturaDaTab` = a composição do editor de Letra (`Bloco` + `Campo` *Tablatura* + o campo de `5 × touch.min`, `resize-y`, contorno `lineInfo`) com a tipografia da tab: `font-fam-mono`, `text-tam-zoom-padrao`, `leading-entrelinha-tab`, `wrap="off"`, `whitespace-pre`, `overflow-x-auto` (D0-D17). `CompassoDaTab` saiu |
| `components/editors/frases-editor.ts` | saem `edit.tab.adicionar-compasso`, `.compasso`, `.corda`, `.duplicar-compasso`, `.remover-compasso` (só o editor de compassos as usava; I1-E34) |
| `scripts/gates-web/g-faixa-editor-exemplos.ts` | a Tab de exemplo: título e autor fabricados (D0-D18), a tab em **texto** (as seis linhas do compasso da folha), sem `measures` |
| `tests/gates/fixtures/editor-put-antes.json` | o título e o autor da Tab trocados pelos fabricados (D0-D18) — **é o que a `main` grava com a entrada fabricada**: rodado sobre `origin/main` numa árvore descartável, o arquivo saiu com o **mesmo sha256** `29d76ab1…` `[medido: bruto/prova-nomes-antes-json.txt]` |
| `tests/gates/fixtures/editor-put-depois.json` | novo: o corpo do editor da D-0, gravado com a rota dizendo 200 |
| `tests/gates/i1-editor-put.test.tsx` | a Tab com nome fabricado e editada pelo painel; o gate exige: 200, o corpo = o depois byte a byte, e **o antes × o depois = exatamente os `PARES`** (mudança não declarada reprova; par que não casa reprova; par de caso inexistente reprova) |

### 3.1 Os corpos que mudaram, e por quê `[medido: bruto/c2-put-depois.txt]`

| caso | chave | velho → novo | razão |
|---|---|---|---|
| cifra em texto | `difficulty` | `""` → `null` | D0-D19 (div. 1152): o esquema aceita `null` e recusa `""` |
| cifra em seções | `difficulty` | `""` → `null` | idem |
| letra | `difficulty` | `""` → `null` | idem |
| tab | `content_data.tablature` | o texto da linha → o texto editado (+ uma linha) | D0-D6: a edição vai à chave que os leitores leem |
| tab | `content_data.measures` | o exemplo com uma corda editada → **ausente** | D0-D7: o exemplo não se grava mais (a linha não tinha `measures`) |
| partitura | `difficulty` | `""` → `null` | D0-D19 |
| partitura | `content_data` | `{ annotations: [] }` → `null` | D0-D22: o nulo que ninguém editou fica nulo |

**7 chaves, 7 pares; não declaradas 0, órfãos 0.** Os 5 corpos: rota **200**. A poluição do `content_data` (a linha
inteira dentro dele, `annotations`) é a de antes — herança D, não tocada.

## 4. As três classes de dado (§8.2 do pre-check) — o que o editor faz agora

| classe | ao abrir | ao salvar | prova |
|---|---|---|---|
| 1 · sem `measures` | a `tablature` no painel | a `tablature` editada; nenhum `measures` novo | `(e)` classe 1 |
| 2 · `measures` = o exemplo | a `tablature` — a tab real (antes: o exemplo) | a `tablature` editada; o `measures` intacto, byte a byte | `(e)` classe 2 |
| 3 · `measures` ≠ o exemplo | a `tablature` — a tab real | idem | `(e)` classe 3 |
| Tab de upload (`content_data: null`) | o painel vazio | por *Detalhes*: `null` (D0-D22); pelo editor de tab: a `tablature` (`""` ou o texto) | `(b)` ×3 |

No dado real (M1) nenhuma Tab tem `measures`; as classes 2 e 3 existem só no gate.

## 5. Commit 3 — a folha e os gates do site

### 5.1 O G-faixa do `EDIT-tab` `[medido: bruto/g-faixa-antes.txt, bruto/g-faixa-depois.txt, bruto/g-faixa-veredito.txt]`

Rodada por estado (`G_FAIXA_ESTADOS=EDIT-tab,base-tab`), o executor, perfil persistente, `localhost:3000`, o `pnpm dev`
desta árvore. O `base-tab` (a casca-efeito do I1-PR-10, sem folha) entrou junto porque a tela dele também mudou — **extra
declarado**. Mesclado por estado no `tests/gates-web/medicoes/content-edit.json`: só `EDIT-tab` e `base-tab` mudaram
(conferido estado a estado); `rodadasPorEstado` registra a rodada `2026-10-08T12:28:06Z`, commit `2d90f60+sujo` (o `+sujo`
é o `g-faixa-medir.ts` com a flag de captura, ainda sem commit; nenhum arquivo de app diferia).

| | 1138 (C) | 711 (B) | 411 (A) |
|---|---|---|---|
| **antes** (os 4 arquivos do editor da `main`, o exemplo D-0) — `EDIT-tab`+`base-tab` | (e) 0 · (b) 0 · candidata 0 | 0 · 0 · 0 | 0 · 0 · (d′) 2 |
| **depois** — `EDIT-tab` | (e) **0** · (b) **0** · candidata 3 | **0** · **0** · candidata 33 | **0** · **0** · (d′) 1 |

O veredito inteiro: **`G-faixa: PASSA`**, `erratas candidatas sem cobertura: 0`; as **36** candidatas do `EDIT-tab` saem
*coberta por I1-E33*. A causa é uma só: o painel de texto é ≈ 19 px mais baixo que o compasso da folha — em C, os títulos
*Tablatura* e *Prévia* e a caixa da prévia sobem 15–19 px (3); em B, onde *Detalhes* empilha abaixo, todos os nós dele
sobem ≈ 20 px (33). Sem par (contados à parte): folha 19 / app 6 por largura (os compassos, as cordas e os botões que a
folha tem e o app não; o rótulo e o campo *Tablatura* que o app tem e a folha não).

**O nome real na medição** (div. 1165): o `content-edit.json` tem 14 ocorrências do título/autor reais — **todas na cópia
da folha** que a medição guarda como esperado (`estados.*.folha`, a folha 6 com sha registrado), antes e depois. A medição
do app tem **0** (o texto vai em hash). Sair dali exige errata da folha — Bloco D, item 6 do §12.2 do pre-check.

### 5.2 As erratas da folha — I1-E33 e I1-E34

No `docs/ux/DESIGN-I1/erratas.json` e na tabela do `DESIGN-I1/README.md` §2.2 (seção *Da D-0*); o `SHA256SUMS` muda **só**
na linha do `README.md` (14/14 OK).

| id | lista | o que vale | n |
|---|---|---|---|
| **I1-E33** | `erratasFaixa` (o G-faixa lê) | a Tablatura do `EDIT-tab` é **um painel de texto**; os compassos, as cordas como campos, *Adicionar compasso*, *Duplicar* e *Remover* deixam de existir; o painel ≈ 19 px mais baixo | **36** (3 C + 33 B) — todas cobertas; nenhuma candidata do `EDIT-tab` sem cobertura |
| **I1-E34** | `erratasFrase` (registro) | as cinco frases de compasso saem das `frases-editor.ts` (regra 31) | — |

**A regra da errata órfã**: a I1-E33 cobre exatamente as 36 do aceite (o `n` é o medido, não estimado); a I1-E34 é de
registro (nenhum gate a lê, como as outras `erratasFrase`); o G-tok (i) segue `achados 29 · cobertos 29 · órfãs 0` — as
duas não entram na lista `erratas` que ele cobra.

### 5.3 O antes e o depois da tela, por estado — [`capturas/`](capturas/)

`G_FAIXA_CAPTURAS` (extra declarado no `g-faixa-medir.ts`: opcional, só grava a captura de cada estado medido). Mesma
fixture fabricada nos dois lados.

| estado | antes (`capturas/antes/`) | depois (`capturas/depois/`) |
|---|---|---|
| `EDIT-tab` · 1138 / 711 / 411 | a Tab tem seis linhas de tab no `content_data`, e o editor mostra **o compasso de exemplo** (`E|--0--3--0--2--0--|` …) com *compasso 1*, *Adicionar compasso* e o ícone de duplicar — a tab da linha não aparece | o painel *Tablatura* com **as seis linhas da própria Tab**, mono, sem quebra; sem compassos nem botões de compasso |
| `base-tab` · 1138 / 711 / 411 | idem (o editor velho, a Tab da folha 5) | idem (o painel de texto) |

## 6. O aceite, local `[medido]`

### 6.1 Os roteiros do M0, de novo — [`bruto/m0-depois.txt`](bruto/m0-depois.txt)

O instrumento do pre-check, copiado para `instrumentos/m0-depois.medir.tsx` (config própria, sem sufixo `.test`). Duas
trocas, as duas no instrumento: *uma corda do compasso* (R3, R6) virou *o painel de texto*, porque a corda não existe mais;
e ele supunha `content_data` objeto — com a D0-D22 o R5 manda `null` e o instrumento quebrava (div. 1166).

| roteiro | `difficulty: null` | `'Beginner'` | no pre-check |
|---|---|---|---|
| R1 título em *Detalhes* | **200** | **200** | 400 · 200 |
| R2 título em *Informações* | **200** | **200** | 400 · 200 |
| R3 o painel de texto (era: uma corda) | **200** | **200** | 400 · 200 |
| R4 abrir sem mudar | *Salvar* inativo | *Salvar* inativo | igual |
| R5 Tab de upload, *Detalhes* | **200**, `content_data = null` | **200**, `null` | 400 · 400 |
| R6 Tab de upload, o painel | **200** | **200** | 400 · 400 |

**10 salvamentos, 10 × 200** (o pre-check: 3 × 200, 7 × 400). O título em *Informações* segue não chegando à coluna (div.
1147, fora — D0-D11).

### 6.2 No navegador — [`instrumentos/aceite-navegador.ts`](instrumentos/aceite-navegador.ts), [`bruto/aceite-navegador-*.txt`](bruto/)

**Parte A** — `localhost:3000`, o perfil persistente, o `pnpm dev` desta árvore; o `GET` do content fabricado no navegador;
o `PUT /api/content` **parado no navegador** (o corpo guardado, um 200 fabricado) e cada corpo passado, no node, pelo
esquema e pelo contrato reais:

| caso | `difficulty` | `content_data` | o esquema + o contrato | a tela |
|---|---|---|---|---|
| Letra sem dificuldade · *Notas* | `null` | `{lyrics, annotations}` | aceitam | foi à `/library` |
| Cifra sem dificuldade · *Notas* | `null` | `{chords, annotations}` | aceitam | idem |
| Tab sem dificuldade · *Notas* | `null` | `{tablature, annotations}` | aceitam | idem |
| Partitura sem dificuldade · *Notas* | `null` | `null` | aceitam | idem |
| Tab · o texto editado no painel (o painel abriu com a `tablature` da linha, 23 car.) | `null` | `{tablature, …a poluição…, annotations}` | aceitam | idem |

`requests a /api/*: 20 · escritas barradas: 0 · prod abortados: 0`. **Nenhum `PUT` saiu.**

**Parte B** — a visualização do site com a linha que o `PUT` gravaria. A rota `/content/[id]` é SSR do banco (não se
fabrica por `route()`), então o `ContentPageClient` real foi montado por uma página de fumaça
(`instrumentos/fumaca-d0.tsx`) numa **cópia da árvore sem `.env*`**, `next dev` na 3110 — o molde da I1-PR-11 §16; a cópia
foi apagada no fim e a página nunca entrou em `app/`. **O painel *Tab* mostra 44 caracteres = o texto editado**
(`capturas/aceite/visualizacao-tab-1138.png`; o editor antes de salvar em `capturas/aceite/editor-tab-editada-1138.png`).

## 7. Os gates — todos `[medido: bruto/]`

| gate | resultado |
|---|---|
| o do `PUT` do editor | 5/5 com a rota em 200; o corpo = o depois; pares 7/7, não declaradas 0, órfãos 0 |
| o da D-0 | 19/19 (23/23 com o grupo (g), §13) |
| G-par (site) | `itens 17 · pares comparados 10 · iguais 10 · diferentes 0 · fora do par 7` — `tab-editada-no-site` IGUAL, `texto(44)` × `texto(44)`; retrato do site: 10 itens |
| G-par da visualização (o tablet, `apps/native/test/g-par-visualizacao.test.tsx`) | `tab-editada-no-site site=texto(44) V=texto(44)` · zero diferenças — **sem arquivo do tablet mudar** |
| G-faixa | `PASSA` (§5.1) |
| G-tok (i) · (ii) · cobertura | `PASSA` — achados 29, órfãs 0; 133 arquivos, literais 0, strings de `.ts` examinadas 490, isentas 5 de 5 · cobertura 129/129 |
| G-back | `PASSA` **sem declaração** — nenhum arquivo do núcleo |
| G-palco | `PASSA — 0 ocorrências` |
| G1a/G1b · G2/G3 (tablet) | passam sem par nem remoção declarados |
| **o diff no tablet** | `git diff --stat a613b1d HEAD -- apps/native packages/core/src` → **vazio**. Os 17 arquivos da PR estão em `bruto/` e na §0; os de `packages/core` são só `fixtures/` |
| `SHA256SUMS` | DESIGN-V1 3/3 · N2 2/2 · N3 2/2 · N4 2/2 · I1 14/14 |
| a suíte inteira (`pnpm test`) | `Test Files 140 passed \| 3 skipped (143)` · `Tests 1689 passed \| 59 skipped (1748)` |
| `tsc --noEmit` · `pnpm lint` | exit 0 · *No ESLint warnings or errors* |

## 8. As divergências — 1160 a 1167

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente/dado/produto · **T** toolchain/aparato · **X**
terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1160** | P | A D0-D21 supõe que *"o mesmo conserto"* (a chave do tipo sempre no corpo) resolve a Cifra com `content_data` nulo; para a **Cifra escaneada** ele faria o palco trocar o PDF por texto vazio, e levaria a Tab de upload ao estado da 1148 (§1) | **D0-D22** `[Marcel, 2026-10-08]`; prova no gate da D-0 (c) |
| **1161** | T | O passo `CN_GRAVAR` do gate do `PUT` gravava a fixture com os casos que passaram e **descartava em silêncio** os que a rota recusou (o CN 5b: o depois ficou com 1 de 5) | consertado no instrumento (`2d90f60`); CN 5c |
| **1162** | T | O cache do Playwright (`~/Library/Caches/ms-playwright`) **não existia** — nenhum Chromium. Reinstalado o fixado (`pnpm exec playwright install chromium`, *Chromium Headless Shell 140.0.7339.16, build 1187*, 81,9 MiB, do lockfile — `COMO-RODAR.md`) | registrado |
| **1163** | T | A checagem de sessão do G-faixa **sem janela** (`G_FAIXA_SEM_JANELA=1`) disse *"o perfil não tem sessão"*; a mesma checagem **com janela**, dois minutos depois, achou a sessão, **sem login nenhum**, e o contexto persistente *headless* da parte A também tinha sessão. O executor tomou a primeira leitura por sessão caída e **pediu ao Marcel que entrasse** — a janela nunca abriu, porque não precisava. Hipótese, não confirmada: a 1ª checagem rodou logo depois de o `next dev` subir, com o `/dashboard` ainda compilando | registrado; hipótese com dono — a próxima PR que medir com sessão repete a checagem sem janela antes de pedir login |
| **1164** | D | A folha 6 desenha o `EDIT-tab` com compassos, cordas e botões de compasso que o caminho 1a tira | **I1-E33** (faixa, n=36) e **I1-E34** (frase) |
| **1165** | D | O pre-check (§9.3) pôs as 10 linhas de nome real do `content-edit.json` no grupo que a D-0 troca *"na medição"*: as 14 ocorrências são a **cópia da folha** (com sha) dentro da medição; a medição do app tem 0 | Bloco D, item 6 do §12.2 do pre-check (a troca exige errata da folha) |
| **1166** | T | O instrumento do M0 supunha `content_data` objeto; com a D0-D22 o R5 manda `null` e ele quebrava (`Cannot convert undefined or null to object`) | consertado na cópia do instrumento (§6.1) |
| **1167** | P | O prompt pede *"os quatro roteiros do M0"*; o M0 tem **seis** (R1–R6) × duas dificuldades | rodados os seis (§6.1) |

| **1168** | A | **O editor zera o `annotations` em todo salvar**, nos quatro tipos: o estado (`components/content-editor.tsx:90`) nasce `[]` e nada o escreve, e o corpo o põe depois do espalhamento (`:77`) — uma linha com anotações volta com `annotations: []`. **Já era da `main`** (medido, §13). O que a D-0 muda é o alcance: os salvamentos que davam 400 (div. 1152, 158 de 196) passam a gravar. No dado (M1, consulta 3): 21 contents com a chave; com texto, a sonda da Fase D (div. 1159); os outros 20 não foram lidos por valor | **pergunta ao Marcel** (§13) |
| **1169** | T | A primeira rodada do grupo (g) "sobre a `main`" **não trocou os arquivos**: os quatro caminhos foram passados numa variável que o zsh não divide, o `git checkout` falhou e o teste mediu o código da PR. Visto pela saída (`pathspec … did not match`), refeito com os caminhos explícitos | registrado; os dois brutos estão no anexo |

**Contagem** (1160–1169): 10 — P 2 · D 2 · A 1 · T 5. **A próxima livre é a 1170.**

## 9. Para o catálogo — a regra proposta (div. 1157)

A última do `docs/native/LOGS-OCTAVIA.md` é a **38**. Proposta, para o encerramento da D-0:

> **39. Um gate de corpo prova que o corpo é aceito pelo esquema real, não só que ele não mudou.** *(Div. 1157, D-0-PR1;
> D0-D19.)* O gate do `PUT` do editor do I1 travou byte a byte, em 4 de 5 casos, um corpo que o servidor recusava desde
> 2025-07-08 — o `fetch` falso devolvia 200 a qualquer corpo, e o aceite rodava sem `PUT` real. "Não mudou" não é
> "funciona" quando o lado que diz se funciona está simulado. Gate de corpo passa o corpo pelo validador de verdade (a rota
> com autenticação e banco simulados, ou o esquema e o contrato) **antes** de comparar bytes, e o passo que grava a fixture
> só grava com todos os casos aceitos (div. 1161).

## 10. A contabilidade

| quem | item | valor |
|---|---|---|
| executor | requests a prod feitas por mim · logins · `.env*` abertos · escritas reais · contas criadas | **0 · 0 · 0 · 0 · 0** |
| executor | `.env.local` | **copiado sem abrir** de `../octavia` para `../octavia-d0-pr1` (sinalizado antes; o `next dev` o carrega; ignorado pelo git) — o molde da I1-PR-13 |
| executor | `next dev` | 3000, a árvore da PR, com o `.env.local` (o G-faixa e a parte A); 3110, uma cópia sem `.env*` (a parte B), parada e apagada |
| servidor local (3000) | o que ele leu do banco/Auth, por estar com a sessão do perfil | leituras: a sessão (`/api/profile`, o `securetoken`) e, depois de cada salvar, a `/library` (o SSR e o `GET /api/content` da lista da conta) — como no I1. Nenhum content real aberto no editor (todo `GET /api/content/<id>` fabricado) |
| — | `PUT` que saiu | **0** — todos parados no navegador (aceite) ou na rota simulada (gates) |
| executor | árvores temporárias | `origin/main` destacada no scratchpad (a prova do `editor-put-antes.json`), removida; a cópia sem `.env*`, apagada |
| executor | Chromium do Playwright | reinstalado (div. 1162) |
| executor | `../octavia/.claude/launch.json` (local, fora do git) | duas entradas: `d0-pr1-dev-3000`, `d0-pr1-fumaca-3110` |

## 11. Os anexos

| caminho | o quê |
|---|---|
| [`bruto/`](bruto/) | as saídas literais (sem códigos de cor): os gates sobre a `main` e depois, os controles negativos, o G-par dos dois lados, G-tok, G-back, G-palco, G1, G2/G3, o G-faixa antes/depois/veredito, o M0 de novo, o aceite no navegador (A, B e os JSON), o resumo da suíte, `tsc`, lint. No veredito do G-faixa, o título e o autor reais da folha estão trocados por um marcador (12 ocorrências) |
| [`capturas/`](capturas/) | o antes e o depois do `EDIT-tab` e do `base-tab` nas três larguras; as duas do aceite |
| [`instrumentos/`](instrumentos/) | o aceite no navegador, a página de fumaça, o M0 de novo com a config dele — rastro, fora de CI, lint e typecheck (N4-D117) |

## 12. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# D-0-PR1: nenhuma declaração. Nenhum arquivo de apps/native nem de packages/core/src muda (G1/G2/G3 passam sem par).
# packages/core/fixtures/g-par.json ganha o item tab-editada-no-site e g-par-site.json é refeito (fixtures, fora do src).
```

```gates-web
# D-0-PR1: nenhum arquivo do núcleo do G-back tocado (G-back PASSA sem declaração) — a rota, o esquema e o contrato não mudam.
# G-tok: a lista não cresce; saem 5 frases de components/editors/frases-editor.ts (I1-E34).
# G-faixa: a regra do veredito não muda; content-edit.json remedido em EDIT-tab e base-tab (I1-E33, n=36).
```

## 13. A conferência antes do merge — o editor não apaga o que não conhece

**(1) Por leitura, `arquivo:linha`.** Com o `content_data` da linha **não** nulo, o editor:
- copia o objeto inteiro para o estado (`components/content-editor.tsx:48`, `content_data: content.content_data || {}`);
- num salvar só por *Detalhes*, o corpo leva **o mesmo objeto espalhado** (`:76`, `...dados`), mais `annotations` (`:77`),
  `sections`/`lyrics` quando o estado do topo os tem (`:79-80`, nunca num salvar por *Detalhes*) e a chave do tipo só se
  faltava (`:81-82`);
- quando um editor de tipo muda algo, o `handleContentChange` espalha o `content_data` de antes e só então o que voltou
  (`components/editors/content-type-editor.tsx:34-37`); os editores devolvem `{ ...content, … }`, com o `content_data`
  espalhado no `content` (`:45`; `tab-editor.tsx:40`, `chord-editor.tsx:40`, `lyrics-editor.tsx:22`). A Partitura não tem
  editor de tipo: o `SheetMusicDisplay` não chama `onChange` (`:42`).
- **Resultado esperado: nenhuma chave desconhecida se perde; a única chave que o editor reescreve sem ter editado é o
  `annotations`** (div. 1168).

**(2) O teste — o grupo (g) do gate da D-0** (`349b9c5`). Uma linha por tipo com a chave fabricada
`chave_d0_desconhecida` (objeto) e, na Partitura, também a legada `file` (a forma de `docs/native/N4-PRECHECK.md:950`);
*Notas* em *Detalhes*; salvar. A chave tem de voltar no corpo **e** na linha gravada com o mesmo valor
`[medido: bruto/conferencia-g-*.txt]`:

| tipo | chaves desconhecidas | sobre a PR | sobre os arquivos do editor da `main` |
|---|---|---|---|
| Letra | 1 | ✓ 1 de 1 no corpo, igual | ✓ |
| Cifra | 1 | ✓ | ✓ |
| Tab | 1 | ✓ | ✓ |
| Partitura | 2 (`file`, a fabricada) | ✓ 2 de 2 | ✓ |

**Passa nos quatro: só o teste entra, nenhum conserto.** Não é comportamento novo — a `main` passa igual.

**(3) Controle negativo** — o `corpoDoPut` passando só as chaves de tipo (`lyrics`, `chords`, `tablature`, `sections`):
**reprovam os 4 casos (g)** (*"a chave chave_d0_desconhecida perdeu-se ou mudou no corpo"*; na Partitura, *"a chave file…"*),
e com eles o (d) e as classes 2 e 3 do (e) — 7. Desfeito; `git status` só com o teste.

**O `annotations` (div. 1168), medido à parte** por um teste descartável, apagado depois (`bruto/conferencia-sonda-annotations*.txt`):
uma linha com `annotations: [{ id: 1, texto: "anotação fabricada D0" }]`, *Notas* em *Detalhes*, salvar → **o corpo leva
`annotations: []`, nos quatro tipos, na PR e na `main`**. Não está no grupo (g) porque não é chave desconhecida: o editor a
conhece e a reescreve. Não foi consertado — a pergunta é do Marcel.

**Os gates depois do (g)**: o da D-0, o do `PUT` e o G-par juntos — `31 passed | 1 skipped`; lint limpo. **CI no `349b9c5`:
8/8 verdes** (`build`, g-back, g-faixa, g-palco, g-tok, gates-nativos, Vercel).

---

**O que vem depois**: **o encerramento da D-0**, com a prova em prod (o M2: a Tab descartável da conta de audit editada no
site, um content sem dificuldade salvo, e o sync de leitura no AVD mostrando no palco o comprimento e o `sha12` esperados) —
e, depois dele, **o bloco da quebra de linha**.
