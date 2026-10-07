# N4-PR8 — a visualização (V)

> **Bloco N4 · PR-8** (`n4/pr8-visualizacao`, PR [#364](https://github.com/marcelviana/octavia/pull/364), **sem merge**).
> Datas: 2026-10-06 (código, AVD, celular) e 2026-10-07 (Tab, docs). Base: `origin/main` = `836d5e6` (merge da #363, a
> N4-PR7). Árvore `../octavia-n4-pr8`; `pnpm install --frozen-lockfile --offline`.
> Commits: `5769ec3` `test(n4): PR-8 — o instrumento` · `afda91b` `feat(identidade): o token da visualização (P-T3)` ·
> `b726833` `test(n4): PR-8 — a visualização, reprovando` · `4a73cec` `feat(native): a visualização — cabeçalho, colunas e
> campos` · `d7c0952` `… — o corpo por tipo e os arquivos` · `7a3dbbd` `… — favoritar, tocar e sem rede` · `cee3139`
> `feat(native): a linha da biblioteca abre a visualização (N4-R6)` · **e quatro a mais, declarados** (div. 1110):
> `37b459b` `test(n4): PR-8 — o otimismo da estrela de V, que o teste não via` (§4) · `aa1a7c4` `fix(native): o comentário
> do leitor sem citar a chamada de log (G3 70 = 70)` · `f668cf9` `test(n4): PR-8 — a borda do ▶ inerte é a do ativo
> (P-I2), reprovando` · `d88679d` `fix(native): o ▶ inerte com a borda da folha (P-I2), na linha da L e em V` (§5.4) · o de
> docs (este README e as erratas).
> `[medido]` = comando + saída literal nesta sessão, nos arquivos desta pasta.
> Requisitos: N4-R6 (a linha tocável), N4-R7…N4-R9 em V, N4-R12…N4-R15, N4-R20 (P-T3), N4-R22…N4-R25. Aceites: §7.

**O palco não muda**: G-inv **34 de 34 e 18 de 18** nos dois aparelhos, com a PR — o leitor que V usa é o do palco, agora
num módulo compartilhado (`Leitor.tsx`), e o palco desenha a mesma árvore. Nenhum backend, nenhum arquivo do site; o CSS
gerado byte a byte igual. Zero escrita em prod; em prod, as 2 leituras da prova da N4-D56 **e uma leitura a mais, de um
arquivo do Marcel no storage, sem querer** (div. 1113, §5.5).

---

## 0. Decisões do Marcel nesta PR `[Marcel, 2026-10-06/07]`

A tela precisou de três valores que nem o pacote nem a P-T3 dão; parei e perguntei (o prompt). As respostas, verbatim da
escolha (as três, a opção recomendada):

- **N4-D99 — a grade de *Detalhes*: "Token view.grade".** No pacote, junto da P-T3: `faixas.*.view = { coluna, grade }`,
  a grade C 2 · B 3 · A 2 (N4-R13: *"grade de 3 em B, de 2 em A"*; C pela folha). A tela monta linhas de N células
  `flex: 1`, sem conta de largura. Extra declarado: não é uma P-T da folha.
- **N4-D100 — o 13 do rótulo dos campos e da linha das datas: "Literal 13, como a N4-D79".** Herança do bloco de
  identidade, com os 13 e 20 da N4-D79.
- **N4-D101 — o fundo da linha pressionada da L: "Literal 6 % da folha".** `accentInk` a 6 % (medido no DOM da folha:
  `rgba(119,124,232,0.06)`), literal declarado — herança do bloco de identidade, como a N4-D96.

E, no aceite no Tab, **os julgamentos do Marcel**: **1 — a leitura do corpo em C: "SIM"** · **2 — a mão na biblioteca
(linha × estrela × ▶, em C e em B): "SIM"** · **3 — um achado**: *"A borda do play inativo é mais clara do que a borda do
play ativo. isso cria uma sensação estranha e a dúvida sobre qual deles deveria ser clicável."* Medido contra a folha
(§5.4), a resposta: **"sim, siga a folha"** — consertado nesta PR (`f668cf9` → `d88679d`).

---

## 1. O instrumento, antes de qualquer tela

### 1.1 A régua das estimadas (N4-R25) `[medido: regua-avd.txt; instrumentos/regua-pr8.tsv]`

A régua de desenvolvimento ganhou os estilos de V (`ReguaDeDev.tsx`, commit 1): `view-titulo` (Manrope 600 de 22), `view-meta`
e `view-valor` (17), `view-rotulo` (13, N4-D100), `view-notas` (16) e **`leitor`** (mono 22 com a entrelinha do texto — o
`estiloTexto` do palco). Medida no AVD com o Metro servindo **a árvore no commit 1** (a tela ainda não existia; o bundle
conferido: `view-titulo` 1 · `VisualizacaoScreen` 0).

| # | elemento | folha | medido | Δ | |
| --- | --- | --- | --- | --- | --- |
| **e5** | o cabeçalho com o título longo — C e B | 1 linha em C, 2 em B (≈ 118) | o título da folha 596,9 dp: **1 linha em C** (909,8 disponíveis), **2 em B** (483,1); o do mock (914,7): 2 em C e em B | — | sem errata |
| **e5** | o cabeçalho com o título longo — A | ≈ 196 | **304,8 dp** (o dump do celular, §5.6) — o título de 914,7 em 175 dp quebra em 6 linhas | +108,8 | registro: A é do N5 (div. 1108) |
| **e6** | a coluna de 340 (C) | 340 | o token; o que tem de caber nela: a linha das datas **249,8** de 291 (uma linha); os valores da grade de 2 (célula 133,5): *Intermediário* 106,7 · *Toada de fixture* 129,3 | — | sem errata; o álbum longo (324,9) quebra na célula (div. 1107) |
| **m14** | colunas visíveis do leitor — C | ≈ 56 (738 dp ÷ 13,2) | o caractere mono 22 = **13,33 dp** (100 caracteres = 1333,3); a janela do texto **733,8 dp** → **55,0 colunas** | **−4,2 dp** | **N4-E12** |
| **m14** | colunas visíveis do leitor — B | ≈ 49 (651 dp) | **647,1 dp → 48,5 colunas** | −3,9 dp | sem errata |

O controle régua × dump: a janela do texto (o `HorizontalScrollView` do `corpo`) no dump de V mede **733,8 dp em C e 647,1
em B**, no AVD e no Tab — os mesmos números da conta (797,8 − 64 e 711,1 − 64; o 64 é o respiro de 32 do leitor do palco).

### 1.2 O G-par sobre o corpo de V `[medido: ver §4 e §5.2]`

O site e o nativo rodam em projetos diferentes do Vitest. O par se fecha por um **retrato do site**,
`packages/core/fixtures/g-par-site.json`, cobrado dos dois lados: o `tests/gates/n4-g-par.test.tsx` exige que ele seja,
byte a byte, o que o site renderizado mostra (9 itens: texto 7 · arquivo 1 · sem-corpo 1); o
`apps/native/test/g-par-visualizacao.test.tsx` exige que o nó `corpo` de V (ou o arquivo que o leitor de PDF abre) mostre o
mesmo. **Entrou reprovando** (`Failed to resolve import "../src/screens/VisualizacaoScreen"`); depois do commit 5, **9 de
9 iguais**. No aparelho, o mesmo (§5.2).

### 1.3 A linha de base sobre a `main` `[medido: g-inv-main-*, g-inv-par-main-*, g-n3-main-*]`

| | AVD (antes de mexer) | Tab (na sessão do Tab, o Metro de uma árvore da `main`) |
| --- | --- | --- |
| `B5-baseline/` | 18 de 18 | → **34 de 34** |
| `B3-referencia-paisagem/` | 9 de 9 | → **18 de 18** |
| `g-inv-par` | 4 de 4 | → **8 de 8** |
| G-N3 com os rolados | 16 pares, (e)=0 · (b)=0 | 32 pares, **(e)=0 · (b)=0** · nome-acessível 8 · rolagem 6 |

Nos dois aparelhos o primeiro passo da cadeia (o palco) esgotou a espera da carga fria e foi refeito isolado (div. 1098).

---

## 2. O que se mediu antes de escrever

- **O leitor do palco** (`StageScreen.tsx` na `main`): o texto é um `Text` com `testID="corpo"` dentro de um `ScrollView`
  HORIZONTAL (o que impede a re-quebra, T1-R25/R31), dentro do `ScrollView` vertical com o respiro de 32 (`conteudoPad`);
  o estilo é o `estiloTexto` (mono, `zoom`, a entrelinha do texto ou da tab, a tinta do tema). O PDF é o `Pdf` do
  `react-native-pdf` com `fitPolicy={0}` (largura) — `Arquivo`, fase `pronto`. Os placeholders: o motivo do item inválido
  (título + apoio), o baixando (só o apoio), o S3e (título, apoio, a linha do erro, o *Baixar* de palavra), o formato
  (ícone + frase + nome). **Como V reusa sem os controles de tocar e sem mudar o palco**: o que é desenho vai para um
  módulo compartilhado, `Leitor.tsx` (`estiloDoLeitor`, `CorpoDoLeitor`, `PdfDoLeitor`, `PlaceholderDoLeitor`,
  `S3eDoLeitor`, `FormatoDoLeitor`, as medidas do corpo); o palco os usa e desenha **a mesma árvore**. O que é do palco
  fica nele: os controles de tocar, a máquina do arquivo (`buscarArquivo`) e **todas as linhas de log** e **todos os
  `testID`** (passados como prop a partir do `StageScreen.tsx`) — o G3 e o G2 coletam por arquivo. Prova: G-inv 18/18 e o
  CN do §4 (uma mudança no leitor → 6 palcos DIFERENTES).
- **Os campos** — de onde vem cada um: o `GET /api/content` traz as 22 colunas (`select('*')`), o sync as grava sem mapear
  (como o `is_favorite`, N4-PR5): o `ContentDTO` ganha, opcionais, `difficulty`, `genre`, `key`, `bpm`, `tags`, `notes`,
  `created_at`. Os que o site salva de verdade são os da `N4-PRECHECK.md` A4 (álbum, dificuldade, gênero, tom, andamento,
  etiquetas; as notas; as datas do servidor); compasso, capo e afinação não (herança D). **A dificuldade** está gravada
  como `Beginner` · `Intermediate` · `Advanced` (o `DIFICULDADES` do site, sem caixa) e vira o rótulo do site com
  maiúscula, *Intermediário* — a forma da folha (o *Detalhes* do site escreve minúscula, div. 1037). **As datas** nas
  outras telas do tablet: S1 e S2 mostram a data do show como `YYYY-MM-DD` (o `performance_date`, `SetlistsScreen.tsx`,
  `IndexScreen.tsx`); V usa o mesmo formato, **no fuso do aparelho** (o `created_at` é um instante), *criado {data} ·
  alterado {data}* com os rótulos do site — `packages/core/src/visualizacao.ts`.
- **Os ícones** pelo nome: o *Baixar* de V é o **`baixar-setlist`** (`packages/identidade/src/icones.ts`; div. 1025); o
  download em andamento é o **`baixando`** (o mesmo da linha da L, N4-E6) — o `baixando-acao` não chega a aparecer (div.
  1105).
- **A P-T3, só em C** (div. 1020): na forma que a N4-PR4 deu às medidas inexistentes (N4-D64) — `view.coluna: number |
  Inexistente`, `340` em C e `INEXISTENTE` em B e A; a tela compara com `INEXISTENTE`. O gerador de CSS não leva o bloco.
- **As frases desta PR** (a tabela da N4-PR3 §1.1, linhas 18–23): *tipo desconhecido*, *este item não tem conteúdo*, o apoio
  do S3e (*{título} · {tipo}{tamanho} não está neste aparelho.* e as duas segundas frases), *Baixar*, *arquivo incompleto:
  {n} de {m} bytes* — passam ao core (`frases-content.ts`, grupo 6), e mais, declaradas, a segunda frase sem rede e o
  conjunto fechado das espécies da falha de download (*o arquivo chegou vazio*, *… corrompido*, *o servidor respondeu
  {status}*). O palco, o leitor e o `files.ts` importam. Gate: `frases-n4.test.ts` (6).
- **O tamanho** `[medido: git diff --shortstat origin/main..HEAD]`: 26 arquivos, **+2216/−252** (`VisualizacaoScreen.tsx`
  543, `Leitor.tsx` 247, `ControlesDaMusica.tsx` 128, `visualizacao.ts` 84; os testes de V 573 + 125) — o porte da N4-PR7
  (+1940): **coube numa PR**, sem o corte.

---

## 3. O que a PR entrega

| | onde | o quê |
| --- | --- | --- |
| **o token** P-T3 e a grade | `packages/identidade/src/tokens.ts` | `faixas.*.view = { coluna: 340 \| INEXISTENTE, grade }` (C 340, 2 · B —, 3 · A —, 2; N4-D99). O teste do pacote em par (o `view` é adição; *"A é B fora do lib"* → *"fora do lib e do view"*); reprovou antes (2 ✗, `identidade-antes.txt`). **O CSS do site**: sha256 `1857944a…` antes e depois de regenerar (`identidade-depois.txt`) |
| **o cabeçalho** (N4-R12) | `VisualizacaoScreen.tsx` | 88 mínimo (`bar.top + space.xl`), cresce (o título não elide); voltar · título · artista · tipo (ícone de 20 + palavra; sem artista, só o tipo; desconhecido em `offlineInk` com o ▶ inerte) · a estrela · o ▶ — **os controles da linha da L**, agora comuns (`ControlesDaMusica.tsx`) |
| **o corpo** (N4-R13) | `VisualizacaoScreen.tsx`, `Leitor.tsx` | C: duas colunas, os detalhes na largura da P-T3 (fica mesmo vazia), o leitor à direita; B: uma rolagem, os detalhes sobre o corpo. O leitor é o do palco, escuro, sem quebra, sem os controles de tocar |
| **os campos** (N4-R14) | `packages/core/src/visualizacao.ts` | os salvos de verdade, na ordem da folha (álbum, tom, andamento, dificuldade, gênero, etiquetas), o rótulo do site; as notas (P-F3); as datas no fim; vazio não aparece; compasso/capo/afinação nunca |
| **o corpo por tipo e os arquivos** (N4-R15) | `VisualizacaoScreen.tsx` | a Cifra com seções (o `bodyOf` do core: o nome de cada seção); a Tab como importada; o PDF na largura da coluna; o item sem corpo e o tipo desconhecido; *baixando o arquivo…* com o `baixando`; o S3e do palco com o **Baixar como ícone** (`baixar-setlist`, 48 com borda, nome *Baixar*, nenhum nó de texto *Baixar*); a falha (*não consegui baixar* · a espécie, a genérica não se repete); o formato |
| **o favoritar, o ▶, sem rede** (N4-R7, R8, R9) | `VisualizacaoScreen.tsx` | a estrela da linha; a linha de aviso por espécie sob o cabeçalho; a resposta fora de foco não vira aviso; sem rede, só a estrela inerte e a P-F4; o ▶ → o avulso com a origem `visualizacao` |
| **a linha da L tocável** (N4-R6) | `LinhaDaBiblioteca.tsx`, `LibraryScreen.tsx`, `navigation.tsx`, `rotas-do-avulso.ts` | a linha inteira é o alvo (*Ver “{título}”*, P-F7; pressionada: contorno `accentInk`, fundo a 6 %, N4-D101); a rota `Visualizacao` empilhada (`push`), o voltar é o `goBack` |
| **o ▶ inerte** | `ControlesDaMusica.tsx` | a borda `line` em todos os estados (a folha, P-I2); o inerte só pelo ícone (§5.4) |
| **as frases** | `packages/core/src/frases-content.ts` | o grupo 6 (§2) |

**Os tamanhos**: o título 22 (`size.title`), a meta e o valor 17 (`size.button`), as notas 16 com a entrelinha do texto,
o rótulo e as datas 13 (N4-D100); a grade com 24 entre colunas e 12 entre linhas (a folha: 20 e 14, não são token — a
diferença fica abaixo de 4 dp).

---

## 4. Testes antes e depois, e os controles negativos

**Commit 3 sobre a `main` + os commits 1 e 2** `[medido: commit3-reprovando.txt]`: 3 arquivos reprovam na importação
(`visualizacao-tela`, `g-par-visualizacao`, o core da visualização) e **8 testes** vermelhos (o gate das frases (5) e (6), a
linha da L tocável). Pelas fatias: depois do commit 4, ficam os do corpo, do favoritar e da linha; do 5, os do favoritar e
da linha; do 6, os três da linha; do 7, **0**.

| arquivo | testes |
| --- | --- |
| `apps/native/test/visualizacao-tela.test.tsx` | 36 — N4-R12…R15, R7…R9 em V, o ▶, a linha da L tocável, a borda do ▶ inerte |
| `apps/native/test/g-par-visualizacao.test.tsx` | 1 — 9 pares, 7 fora do par |
| `packages/core/src/visualizacao.test.ts` | 7 |
| `apps/native/test/frases-n4.test.ts` | (6) novo; (5) em par (o S3e no `Leitor.tsx`) |
| `tests/gates/n4-g-par.test.tsx` | + o retrato do site |
| `packages/identidade/test/igualdade.test.ts` | + o bloco `view`; em par: A é B fora do `lib` e do `view` |

**Suíte inteira** `[medido: suite.txt]`: **138 arquivos ✓ · 3 pulados; 1646 testes ✓ · 59 pulados; 0 ✗** (a N4-PR7 fechou
em 1594).

**O duplo do `react-native`** (regra 32, commits 3 e 7): o `click` do `Pressable` de dentro não borbulha para o de fora (no
RN o toque é do mais fundo — sem isso a estrela dentro da linha tocável acionava as duas); o `ScrollView` expõe
`horizontal`; o `style` que é função do estado é chamado com `pressed: false`. A suíte de tela inteira continuou verde.

**Controles negativos** (regra 4), cada um desfeito, `git status` vazio `[medido: cn.txt, cn-refeitos.txt, cn-leitor-g-inv.txt]`:

| CN | o que se plantou | quem reprova |
| --- | --- | --- |
| 1 | um campo vazio aparecendo (o texto vazio vira valor) | 4 ✗ |
| 2 | o compasso aparecendo | 3 ✗ |
| 3 | o corpo de V diferente do site — o `trim` | **não reprovou**: nenhum texto da fixture tem espaço nas pontas — o plantio não mudava nada (div. 1110) |
| 3b | o corpo de V diferente do site — a 1ª quebra de linha vira espaço | **G-par da visualização: 7 de 9 DIFERENTES** |
| 4 | o *Baixar* de V com a palavra | 3 ✗ |
| 5 | a estrela de V cheia em voo (otimismo) | **não reprovou**: o teste não afirmava o desenho em voo → consertado no instrumento (`37b459b`) |
| 5b | o mesmo, com o instrumento consertado | 1 ✗ |
| 6 | o voltar de V perdendo a posição da L (V no lugar da L: `replace`) | 1 ✗ |
| 7 | **no aparelho**: o leitor com o respiro de 24 no lugar de 32 (`Leitor.tsx`), o bundle conferido | **G-inv: 6 dos 9 palcos do AVD DIFERENTES** (os de texto; o PDF, o S3e e o S5 não usam o respiro) |
| (borda) | o teste da borda do ▶ inerte antes do conserto | 1 ✗ (`borda-reprovando.txt`: `#6E6A80` no lugar de `#2A2836`) |

---

## 5. No aparelho, com o mock (N4-D54: o executor mede)

**O aparato** (`APARATO.md` lido inteiro): a fixture do pre-check do N3 para o G-inv (*hoje* = 2026-09-23); a **da
visualização** para V (`instrumentos/fixture-visualizacao.py`: a da biblioteca da N4-PR7 com os campos que a folha
desenha, a Cifra com seções, um `.jpg` para o formato, os campos vazios; compasso, capo e afinação gravados para provar
que não aparecem); a **do G-par** (`fixture-gpar.py`: os itens do `g-par.json`); o servidor de arquivos com o PDF grande
**lento** (`arquivos-lentos.py`, ≈ 100 KiB/s — o *baixando* fica na tela, div. 1095); um mock por aparelho (AVD 8788, Tab
8789, celular 8792); o Metro sem `CI=1`, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline;
`apps/native/.env` por `cp -p` do checkout principal (sha256 `f2bfa179cd8e4b1f…`, nenhum valor lido), **apagado** nas
duas árvores. **O bundle servido conferido** antes de cada rodada (regra 13): na PR `VisualizacaoScreen` 9 ·
`PdfDoLeitor` 6 · `localhost:8788` 1 · **`octavia.rocks` 0**; na `main`, `VisualizacaoScreen` 0. O arnês: `instrumentos/`
— `visualizacao.py` (V estado a estado, a abertura pelo toque na linha), `phone-v.py`, as cadeias.

### 5.1 G-inv, `g-inv-par`, G-N3 com a PR `[medido: g-inv-depois-*, g-inv-par-depois-*, g-n3-depois-*]`

| | AVD + Tab |
| --- | --- |
| G-inv `B5-baseline/` | **34 de 34** (os 4 da S4 pelo caminho da errata da N4-PR7, o ▶ da L) |
| G-inv `B3-referencia-paisagem/` | **18 de 18** (o palco com setlist, nó a nó, com o leitor compartilhado) |
| `g-inv-par` | **8 de 8** |
| G-N3 (a base, com os rolados) | 32 pares, **(e)=0 · (b)=0** · nome-acessível 8 · rolagem 6 |
| G-N3 de V (paisagem × retrato) | **48 pares, (e)=0 · (b)=0** (`g-n3-visualizacao.txt`) |
| G5/G6 de V, quatro colunas | 24 estados: **todo alvo ≥ 48 dp · todo alvo com testID** (`g5g6-visualizacao.txt`) |

### 5.2 V, estado a estado `[medido: roteiros/avd-*.txt, roteiros/tab-*.txt, dumps/]`

| estado | AVD e Tab, C e B |
| --- | --- |
| letra · cifra · cifra-secoes · tab · campos-vazios · sem-artista · título longo · tipo desconhecido · corpo vazio | as capturas, contra as molduras `N4-*-V-*` |
| partitura | `file src=disk name=partitura-12p.pdf bytes=4198`; o PDF na coluna |
| formato (`.jpg`) | o placeholder do formato; **nenhuma linha** (nenhum `ensureFile`) |
| **baixando** | o PDF grande apagado por nome e o servidor lento: *baixando o arquivo…* com o `baixando` — o transitório que a N4-PR7 não capturou (div. 1095, a parte de V) |
| não baixado (avião: `ping` → *Network is unreachable*) | o S3e com o **Baixar de ícone**; a estrela inerte; a P-F4 |
| falhou (o 404) | *não consegui baixar* · *o servidor respondeu 404* |
| favoritando (8 s) | em voo a estrela inerte com o arco; `api status=200 … ms=8095 · write op=favorite content=b1b10002 status=200 code=- ms=8111 · cache write kind=content n=16 invalidated=1` — **nenhum `GET`** |
| a falha de servidor | `write op=favorite … status=500 code=INTERNAL_ERROR`; a linha de aviso *Favoritar “Segunda do ensaio”  ·  falha no servidor — nada foi alterado aqui* |
| **sair no meio** | o favoritar em voo e o voltar de V: o pedido termina (`write … 200`, `cache write … invalidated=1`), a L mostra *Tirar “Segunda do ensaio” das favoritas* e **nenhuma linha de aviso** (N4-R7) |
| sem rede | só a estrela inerte (o toque nela não gera linha), a P-F4; o ▶ abre o avulso |
| **o ▶** | o avulso com o voltar ***Voltar para a visualização***; `prefetch plan n=0 reason=demand`; a volta a V **igual, nó a nó** (21 nós) |
| **o voltar de V** | termo + filtro Cifra + rolagem → a linha → V (o voltar *Voltar para a biblioteca*) → a L **igual, nó a nó** (42 nós) |
| **m14** | a janela do texto 733,8 dp (C) e 647,1 dp (B) → 55,0 e 48,5 colunas |
| **G-par no aparelho** | o nó `corpo` de V lido do dump, item a item do `g-par.json`: **9 de 9 iguais** ao retrato do site (o arquivo pela classe: o leitor de PDF abriu) |

No AVD o ▶ de V fica sob o FAB do dev client (o toque pelo centro e pela margem esquerda abre o menu de desenvolvimento);
toca-se pelo canto inferior esquerdo do alvo (div. 1099). No Tab, em retrato, o desfavoritar do fim do *favoritando* não
registrou (div. 1116).

### 5.3 O controle negativo do leitor no aparelho — §4, CN 7.

### 5.4 O achado do Marcel: a borda do ▶ inerte `[medido: borda-reprovando.txt, borda-pixel.txt, dumps/N4P8B-*]`

**A folha** (`DESIGN-N4/telas.html`, a tabela de ícones, P-I2 *tocar*, lida do HTML): os quatro estados — normal,
pressionado, inerte, em andamento — têm a **mesma borda `#2A2836` (`line`)**; o que muda no inerte é o ícone (`#6E6A80`,
`lineInfo`, traço 1,25). **O app** (desde a N4-PR7, `LinhaDaBiblioteca.tsx` → `ControlesDaMusica.tsx`): a moldura do
inerte em `lineInfo` — a E3 do palco, onde a borda normal JÁ é `lineInfo`; aqui ela invertia o contraste (div. 1100).

O teste primeiro (`f668cf9`, reprovando: `Expected "#2A2836" Received "#6E6A80"`), o conserto (`d88679d`: o `alvoInerte` sai;
a borda é `line` sempre). No Tab, pelo pixel da borda esquerda do alvo (`instrumentos/borda-pixel.mjs`):

| | borda |
| --- | --- |
| ▶ ativo (V, Letra) | `#2A2836` |
| ▶ inerte, **antes** (V, tipo desconhecido) | **`#6E6A80`** |
| ▶ inerte, **depois** — V tipo desconhecido · V item sem conteúdo · L linha inválida (C) · L linha inválida (B) | **`#2A2836`** nos quatro |

Refeitos no Tab, em C e em B, só os estados com ▶ inerte (V tipo desconhecido e corpo vazio; as duas linhas inválidas da L,
`enabled=false`). O AVD não foi refeito para este conserto: a mudança é de tinta, não de `bounds` (div. 1117).

### 5.5 O Tab, do começo ao fim (autorizado `[Marcel, 2026-10-06]`) `[medido: estado/]`

| | |
| --- | --- |
| lido | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **release** de 2026-10-06 15:21:36 (sem `DEBUGGABLE`); `stay_on` a 7 |
| ida | `install -r` do dev client (`9447edc7…`): `DEBUGGABLE` |
| o cache do Marcel (N4-D98) | guardado arquivo a arquivo com o app parado (`setlists.json` `4c93a263…`, `content.json` `b62f192a…`, `files-index.json` `b21cc49b…`, o PDF dele `05253d42…`), **4 de 4 md5 iguais**; a demanda vazia; o PDF apagado do aparelho **por nome** |
| **o furo da receita** | **o PDF voltou ao aparelho às 20:44** (apagado às 20:43): o app abriu antes de o mock do Tab estar de pé, o sync falhou, e a garantia de todos os arquivos (N4-R26) rodou o plano sobre o cache do Marcel — que continuava lá — e **baixou o PDF dele do storage de prod** (md5 `05253d42…`, o mesmo). **1 leitura de arquivo no storage, do próprio PDF; zero escrita; nenhuma chamada à API de prod** (o bundle aponta para `localhost:8788`). Div. 1113 |
| durante | a `main` primeiro (o Metro de uma árvore temporária), depois a PR; os túneis reaplicados antes de cada passo |
| volta | apagados por nome os arquivos da fixture (`partitura-12p.pdf`, `-1p.pdf`, `-escaneada.jpg`, `-grande.pdf`); regravados os três `.json` e o PDF — **md5 a md5 idênticos, 4 de 4** (`estado/tab-md5-depois.txt`); os quatro `._*` onde estão; `install -r` do release (`6eae4a8b…`, `release-31d6b3a.apk`): sem `DEBUGGABLE`, `lastUpdateTime=2026-10-07 08:32:08` |
| N4-D56, em avião | `ping` → `Network is unreachable`; `cache hit kind=setlists n=2` · `kind=content n=63`; `sync skip reason=offline`; o S1 com as duas setlists e o `aviso-motivo`; `FATAL` 0 |
| N4-D56, com rede | `ping` 2/2; **2 `GET`** (`/api/setlists` 200, `/api/content` 200), `invalidated=0` nos dois; 0 escritas; `FATAL` 0 |
| fim | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio — **igual ao lido**; o Tab com o release (N4-D55) |

### 5.6 O AVD e o celular

**AVD `octavia_tab32`**: lido `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, dev client de 2026-09-24 14:00:01;
subido **quatro** vezes com `-no-snapshot-save` (o S0 do fim das cadeias derruba a sessão); fim igual ao lido, `reverse`
vazio, `ping` → *unreachable*, `ram.bin` de 2026-09-24 14:00.
**`octavia_phone` (faixa A)**, com a conta de audit (N4-D94) e o mock na 8792: **nenhum `FATAL`**; V **abre** (Letra, título
longo, tipo desconhecido, arquivo não baixado). **A lista do inalcançável em V: nenhum** — voltar, estrela, ▶ e o *Baixar*
dentro da janela útil em todos os estados (`phone-v.txt`). O cabeçalho em A: 107,0 dp (Letra) · **304,8** (título longo)
· 112,8 · 137,1. Fim: lido igual, app parado, `reverse` vazio, desligado sem salvar.

---

## 6. Gates `[medido: g1.txt, g2g3.txt, a20-icones-sha.txt, gates-web.txt, tsc-lint.txt, suite.txt]`

| gate | resultado |
| --- | --- |
| testes desta PR | `visualizacao-tela` 36 · `g-par-visualizacao` 1 · `visualizacao` (core) 7 · `frases-n4` (6) — verdes; suíte 1646 ✓ |
| G-par (o do contrato) · G-par da visualização | 9 pares, 9 iguais, lista vazia ✓ · o retrato do site 9 itens ✓ · V 9 de 9 (teste e aparelho) |
| G-inv · `g-inv-par` · G-N3 · G5/G6 | §5.1 |
| G1a / G1b | com o bloco do corpo: `G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)` — 15 exceções, todas usadas · `G1b: só adição ✓` |
| G2 / G3 | `testIDs antes=99 depois=121` ✓ (os `view-*`) · `log( antes=70 depois=70`, nenhuma linha sumiu ✓ |
| `gate:a20` · `gate:icones` | 0 acusações (**229** literais; eram 223) · 0 acusações, 0 avisos |
| igualdade das frases · G-tok | `frases-n4` verde; **G-tok PASSA**, strings de `.ts` 485 → **495**; cobertura PASSA |
| o pacote de identidade | `igualdade.test.ts` 42 ✓ (2 ✗ antes do token); o `css.test` 4 ✓; o CSS byte a byte igual |
| site: G-back · G-palco · G-faixa | PASSA · PASSA (0) · PASSA — nenhum arquivo do site muda |
| `SHA256SUMS` | `DESIGN-V1` 3 · `-N2` 2 · `-N3` 2 · `-N4` 2 · `docs/ux/DESIGN-I1` 14 · `N3-PRECHECK-anexos` 355 — todos OK; `dumps/SHA256SUMS.txt` desta pasta (212) |
| `tsc` | raiz 0 · core 0 · identidade 0 · nativo 0 |
| lint | *No ESLint warnings or errors* |
| CI (`aa1a7c4`) | **10 de 10 verdes** — `android-debug-apk` **8m26s** (job; run `37542247683`) · `build` 4m36s · `gates-nativos` · `g-back` · `g-tok` · `g-palco` · `g-faixa` · `mudou-nativo` · Vercel. No `d88679d` (o conserto da borda): **10 de 10 verdes**, `android-debug-apk` **14m11s** (job; run `37614961030`) · `build` 4m17s |

O bloco ```` ```gates ```` e o ```` ```gates-web ```` do corpo da PR, como ficaram (a regra do W4-b2):

```gates
# N4-PR8 — a visualização (V) (N4-R12…N4-R15; N4-R7…N4-R9 em V; N4-R6: a linha da L abre V; N4-D99, N4-D100, N4-D101). Nenhuma linha de log nova, nenhuma errata do G3.
# Tablet: V (VisualizacaoScreen.tsx, novo); o leitor do palco compartilhado (Leitor.tsx, novo — o palco desenha a mesma árvore, StageScreen.tsx) e as frases do leitor que vêm do core (StageScreen.tsx, files.ts); a estrela e o ▶ comuns a L e V (ControlesDaMusica.tsx, novo; LinhaDaBiblioteca.tsx, LibraryScreen.tsx); a linha da L tocável e o pressionado (LinhaDaBiblioteca.tsx, FiltrosDaBiblioteca.tsx: o comAlfa exportado); a rota Visualizacao (navigation.tsx, rotas-do-avulso.ts); os estilos de V na régua de dev (ReguaDeDev.tsx).
# Core: os campos, as notas e as datas de V (visualizacao.ts, novo; index.ts); os campos no ContentDTO (types.ts); as frases do leitor que V reusa, grupo 6 (frases-content.ts).
g1a: apps/native/src/files.ts
g1a: apps/native/src/navigation.tsx
g1a: apps/native/src/rotas-do-avulso.ts
g1a: apps/native/src/screens/ControlesDaMusica.tsx
g1a: apps/native/src/screens/FiltrosDaBiblioteca.tsx
g1a: apps/native/src/screens/Leitor.tsx
g1a: apps/native/src/screens/LibraryScreen.tsx
g1a: apps/native/src/screens/LinhaDaBiblioteca.tsx
g1a: apps/native/src/screens/ReguaDeDev.tsx
g1a: apps/native/src/screens/StageScreen.tsx
g1a: apps/native/src/screens/VisualizacaoScreen.tsx
g1a: packages/core/src/frases-content.ts
g1a: packages/core/src/index.ts
g1a: packages/core/src/types.ts
g1a: packages/core/src/visualizacao.ts
```

```gates-web
# N4-PR8 — nenhum arquivo do núcleo do G-back tocado; nenhum arquivo do site (app/, components/, lib/, hooks/) muda.
# O core muda (packages/core/src/frases-content.ts, na lista do G-tok): as frases do leitor que a visualização reusa (grupo 6) — o texto byte a byte o do palco e do files.ts de antes (apps/native/test/frases-n4.test.ts (6)); o site não importa nenhuma delas. E um módulo novo do core, visualizacao.ts (os campos e as datas de V; os rótulos vêm do grupo 1, nenhuma frase nova), que o site não importa.
# O pacote de identidade ganha o bloco view (P-T3; a grade da N4-D99) — o CSS gerado do site byte a byte igual (o gerador só leva web.* e folha.*; sha256 1857944a… antes e depois).
# O G-par (tests/gates/n4-g-par.test.tsx) ganha o retrato do site (packages/core/fixtures/g-par-site.json), cobrado contra o site renderizado.
```

---

## 7. Por aceite

| aceite | esta PR | fica para |
| --- | --- | --- |
| **A-N4-6** | **o toque na linha abre V** (*Ver “{título}”*; a estrela e o ▶ não visualizam — teste, e no aparelho: a linha tocada → V); **Marcel, a mão**: *"SIM"*; o ▶ inerte com a borda da folha (§5.4) | **PR-9**: o *baixando* na LINHA da L no aparelho |
| **A-N4-7** | em V: a estrela inerte com o arco em voo, sem otimismo (CN 5b); depois do 200, `cache write … invalidated=1` e nenhum `GET`; **sair de V não cancela** e não deixa aviso (§5.2) | **PR-9**: em prod (A-N4-27) |
| **A-N4-8** | em V: as seis espécies em teste; no aparelho, a de servidor (C e B) | **PR-9**: as seis no aparelho |
| **A-N4-9** | em V: sem rede (`ping`), só a estrela inerte, a P-F4, a leitura e o ▶ funcionando | — |
| **A-N4-12** | cabeçalho 88 mínimo; o título longo cresce (2 linhas em B; em A 304,8 dp, registro); sem artista; tipo desconhecido com o ▶ inerte | — |
| **A-N4-13** | C: a coluna da P-T3 (340 no token, no dump) e o leitor à direita; B: uma coluna; o leitor sem quebra; **colunas visíveis medidas** (55,0 C · 48,5 B; N4-E12); **Marcel, a leitura em C**: *"SIM"* | — |
| **A-N4-14** | só os campos salvos (a fixture grava compasso, capo e afinação: nenhum aparece); vazio ausente; notas com a P-F3; datas no fim | — |
| **A-N4-15** | cada estado de corpo e de arquivo, com as frases (o *baixando* em V capturado); o *Baixar* de V é o **ícone** `baixar-setlist`, 48 com borda, `content-desc` *Baixar*, nenhum nó de texto *Baixar* | — |
| **A-N4-20** | P-T3 no pacote, lida pela tela (o teste por faixa); nenhum literal de largura; o `igualdade.test.ts` em par | — |
| **A-N4-22** | G2 só adição (99 → 121); G6: todo alvo novo com testID | — |
| **A-N4-23** | G-inv 34/34 e 18/18, AVD e Tab | toda PR |
| **A-N4-24** | B contra as molduras; A sem `FATAL` e **nada inalcançável em V** (§5.6) | **N5**: A |
| **A-N4-25** | a tabela do §1.1: e5, e6, m14 — com a N4-E12 | — |

---

## 8. Erratas

- **N4-E12** (as colunas visíveis do leitor em C) — `DESIGN-N4/README.md` §6. As de medida seguintes: **N4-E13**.
- **No `N4-REQUISITOS.md`**: a do **N4-R6** (fecha o estado intermediário da N4-PR7; o ▶ inerte com a borda da folha), a do
  **N4-R13** (as colunas medidas; a Partitura em B), a do **N4-R15** (a falha de V; o *Baixar* em voo), e as **N4-D99,
  N4-D100, N4-D101**.
- **No `APARATO.md`**: o FAB do dev client sobre o ▶ de V (toca-se pelo canto); e **o furo da receita do cache** (div.
  1113) — registrado, com a errata **proposta** (§9, a decisão é do Marcel).

---

## 9. Divergências — 1098 a 1118

A última usada era a **1097** (`N4-PR7-anexos/README.md` §9) `[medido: git grep -h -o -E '^\| \*\*1[0-9]{3}\*\*' -- docs |
sort -u | tail -4` → `1095 · 1096 · 1097 · 1138`, o último uma linha de medida]. Origem: **P** premissa do prompt · **D**
doc anterior · **A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
| --- | --- | --- | --- |
| **1098** | T | o primeiro passo da cadeia da `main` (o palco) esgotou a espera da carga fria no AVD e no Tab (a div. 1094 de novo); e o S0 do fim das cadeias derrubou a sessão do AVD | o palco refeito isolado; o AVD subido de novo sem salvar; registro |
| **1099** | T | o ▶ de V fica sob o FAB do dev client nas duas orientações: o toque pelo centro e pela margem esquerda (12 px) abre o menu de desenvolvimento | o arnês toca pelo canto inferior esquerdo (6 px, 8 px), medido; `APARATO.md` |
| **1100** | A | o ▶ inerte com a borda `lineInfo`, MAIS CLARA que a `line` do ativo — a N4-PR7 aplicou a E3 do palco; a folha (P-I2) dá `line` em todos os estados. Achado do Marcel no Tab | **consertado nesta PR** (`f668cf9` → `d88679d`), provado pelo pixel (§5.4); errata do N4-R6 |
| **1101** | D | m14 em C: a folha estima ≈ 56 colunas (738 dp ÷ 13,2); o leitor do palco tem 32 de respiro (não 30) e o caractere mede 13,33: 733,8 dp, 55,0 colunas (−4,2 dp) | **N4-E12** |
| **1102** | D | a N4-E8 diz que, se V reaproveitar o placeholder do palco, *"o controle é a única diferença"*; o N4-R15 (e a folha) dão à falha de V outra composição (*não consegui baixar* e a espécie embaixo), que não é a do S3e com erro do palco | o arquivo não baixado é o S3e do palco com o controle como única diferença (`S3eDoLeitor`); a falha de V é a do N4-R15 (`PlaceholderDoLeitor`); errata do N4-R15 |
| **1103** | D | a folha desenha os títulos dos placeholders de V em Raleway 22 maiúsculo, centrados na altura; o leitor do palco os põe em Manrope 600 de 28, no topo do corpo | vale o leitor do palco (N4-D24; o molde da div. 1075); registro |
| **1104** | D | ícones nos placeholders de V: a folha desenha um arco no *arquivo não baixado* e no *baixando*, e ícones no tipo desconhecido e na falha | vale o catálogo pelo nome (N4-E6): `baixando` no baixando, `tipo-desconhecido` e `falha`; o S3e de V sem ícone, como o do palco; registro |
| **1105** | D | a N4-E8 cita *"em voo, o `baixando-acao`"*: a máquina do arquivo (a do palco) troca o S3e pelo *baixando* no toque, e o ícone em voo nunca aparece | registro; errata do N4-R15 |
| **1106** | D | a folha (`V-cifra-secoes`) desenha os nomes de seção em maiúsculo, como rótulo; o leitor mostra o texto como o site (o G-par) | vale o texto do site (N4-R15: *"como o editor gravou"*); registro |
| **1107** | D | na `V-titulo-longo` o álbum sozinho na linha ocupa a largura inteira; na `V-letra` o gênero sozinho fica na célula — a folha não dá regra; a grade da N4-D99 mantém as células iguais e o álbum longo quebra em 3 linhas (a folha: 2) | registro; *"quando não cabe, empilha; o conteúdo não sai"* |
| **1108** | D | e5: o cabeçalho de V em A com o título longo ≈ 196 na folha; 304,8 dp no celular (o título do mock, 914,7 dp, em 175) | registro; **N5** |
| **1109** | T | um comentário do `Leitor.tsx` citava a chamada de log, e o G3 contava 70 → 71 (o coletor lê comentário, div. 83) | reescrito (`aa1a7c4`); 70 = 70 |
| **1110** | T | dois CN não reprovaram: o `trim` (nenhum texto da fixture tem espaço nas pontas) e o otimismo (o teste não afirmava o desenho em voo); e a PR tem doze commits, não os oito do prompt | o plantio trocado (3b); o teste consertado (`37b459b`); os quatro a mais declarados (cabeçalho) |
| **1111** | T | o duplo do `react-native`: o `click` do Pressable de dentro borbulhava para o de fora; o `style` função não era achatado | consertado no duplo (commits 3 e 7, regra 32); a suíte de tela continuou verde |
| **1112** | A | o cache dos navegadores do Playwright (`~/Library/Caches/ms-playwright`) sumiu durante a sessão, com o disco a 96 % | a folha já estava medida; o resto lido do HTML; não reinstalado (baixar exige autorização) |
| **1113** | A | **o furo da receita do cache no Tab (N4-D98)**: o PDF real sai do aparelho, mas o `content.json` e o `files-index.json` do Marcel ficam; o app abriu antes do mock do Tab, o sync falhou, e a garantia de todos os arquivos (N4-R26) baixou o PDF de novo do storage de prod — 1 leitura de arquivo, zero escrita | regravado no fim, md5 idêntico; **errata proposta para o `APARATO.md`**: depois da guarda, o mock do aparelho de pé e os túneis aplicados **antes** de qualquer abertura do app (ou o `content.json` da fixture gravado por cima antes de abrir). **Decisão do Marcel** |
| **1114** | D | V não emite linha de log: o `placeholder kind=file-missing` e o `download-error` são do palco | declarado (G3 igual); o `file …` e o `file-reject` do `files.ts` continuam saindo |
| **1115** | D | o N4-R13 diz *"uma rolagem só"* em B; com o PDF pronto, o leitor de PDF rola ele mesmo, e os detalhes ficam em cima, fora da rolagem | declarado; errata do N4-R13 |
| **1116** | T | no Tab, em retrato, o desfavoritar do fim do *favoritando* não registrou (nenhuma linha) | o mock reinicia por estado e o `sairNoMeio` desfavoritou depois; registro |
| **1117** | P | *"cada estado da visualização … no AVD e no Tab"*: o conserto da borda (depois do aceite) foi refeito só no Tab | a mudança é de tinta, não de `bounds`; o pixel no Tab, em C e em B; registro |
| **1118** | T | o primeiro refazer da borda no Tab saiu com o sufixo errado (o laço do zsh não separa palavras) | os quatro arquivos apagados por nome e o passo refeito com as chamadas explícitas |

**Contagem**: 21 — D 9 · T 8 · A 3 · P 1 · X 0. **Fechada nesta PR**: a **1095** na parte de V (o *baixando* capturado).
**Próxima divergência livre: 1119.**

---

## 10. Contabilidade

| | |
| --- | --- |
| requests a prod / escritas em prod | **2 `GET`** à API (a prova da N4-D56 com rede) e **1 `GET` de arquivo no storage** (o PDF do Marcel, div. 1113) / **0** |
| requests a terceiros | as renovações de token das sessões de audit (AVD, celular) e da do Marcel (Tab, `auth refresh=cached`) |
| mock | `GET /api/setlists` e `GET /api/content` por abertura; `PUT /api/content` do favoritar contra o mock (o lento, o 500) e os desfavoritar |
| aparelho | AVD `octavia_tab32` (quatro subidas, sem salvar); Tab S6 (destravado pelo Marcel; release → dev client → release; estado final igual ao lido; cache md5 a md5); `octavia_phone` (subido sem salvar) |
| `.env*` | `apps/native/.env` por `cp -p` (sha256 `f2bfa179cd8e4b1f…`) na árvore da PR e na temporária da `main`, só para o Metro; **apagado** nas duas; nenhum valor lido |
| temporários | as árvores `../octavia-n4-pr8-main` (o Metro da `main`) e `../octavia-n4-pr8-cn` (os CN de unidade) **removidas**; as cópias do cache do Marcel **apagadas do host**; os PNG das rodadas de G-inv, os bundles, os logs do Metro e do mock: no scratchpad da sessão, fora do commit |
| perguntas ao Marcel | três valores (N4-D99, N4-D100, N4-D101), os dois julgamentos do Tab e a borda do ▶ |
| agentes | 0 |

---

**A próxima PR desta lista** (N4-D72): **PR-9 — estados transversais, a troca por espécie, o aceite completo, a prova em
prod e o release**.
