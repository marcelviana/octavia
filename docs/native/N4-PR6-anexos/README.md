# N4-PR6 — o palco avulso sem hospedeira

> **Bloco N4 · PR-6** (`n4/pr6-palco-avulso`, PR [#362](https://github.com/marcelviana/octavia/pull/362), **sem
> merge**). Datas: 2026-10-04 (código, AVD) e 2026-10-06 (Tab, celular, docs). Base: `origin/main` = `d78ea89` (merge da
> #361, a N4-PR5). Árvore `../octavia-n4-pr6`; `pnpm install --frozen-lockfile --offline`.
> Commits: `a3c2d0f` `test(n4): PR-6 — o G-N3 com os dumps rolados` · `655d73a` `test(n4): PR-6 — o palco avulso sem
> hospedeira, reprovando` · `155ce71` `feat(native): o palco avulso sem hospedeira (N4-R16)` · `a6f3a2f` `feat(native): a
> busca do palco avulso sem setlist (N4-R17)` · `c8e5554` `feat(native): o estado de formato no palco (N4-D43, N4-D83)` ·
> o de docs (este README, as erratas N4-E9 e do `APARATO.md`).
> `[medido]` = comando + saída literal nesta sessão, nos arquivos desta pasta.
> Requisitos: N4-R16, N4-R17, N4-R23, N4-R24 (o palco). Aceites: A-N4-16, A-N4-17, A-N4-23, A-N4-24 (§6).

**O palco com setlist não muda**: G-inv **34 de 34 e 18 de 18** nos dois aparelhos, com a PR (§5). Nenhum backend, nenhum
token, nenhum arquivo do site. Zero escrita em prod; em prod, só o sync de leitura da prova da N4-D56 (2 `GET`).

---

## 0. Decisões do Marcel nesta PR `[Marcel, 2026-10-06]`

Depois do primeiro relatório, verbatim da escolha:

- **N4-D93** — o `build` vermelho pelo envio ao Codecov: seguir com o aceite; depois dele, **mais um rerun** autorizado;
  se o envio continuar falhando, **não mexer no CI nesta PR** — o conserto sai numa PR de instrumento à parte (o envio
  tolerante a falha, a cobertura cobrada no próprio job), e o merge fica com o Marcel, com o `build` como estiver (§8).
- **N4-D94** — a faixa A: o Marcel faz o login da **conta de audit** no `octavia_phone`; o login fica no emulador para as
  próximas PRs, com errata no `APARATO.md` (feita neste commit).
- **N4-D95** — a página do PDF em B no avulso fica na **linha 1**, como no palco com setlist: é a **N4-E9**
  (`DESIGN-N4/README.md` §6); as erratas de medida passam a começar na **N4-E10**.
- A linha de base do G-inv no Tab medida na sessão do Tab, com o código da `main` antes do da PR (div. 1069, P).

---

## 1. O instrumento, antes de qualquer tela

### 1.1 O G-N3 com os dumps rolados (div. 1054, **fechada**) `[medido: g-n3-main-rolada.txt]`

O arnês do retrato passou a ser o `instrumentos/rolada.py` (commit `a3c2d0f`): o `roteiro.py` do pre-check do N3 com o
**dump rolado de toda lista** (S2, S4, picker) no mesmo estado — e a lista volta ao topo, **conferida** (o primeiro texto
da lista igual ao de antes de rolar, senão levanta), porque o roteiro encadeia estados na mesma tela.

Sobre a **`main`**, AVD e Tab, os mesmos 32 pares da N4-PR4:

| | (e) | rolagem |
| --- | --- | --- |
| sem os rolados (o arnês da N4-PR4) | **6** — "8" e "Oitava do ensaio" na S2 com edição, com e sem aviso, nos dois aparelhos | 0 |
| com os rolados | **0** | **6** |

O (e) da div. 1054 era **dobra, não defeito da tela**: a linha 8 está no rolado do mesmo estado. Com a PR, 60 pares (a
base e o avulso, os dois aparelhos): **(e)=0 · (b)=0** · nome-acessível 8 · rolagem 6 (`g-n3-depois.txt`).

### 1.2 A linha de base do G-inv sobre a `main` `[medido: g-inv-main-ambos.txt]`

| base | AVD (2026-10-04) | Tab (2026-10-06) |
| --- | --- | --- |
| `B5-baseline/` (34) | 18 de 18 | 16 de 16 → **34 de 34** |
| `B3-referencia-paisagem/` (18) | 9 de 9 | 9 de 9 → **18 de 18** |
| `g-inv-par` (8) | 4 de 4 | 4 de 4 → **8 de 8** |

É a medida dos dois aparelhos que a div. 1060 da N4-PR5 deixou para esta PR. O Tab foi medido com um Metro de uma árvore
da `main` (`d78ea89`) antes do da PR (div. 1069).

### 1.3 A base e o palco avulso

**Nenhum dump da base é do palco avulso**: `grep -rl AVULSA` e `grep -rl "Voltar para a busca"` nos XML de `B5-baseline/`,
`B3-referencia-paisagem/` e `B2/` → nada; os nove palcos de cada aparelho da `B3-referencia-paisagem/` têm o `indice`.
**Nenhuma errata em par** nesta PR.

---

## 2. O que se mediu antes de escrever

### 2.1 O que o palco exigia, e por onde o avulso entrava (na `main` `d78ea89`)

- **O palco exige uma setlist**: a rota `Stage` era `{ setlistId, position, avulsa? }` (`apps/native/src/navigation.tsx:32`);
  a tela procura a setlist (`:183`) e, sem ela, mostra o placeholder `SETLIST · não está no cache` sem controle nenhum
  (`:184-186`). O `StageScreen` recebia `setlist: SetlistDTO` (`StageScreen.tsx:78`), escrevia o nome dela na barra
  (`:551`, `:561`), punha o `indice` na barra de baixo (`:703-710`) e logava `nav … setlist=<id8>` (`:336-338`).
- **Os caminhos que abrem um palco avulso** — todos pelo toque num resultado da S4 (`navigation.tsx:260-276`):
  1. **a S4 aberta de S1** (`onBuscar`, `:133` → `Search {}`): `setlist === null` → `replace('Stage', { setlistId:
     setlist?.id ?? dados.lista[0]?.id ?? '', … })` (`:271-275`) — a **hospedeira** é a primeira setlist da lista, e com
     zero setlists o `''` cai no placeholder (div. 1001). **É este que a PR muda.**
  2. **a S4 aberta de S2** sem palco (`:170-175`) e **a S4 aberta do palco** (`:202-207`), com a música de fora da
     setlist: o avulso **com** a setlist da busca, no lugar dela — o *"aberto pela busca dentro de uma setlist"*, que
     **fica como está** (N4-D30).
- **O que o prefetch baixava quando o avulso abria**: `prefetchDemanda(setlist, contentById, posicao)` (`StageScreen.tsx:392-395`
  → `prefetch.ts:243-262`) — os arquivos **da hospedeira**, a partir da posição da busca. No AVD, sobre a `main`, toda
  abertura do avulso por S1 — inclusive de uma letra — deu `prefetch plan n=1 reason=demand` e `download-error
  nao-existe.pdf` (o arquivo da música 5 da setlist alheia) `[medido: roteiros/av-main-avd-pai.txt]` (div. 964).
- **O voltar**: o avulso por S1 entrava por `replace` no lugar da busca, então o `goBack` levava a **S1**, embora o
  nome acessível dissesse *Voltar para a busca* (`StageScreen.tsx:721`) `[medido: o passo "letra" do avulso.py, sobre a
  main, esgota a espera da busca nos dois aparelhos]`.

### 2.2 As alturas da barra de cima do avulso por faixa, e de onde vêm

| | C | B | A |
| --- | --- | --- | --- |
| a folha (m20) | 64 · 96 | 88 · 96 | 144 · 96 |
| o pacote | `faixas.C.palco.barra` = `bar.top` (64), `packages/identidade/src/tokens.ts:368` | `faixas.B.palco.barra` = `bar.top + space.xl` (88), `:388` | `faixas.A` = `faixaB` (`:399`) → 88; o 144 da folha é do N5 |
| a de baixo | `bar.stage` = 96 (`:71`) | igual | igual |

### 2.3 As medidas que a folha pede primeiro (no dump; > 4 dp seria errata) `[medido: dumps/avulso-*/N4P6*-S3-avulso-letra-avd-*.xml]`

| | `main` (com a hospedeira) | a PR | contra a folha |
| --- | --- | --- | --- |
| C · o título | x 304,9–1113,8 (**808,9**) | x 145,3–1114,2 (**968,9**) | ganha **+160,0 dp** = o nome (143,6) + o vão (16,4): ≈ 12 caracteres de 20 dp, o que a ordem do §3 estimava |
| C · `AVULSA` | x 24,0–129,3 | x 24,0–129,3 | igual |
| B · o título | x 24,0–687,1 (663,1), linha 2 | igual | já tinha a largura inteira; a linha 1 perde o nome |
| a barra de baixo | 7 controles, 65,8–66,2 × 65,7 | **6**, os mesmos x; só o `indice` sai | **66 (N4-E4)** ✓ |

Nenhuma diferença > 4 dp → **nenhuma errata de medida** (a N4-E10 continua livre).

### 2.4 As frases desta PR (a tabela da N4-PR3 §1.1, linhas 1–3)

*AVULSA* (`StageScreen.tsx:513`), *página {n} de {N}* (`:529`) e *Voltar para a busca* (`:721`) passam ao core
(`FRASES_DO_PALCO`, `paginaDe`, `packages/core/src/frases-content.ts`) e o palco importa — **nenhuma cópia na tela**,
provado pelo `apps/native/test/frases-n4.test.ts` (4), que guarda o texto da tela de antes e lê o fonte do palco. As
duas outras origens do voltar já estavam no core: *Voltar para a biblioteca* (do site) e *Voltar para a visualização*
(P-F6) — `nomeDoVoltarDoAvulso`. G-tok: strings de `.ts` **457 → 460**.

---

## 3. O que a PR entrega

| | onde | o quê |
| --- | --- | --- |
| **a rota** | `apps/native/src/rotas-do-avulso.ts` (novo) · `navigation.tsx` | `Stage` ganha a forma `{ avulsa, origem }` — **nenhuma setlist é procurada**, então zero setlists abre (div. 1001); a S4 sem setlist **empilha** (`push`) o avulso, e o voltar (`goBack`) devolve a busca no mesmo termo e posição. `destinoDoResultado` e `destinoDaBuscaDoPalco` são funções, testadas sem a `Navigation` (div. 334) |
| **o palco** | `StageScreen.tsx` | `setlist: SetlistDTO \| null`; a barra de cima sem o nome (C: o título ganha a largura; B: um espaçador no lugar do nome, página/nota/ponto à direita — a N4-E9); a de baixo sem o `indice`; o voltar pela origem (`origemDoAvulso`) |
| **o prefetch** | `prefetch.ts` | `prefetchDemanda(null, …, avulsaContentId)`: o plano é o arquivo desta música, e só ele; a mesma linha de log |
| **a busca do avulso** (N4-R17) | `navigation.tsx` | a S4 de hoje, **nova** e sem setlist — sem *Nesta setlist* |
| **o formato** (N4-D43, N4-D83) | `StageScreen.tsx` `Formato` | pela extensão (`ehFormatoQueOAppMostra`, da PR-5): o `tipo-desconhecido` de 28 em `offlineInk`, a frase do site, o nome do arquivo · o tipo (o tamanho, se conhecido) em mono `size.label`; sem `ensureFile`; **no palco com setlist e no avulso** |
| **as frases** | `frases-content.ts` | `FRASES_DO_PALCO`, `paginaDe`, `OrigemDoAvulso`, `nomeDoVoltarDoAvulso` |

**O que não muda**: o palco com setlist; o avulso aberto pela busca de dentro de uma setlist; S1; a S4 aberta por S1 (até a
PR-7, `Buscar música` abre a busca); o *Baixar* do S3e com a palavra (N4-D78); nenhuma linha de log (G3 70 = 70).

**Extras declarados**: o `testID` `s3-formato` (G2, adição); o placeholder de formato no lugar dos outros placeholders do
palco (no topo do corpo, não centrado como a folha — div. 1075) e com `size.label` (14) no nome do arquivo, o tamanho
que o app usa para a página do S3d, que a folha desenha em 13 nos dois lugares (div. 1076).

---

## 4. Testes antes e depois, e os controles negativos

**Commit 2 sobre a `main`** `[medido: commit2-reprovando.txt]`: **22 reprovam**, 41 passam (os controles e as P-F).

| arquivo | sobre a `main` | depois |
| --- | --- | --- |
| `apps/native/test/palco-avulso.test.tsx` (22) | 17 ✗ — sem nome (C, B), os dois temas, sem índice, as três origens, a busca, o prefetch, o S3e, o formato ×2, as rotas ×5 | 22 ✓ |
| `apps/native/test/prefetch-avulso.test.ts` (3) | 2 ✗ (o controle com setlist passa) | 3 ✓ |
| `apps/native/test/frases-n4.test.ts` (4) | 3 ✗ | ✓ |

**Suíte inteira** `[medido: suite.txt]`: **133 arquivos ✓ · 3 pulados; 1539 testes ✓ · 59 pulados; 0 ✗** (a N4-PR5 fechou em
1511).

**Controles negativos** (regra 4), cada um desfeito, `git status` vazio depois `[medido: cn.txt, cn4-g-inv.txt]`:

| CN | o que se plantou | quem reprova |
| --- | --- | --- |
| 1 | o nome da setlist de volta na barra do avulso (C e B) | `palco-avulso`: 3 ✗ |
| 2 | o índice de volta na barra de baixo do avulso | `palco-avulso`: 1 ✗ |
| 3 | o prefetch do avulso baixando as outras músicas | `prefetch-avulso`: 2 ✗ |
| 4 | uma mudança **no palco com setlist** (o nome da setlist 13 → 14 dp), capturada no AVD | **G-inv: 1 de 18** na `B3-referencia-paisagem/` — os 8 palcos diferem, o S5 (sem o nome) fica idêntico |

---

## 5. No aparelho, com o mock (N4-D54: o executor mede)

**O aparato** (`APARATO.md` lido inteiro): a fixture do pre-check do N3 (*hoje* = 2026-09-23); o mock `aceite.py` na 8788 e
os arquivos na 8790; o Metro **sem `CI=1`**, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline;
`apps/native/.env` por `cp -p` do checkout principal (sha256 `f2bfa179cd8e4b1f…`, nenhum valor lido), **apagado no fim**.
**O bundle servido conferido** antes de cada rodada (regra 13): `main` → `destinoDaBuscaDoPalco` 0; PR →
`destinoDaBuscaDoPalco` 4, `nomeDoVoltarDoAvulso` 4, `s3-formato` 1; `localhost:8788` 1 e `octavia.rocks` **0** nas duas.
O arnês: `instrumentos/` — `rolada.py` (§1.1), `avulso.py` (o avulso por S1, estado a estado, com o log de cada abertura),
`fixture-formato.py` (a fixture do N3 mais um `.jpg` e a setlist 3 com ele na posição 3, num diretório **próprio** — a da
base não se toca), as cadeias e o `copias.diff` (o `roteiro.py` com `ARVORE`, `PORTA` e o `ir_s1` que refaz o deep link
uma vez — div. 1070; o `passada4-final.py` com `PREFIXO`).

### 5.1 G-inv, `g-inv-par`, G-N3 com a PR `[medido: g-inv-depois.txt, g-n3-depois.txt]`

| | AVD + Tab |
| --- | --- |
| G-inv `B5-baseline/` | **34 de 34** |
| G-inv `B3-referencia-paisagem/` | **18 de 18** (o palco com setlist, nó a nó) |
| `g-inv-par` | **8 de 8** |
| G-N3 (60 pares, com os rolados e o avulso) | **(e)=0 · (b)=0** |
| a S4 **aberta pelo avulso** × a S4 da base | **4 de 4 idênticos** (`S4-vazio`, `S4-resultados`, AVD e Tab) — o caminho da errata da PR-7 (N4-D73) já fecha |

### 5.2 O palco avulso, estado a estado `[medido: roteiros/av-*.txt; dumps/avulso-*]`

| estado | a PR (AVD e Tab, C e B) |
| --- | --- |
| letra · claro · partitura · título longo · sem artista · não baixado (avião) | `AVULSA` sem nome; sem `indice`; *Voltar para a busca*; o S3e com o título e o *Baixar* de palavra |
| a busca do avulso | a S4 sem *Nesta setlist*; um resultado → o avulso dele; o voltar → **a mesma S4, no mesmo termo** (`S4-avulso-voltou`) |
| **zero setlists** (mock com `[]`) | **abre** — o dump é byte a byte o do avulso com setlists (`b8dbc8efe9ca` no AVD); na `main`, o placeholder sem `sair` |
| o prefetch | toda abertura: `prefetch plan n=0 reason=demand`, **nenhum `download-error`**. Na `main`: `n=1` e o `download-error nao-existe.pdf` da setlist alheia, a cada abertura (5 no Tab, 5 no AVD) |
| o formato (`.jpg`) | o placeholder no avulso **e no palco com setlist** (posição 3 da setlist 3); `prefetch plan n=0`; nenhum `ensureFile` |
| `FATAL` | **0** nas quatro rodadas (`main` e PR, AVD e Tab) |

### 5.3 A faixa A (o `octavia_phone`, 411,4 dp; os tokens de A são os de B) `[medido: dumps/phone/, roteiros/phone-avulso.txt]`

Com a conta de audit (N4-D94). **Nenhum `FATAL`.** O palco avulso **abre**. **A lista do inalcançável** no palco avulso:

| controle | em A |
| --- | --- |
| `sair` (o voltar pela origem) | **inalcançável** — fora da tela (não está no dump). O `BACK` do sistema cobre: volta à busca **com o termo**, e o segundo `BACK` a S1 |
| `busca` | **cortado**: x 368,0–411,4, 43,4 de 66 dp visíveis — tocável |
| os quatro de leitura, as bordas (61,7), a barra de cima, o corpo | alcançáveis |

O arnês do avulso espera o `sair` para seguir: em A só o estado de zero setlists saiu (div. 1078); a medida acima é
desse dump e do teste do `BACK`. Herança do **N5** (a moldura `N4-A-S3-avulso-*` sobe busca e voltar para a barra de cima).

### 5.4 O Tab, do começo ao fim (autorizado `[Marcel, 2026-10-04]`) `[medido: estado/, n4d56-*.txt]`

| | |
| --- | --- |
| lido | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **release** de 2026-10-04 12:48:08 (sem `DEBUGGABLE`); `stay_on` a 7 antes de pedir o destravar |
| ida | `install -r` do dev client (`9447edc7…`): `DEBUGGABLE` |
| o cache do Marcel | guardado arquivo a arquivo com o app parado (`setlists.json` `6b3ad0ba…`, `content.json` `b62f192a…`, `files-index.json` `b21cc49b…`, o PDF dele `05253d42…`); a demanda vazia; **regravado no fim, md5 a md5 idêntico, 4 de 4** (`estado/tab-md5-antes.txt` × `-depois.txt`); os três arquivos da fixture (`partitura-12p.pdf`, `partitura-1p.pdf`, `partitura-escaneada.jpg`) apagados; os quatro `._*` ficam onde estão |
| durante | o `adb` perdeu o `reverse` no meio da primeira rodada da PR (div. 1077): refeita inteira, com as cadeias reaplicando os túneis |
| volta | `install -r` do release (`6eae4a8b…`, `release-31d6b3a.apk`): sem `DEBUGGABLE`, `lastUpdateTime=2026-10-06 10:39:39` |
| N4-D56, em avião | `ping` → `Network is unreachable`; `cache hit kind=setlists n=2` · `kind=content n=63`; `sync skip reason=offline`; **0** requests; o S1 com as duas setlists e o `aviso-motivo`; `FATAL` 0 |
| N4-D56, com rede | `ping` 2/2; **2 `GET`** (`/api/setlists` 200, `/api/content` 200), `invalidated=0` nos dois; 0 escritas; `FATAL` 0 |
| fim | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio — **igual ao lido**; o Tab com o release (N4-D55) |

O release instalado é o da `31d6b3a` (a linha dele ainda diz `reason=7d`): esta PR não troca o release do Tab — é a PR-9
(A-N4-28).

### 5.5 O AVD e o celular

**AVD `octavia_tab32`**: lido `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, dev client de 2026-09-24 14:00:01;
subido três vezes com `-no-snapshot-save` (o S0 frio derruba a sessão); fim igual ao lido, `reverse` vazio, `ping` →
*unreachable*, `ram.bin` de 2026-09-24 14:00 (`estado/avd-*.txt`).
**`octavia_phone`**: lido `stay_on=1 accel=0 user_rot=0 airplane=0 wifi=1 data=1`, dev client de 2026-09-23 21:10:37, sem
conta; o Marcel fez o login da conta de audit; fim igual ao lido **mais a conta**, app parado, `reverse` vazio, snapshot
`default_boot` salvo (N4-D94; `APARATO.md`).

---

## 6. Por aceite

| aceite | esta PR | fica para |
| --- | --- | --- |
| **A-N4-16** | avulso aberto **pela busca de S1** (o único caminho nesta PR): sem nome, sem `indice`, o voltar à busca na mesma posição e termo, o nome acessível por origem (as três por teste); **zero setlists abre**; nenhum prefetch de outra música (logcat); G-inv 18/18 do palco com setlist; **o formato no palco com setlist** e a base intacta (N4-D83); o *Baixar* de palavra, nó a nó o de hoje (S3e do G-inv 18/18) | **PR-7/PR-8**: o avulso aberto **de L e de V** no aparelho |
| **A-N4-17** | a S4 do avulso sem *Nesta setlist*; e os 4 dumps da S4 da base **idênticos por esse caminho** (§5.1) | a errata de caminho é declarada na **PR-7** (N4-D73), quando `Buscar música` trocar de destino |
| **A-N4-23** | G-inv 34/34 e 18/18, AVD e Tab | toda PR |
| **A-N4-24** | B contra as molduras do avulso (com a N4-E9); A sem `FATAL` e a lista do inalcançável (§5.3) | **N5**: A |

---

## 7. Erratas

- **N4-E9** (`DESIGN-N4/README.md` §6; N4-D95): a página do PDF no avulso em B fica na linha 1. As de medida começam na
  **N4-E10**. Errata do **N4-R16** no `N4-REQUISITOS.md`.
- **`APARATO.md`**: o `octavia_phone` repousa com a conta de audit (N4-D94); o `adb` perde o `reverse` do Tab (div. 1077).
- Nenhuma errata em par da base do G-inv (§1.3).

---

## 8. Gates `[medido: g1g2g3-a20-icones.txt, gates-web.txt, sha.txt, suite.txt, tsc-lint.txt]`

| gate | resultado |
| --- | --- |
| testes desta PR | `palco-avulso` 22 · `prefetch-avulso` 3 · `frases-n4` (4) — verdes; suíte 1539 ✓ |
| G-inv · `g-inv-par` · G-N3 | §5.1 |
| G1a / G1b | com o bloco do corpo: `G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)` — 51 derivados, 5 exceções, todas usadas · `G1b: só adição ✓` |
| G2 / G3 | `testIDs antes=80 depois=81` (`s3-formato`) ✓ · `log( antes=70 depois=70`, nenhuma linha sumiu ✓ |
| `gate:a20` · `gate:icones` | 0 acusações (169 literais) · 0 acusações, 0 avisos |
| igualdade das frases · G-tok | `frases-n4` (4) verde; **G-tok PASSA**, strings de `.ts` 457 → 460; cobertura PASSA |
| site: G-back · G-palco · G-faixa | PASSA · PASSA (0) · PASSA — nenhum arquivo do site muda |
| `SHA256SUMS` | `DESIGN-V1` 3 · `-N2` 2 · `-N3` 2 · `-N4` 2 · `docs/ux/DESIGN-I1` 14 · `N3-PRECHECK-anexos` 355 — todos OK; `dumps/SHA256SUMS.txt` desta pasta (294) |
| `tsc` | raiz 0 · core 0 · identidade 0 · nativo 0 |
| lint | *No ESLint warnings or errors* |
| CI (`c8e5554`) | `android-debug-apk` **12m56s** (job; run `37248763758`) · `gates-nativos` · `g-back` · `g-tok` · `g-palco` · `g-faixa` · `mudou-nativo` · Vercel verdes; **`build`**: vermelho duas vezes só no passo `Upload coverage to Codecov` (`SSL alert number 40`; lint, type-check, a suíte e a cobertura verdes no mesmo job), e **verde no rerun autorizado pela N4-D93, depois do aceite** (job `112314762509`, 4m09s) — div. 1072 · **10 de 10 verdes** |

O bloco ```` ```gates ```` e o ```` ```gates-web ```` do corpo da PR, como ficaram (a regra do W4-b2):

```gates
# N4-PR6 — o palco avulso sem hospedeira (N4-R16, N4-R17; N4-D43, N4-D83). Nenhuma linha de log nova, nenhuma errata do G3.
# Tablet: o palco (StageScreen.tsx — a barra sem o nome, a base sem o índice, o voltar pela origem, o estado de formato), a rota do avulso (navigation.tsx; rotas-do-avulso.ts, novo), o prefetch sob demanda do avulso (prefetch.ts).
# Core: AVULSA, a página e o voltar pela origem (frases-content.ts).
g1a: apps/native/src/navigation.tsx
g1a: apps/native/src/prefetch.ts
g1a: apps/native/src/rotas-do-avulso.ts
g1a: apps/native/src/screens/StageScreen.tsx
g1a: packages/core/src/frases-content.ts
```

```gates-web
# N4-PR6 — nenhum arquivo do núcleo do G-back tocado; nenhum arquivo do site (app/, components/, lib/, hooks/) muda.
# O core muda (packages/core/src/frases-content.ts, na lista do G-tok): AVULSA, a página do S3d e o voltar do avulso pela origem — o texto byte a byte o do palco do tablet (apps/native/test/frases-n4.test.ts (4)); o site não importa nenhuma delas.
```

---

## 9. Divergências — 1069 a 1080

A última usada era a **1068** (`N4-PR5-anexos/README.md` §8) `[medido: git grep -h -o -E '^\| \*\*1[0-9]{3}\*\*' -- docs |
sort -u | tail -4` → `1066 · 1067 · 1068 · 1138`, o último uma linha de medida]. Origem: **P** premissa do prompt · **D**
doc anterior · **A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
| --- | --- | --- | --- |
| **1069** | P | o §1.2 pede o G-inv nos dois aparelhos sobre a `main` *"antes de mexer"*, e o §6 só autoriza o Tab depois do APK verde | a metade do Tab medida na sessão do Tab, com o Metro de uma árvore da `main` antes do da PR (de acordo do Marcel); §1.2 |
| **1070** | T | o deep link do dev client, depois do `force-stop`, às vezes cai no lançador: o `ir_s1` esgotava os 60 s (a passada de S1 e a S4 do retrato, na 1ª rodada da `main` no AVD) | o `ir_s1` da cópia refaz o deep link **uma vez** (`instrumentos/copias.diff`); os estados refeitos |
| **1071** | T | o `formato()` do `avulso.py` não reiniciava o mock com a fixture do formato; em paisagem, na `main` do AVD, a música 13 não existia | consertado no instrumento (`R.mock` no começo do `formato` e do `formatoSetlist`); o retrato da `main` e as rodadas da PR saíram com ele |
| **1072** | X | o `build` reprova no `Upload coverage to Codecov` (`ssl3_read_bytes … SSL alert number 40`) — o mesmo erro no rerun da regra 16; a PR não toca `.github/`, `codecov.yml`, `vitest.config.*` nem `package.json` (diff vazio) | **N4-D93**: um rerun depois do aceite — **passou** (2026-10-06, job `112314762509`): a causa era do terceiro e passou com ele. Nenhuma mudança de CI nesta PR; a PR de instrumento (o envio tolerante a falha) fica como proposta, sem urgência — decisão do Marcel |
| **1073** | D | as molduras `N4-B-S3-avulso-*` põem a página na linha 2; o palco com setlist (`N3-B-S3`) a põe na linha 1 | **N4-E9** (N4-D95) |
| **1074** | D | as molduras do avulso desenham o ícone de tipo na barra (♪ antes de *Partitura*); a barra do palco só tem a palavra (div. 1047) | registro: a composição da barra não muda no N4 — o bloco de identidade (div. 1047) |
| **1075** | D | a folha centra os placeholders do palco no corpo (o S3e, o formato); o app os põe no topo (`placeholder`, `paddingTop: space.xxxl`), e o S3e de hoje é o que a N4-R16 manda manter | o formato segue o placeholder do palco (o mesmo componente, N4-D83); registro |
| **1076** | D | a folha escreve o nome do arquivo do formato em mono 13 — não é token; o app usa `size.label` (14) para o mono da página do S3d, que a folha também desenha em 13 | `size.label`, nenhum valor fora do pacote; registro |
| **1077** | T | o `adb` perdeu o `reverse` do Tab no meio da primeira rodada da PR (o aparelho continuou em `adb devices`): o dev client parou na tela de erro do lançador, 0 capturas em 30 min | rodada refeita inteira; as cadeias reaplicam os túneis antes de cada passo; `APARATO.md` |
| **1078** | A | em A o `sair` do palco avulso fica fora da tela e a `busca` cortada (43,4 de 66 dp) | a lista do §5.3; o `BACK` do sistema cobre o voltar; **N5** |
| **1079** | P | o §6 pede o `octavia_phone` com o mock para A; ele repousava sem conta (o S0), e o login é do Marcel | **N4-D94**: o login da conta de audit pelo Marcel; `APARATO.md` |
| **1080** | T | o `avulso.py` espera o `sair` para seguir: em A só o estado de zero setlists saiu (5 "falhas" do arnês, não do app — `FATAL` 0) | a medida de A é desse dump e do teste do `BACK` (§5.3); o arnês de A é do N5 |

**Contagem**: 12 — T 4 · D 4 · P 2 · A 1 · X 1. **Fechada nesta PR**: a **1054** (§1.1) e a **1060**
(o G-inv nos dois aparelhos, §1.2). **Próxima divergência livre: 1081.**

---

## 10. Contabilidade

| | |
| --- | --- |
| requests a prod / escritas em prod | **2 `GET`** (o sync de leitura da prova da N4-D56 com rede) / **0** |
| requests a terceiros | o login do Firebase no celular, feito pelo Marcel (N4-D94); as renovações de token das sessões de audit (AVD, celular) e da do Marcel (Tab, `auth refresh=cached`) |
| mock | `GET /api/setlists` e `GET /api/content` por abertura; a escrita da "folha falhou" contra `escrita-500` (nada gravado); 0 `PUT` |
| aparelho | AVD `octavia_tab32` (três subidas, sem salvar); Tab S6 (destravado pelo Marcel; release → dev client → release; estado final igual ao lido; cache md5 a md5); `octavia_phone` (o login do Marcel; snapshot salvo, N4-D94) |
| `.env*` | `apps/native/.env` por `cp -p` (sha256 `f2bfa179cd8e4b1f…`) na árvore da PR e na árvore temporária da `main`, só para o Metro; **apagado** nas duas; nenhum valor lido |
| temporários | a árvore `../octavia-n4-pr6-dev` (os rascunhos validados e depois a `main` para o Metro do Tab) **removida**; os PNG das capturas, os bundles baixados, os logs do Metro e do mock, as cópias do cache do Marcel: no scratchpad da sessão, fora do commit |
| agentes | 0 |

---

**A próxima PR desta lista** (N4-D72): **PR-7 — a tela da biblioteca**.
