# N4-PR2-anexos — o leitor (o contrato de leitura lê `sections[]` da Cifra)

**PR** [#355](https://github.com/marcelviana/octavia/pull/355), branch `n4/pr2-leitor`, árvore `../octavia-n4-pr2` sobre
`origin/main` = `3e3390d` (o merge da #354, a PR-1 dos gates). `pnpm install --frozen-lockfile --offline`. Esta PR é a
**PR-2** da N4-D45 (`N4-PRECHECK.md` §16). Fonte do bloco: [`N4-PRECHECK.md`](../N4-PRECHECK.md).

- **O defeito** (div. 975, em produção): uma Cifra editada no web chegava ao palco com o texto **velho** — o editor grava
  `sections[]` e nunca reescreve o `chords` do topo, que era o que o contrato de leitura do core lia.
- **Commits**: `150328b` `test(n4): o contrato lê sections[] — casos, reprovando` · `cdee665` `fix(core): o contrato de
  leitura lê sections[] da Cifra (N4-D40)` · `dae7009` `test(n4): G-par — os três textos da declaração órfã (div. 987)` ·
  `050980e` `test(n4): G-par — duas seções, escaneada fora do par, lista vazia fixa` (N4-D48…D50) · o de docs (este).
- **Código de produto tocado**: só `packages/core/src/content-contract.ts`. Nenhum arquivo do web, nenhuma tela, nenhuma
  linha de log, nenhum `testID`.
- **Aceite**: **medido pelo executor (N4-D53) e conferido visualmente pelo Marcel** no Tab S6 (§7).
- `[medido]` = comando + saída literal nesta sessão, no arquivo citado. **Nenhum texto, título, artista ou nome de arquivo
  de música** em anexo: do dado real só saem ordinal, tipo, comprimento, `sha256[:12]` e igual/diferente.

| arquivo | o quê |
|---|---|
| [`s2-consumidores.txt`](s2-consumidores.txt) | §2 — quem consome o contrato, arquivo × seções, a fixture do mock e as bases do G-inv |
| [`commit1-esperados-contra-o-web.txt`](commit1-esperados-contra-o-web.txt) | os esperados dos casos novos, conferidos contra o `textoDaCifra` real do web: 14 de 14 |
| [`commit1-reprovando.txt`](commit1-reprovando.txt) | o commit 1 sobre a `main`: 10 de 39 reprovam |
| [`g-par-commit2.txt`](g-par-commit2.txt) · [`g-par-commit4.txt`](g-par-commit4.txt) | o G-par depois do conserto e depois da N4-D48…D50 |
| [`cn-commit2.txt`](cn-commit2.txt) · [`cn-commit3.txt`](cn-commit3.txt) · [`cn-commit4.txt`](cn-commit4.txt) | os controles negativos de cada commit, desfeitos |
| [`gates.txt`](gates.txt) · [`g1-g2g3-com-o-bloco-gates.txt`](g1-g2g3-com-o-bloco-gates.txt) | os gates locais; o G1/G2/G3 com o bloco ```` ```gates ```` do corpo da PR |
| [`suite-commit4.txt`](suite-commit4.txt) | o resumo da suíte inteira sobre o `050980e` |
| [`n4-d51-leitura.txt`](n4-d51-leitura.txt) | a leitura que condiciona a N4-D51 (§8) |
| [`aceite-tab.txt`](aceite-tab.txt) | o aceite no Tab S6 (§7), com o estado lido, os syncs, as comparações, o avião, a conferência e a desmontagem |

---

## 1. O conserto — a regra (e) do contrato

`packages/core/src/content-contract.ts`, cabeçalho e código. A leitura é a do web, sem regra nova (`textoDaCifra`,
`components/content/corpo-de-texto.ts:47-56`), **só na Cifra**:

- `sections` em lista **não vazia** vence o `chords` do topo;
- cada seção é `name` · `chords` · `lyrics`, só os textos **não vazios**, juntos por `"\n"`; as seções com texto, por
  `"\n\n"`, na ordem da lista;
- item que não é objeto e campo que não é texto são **pulados**; nada lança;
- lista vazia ou `sections` que não é lista → o `chords` do topo, como antes;
- lista não vazia sem nenhuma parte com texto → **`no-body`**: o web mostra o vazio do painel e **não** cai no `chords`
  (N4-D51, §8);
- **não muda**: Letra, Tab e Partitura (uma chave `sections` neles segue ignorada), a Cifra escaneada (`content_data` nulo
  com `file_url` → arquivo), e o "fora do par" (`progression`, `chords` em lista sem seções, `tablature` em lista,
  `notation`, tipo legado, tipo fora do enum).

O que (a) do contrato dizia — *"`sections` … ignoradas"* — passa a valer para Letra, Tab e Partitura; na Cifra vale (e).
A errata está nos dois documentos que o cabeçalho manda (*"Mudança de um lado é errata declarada nos dois documentos"*): o
**T1-R7** do [`PRD-TELA-1.md`](../PRD-TELA-1.md) §4 (leitura) e o [`docs/api/CONTENT-DATA.md`](../../api/CONTENT-DATA.md)
(escrita, que dizia *"O nativo as ignora"*) — o texto original não foi reescrito.

## 2. O que se mediu antes do conserto `[medido: s2-consumidores.txt]`

| quem | arquivo:linha | o que faz com a resposta | o que muda numa Cifra com seções |
|---|---|---|---|
| palco | `apps/native/src/screens/StageScreen.tsx:289-290` | validade → placeholder (`:314-319`) ou PDF (`urlArquivo`, `:326-327`); `bodyOf` → o nó `corpo` (`:597-598`) | o `corpo` traz as seções; uma Cifra só com seções deixa de ser placeholder `no-key` |
| S2 | `IndexScreen.tsx:282-283` → `song.ts:27`, `:46` (`resolveSong`/`labelFor`) | rótulo `ready`/`invalid` e o ícone do motivo | a Cifra só com seções passa a `ready` |
| reordenar | `ModoDeReordenar.tsx:670`, `:697` (`resolveSong`) | só o `content` (título) | nada |
| busca (S4) e picker | `SearchScreen.tsx:176`, `Picker.tsx:156` → `search.ts:42` (`buildIndex`) | **o índice usa o corpo** (`bodyOf`), além de título, artista e álbum | a Cifra é achada pelo texto das seções; palavra que só existe no `chords` velho deixa de achá-la |
| offline | `offline.ts:33` (`fileUrlsOf` → `offlineStatus`, `SetlistsScreen.tsx:457`; `selectPrefetch`) | só `body === 'file'` conta arquivo | nada: Cifra com `content_data` objeto nunca foi arquivo |
| prefetch | `prefetch.ts:50` (`urlDe`) | idem | nada |

- **Arquivo × seções**: o painel da Cifra do web **nunca** mostra arquivo — `ChordDisplay.tsx:14-17` desenha
  `textoDaCifra` ou o vazio. Numa Cifra com `sections[]` **e** `file_url`, o web mostra as seções, e o contrato devolve
  `text` (as seções): o offline e o prefetch não baixam o arquivo — como antes, porque `content_data` objeto já nunca
  era `file`. **A Cifra escaneada** (`content_data` nulo) é o outro lado: o web mostra *"nenhuma cifra"*, o palco o PDF —
  div. 991, N4-D49.
- **A fixture do mock e as bases do G-inv**: `sections` em **0** lugares — `N3-PRECHECK-anexos/instrumentos/fixture.py`
  (uma chave por tipo, `:81`, `:89`), `apps/native/src/fixtures/aceite.py` (o único `Chords` é `{annotations: []}`,
  `:137`), e os dumps de `B5-baseline/`, `B3-referencia-paisagem/` e `N3-PR6c-anexos/dumps-final/` (`grep -rl` exit 1).
  **O G-inv não muda.**

## 3. Os commits e as saídas

**Commit 1** (`150328b`) — casos novos no `content-contract.test.ts` (15) e um no `apps/native/test/palco-faixa.test.tsx`
(o nó `corpo` de uma Cifra com seções). Os esperados foram conferidos contra o `textoDaCifra` do web antes do commit
`[medido: commit1-esperados-contra-o-web.txt]`: **14 de 14 iguais**. Sobre a `main`: **10 de 39 reprovam** (9 do core, 1
do palco); os guardas que passam são a lista vazia, as não-listas, a escaneada, e Letra/Tab/Partitura/tipo fora do enum
com `sections` `[medido: commit1-reprovando.txt]`.

**Commit 2** (`cdee665`) — o conserto e a lista do G-par esvaziada `[medido: g-par-commit2.txt]`:

```
G-par — itens 14 · pares comparados 8 · iguais 8 · diferentes 0 · fora do par 6
lista esperada (0): (vazia)
reprovados     (0): (nenhum)
G-par: reprova exatamente a lista esperada (0) ✓
```

**Commit 3** (`dae7009`) — a órfã com três textos (div. 987): *"passa"*, *"está no fora do par"*, *"não existe na fixture"*.

**Commit 4** (`050980e`) — N4-D48 (Cifra com duas seções no par), N4-D49 (a escaneada no fora do par), N4-D50 (a lista
vazia fixa) `[medido: g-par-commit4.txt]`:

```
G-par — itens 16 · pares comparados 9 · iguais 9 · diferentes 0 · fora do par 7
  IGUAL     cifra-duas-secoes            web=texto(97)        nativo=texto(97)              [painel-cifra]
  diferente cifra-escaneada              web=sem-corpo        nativo=arquivo(77)            — … → Bloco D
lista esperada (0): (vazia)
reprovados     (0): (nenhum)
G-par: zero reprovações, lista vazia (N4-D50) ✓
```

O prompt da N4-D48 esperava *"itens 15"*; são **16** porque a N4-D49 põe a escaneada no fora do par (7) — div. 992. A
fixture não foi ajustada.

## 4. Os controles negativos (regra 4)

| commit | CN | o G-par | exit |
|---|---|---|---|
| 2 | só o conserto revertido (o `content-contract.ts` da `main`, a lista vazia) | `✗ reprovação NÃO DECLARADA` nas duas variantes de seções | 1 |
| 2 | ordem das partes trocada (name · lyrics · chords) | reprova `cifra-secoes-completas` | 1 |
| 2 | junção **dentro** da seção `"\n"` → `" "` | reprova as duas | 1 |
| 2 | junção **entre** seções `"\n\n"` → `"\n"` | **passa** (as duas variantes tinham uma seção) — div. 990; o teste do contrato e o do palco pegam (3 reprovações) | **0** |
| 3 | `letra` · `cifra-em-lista` · `nao-existe` na lista | `(passa)` · `(está no fora do par)` · `(não existe na fixture)` | 1 |
| 4 | junção **entre** seções `"\n\n"` → `"\n"` (N4-D48) | `✗ reprovação NÃO DECLARADA: cifra-duas-secoes` | **1** |
| 4 | `letra` na lista | `✗ declaração ÓRFÃ: letra (passa)` e `✗ LISTA NÃO VAZIA (1): desde a PR-2 (N4-D40) reprovação declarada não é mais aceita — g-par-reprovados.txt tem de estar vazio (N4-D50)` | 1 |
| 4 | `cifra-em-lista` · `nao-existe` na lista | os dois textos da órfã e a mesma linha de lista não vazia | 1 |
| 4 | conserto revertido **e** as três Cifras com seções **declaradas** na lista | só `✗ LISTA NÃO VAZIA (3)` — a reprovação declarada deixou de ser aceita | 1 |

Todos desfeitos com `git checkout`; o `git status` depois de cada rodada está no anexo de cada commit.

## 5. Os gates `[medido: gates.txt, g1-g2g3-com-o-bloco-gates.txt, suite-commit4.txt]`

| gate | resultado |
|---|---|
| G-inv | `B5-baseline` **34 de 34**; `B3-referencia-paisagem` **18 de 18** — idêntico em dp (§2: nenhuma base tem `sections`) |
| G-N3 | (e)=0 · (b)=0 · nome-acessível=0 |
| G1 | sem o bloco: `G1a: DIFF NÃO VAZIO ✗` no `content-contract.ts` (o conserto); **com** o bloco ```` ```gates ```` do corpo: `G1a: DIFF VAZIO ✓` em 49 derivados · `G1b: só adição ✓` (0 linhas removidas nos testes do core) |
| G2 / G3 | `testIDs antes=80 depois=80` ✓ · `log( antes=68 depois=68` ✓ — nenhum `testID`, nenhuma linha de log |
| `gate:a20` · `gate:icones` | 0 acusações · 0 acusações, 0 avisos |
| G-back · G-palco · G-tok · cobertura · G-faixa | PASSA · PASSA (0) · PASSA (132 arquivos, 446 strings de `.ts`) · PASSA (129 de 129) · PASSA |
| `SHA256SUMS` | `DESIGN-V1` 3 OK · `-N2` 2 OK · `-N3` 2 OK · `docs/ux/DESIGN-I1` 14 OK |
| suíte inteira | `Test Files 120 passed \| 3 skipped (123)` · `Tests 1203 passed \| 59 skipped (1262)` (1187 da PR-1 + 16 novos); `tsc` raiz e nativo, lint: limpos |

## 6. Os checks da PR

Sobre os dois heads de código, **todos verdes** `[medido: gh pr checks 355; gh run view <id> --json jobs]` (nível **job**,
pelos carimbos; `n=1` cada — não é referência, a faixa é a do [`CI-FAIXA.md`](../CI-FAIXA.md)):

| check | `dae7009` | `050980e` |
|---|---|---|
| `build` (`ci.yml`) | pass | pass (4m0s) |
| `gates-nativos` (`gates.yml`, lendo o bloco do corpo) | pass | pass (13s) |
| `g-back` · `g-palco` · `g-tok` · `g-faixa` | pass | pass (33s · 14s · 29s · 9s) |
| `mudou-nativo` | pass | pass (9s) |
| **`android-debug-apk`** | **pass — 11m45s** (19:13:10 → 19:24:55Z) | **pass — 13m20s** (19:21:55 → 19:35:15Z) |
| `Vercel` · `Vercel Preview Comments` | pass | pass |

**O APK rodou só porque o commit 1 toca `apps/native/test/`** — `packages/core/**` está fora do `paths` do `native.yml`
desde a N1-PR8 (div. 988, destino **W5** pela N4-D52). O do `050980e` (que só toca `packages/core/fixtures` e
`tests/gates`) também rodou: nenhum APK anterior desta PR tinha terminado `success` ainda (div. 360).

## 7. O aceite no Tab S6 — medido pelo executor (N4-D53), conferido pelo Marcel `[medido: aceite-tab.txt]`

- **Aparelho**: o Marcel destravou; `stay_on` 0 → 7 → 0; rotação (`accelerometer_rotation=1`, `user_rotation=0`), rádio e
  avião lidos e devolvidos; `adb reverse` vazio antes e depois.
- **O bundle** (regra 13), Metro desta árvore sem `CI=1`, `apps/native/.env` copiado por `cp -p` do checkout principal
  (sha256 `f2bfa179cd8e…` nos dois; não aberto): `textoDasSecoes: 3 · octavia.rocks: 1 · localhost:8788: 0`.
- **Os alvos**: as 3 Cifras (ordinais 3 e 8 com seções — os mesmos da B2 —, e 63), a Letra de ordinal 1, a Tab de
  ordinal 7 e a Partitura de ordinal 9; abertos no palco pela S4 (*"busca pelo título do ordinal N"*, toque em
  `resultado-<id8>`); o nó `corpo` lido pelo `uiautomator dump`, em memória. **O dump trouxe o texto inteiro do nó**: a
  prova é a igualdade byte a byte com (w) — um texto parcial não daria `igual`.
- **(w)** o `ContentDisplay` real do web montado em jsdom, como o G-par; **(n)** o `bodyOf` desta árvore; **(v)** o
  `bodyOf` da `main` — por um teste temporário fora do commit, apagado no fim.

**A medição, depois do sync 2** (a que vale — ver a conferência abaixo):

| ordinal | tipo | len(palco) | sha12(palco) | palco × w | palco × n | n × v |
|---|---|---|---|---|---|---|
| 3 | Cifra, seções | 2029 | `1b7a6ac7c5ef` | igual | igual | **diferente** (v = 2027) |
| 8 | Cifra, seções | 32 | `5699489a26b4` | igual | igual | **diferente** (v = 10) |
| 63 | Cifra | 8 | `761920247813` | igual | igual | igual |
| 1 | Letra | 1831 | `8eaa08ad353f` | igual | igual | igual |
| 7 | Tab | 7 | `a63ab36162a4` | igual | igual | igual |
| 9 | Partitura | — (nó `s3d`) | — | — | — | — |

- **A Partitura** abriu como antes: `s3d`, `file src=disk … bytes=138916`, `pdf-render pages=5 src=disk`, `pdf-page n=1/5`.
- **Antes do sync 2** a mesma tabela deu o mesmo, com o ordinal 3 em **2028** (`24bd99f875e2`, v = 2027) — os 2028 e os
  2027 são os comprimentos que a B2 mediu para o web e para o core naquela Cifra.
- **Em avião** (regra 11: lido, `cmd connectivity airplane-mode enable`, `ping` → `connect: Network is unreachable`,
  `net offline`; restaurado, `ping` respondendo): as 3 Cifras reabertas com o **mesmo sha12** da medição com rede (2028 ·
  32 · 8). Medido antes da edição do Marcel.
- **A conferência do Marcel**, verbatim:
  - ordinal 3, 1ª pergunta: *"Eu não havia editar. Só editei agora"* — ele **não** tinha editado essa Cifra antes e a
    editou no web durante o aceite (div. 993). Pela escolha dele (*"Sincronizar e remedir"*): sync 2 (`invalidated=1`, o
    ordinal 3 com `updated_at` 2026-10-01T22:10:56Z), a medição acima, e a pergunta de novo;
  - ordinal 3, depois do sync 2: *"É o texto que eu editei"*;
  - ordinal 8: *"É o texto que eu editei"*.
- **O que a edição ao vivo mostrou**: depois de o Marcel editar, (v) — o leitor velho — continua nos **2027** caracteres
  do `chords` do topo, e o palco com o leitor novo mostra os **2029** que ele escreveu. É a div. 975 acontecendo no
  aparelho, e o conserto a cobrindo.
- **Requests a `/api/*`**: **4 `GET`** (dois syncs de leitura, 2 cada); escrita do executor **0**; login **0**. Uma
  escrita em prod **do Marcel**, no web (a edição do ordinal 3), fora do aceite. **Janela sem log**: o 1º Metro parou pelo
  limite de tempo da tarefa em segundo plano (div. 994); o log dele termina em `net online` (a volta do avião) sem sync
  depois, e até a 2ª subida o app ficou aberto sem Metro — uma sync nessa janela não estaria registrada.
- **Desmontagem**: Metro parado (`lsof … :8081` → 0); `apps/native/.env` apagado (`ls` → *No such file or directory*);
  `reverse` vazio; `stay_on` 0, rotação, avião, wifi e dados como lidos. **md5 do cache depois**: `content.json` mudou (a
  edição do Marcel), `setlists.json` mudou (o `syncedAtMs`), `files-index.json` mudou (o PDF aberto); o PDF igual
  (`05253d42…`); a pasta de demanda vazia. O diretório temporário apagado (`ls` → *No such file or directory*); os dois
  arquivos de teste temporários em `tests/gates/` apagados (`git status` vazio).

## 8. N4-D51 — a leitura que a condiciona `[medido: n4-d51-leitura.txt]`

*"Lista de seções não vazia e sem nenhum texto → sem corpo"* fica (igual ao web) porque **nenhum caminho grava seções com
menos texto do que o `chords` do topo tinha**:

- **Abrir uma Cifra só com o `chords` do topo**: o editor cria **em memória** uma seção de `name` `"Content"`, `chords`
  vazio e **o `chords` do topo inteiro** na `lyrics` (`components/chord-editor.tsx:25-29`; o texto não é aparado nem
  cortado). Sem texto no topo, uma `"Verse 1"` vazia (`:32-35`).
- **O estado só sai do editor por uma mudança**: `updateChordData` (`:38-41`) — inclusive os campos de *Informações* do
  próprio editor de cifra (`:74`) —, espalhado no `content_data` (`components/editors/content-type-editor.tsx:31-38`) e
  levado ao `PUT` (`components/content-editor.tsx:64-68`). Uma mudança grava a seção `"Content"` com o texto todo: o
  palco passa a mostrar `"Content"` + o mesmo texto — **mais**, não menos.
- **Salvar sem editar não existe**: o *Salvar* só fica ativo quando o corpo do `PUT` difere do de abertura
  (`content-editor.tsx:80-81`; `components/editors/cabecalho-do-editor.tsx:26`, `:45`).
- **Os únicos caminhos para menos texto** são do músico: apagar o texto de uma seção à mão (o palco mostra o que ele
  deixou) ou remover todas as seções (grava `[]` — e lista vazia volta ao `chords` do topo).
- **Upload, criar do zero e lote não gravam `sections`**: criar grava `{ chords: "" }` (`components/content-creator.tsx:32`);
  o lote grava `song.body` (`hooks/useAddContentLogic.ts:170`); `git grep sections` em `hooks`, `components/upload`,
  `components/add-content`, `content-creator.tsx`, `lib/batch-import.ts`, `lib/content-service.ts` e `app` → exit 1.

## 9. Como o leitor novo chega ao Tab no dia a dia (div. 989)

**Hoje não há build com o código embutido instalado no Tab.** O app do Tab é o **dev client** (`DEBUGGABLE`,
`lastUpdateTime 2026-09-23 19:11:34`, lido de novo neste aceite) — o mesmo da B1 do pre-check, que só carrega o código
JavaScript pelo **Metro** (div. 982). O APK do CI (`android-debug-apk`, `assembleDebug`) é o mesmo tipo de binário: o
plugin do React Native **não embute o bundle** nas variantes de debug (`debuggableVariants`, padrão
`['debug', 'debugOptimized']`, `@react-native/gradle-plugin` `ReactExtension.kt:99-106`). O release medido no W4-b3 rodou
no Tab e **saiu** dele: *"o do Tab voltou ao binário de antes"* (`W4-ENCERRAMENTO.md` §8). Depois do merge, o conserto só
aparece no palco com o Metro de uma árvore que tenha o merge.

**A receita para o conserto estar no aparelho sem Metro** — o build de release do W4-b3
([`RELEASE-FAIXA.md`](../RELEASE-FAIXA.md); [`APARATO.md`](../APARATO.md), "Ferramentas"):

1. numa árvore sobre a `main` com o merge desta PR, o `apps/native/.env` copiado do checkout principal (o prebuild precisa
   dele; regra 2) — passo do Marcel;
2. `rm -rf $TMPDIR/metro-cache` — com ele quente, o bundle embutido saiu com a URL errada (div. 374);
3. da raiz: `sh docs/native/W4B3-anexos/builds.sh <saida.tsv> R1` — prebuild limpo e `assembleRelease`, assinado com a
   **chave de debug** (a mesma do dev client);
4. conferir o APK: `unzip -p <apk> assets/index.android.bundle | grep -ac octavia.rocks` ≥ 1 (e, como hipótese não
   medida, o `textoDasSecoes` no mesmo `grep`: o bundle de release é bytecode, e o nome pode não sobreviver);
5. guardar o dev client: `adb shell pm path rocks.octavia.app` + `adb pull` do `base.apk`;
6. `adb install -r <apk>` — troca o app **mantendo dados e sessão** (div. 372); apagar o `.env` da árvore.

Limites do release: não alcança `http://` (o mock é do dev client; aceite de release é contra prod), não tem `run-as`; a
volta ao dev client para os aceites é o mesmo `install -r` do `base.apk` guardado.

## 10. Decisões `[Marcel, 2026-10-01]`

| # | decisão |
|---|---|
| **N4-D48** | (div. 990) A fixture do G-par ganha uma Cifra com **duas seções**, para o gate ver a junção entre seções; o CN `"\n\n"` → `"\n"` tem de reprovar. *(Feito no `050980e`; reprova — §4.)* |
| **N4-D49** | (div. 991) A Cifra escaneada entra no "fora do par", destino **Bloco D**: o web mostra *"nenhuma cifra"*, o core a trata como arquivo e o palco mostra o PDF; vale o comportamento do core; nenhum item da conta principal está nesse caso. O fora do par passa a 7. |
| **N4-D50** | O G-par exige a **lista vazia como condição fixa**: qualquer linha em `g-par-reprovados.txt` reprova, com a frase *"desde a PR-2 (N4-D40) reprovação declarada não é mais aceita"*; os três textos da órfã continuam. |
| **N4-D51** | *"Lista de seções não vazia e sem nenhum texto → sem corpo"* fica como está (igual ao web), condicionada à leitura do §8 — que não achou caminho de menos texto. |
| **N4-D52** | A div. 988 tem destino **W5**, junto do item **4** do `I1-ENCERRAMENTO.md` §10.4 (*"o CI do APK só pelo pacote"* — o `paths` do `native.yml` e o `packages/identidade`; conferido com `grep`). Este README registra que o APK desta PR só rodou porque o commit 1 toca `apps/native/test/` (§6). |
| **N4-D53** | Nesta PR o aceite no Tab é **medido pelo executor**, por instrumento; ao Marcel cabem o destravar e a conferência visual. O `apps/native/.env` autorizado só para isto, pela receita da B1. |

## 11. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# N4-PR2 (N4-D40): o contrato de leitura do core lê sections[] da Cifra — o conserto é este arquivo.
g1a: packages/core/src/content-contract.ts
```

```gates-web
# N4-PR2: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado; só packages/core/src, packages/core/fixtures, tests/gates e apps/native/test.
```

## 12. Divergências — 988 a 995

A última usada era a **987** (`N4-PR1-anexos/README.md` §5) `[medido: git grep -nE '^\| \*\*9[8-9][0-9]\*\*' -- docs]`.
Origem: **P** premissa do prompt · **D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **988** | P | *"Esta PR toca `packages/core/src`: o `native.yml` tem de construir o APK"* — `packages/core/**` está fora do `paths` do `native.yml` desde a N1-PR8 (o cabeçalho do workflow, `:2-8`, `:37`); o APK rodou só porque o commit 1 toca `apps/native/test/` | **W5** (N4-D52), com o `I1-ENCERRAMENTO.md` §10.4 item 4 |
| **989** | P | *"como instalar este APK"* — o APK do CI é dev client de debug: não embute o bundle (`debuggableVariants`); o leitor novo chega pelo Metro | roteiro pelo Metro; §9 (o uso do dia a dia) |
| **990** | T | O G-par não via a junção **entre** seções: as duas variantes da fixture tinham uma seção; o CN `"\n\n"` → `"\n"` passava (exit 0). O teste do contrato e o do palco pegavam | **fechada** pela N4-D48 (`050980e`) |
| **991** | A | A Cifra escaneada: o web mostra o vazio do painel (`ChordDisplay.tsx:14-17` não mostra arquivo), o palco mostra o PDF — diferença anterior a esta PR, fora da fixture do G-par | **fechada** pela N4-D49: fora do par, Bloco D |
| **992** | P | N4-D48 esperava *"itens 15"*; a N4-D49, no mesmo commit, põe a escaneada no fora do par: **16** (par 9 + fora 7). Pares, iguais e diferentes como pedidos | registrado; a fixture não foi ajustada |
| **993** | P | O roteiro de aceite presumia que as 2 Cifras com seções tinham sido **editadas pelo Marcel**; ele não tinha editado a de ordinal 3 (*"Eu não havia editar. Só editei agora"*) e a editou durante o aceite | pela escolha dele: sync 2, remedição e conferência de novo (§7) |
| **994** | T | O 1º Metro parou no meio do aceite pelo limite de tempo da tarefa em segundo plano da sessão; subido de novo com limite maior, o bundle conferido outra vez. Deixa uma janela sem log de app (§7) | declarado; nenhuma medição dependia dele naquele intervalo |
| **995** | T | O driver da busca falhou na 1ª tentativa: a consulta tirava a pontuação do título (a busca não achava) e o `apagar` não limpou o campo (as seis consultas acumularam, 64 caracteres) | consertado no instrumento (DEL e o maior trecho contínuo do título) antes de qualquer medição |

**Contagem**: 8 — P 4 · A 1 · T 3. **Fechadas**: 990 (N4-D48), 991 (N4-D49) e a **987** da PR-1 (commit 3).
**Com destino fora**: 988 (W5).

## 13. Contabilidade

| | |
|---|---|
| requests a `/api/*` em prod | **4 `GET`** (dois syncs de leitura do Tab, 2 cada) — sem a janela sem log da div. 994 |
| requests a terceiros | **0** |
| escritas em prod | **0** do executor; **1** do Marcel no web (a edição do ordinal 3, durante o aceite) |
| logins | **0** |
| aparelho | Tab S6, destravado pelo Marcel; `stay_on` 0 → 7 → 0; avião ligado e desligado (regra 11); `adb reverse` 8081, removido; estado final igual ao lido |
| `.env*` | `apps/native/.env` (N4-D53), cópia por `cp -p`, não aberto, **apagado** no fim |
| agentes | **0** |
| código de produto | `packages/core/src/content-contract.ts` |
| testes e fixtures | `packages/core/src/content-contract.test.ts`, `apps/native/test/palco-faixa.test.tsx`, `tests/gates/n4-g-par.test.tsx`, `packages/core/fixtures/{g-par.json, g-par-reprovados.txt}` |
| docs | este diretório; a errata do T1-R7 no `PRD-TELA-1.md` §4; a linha de errata no `docs/api/CONTENT-DATA.md` |
| YAML | nenhum |
| APK | dois, verdes (§6) |
| temporários | o diretório do aceite (cópias do `content.json`, dumps, o contrato da `main`), os dois testes temporários em `tests/gates/`, os bundles baixados e os logs do Metro: fora do commit, apagados ou no scratchpad da sessão |

---

**A próxima PR desta lista** (N4-D45): **PR-3 — core das frases**, que só começa depois do congelamento do desenho.
