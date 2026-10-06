# N4-PR7 — a tela da biblioteca (L), com o novo destino de `Buscar música`

> **Bloco N4 · PR-7** (`n4/pr7-biblioteca`, PR [#363](https://github.com/marcelviana/octavia/pull/363), **sem merge**).
> Data: 2026-10-06. Base: `origin/main` = `5c707a3` (merge da #362, a N4-PR6). Árvore `../octavia-n4-pr7`;
> `pnpm install --frozen-lockfile --offline`.
> Commits: `ab5ed96` `test(n4): PR-7 — o instrumento` · `aa766d5` `feat(identidade): os tokens da biblioteca (P-T1, P-T2)`
> · `b078b91` `test(n4): PR-7 — a tela da biblioteca, reprovando` · `ed61bcc` `feat(native): a biblioteca — composição,
> lista, filtros e busca` · `5ee20dd` `… — a linha, o favoritar e o ▶` · `c29a6a7` `… — sem rede, sincronização e falhas` ·
> `8d14c69` `feat(native): Buscar música abre a biblioteca (N4-R1)` · **e quatro a mais, declarados** (div. 1089):
> `2a095a7` `test(n4): PR-7 — o duplo do FlatList e do autoFocus` (dois CN que não reprovavam, §4) · `9843b1d` `test(n4):
> PR-7 — o teclado não encolhe a L, reprovando` · `105b98d` `fix(native): com o teclado de pé, a lista de L termina acima
> dele (N4-R2)` (§5.2) · `b941a13` `fix(native): o Tentar novamente da L sem cache é o botão do S1d` · `8aa319c` o de docs ·
> **e os dois acertos antes do merge**: `6d2a605` `test(n4): o arnês não apaga o que não criou` (§5.6) · o de docs (§5.6,
> §5.7).
> `[medido]` = comando + saída literal nesta sessão, nos arquivos desta pasta.
> Requisitos: N4-R1…N4-R11 (na tela de L), N4-R20 (P-T1, P-T2), N4-R22…N4-R25. Aceites: §7.

**S1 não muda em mais nada; o palco com setlist não muda**: G-inv **34 de 34 e 18 de 18** nos dois aparelhos, com a PR, a
S4 da base alcançada pelo caminho novo (**4 de 4**). Nenhum backend, nenhum arquivo do site; o CSS gerado byte a byte igual.
Zero escrita em prod; em prod, só o sync de leitura da prova da N4-D56 (2 `GET`).

---

## 0. Decisões do Marcel nesta PR `[Marcel, 2026-10-06]`

A tela precisou de dois valores que nem o pacote nem P-T1/P-T2 dão; parei e perguntei (o prompt). As respostas, verbatim da
escolha (as duas, a opção recomendada):

- **N4-D96 — o arco da estrela em voo: "Literal da folha".** O arco de `N4-*-L-favoritando` (a caixa de 42 × 42, a trilha
  r 19 em `line` e um quarto em `accentInk`, traço 2) é desenho da tela, com os números da folha, declarado
  (`LinhaDaBiblioteca.tsx`, `ArcoDeAndamento`); vai à herança do bloco de identidade, com os 13 e 20 da N4-D79.
- **N4-D97 — a largura máxima do apoio nos estados centrais: "O mesmo 560 de S1/S4".** Cópia declarada do literal das
  duas telas (`LibraryScreen.tsx`, `centroApoio`); herança do bloco de identidade.

E, no aceite, **o julgamento do Marcel** (§7, A-N4-18): a estrela **bom** · o ▶ **bom** · *a tela se lê?* **sim**.

E, depois do relatório dos acertos antes do merge:

- **N4-D98 — a receita do cache no Tab: "aprovada, pode aplicar".** A errata proposta no §5.6 (div. 1097) vale: o arquivo
  real do Marcel sai do aparelho junto com a guarda do cache, por nome, e volta junto com a regravação, conferido o md5 —
  durante o mock, a pasta da sessão só tem o que a fixture criou (`APARATO.md`, "O cache do app no Tab").

---

## 1. O instrumento, antes de qualquer tela

### 1.1 A régua das estimadas (N4-R25) `[medido: regua-avd.txt]`

A régua de desenvolvimento ganhou os quatro estilos de L (`ReguaDeDev.tsx`: `lib-chip` Manrope 15, `lib-contagem` mono 13,
`lib-titulo` Manrope 600 de 20, `lib-segunda` Manrope 15) e mediu no AVD, na ordem da folha. A cópia do `regua.py` da N3-PR1
(`instrumentos/regua-pr7.py`) não limpa o logcat por linha (o `FATAL` cobre a rodada) e lê a **altura** da caixa no dump.

| # | elemento | folha | medido | Δ | |
| --- | --- | --- | --- | --- | --- |
| **e1** | chips (com as contagens da folha, e a borda) | 112 · 110 · 92 · 140 · 140 | 114,4 · 103,3 · 95,3 · 130,9 · 133,1 | +2,4 · **−6,7** · +3,3 · **−9,1** · **−6,9** | **N4-E10** |
| **e2** | chips somados em B | 626 de 663 · folga 37 | **609,0 de 663 · folga 54,0** | −17 | **N4-E10** — cabem numa linha |
| — | no dump de B (contagens da fixture do mock) | — | 601,3 dp do 1º ao último, **uma linha** | | `medidas-l` |
| **e3** | título da linha 20/600 | linha 26 | caixa 29,8 | +3,8 | sem errata |
| **e4** | linha com título em 2 linhas (A) | 106 | não medida: em A o título fica numa linha | — | registro (N5) |
| **e9** | teclado em C | 300 | **279,1** da janela de 627,1 (AVD) | −20,9 | **N4-E11** |
| **e9** | teclado em A | 300 | o teclado 288,4; cobre **320,4** da janela útil | | **N4-E11** |
| m6 | régua | 50 (a conta dá 48,2) | texto 18,2; a régua 16 + 18,2 + 12 = **46,2** (dump) | −3,8 | sem errata |
| div. 1014 | a linha de aviso com o motivo em 15 | P-F4 em B: 1 linha | P-F4 615,6 dp de 631,1 disponíveis: **1 linha** | | fecha |
| div. 1014 | favoritar, pior caso (o título da folha) | C 1 · B 2 · A 4 | 820,9 dp: **C 1 · B 2 · A 3** | | registro |
| div. 1014 | o mesmo, com o título longo do mock (*Tirar …*) | — | 1092,0 dp: **C 2 · B 2 · A 4** | | registro |

O controle régua × dump: o chip *Letra* com a contagem *6* dá 106,4 pela régua e **106,7** no dump.

### 1.2 O `gate:a20` lê o `frases-content.ts` (div. 1035) `[medido: a20-icones.txt, cn.txt]`

`EXTRAS` com o módulo de frases de content do core: **169 → 223** literais examinados, 0 acusações. CN 9: *loading…* plantado
no `FRASES_DO_TABLET` → `acusações: 1` (`[EXTRAS: valor de chave] "loading…"`).

### 1.3 Os testIDs e a fixture (div. 1002) — a escolha

**Esta PR usa uma fixture com ids distintos**, num diretório próprio (`instrumentos/fixture-biblioteca.py`): a da base do
pre-check do N3, com o `{id8}` de cada música trocado (`b1b1XXXX-…`, as setlists acompanham), mais três itens escritos pelo
projeto (*Item sem tipo da fixture* fora do enum, *Item sem conteúdo da fixture* sem corpo, *Partitura grande da fixture*
com um PDF de 24 MiB) e *Segunda do ensaio* favorita. **A fixture da base do G-inv não se toca**: no caminho novo da S4 o
arnês toca o ▶ pelo **nome acessível** (*Tocar “Águas de fixture”*), onde o `{id8}` colide.

### 1.4 A linha de base sobre a `main` `[medido: g-inv-main-*.txt, g-inv-par-main-*.txt, g-n3-main-*.txt]`

| | AVD (antes de mexer) | Tab (na sessão do Tab, Metro de uma árvore da `main`) |
| --- | --- | --- |
| `B5-baseline/` | 18 de 18 | 16 de 16 → **34 de 34** |
| `B3-referencia-paisagem/` | 9 de 9 | 9 de 9 → **18 de 18** |
| `g-inv-par` | 4 de 4 | 4 de 4 → **8 de 8** |
| G-N3 com os rolados | (e)=0 · (b)=0 | os dois: **(e)=0 · (b)=0** · nome-acessível 8 · rolagem 6 |

No Tab o primeiro passo da cadeia (o palco) esgotou a espera do cartão — o sync da fixture ainda não tinha trocado o cache do
Marcel — e foi refeito isolado (div. 1094).

---

## 2. O que se mediu antes de escrever

- **Como S1 abre a busca, e o que muda** — `navigation.tsx:157` (na `main`): `onBuscar={() => navigation.navigate('Search',
  {})}`. Agora `navigation.navigate(DESTINO_DE_BUSCAR_MUSICA)` (`'Biblioteca'`, `rotas-do-avulso.ts`). O botão é o de sempre
  (`SetlistsScreen.tsx`, `testID="buscar"`, o rótulo agora do core com o texto byte a byte): **os 8 dumps de S1 idênticos**.
- **Como o roteiro chega à S4** — `N3-PRECHECK-anexos/instrumentos/roteiro.py:258-264`: `ir_s1` → `tap(buscar)` → a S4. Passa
  a ser `ir_s1` → `buscar` (a L) → *Tocar “Águas de fixture”* → o palco avulso sem setlist → `busca` → a S4 sem *Nesta
  setlist* (`instrumentos/roteiro-errata-de-caminho.diff`). **4 de 4** (§5.1).
- **O estado do arquivo depois de um plano rodado sem rede (N4-D92, div. 1066)** — na `main`, a rejeição do download entrava
  no estado como falha (`files.ts`, `falhas.set(url, fraseDaFalha(erro))`), e a mensagem do Android sem rede não tem status: a
  música virava *não consegui baixar*. Agora o `files.ts` consulta uma sonda de rede (`ligarSondaDeRede`, ligada pela raiz com
  o `estaOnline`): sem rede, nada se registra e o estado é *arquivo não baixado*. O log não muda.
- **As frases** (a tabela da N4-PR3 §1.1, linhas 4–17) passam ao core (`frases-content.ts`, grupo 5: `FRASES_DO_TABLET`,
  `nadaEncontradoPara`, `escopoDaBusca`, `mostrandoDadosDe`) e as telas importam — `IndexScreen`, `StageScreen`,
  `SearchScreen`, `SetlistsScreen`, `files.ts`. **Três a mais, declarados**: o mapa inteiro da falha de sync
  (`TEXTO_DA_FALHA_DE_SYNC`; a linha 16 é um valor dele), a idade do dado (`haQuantoTempo`, com o relógio como dado) e o
  *Voltar para as setlists* (`IndexScreen.tsx:693`, o voltar de L); e a régua sem número (`REGUA_SEM_NUMERO`, *Biblioteca*
  · *—*, N4-D79). A cópia da P-F8 na S4 sai (a régua importa `nResultados`). Gate de igualdade: `frases-n4.test.ts` (5).
- **O tamanho**: 21 arquivos, +1940/−69 de código (três telas novas — `LibraryScreen.tsx` 474, `LinhaDaBiblioteca.tsx` 243,
  `FiltrosDaBiblioteca.tsx` 178 — e os testes). O porte da N4-PR5 (2259): **coube numa PR**, sem o corte.

---

## 3. O que a PR entrega

| | onde | o quê |
| --- | --- | --- |
| **os tokens** P-T1, P-T2 | `packages/identidade/src/tokens.ts` | `faixas.*.lib` = `{ filtros, linha }`: C 64 · B 64 · A 120 (`space.sm + touch.min + space.sm`; em A, duas linhas); a linha 80. A passa a ser uma cópia de B com o `lib` próprio. O teste do pacote em par (`igualdade.test.ts`: o `lib` é adição; *"A é o objeto de B"* → *"A é B fora do lib"*). **O CSS do site**: sha256 `1857944a…` antes e depois de regenerar (`identidade-depois.txt`) |
| **a composição** (N4-R3) | `LibraryScreen.tsx` | a barra de 88 (a da S4, medida a medida), a linha de aviso sob ela, a faixa de filtros (`tokens.lib.filtros`, `flexWrap`), a régua fixa e só a lista rolando |
| **a lista e os filtros** (N4-R4, R5) | `FiltrosDaBiblioteca.tsx` | o core da PR-5; a contagem fixa; os nomes da P-F9 (*Só as favoritas* da N4-D85); o marcado com o contorno `accentInk` e o fundo do `web.alfaMarcado` do pacote (div. 1091) |
| **a busca** (N4-R11) | `LibraryScreen.tsx` | a da S4 sem o corte de 50, com as frases da S4b |
| **a linha** (N4-R6) | `LinhaDaBiblioteca.tsx` | o tipo sempre, o artista depois; o estado do arquivo; os inválidos com o ▶ inerte; a estrela e o ▶ de 48. **A linha não é tocável** (V na PR-8; errata do N4-R6/A-N4-6) |
| **o ▶** | `rotas-do-avulso.ts` | `destinoDoTocarDaBiblioteca`: o avulso sem hospedeira, origem `biblioteca`, `push` |
| **o favoritar** (N4-R7, R8, R9) | `LibraryScreen.tsx`, `LinhaDaBiblioteca.tsx` | a estrela inerte com o arco em voo (N4-D96), nada antes da resposta; a falha por espécie na linha de aviso; sem rede, a estrela inerte e a P-F4 |
| **os estados de sync** (N4-R10) | `LibraryScreen.tsx` | carregando · vazia (a marca de S1, exportada: `MarcaEmRepouso`) · falha com e sem cache |
| **N4-D92** | `files.ts`, `App.tsx` | a sonda de rede na rejeição do download |
| **sem teclado / com teclado** (N4-R2) | `LibraryScreen.tsx` | o campo sem `autoFocus`; a raiz um `KeyboardAvoidingView` (`padding`, o inset do topo) — §5.2 |
| **a entrada** (N4-R1) | `navigation.tsx` | a rota `Biblioteca`; `Buscar música` a abre |
| **o mock** (instrumento) | `fixtures/aceite.py` | `OCTAVIA_MOCK_LENTA_S` (div. 1088) |

**Os tamanhos**: o título 20 e a contagem 13 são os literais da S4 (N4-D79); a segunda linha é **15** (`size.bodySmall`), a da
folha (div. 1090).

---

## 4. Testes antes e depois, e os controles negativos

**Commit 3 sobre a `main` + os commits 1 e 2** `[medido: commit3-reprovando.txt]`: `biblioteca-tela.test.tsx` reprova na
importação (a tela não existe); `arquivo-sem-rede.test.ts` 4 ✗ (o `ligarSondaDeRede` não existe); `frases-n4.test.ts` 10 ✗
— **15 ✗**, 37 ✓. Pelas fatias: depois do commit 4, 25 ✗ (só os novos); do 5, 24; do 6, 1 (o N4-R1); do 7, **0**.

| arquivo | testes |
| --- | --- |
| `apps/native/test/biblioteca-tela.test.tsx` | 40 — N4-R1 a N4-R11, os três tokens por faixa, os quatro estados de sync, as seis espécies |
| `apps/native/test/arquivo-sem-rede.test.ts` | 6 — N4-D92 (sem rede · o log não muda · a falha antiga sai · três controles) |
| `apps/native/test/frases-n4.test.ts` | (5) novo; (3) em par |

**Suíte inteira** `[medido: suite.txt]`: **135 arquivos ✓ · 3 pulados; 1594 testes ✓ · 59 pulados; 0 ✗** (a N4-PR6 fechou em
1539).

**Controles negativos** (regra 4), cada um desfeito, `git status` vazio `[medido: cn.txt, cn-device-g-inv.txt]`:

| CN | o que se plantou | quem reprova |
| --- | --- | --- |
| 1 | a régua rolando com a lista (no cabeçalho da `FlatList`) | **não reprovou** → o duplo ignorava o `ListHeaderComponent` (div. 1081); consertado no duplo (`2a095a7`), refeito: **2 ✗** |
| 2 | a contagem do chip contada sobre o que sobrou | 1 ✗ |
| 3 | a estrela com o desenho do valor pedido em voo (otimismo) | 1 ✗ |
| 4 | o motivo elidido (`numberOfLines={1}`) | 1 ✗ |
| 5 | o teclado abrindo sozinho (`autoFocus`) | **não reprovou** → o React consome o `autoFocus` sem escrever o atributo (div. 1081); consertado no duplo, refeito: **1 ✗** |
| 6 | o N4-D92 desfeito | 2 ✗ |
| 7 | uma cópia de frase de volta numa tela | 1 ✗ |
| 8 | uma frase do core trocada | 1 ✗ |
| 9 | inglês no `frases-content.ts` | `gate:a20`: 1 acusação |
| 10 | **no aparelho**: S1 com o rótulo de `Buscar música` em `size.body` | **G-inv: `S1-setlists-avd-pai` DIFERENTE** |
| 11 | **no aparelho**: a S4 com o campo de `touch.list + 6`, alcançada pelo caminho novo | **G-inv: `S4-vazio` e `S4-resultados` DIFERENTES** |
| (teclado) | o teste da raiz `KeyboardAvoidingView` antes do conserto | 1 ✗ (`teclado-reprovando.txt`) |
| (S1d) | o fundo do *Tentar novamente* antes do conserto | 1 ✗ |

---

## 5. No aparelho, com o mock (N4-D54: o executor mede)

**O aparato** (`APARATO.md` lido inteiro): a fixture do pre-check do N3 (*hoje* = 2026-09-23) para o G-inv, e a da
biblioteca (§1.3) para a L; um mock por aparelho (AVD 8788, Tab 8789, celular 8792); os arquivos na 8790; o Metro **sem
`CI=1`**, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; `apps/native/.env` por `cp -p` do checkout
principal (sha256 `f2bfa179cd8e4b1f…`, nenhum valor lido), **apagado no fim**. **O bundle servido conferido** (regra 13)
antes de cada rodada (`bundle-pr.txt`, `bundle-tab-pr.txt`): `LibraryScreen` 9 · `destinoDoTocarDaBiblioteca` 3 ·
`ligarSondaDeRede` 4 · `localhost:8788` 1 · **`octavia.rocks` 0**; na `main`, `LibraryScreen` 0. O arnês: `instrumentos/`
— as cadeias, a errata de caminho do `roteiro.py`, `biblioteca.py` (a L estado a estado), `medidas-l.py`, `phone-l.py`.

### 5.1 G-inv, `g-inv-par`, G-N3 com a PR `[medido: g-inv-depois-*.txt, g-inv-par-depois.txt, g-n3-depois.txt]`

| | AVD + Tab |
| --- | --- |
| G-inv `B5-baseline/` | **34 de 34** — os 8 de S1 sem errata nenhuma |
| a S4 da base **pelo caminho novo** (a errata de caminho, N4-D73) | **4 de 4**: `S4-vazio` e `S4-resultados`, AVD e Tab |
| G-inv `B3-referencia-paisagem/` | **18 de 18** (o palco com setlist) |
| `g-inv-par` | **8 de 8** |
| G-N3 (a base, com os rolados) | **(e)=0 · (b)=0** · nome-acessível 8 · rolagem 6 |
| G-N3 da L (22 pares paisagem × retrato, AVD) | **(e)=0 · (b)=0**; o (d′) é o título em B (948 → 521 dp), triagem |
| G5/G6 da L (AVD) | **todo alvo ≥ 48 dp · todo alvo com testID** |

Os dumps do AVD são do `2a095a7` e os do Tab do `b941a13`; os commits entre os dois mudam só a L (`git diff 2a095a7
b941a13 --stat`: `LibraryScreen.tsx`, o duplo do `react-native` e o teste da L).

### 5.2 A L, estado a estado `[medido: roteiros/avd-*.txt, roteiros/tab-*.txt, dumps/biblioteca/]`

| estado | AVD e Tab, C e B |
| --- | --- |
| ao abrir | `mInputShown=false`; nenhum nó com foco (N4-R2) |
| a composição (B, dump) | barra 88 (o voltar 48 em y 43,6); filtros 64, os cinco chips numa linha; régua 46,2; linha 80 (663,1 em B, 1089,8 em C); estrela e ▶ 48, vão 4 |
| a rolagem | `lib-regua`, `lib-filtro-*`, `lib-campo` e `lib-lista` com **o mesmo `bounds` antes e depois de rolar** |
| filtros · favoritas · filtro sem resultado · busca sem resultado · busca *ensaio* | as capturas |
| o ▶ e a volta | o avulso com o voltar *Voltar para a biblioteca*; `prefetch plan n=0 reason=demand`; o voltar devolve a L **igual, nó a nó** (termo, filtro Cifra, rolagem — 41 nós no AVD, 42 no Tab) |
| favoritar com a resposta 8 s atrasada | em voo a estrela inerte com o arco; o log: `api status=200 path=/api/content n=1 ms=8033 · write op=favorite content=b1b10001 status=200 code=- ms=8039 · cache write kind=content n=15 invalidated=1` — **nenhum `GET`**; depois, a estrela cheia. E o desfavoritar, que devolve a fixture |
| a falha de servidor (`escrita-500`) | `write op=favorite … status=500 code=INTERNAL_ERROR`; a linha de aviso *Favoritar “Manhã de ensaio”  ·  falha no servidor — nada foi alterado aqui* sob a barra |
| sem rede (`ping` → *Network is unreachable*) | a P-F4 na linha de aviso; as estrelas inertes; o toque na estrela inerte não gera linha |
| **N4-D92** | com rede, o 404 é *não consegui baixar*; os arquivos apagados e o app aberto **sem rede**: a mesma música é **arquivo não baixado** (a regra 15: na tela) |
| falha com cache · carregando · falha sem cache · vazia | as capturas |
| **com o teclado de pé** | **antes do conserto** a `lib-lista` ia até o fim da janela, sob o teclado (C 651,1 com o topo do teclado em 372,0; B 1077,8 com 752,4) — div. 1082. **Depois** (`105b98d`): **C 372,0 · B 752,4** no AVD, **B 761,3** no Tab — a lista termina no topo do teclado; sem teclado, nada muda. No Tab deitado o teclado é **flutuante** (div. 1087) |

Não visto no aparelho: o *baixando o arquivo…* (transitório; o PDF de 24 MiB baixa no primeiro sync) — div. 1095, PR-9.

### 5.3 A faixa A (o `octavia_phone`, 411,4 dp) `[medido: phone-l.txt, e9-phone.txt, dumps/phone/]`

Com a conta de audit (N4-D94). **Nenhum `FATAL`.** A L **abre**: os chips em **duas linhas, 3 + 2** (a faixa de 120 do
P-T1); a régua, a lista e a linha de 80 (363,4 dp). **A lista do inalcançável em L: nenhum** — todo alvo (voltar, campo, os
cinco chips, estrela e ▶ de cada linha visível) dentro da janela útil. O ▶ abre o avulso e o `BACK` volta à L. Do palco
avulso, o `sair` continua fora da tela (a div. 1078 da PR-6). O título fica numa linha em A (as duas linhas são do N5); o
teclado em A foi medido antes do conserto do §5.2 e não de novo — N5.

### 5.4 O Tab, do começo ao fim (autorizado `[Marcel, 2026-10-06]`) `[medido: estado/, n4d56-*.txt]`

| | |
| --- | --- |
| lido | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **release** de 2026-10-06 10:39:39 (sem `DEBUGGABLE`), bloqueado; `stay_on` a 7 antes de pedir o destravar |
| ida | `install -r` do dev client (`9447edc7…`): `DEBUGGABLE` |
| o cache do Marcel | guardado arquivo a arquivo com o app parado (`setlists.json` `8533cc5f…`, `content.json` `b62f192a…`, `files-index.json` `b21cc49b…`, o PDF dele `05253d42…`); a demanda vazia; **regravado no fim, md5 a md5 idêntico, 4 de 4** (`estado/tab-md5-*.txt`). O passo do N4-D92 do arnês apagou `files/` inteiro — o PDF do Marcel saiu junto e voltou pela receita (`APARATO.md`); os três da fixture (`partitura-12p.pdf`, `-1p.pdf`, `-grande.pdf`) apagados; os quatro `._*` onde estão |
| durante | a `main` primeiro (o Metro de uma árvore temporária), depois a PR; os túneis reaplicados antes de cada passo |
| volta | `install -r` do release (`6eae4a8b…`, `release-31d6b3a.apk`): sem `DEBUGGABLE`, `lastUpdateTime=2026-10-06 15:21:36` |
| N4-D56, em avião | `ping` → `Network is unreachable`; `cache hit kind=setlists n=2` · `kind=content n=63`; `sync skip reason=offline`; o S1 com as duas setlists (`setlist-772076b4`, `setlist-e39d57cf`) e o `aviso-motivo`; `FATAL` 0 |
| N4-D56, com rede | `ping` 2/2; **2 `GET`** (`/api/setlists` 200, `/api/content` 200), `invalidated=0` nos dois; 0 escritas; `FATAL` 0 |
| fim | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio — **igual ao lido**; o Tab com o release (N4-D55) |

### 5.5 O AVD e o celular

**AVD `octavia_tab32`**: lido `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, dev client de 2026-09-24 14:00:01;
subido **três** vezes com `-no-snapshot-save` (o S0 frio da cadeia derruba a sessão, div. 1093); fim igual ao lido, `reverse`
vazio, `ping` → *unreachable*, `ram.bin` de 2026-09-24 14:00 (`estado/avd-*.txt`).
**`octavia_phone`**: lido `stay_on=1 accel=0 user_rot=0 airplane=0 wifi=1 data=1`, dev client de 2026-09-23 21:10:37, a conta
de audit; subido sem salvar; app parado, `reverse` vazio, desligado.

### 5.6 O arnês não apaga o que não criou (div. 1097) `[medido: prova-sentinela.txt]`

**O passo que apagou a pasta.** Na primeira forma do arnês da L (`instrumentos/biblioteca.py` no `8aa319c`):
- `biblioteca.py:223`, o `semRede` (a prova do N4-D92): `rm -f files/octavia-{u}/files/* cache/octavia-{u}/files/*` — as
  duas pastas de arquivos do app, **inteiras**. O que ele precisava apagar: só os arquivos que **a fixture da L serve**
  (`partitura-12p.pdf`, `partitura-1p.pdf`, `partitura-grande.pdf` — o `nao-existe.pdf` nunca chega ao disco), para o app
  abrir sem rede e o plano rejeitar;
- `biblioteca.py:258`, o `_store_apagado` (os estados sem cache): `rm -f files/octavia-{u}/*.json` — também o
  `files-index.json`, que indexa os arquivos do disco. O que ele precisava: só o `setlists.json` e o `content.json` (o
  `load()` do `store.ts` decide "há cache" por esses dois).

**Por que o PDF do Marcel estava ali.** A receita do cache no Tab (`APARATO.md`, "O cache do app no Tab") **guarda por
cópia e deixa o arquivo no lugar**; e a fixture do mock entra na pasta da sessão restaurada, que é a do Marcel
(`files/octavia-xVDJ…/files/`): o `ls` da guarda (`estado/tab-md5-antes.txt`) mostra o PDF dele ali durante todo o mock.

**O conserto** (`6d2a605`): `apagar_por_nome` — cada passo apaga uma lista **fechada** de nomes (os da fixture, lidos do
`arquivos/` do mock; do store, `STORE_DO_TESTE` = `setlists.json`, `content.json`), recusa curinga e barra, e confere pelo
`ls` antes e depois que **nada fora da lista sumiu** (senão levanta). E a errata da receita do cache, **aprovada (N4-D98)**
(`APARATO.md`): o arquivo real sai do aparelho junto com a guarda e volta junto com a regravação.

**A prova, no AVD** (fixture da L, sessão de audit):

| | sentinela PDF (válido) | sentinela `.json` |
| --- | --- | --- |
| 1 · o passo novo (`apagar_por_nome`) | `209503b2…` → **`209503b2…`** | `3ed7290b…` → **`3ed7290b…`** |
| 2 · CN — o passo antigo (`rm -f …/*`, `rm -f …/*.json`) | **ausente** | **ausente** |
| 3 · os passos inteiros do arnês (`semRede`, `semCache`), app aberto e fechado | `2437b35e…` → **`2437b35e…`** | `3ed7290b…` → **`3ed7290b…`** |

No 3 o N4-D92 continua provado (*arquivo não baixado* sem rede) e os estados sem cache saem iguais (carregando, falha sem
cache, vazia). A primeira forma do 3 usou um `.pdf` de 20 bytes de texto, e o **saneamento do próprio app** o recusou na
abertura (`OCTAVIA: file-reject name=sentinela-n4pr7.pdf kind=malformed bytes=20 expected=-`) — o app, não o arnês; refeito
com um PDF válido, como o do Marcel. O CN (2) levou também o PDF de audit que o AVD guarda; o AVD sobe sem salvar, e o
snapshot o devolve.

**Os outros `rm` sobre caminho do app** (`grep -rnE "(shell|run-as).*\brm\b"` nos `instrumentos/` de todos os anexos):

| onde | o quê | risco |
| --- | --- | --- |
| `N4-PR7-anexos/instrumentos/biblioteca.py` (`:223`, `:258` na forma velha) | as duas acima | **consertados** |
| `N3-PR6b-anexos/instrumentos/n3pr6b.py:84` (`apagar_store`) | `rm -f {d}/*.json` | **o mesmo** do `_store_apagado` (o `files-index.json` sai junto). É rastro de uma PR mergeada, e não se reescreve; quem o copiar copia a receita corrigida do `APARATO.md` ("Store apagado", por nome) — e a receita é a fonte |
| `APARATO.md`, "Store apagado" | a receita com `*.json` | **o mesmo** — errata nesta PR (por nome) |
| `N3-PRECHECK-anexos/instrumentos/cap.sh:7` | `rm -f /sdcard/n3pre.xml` | **nenhum**: o arquivo é o do próprio `cap.sh` (o dump que ele mesmo grava), fora do app |

### 5.7 A sonda de rede do N4-D92 — o que ela é

**Não gera tráfego**: lê o estado de conexão que o Android já mantém, o mesmo que o app inteiro lê, e não faz requisição —
nem no release.

- **A sonda** é uma função injetada no `files.ts` (`apps/native/src/files.ts:191`, o padrão `async () => true`; `:193`,
  `ligarSondaDeRede`), consultada **só quando um download rejeita** (`files.ts:250`: com rede, a falha se registra; sem
  rede, não). A raiz a liga ao `estaOnline`, uma vez, na carga do módulo (`apps/native/App.tsx:31`).
- **`estaOnline`** (`apps/native/src/net.ts:11-13`) chama `Network.getNetworkStateAsync()` — o mesmo que o `useOnline`
  (`net.ts:35`) usa para o "sem rede" do app inteiro, e o favoritar da N4-PR5.
- **O `getNetworkStateAsync` no Android** (`expo-network` 57.0.1): `NetworkModule.kt:136-137` → `fetchNetworkState()`
  (`:185-197`), que só lê o `ConnectivityManager`; o `isInternetReachable` (`NetworkUtils.kt:23-48`) são as capacidades da
  rede ativa — `NET_CAPABILITY_INTERNET`, `NET_CAPABILITY_VALIDATED` (a validação que o próprio sistema já faz) e
  `NOT_SUSPENDED`. A única requisição HTTP do pacote é a do `getIpAddressAsync` da versão **web**
  (`build/ExpoNetwork.web.js:20`, `api.ipify.org`), que o app não chama.
- **Frequência**: uma leitura local por download que rejeita — as mesmas ocasiões em que o `download-error` já saía.
- **No release contra prod**: o mesmo caminho, sem tráfego; nas provas da N4-D56 o release fez as 2 requisições de leitura
  do sync, e só (`n4d56-rede.txt`).

---

## 6. Gates `[medido: g1.txt, g2g3.txt, a20-icones.txt, gates-web.txt, sha.txt, tsc-lint.txt, suite.txt]`

| gate | resultado |
| --- | --- |
| testes desta PR | `biblioteca-tela` 40 · `arquivo-sem-rede` 6 · `frases-n4` (3) e (5) — verdes; suíte 1594 ✓ |
| G-inv · `g-inv-par` · G-N3 · G5/G6 | §5.1 |
| G1a / G1b | com o bloco do corpo: `G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)` — 13 exceções, todas usadas · `G1b: só adição ✓` |
| G2 / G3 | `testIDs antes=81 depois=99` ✓ · `log( antes=70 depois=70`, nenhuma linha sumiu ✓ |
| `gate:a20` · `gate:icones` | 0 acusações (223 literais) · 0 acusações, 0 avisos |
| igualdade das frases · G-tok | `frases-n4` verde; **G-tok PASSA**, strings de `.ts` 460 → 485; cobertura PASSA |
| o pacote de identidade | `igualdade.test.ts` 41 ✓ (2 ✗ antes dos tokens, `identidade-antes.txt`); o CSS gerado byte a byte igual |
| site: G-back · G-palco · G-faixa | PASSA · PASSA (0) · PASSA — nenhum arquivo do site muda |
| `SHA256SUMS` | `DESIGN-V1` 3 · `-N2` 2 · `-N3` 2 · `-N4` 2 · `docs/ux/DESIGN-I1` 14 · `N3-PRECHECK-anexos` 355 — todos OK; `dumps/SHA256SUMS.txt` desta pasta (283) |
| `tsc` | raiz 0 · core 0 · identidade 0 · nativo 0 |
| lint | *No ESLint warnings or errors* |
| CI (`b941a13`) | **10 de 10 verdes** — `android-debug-apk` **9m21s** (job) · `build` 4m25s · `gates-nativos` · `g-back` · `g-tok` · `g-palco` · `g-faixa` · `mudou-nativo` · Vercel. No `2a095a7`, o APK foi 10m1s |

O bloco ```` ```gates ```` e o ```` ```gates-web ```` do corpo da PR, como ficaram (a regra do W4-b2):

```gates
# N4-PR7 — a tela da biblioteca (L) e o novo destino de Buscar música (N4-R1…N4-R11, N4-R20; N4-D73, N4-D92, N4-D96, N4-D97). Nenhuma linha de log nova, nenhuma errata do G3.
# Tablet: a L (LibraryScreen.tsx, LinhaDaBiblioteca.tsx, FiltrosDaBiblioteca.tsx — novos); a rota Biblioteca e o onBuscar de S1 (navigation.tsx); o ▶ e o destino de Buscar música (rotas-do-avulso.ts); as frases que passam ao core, o texto byte a byte (IndexScreen.tsx, StageScreen.tsx, SearchScreen.tsx, SetlistsScreen.tsx, files.ts); a marca de S1 exportada (SetlistsScreen.tsx); a sonda de rede do estado do arquivo, N4-D92 (files.ts, App.tsx); os quatro estilos da régua de dev (ReguaDeDev.tsx).
# Core: as frases do tablet que a L reusa (frases-content.ts, grupo 5).
g1a: apps/native/App.tsx
g1a: apps/native/src/files.ts
g1a: apps/native/src/navigation.tsx
g1a: apps/native/src/rotas-do-avulso.ts
g1a: apps/native/src/screens/FiltrosDaBiblioteca.tsx
g1a: apps/native/src/screens/IndexScreen.tsx
g1a: apps/native/src/screens/LibraryScreen.tsx
g1a: apps/native/src/screens/LinhaDaBiblioteca.tsx
g1a: apps/native/src/screens/ReguaDeDev.tsx
g1a: apps/native/src/screens/SearchScreen.tsx
g1a: apps/native/src/screens/SetlistsScreen.tsx
g1a: apps/native/src/screens/StageScreen.tsx
g1a: packages/core/src/frases-content.ts
```

```gates-web
# N4-PR7 — nenhum arquivo do núcleo do G-back tocado; nenhum arquivo do site (app/, components/, lib/, hooks/) muda.
# O core muda (packages/core/src/frases-content.ts, na lista do G-tok): as frases do tablet que a L reusa (grupo 5) — o texto byte a byte o das telas do tablet de antes (apps/native/test/frases-n4.test.ts (5)); o site não importa nenhuma delas.
# O pacote de identidade ganha o bloco lib (P-T1, P-T2) — o CSS gerado do site byte a byte igual (o gerador só leva web.* e folha.*; sha256 1857944a… antes e depois).
```

---

## 7. Por aceite

| aceite | esta PR | fica para |
| --- | --- | --- |
| **A-N4-1** | `buscar` abre L (o dump da L depois do toque); os 8 dumps de S1 idênticos (G-inv); a S1 vazia com `Criar a primeira setlist` (a base, 34/34) | — |
| **A-N4-2** | sem IME ao abrir (`mInputShown=false`, nenhum nó com foco); o toque no campo sobe o teclado; com ele, todo controle de L acima do topo dele e a lista terminando nele (§5.2) | o teclado flutuante da Samsung (div. 1087) — registro |
| **A-N4-3** | barra, filtros, régua e linha com os valores da folha por faixa (§1.1, §5.2; N4-E10, N4-E11); régua e filtros com o mesmo `bounds` antes e depois de rolar | — |
| **A-N4-4** | a ordem do dump = a do core (*Águas* primeiro), no teste e na tela | — |
| **A-N4-5** | as contagens fixas sob busca e filtro (teste; CN 2); os nomes P-F9 no `content-desc` (dump: *Só Letra (6)* … *Só as favoritas (1)*) | — |
| **A-N4-6** | estrela e ▶ 48 × 48, vão 4; a segunda linha tipo · artista; os estados da `L-linhas` (não baixado, falhou, inválidos com o ▶ inerte; o *baixando* em teste) | **PR-8**: o toque na linha abre V, e a mão do Marcel (linha × controles). **PR-9**: o *baixando* no aparelho |
| **A-N4-7** | em voo a estrela `enabled=false` com o arco; depois do 200, a linha no cache (`invalidated=1`) e nenhum `GET`; sem otimismo (CN 3) | **PR-9**: em prod (A-N4-27); sair de **V** não cancela (V é da PR-8) |
| **A-N4-8** | as seis espécies em teste; no aparelho, a de servidor (em B e C) | **PR-9**: as seis no aparelho (a de rede — o barrado — não se alcança com a estrela inerte sem rede; div. 1092) |
| **A-N4-9** | sem rede (`ping`): a estrela inerte, a P-F4 uma vez, lista/busca/▶ funcionando | — |
| **A-N4-10** | os quatro estados de sync, no AVD e no Tab | — |
| **A-N4-11** | o mesmo conjunto da S4 (o core, PR-5) e as frases da S4b na tela | — |
| **A-N4-18** | **Marcel, no Tab**: o traço da **estrela** (vazada, cheia, inerte) **bom**; o do **▶** (normal, inerte) **bom** | — |
| **A-N4-20** | P-T1 e P-T2 no pacote, lidos pela tela (o teste por faixa); nenhum literal de largura; o `igualdade.test.ts` em par | P-T3 na PR-8 |
| **A-N4-22** | G2 só adição (81 → 99); G6: todo alvo novo com testID | — |
| **A-N4-23** | G-inv 34/34 e 18/18, com os 4 da S4 pelo caminho novo | toda PR |
| **A-N4-24** | B contra as molduras; A sem `FATAL`, a lista do inalcançável em L: nenhum (§5.3) | **N5**: A |
| **A-N4-25** | a tabela do §1.1, na ordem, com as erratas N4-E10 e N4-E11 | e5, e6 na PR-8 |

E a leitura da tela, pedida pelo prompt: **sim** (Marcel).

---

## 8. Erratas

- **N4-E10** (os chips) e **N4-E11** (o teclado em C e A) — `DESIGN-N4/README.md` §6. As de medida seguintes: **N4-E12**.
- **No `N4-REQUISITOS.md`**: a do **N4-R2** (o mecanismo do teclado, medido), a do **N4-R6** (a linha não tocável até a PR-8;
  os ícones do estado do arquivo pelo nome; o título em A), e as **N4-D96** e **N4-D97**.
- **No `APARATO.md`**: o teclado que não encolhe a janela e o flutuante da Samsung; o `rm` do arnês (consertado no
  instrumento, §5.6); a receita "Store apagado" **por nome**; e a errata da receita do cache no Tab, **aprovada — N4-D98**
  (o arquivo real sai e volta com a guarda).

---

## 9. Divergências — 1081 a 1097

A última usada era a **1080** (`N4-PR6-anexos/README.md` §9) `[medido: git grep -h -o -E '^\| \*\*1[0-9]{3}\*\*' -- docs |
sort -u | tail -4` → `1078 · 1079 · 1080 · 1138`, o último uma linha de medida]. Origem: **P** premissa do prompt · **D**
doc anterior · **A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
| --- | --- | --- | --- |
| **1081** | T | dois CN passaram verdes: o duplo do `FlatList` ignorava o `ListHeaderComponent` (a régua plantada no cabeçalho "ficava fora da lista"), e o React consome o `autoFocus` de um `<input>` sem escrever o atributo (o `el.autofocus` que o teste lia era sempre `false`; o comentário do duplo dizia o contrário) | consertado no duplo (`2a095a7`, regra 32); refeitos: 2 ✗ e 1 ✗ |
| **1082** | A | com o teclado de pé a lista de L ia até o fim da janela, por baixo do IME: `adjust=resize`, mas com o edge-to-edge do RN a raiz não encolhe. Achado no dump do aceite, não no teste (o duplo não tem geometria) | consertado nesta PR (`9843b1d` → `105b98d`, `KeyboardAvoidingView` + o inset do topo); `APARATO.md`. A div. 450 (o picker) tem provavelmente a mesma causa — registro para o **polimento do nativo** |
| **1083** | D | e1 · e2: três chips 6,7 a 9,1 dp abaixo da estimativa; a soma 609,0, a folga 54 (não 37) | **N4-E10** |
| **1084** | D | e9: o teclado cobre 279,1 em C e 320,4 em A, não 300 | **N4-E11** |
| **1085** | D | a folha desenha o estado *arquivo não baixado* com uma seta de baixar e o *baixando* com um arco (os redesenhos da N4-E6) | vale o catálogo **pelo nome**: `arquivo-nao-baixado` e `baixando` (a N4-E6); errata do N4-R6 |
| **1086** | A | o `presentUrls` lê o `files-index.json`: um arquivo apagado por fora do app (o `rm` do arnês) continua "baixado" na tela. O Android pode purgar a pasta de demanda (`cache/`) do mesmo jeito | registro; **PR-9** (o `run-as` do índice contra a fixture, A-N4-26) mede se o caso real (a purga) existe |
| **1087** | A | no Tab deitado o teclado da Samsung é **flutuante** (no meio da tela): não encolhe nada, e cobre o meio da lista | registro; `APARATO.md`. É o teclado do aparelho, não da tela |
| **1088** | T | o `escrita-lenta` do mock (0,6 s) não cabe um `uiautomator dump` (≈ 2,3 s): o favoritar em voo não se captura | `OCTAVIA_MOCK_LENTA_S` no mock (8 s no aceite; 0,6 s continua o padrão); extra declarado no commit 6 |
| **1089** | P | o prompt nomeia oito commits; a PR tem doze | os quatro a mais são consertos achados no aceite (o duplo, o teclado em par, o botão do S1d), cada um com o teste primeiro; nenhum push forçado |
| **1090** | D | *"tamanhos 13 e 20 como a tela de busca de hoje"* (N4-D79) × a folha desenhar a segunda linha em **15** (a S4 usa 13 na sublinha) | o título 20 e a contagem 13 da S4; a segunda linha **15** (`size.bodySmall`), a da folha |
| **1091** | D | a folha desenha o chip marcado com o fundo do acento a 12 % — é o `web.alfaMarcado` do pacote, que o nativo não lia | o nativo passa a ler o token (`comAlfa`, `FiltrosDaBiblioteca.tsx`); nenhum valor fora do pacote; extra declarado |
| **1092** | P | *"no aparelho, nesta PR, sem rede e uma falha de servidor"*: a espécie *rede* do favoritar é o **barrado** sem rede — e sem rede a estrela é inerte (N4-R9), então ela não se alcança pelo toque | no aparelho: o estado sem rede (N4-R9) e a espécie servidor; as seis em teste; a *rede* do barrado na PR-9 (pela corrida entre o toque e o `estaOnline`) |
| **1093** | T | o S0 frio do fim da cadeia derruba a sessão do AVD (conhecido, `APARATO.md`): os CN de aparelho e a L precisaram de duas subidas a mais | AVD subido de novo, sempre sem salvar; registro |
| **1094** | T | no Tab, o primeiro passo da cadeia da `main` (o palco) esgotou a espera do cartão: o sync da fixture ainda não tinha substituído o cache do Marcel | o palco refeito isolado (`roteiros/main-tab-pai-palco.txt`); a base do Tab fechou 16/16 e 9/9 |
| **1095** | A | o *baixando o arquivo…* na linha não se capturou no aparelho: transitório, e o PDF grande baixa no primeiro sync, antes de a L abrir | em teste; **PR-9** (A-N4-26: *baixando* e *falhou* vistos na linha) |
| **1096** | D | e3 (+3,8) e m6 (−3,8) ficam dentro dos 4 dp; a m6 com tokens é 16 + 18,2 + 12 (o 14 da folha não é token) | registro; sem errata |

| **1097** | T | o arnês da L apagava pastas inteiras do app (`biblioteca.py:223`: `files/…/files/*` e `cache/…/files/*`; `:258`: `*.json` do store) — no Tab, a pasta da sessão do Marcel, e o PDF real dele saiu junto (voltou pela receita). A receita do cache guarda por cópia e deixava o arquivo real no aparelho durante o mock | **consertado no instrumento** (`6d2a605`, `apagar_por_nome`: só o que o teste criou, por nome; provado com sentinelas, §5.6); a receita "Store apagado" por nome (errata do `APARATO.md`); a receita do cache **aprovada — N4-D98** (o arquivo real sai e volta com a guarda) |

**Contagem**: 17 — D 6 · T 5 · A 4 · P 2 · X 0. **Fechada nesta PR**: a **1066** (N4-D92, §2), a **1035** (§1.2), a
**1002** (§1.3), a **1014** (§1.1) e a **1097** (§5.6). **Próxima divergência livre: 1098.**

---

## 10. Contabilidade

| | |
| --- | --- |
| requests a prod / escritas em prod | **2 `GET`** (o sync de leitura da prova da N4-D56 com rede) / **0** |
| requests a terceiros | as renovações de token das sessões de audit (AVD, celular) e da do Marcel (Tab, `auth refresh=cached`) |
| mock | `GET /api/setlists` e `GET /api/content` por abertura; `PUT /api/content` do favoritar contra o mock (o lento, o 500) e o desfavoritar que devolve a fixture |
| aparelho | AVD `octavia_tab32` (cinco subidas, sem salvar — a quinta para a prova do sentinela, §5.6); Tab S6 (destravado pelo Marcel; release → dev client → release; estado final igual ao lido; cache md5 a md5); `octavia_phone` (subido sem salvar) |
| `.env*` | `apps/native/.env` por `cp -p` (sha256 `f2bfa179cd8e4b1f…`) na árvore da PR e na árvore temporária da `main`, só para o Metro; **apagado** nas duas; nenhum valor lido |
| temporários | as árvores `../octavia-n4-pr7-dev` (o rascunho) e `../octavia-n4-pr7-main` (o Metro da `main` do Tab) **removidas**; os PNG, os bundles, os logs do Metro e do mock, as cópias do cache do Marcel: no scratchpad da sessão, fora do commit |
| perguntas ao Marcel | duas (N4-D96, N4-D97) e o julgamento do Tab |
| agentes | 0 |

---

**A próxima PR desta lista** (N4-D72): **PR-8 — a visualização**.
