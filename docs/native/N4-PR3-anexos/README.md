# N4-PR3 — core das frases

- **PR**: [#359](https://github.com/marcelviana/octavia/pull/359), branch `n4/pr3-frases`, base `origin/main` = `0a37342`
  (o merge da #358, o congelamento do desenho). Árvore `../octavia-n4-pr3`; nenhum `.env*`, nenhuma request a prod,
  nenhum aparelho.
- **Commits**: `f7803d0` `test(n4): PR-3 — gates das frases, reprovando` · `4ccfe9b` `feat(core): vocabulário de
  content e as frases do N4` · `5d96a70` `feat(core): o contrato da linha de aviso` · `d0012e7` `feat(core): P-F9 das favoritas (N4-D85)` · o de docs (este README, os anexos
  e a errata do `N4-REQUISITOS.md`).
- **Nenhuma tela muda** — `apps/native/src` com diff vazio; no site, só `components/library/frases-lista.ts` e
  `components/content/frases-visualizacao.ts`, que passam a importar do core frases com o texto byte a byte igual
  (gate de igualdade, 151 folhas). Nenhum texto do site muda, nenhum token.
- `[medido]` = comando + saída literal nesta sessão, nos arquivos desta pasta.

| arquivo | o que é |
| --- | --- |
| [`commit1-reprovando.txt`](commit1-reprovando.txt) | os dois testes novos sobre a árvore do commit 1 (= a `main` + os gates): web 27 ✗, native 24 ✗ |
| [`g-tok-antes-depois.txt`](g-tok-antes-depois.txt) | o G-tok na `main`, no commit 1 (REPROVA) e no HEAD; a decomposição 446 → 455 por arquivo |
| [`build-antes-depois.txt`](build-antes-depois.txt) | `pnpm build` na `main`, no commit 2 e no commit 3; os 61 chunks com e sem a adoção do tipo no site |
| [`cn.txt`](cn.txt) | os controles negativos do §3 (sete), desfeitos, com o `git status` no fim |
| [`g1.txt`](g1.txt) · [`g2g3.txt`](g2g3.txt) · [`a20-icones.txt`](a20-icones.txt) | G1a/G1b com o bloco `gates` desta PR; G2/G3; `gate:a20` e `gate:icones` |
| [`g-back.txt`](g-back.txt) · [`g-palco.txt`](g-palco.txt) · [`g-faixa.txt`](g-faixa.txt) · [`g-tok.txt`](g-tok.txt) | os gates do web sobre o HEAD (o G-back com o bloco `gates-web` desta PR) |
| [`g-par-favoritar.txt`](g-par-favoritar.txt) | o G-par (lista vazia) e o gate do corpo do favoritar (N4-PR1) |
| [`shasum.txt`](shasum.txt) | o `shasum -c` dos cinco congelados (o laço do `gates.yml`, agora com o `DESIGN-N4`, e o `DESIGN-I1`) |
| [`suite.txt`](suite.txt) · [`cobertura.txt`](cobertura.txt) · [`tsc-lint.txt`](tsc-lint.txt) | a suíte inteira; o `test:ci` (cobertura); `tsc` da raiz, do core, da identidade e do nativo; lint |

---

## 1. O que se mediu antes de escrever

### 1.1 O inventário das frases da folha `[medido]`

**Como**: a folha (`DESIGN-N4/telas.html`, sha256 `dba757dd…`) renderizada no Chromium do Playwright 1.55.0 do
repositório, sem rede (0 requests externas); cada moldura achada pelo `id` do DOM (`N4-{C,B,A}-<id>`, 161, as do índice);
o texto de cada elemento folha juntado por pai. **226 textos distintos** nas 154 molduras não-estudo — o mesmo número do
`DESIGN-N4/README.md` §5.1 (item 4). Mais as três tabelas de frases das legendas: as **espécies do favoritar**
(`N4-*-L-favoritar-falhou`, 6 linhas), o **corpo vazio por tipo** (`N4-*-V-corpo-vazio`, 4 linhas) e os **nomes
acessíveis** da tabela de ícones (P-I1a, P-I1b, P-I2) e das legendas (`Voltar para …`).

Dos 226, **saem da conta** os que não são frase: fixture do projeto (títulos, artistas, corpos, seções `Content`/`Intro`/
`Verse 1`, o termo `xablau` e o realce `do ensaio`, valores de tom, etiquetas e álbum), números e datas soltos, o `·` e
o `—` sozinhos, e as anotações do desenho (*pior caso · comprimento · fixture*, *teclado do sistema · 300 dp* e *· 317 dp*,
*partitura · página 1 de 12*, as etiquetas `P-F*`). O que sobra, por sentido:

**(a) já está no `packages/core` — 9**

| frase (forma da folha) | onde |
| --- | --- |
| *Biblioteca · {n} músicas* (a régua de L; *Biblioteca* sozinha em `L-carregando` é o recorte dela, N4-D79) | `packages/core/src/frases.ts:411` (`reguaBiblioteca`) |
| *sem conexão — nada foi salvo* | `frases.ts:226` (`rede`) |
| *sem resposta do servidor* | `frases.ts` (`sem-resposta`) |
| *não foi possível salvar — confira sua conta no site* | `frases.ts:229` (`auth`) |
| *muitas alterações seguidas — tente de novo em {N} s* | `frases.ts` (`limite-com-prazo`) |
| *falha no servidor — nada foi alterado aqui* | `frases.ts:237` (`servidor`) |
| *não foi possível salvar* | `frases.ts` (`generica`) |
| *Sem conexão: dá para abrir e tocar o que está no aparelho, não para criar setlist. O controle volta com a rede.* | `frases.ts` (`sem-rede-s1`) |
| *{n} músicas* dos cartões de S1 — no core como `nMusicas` (`frases.ts:401`), que o `Picker.tsx:429` usa; o cartão de S1 tem a sua (`SetlistsScreen.tsx:331`) | `frases.ts:401` |

**(b) existe só no site — 26 textos, 27 entradas** (as que mudam de casa nesta PR; §1.2)

**(c) nova — a lista P-F aceita, 9 IDs, 10 frases** (a P-F5 são duas: favoritando e tirando) — §2.2.

**Fora dos três grupos — divergência** (div. 1029): **39** frases que existem **no tablet, fora do core** — nas telas e
no `files.ts`. O prompt dá três grupos (core · só no site · nova) e estas não cabem em nenhum. *(A primeira versão deste
README dizia 38: a soma estava errada — a tabela abaixo, linha a linha, dá 39.)*

**Elas ficam onde estão nesta PR** (levá-las ao core mudaria tela). **A PR que reusar uma frase desta tabela numa tela do
N4 a move para o core, sob o mesmo gate de igualdade** (`tests/gates-web/frases-n4.test.ts` é o molde: a base da tela
antes, a frase no core depois, nenhuma cópia na tela) — e o **N4-R21 fecha no encerramento** com esta tabela zerada nas
três PRs. A coluna *PR* é a primeira tela do N4 que a folha desenha com a frase (N4-D72):

| # | frase (forma da folha) | arquivo:linha de hoje | a folha a reusa em | PR |
| --- | --- | --- | --- | --- |
| 1 | *AVULSA* | `apps/native/src/screens/StageScreen.tsx:513` | `S3-avulso-*` | **PR-6** |
| 2 | *página {n} de {N}* | `StageScreen.tsx:529` | `S3-avulso-partitura` | **PR-6** |
| 3 | *Voltar para a busca* (nome acessível) | `StageScreen.tsx:721` | o voltar do avulso aberto da S4 | **PR-6** |
| 4 | *carregando…* | `apps/native/src/screens/IndexScreen.tsx:202` | `L-carregando` | **PR-7** |
| 5 | *tipo não reconhecido — edite na versão web* | `IndexScreen.tsx:190` | `L-linhas` | **PR-7** |
| 6 | *nada para mostrar — edite na versão web* | `IndexScreen.tsx:191` | `L-linhas` | **PR-7** |
| 7 | *arquivo não baixado* | `StageScreen.tsx:814` | `L-linhas` (e V, palco) | **PR-7** |
| 8 | *baixando o arquivo…* | `StageScreen.tsx:802` | `L-linhas` (e `V-pdf-baixando`) | **PR-7** |
| 9 | *não consegui baixar* | `apps/native/src/files.ts:435` | `L-linhas` (e `V-arquivo-falhou`) | **PR-7** |
| 10 | *{n} resultado(s)* — a P-F8 (N4-E5) | `apps/native/src/screens/SearchScreen.tsx:156` | a régua de L | **PR-7** |
| 11 | *nada encontrado para “{termo}”* | `SearchScreen.tsx:314` | `L-busca-sem-resultado` | **PR-7** |
| 12 | *busca em título, artista, álbum e letra de toda a biblioteca ({n} músicas)* | `SearchScreen.tsx:250` | `L-busca-sem-resultado` | **PR-7** |
| 13 | *sem conexão* | `SearchScreen.tsx:297` · `apps/native/src/screens/SetlistsScreen.tsx:644` | `L-falha-sem-cache` | **PR-7** |
| 14 | *Buscar música* | `SetlistsScreen.tsx:565` | o placeholder do campo de L | **PR-7** |
| 15 | *· mostrando dados de {há quanto}* | `SetlistsScreen.tsx:612` | `L-falha-com-cache` | **PR-7** |
| 16 | *falha no servidor* | `SetlistsScreen.tsx:189` | `L-falha-com-cache` | **PR-7** |
| 17 | *Tentar novamente* | `SetlistsScreen.tsx:622`, `:652` | `L-falha-com-cache`, `L-falha-sem-cache` | **PR-7** |
| 18 | *tipo desconhecido* | `StageScreen.tsx:132` | `V-tipo-desconhecido` | **PR-8** |
| 19 | *este item não tem conteúdo* | `StageScreen.tsx:117` (e `:122`, `:127`) | `V-corpo-vazio` | **PR-8** |
| 20 | *{título} · {tipo} ({tamanho}) não está neste aparelho.* | `StageScreen.tsx:816` | `V-arquivo-nao-baixado` | **PR-8** |
| 21 | *Toque em Baixar para trazê-lo para este aparelho.* | `StageScreen.tsx:809` | `V-arquivo-nao-baixado` | **PR-8** |
| 22 | *Baixar* (em V, o nome acessível do ícone — N4-E8) | `StageScreen.tsx:829` | `V-arquivo-nao-baixado`, `V-arquivo-falhou` | **PR-8** |
| 23 | *arquivo incompleto: {n} de {m} bytes* | `files.ts:427` | `V-arquivo-falhou` | **PR-8** |
| 24 | *SETLISTS* | `SetlistsScreen.tsx:583`, `:588` | só `S1-absorver-*` | — (div. 1040) |
| 25 | *Nova setlist* | `SetlistsScreen.tsx:562` | só `S1-absorver-*` | — |
| 26 | *Baixar esta setlist* | `SetlistsScreen.tsx:343` | só `S1-absorver-*` | — |
| 27 | *garantida offline* | `SetlistsScreen.tsx:141` | só `S1-absorver-*` | — |
| 28 | *parcial* | `SetlistsScreen.tsx:142` | só `S1-absorver-*` | — |
| 29 | *nada a baixar* | `SetlistsScreen.tsx:167` | só `S1-absorver-*` | — |
| 30 | *todos os arquivos neste aparelho* | `SetlistsScreen.tsx:167` | só `S1-absorver-*` | — |
| 31 | *{n} de {m} arquivos baixados* | `SetlistsScreen.tsx:169` | só `S1-absorver-*` | — |
| 32 | *sem data* | `SetlistsScreen.tsx:329` | só `S1-absorver-*` | — |
| 33 | *sincronizado {há quanto}* | `SetlistsScreen.tsx:212` | só `S1-absorver-*` | — |
| 34 | *sincronizando…* | `SetlistsScreen.tsx:210` | só `S1-absorver-*` | — |
| 35 | *· última sincronização {há quanto}* | `SetlistsScreen.tsx:220` | só `S1-absorver-*` | — |
| 36 | *mostrando dados salvos* | `SetlistsScreen.tsx:225` | só `S1-absorver-*` | — |
| 37 | *baixando suas setlists pela primeira vez* | `SetlistsScreen.tsx:631` | só `S1-absorver-*` | — |
| 38 | *Nenhuma setlist foi salva neste aparelho ainda…* | `SetlistsScreen.tsx:647` | só `S1-absorver-*` (L usa a P-F11 no lugar) | — |
| 39 | *Criar a primeira setlist* | `SetlistsScreen.tsx:673` | a S1 vazia de hoje (N4-E1) | — |

**Por PR**: **PR-6: 3** · **PR-7: 14** · **PR-8: 6** — 23 que entram no core. As **16** restantes (24–39) só aparecem nas
molduras de S1, e S1 não muda no N4 (N4-D59): nenhuma tela nova as reusa, nenhuma das três PRs as alcança, e ficam na
tela (div. 1040). Linhas 7–9 e 13 também aparecem em V e no palco; entram na primeira, a PR-7, e V/o palco as importam
de lá.

E mais: os **quatro rótulos de tipo** (*Letra · Cifra · Tab · Partitura*), que estão **nos dois lados** (div. 1030) e vão
ao core pelo grupo (b). As **duas frases de `S1-absorver-vazia`** (*nenhuma setlist*, *Sua conta não tem setlists…*) não
existem no app: são a **N4-E1** (vale a S1 vazia de hoje). **Composições**, não frases: *criado {data} · alterado {data}*
(os rótulos do site no formato de data de S1 — div. 1037) e *partitura-escaneada.jpg · Partitura (840 KB)* (a forma
`{arquivo} · {tipo} ({tamanho})` do placeholder do palco).

**Nenhuma frase nova fora da lista P-F** — o mesmo resultado do `DESIGN-N4/README.md` §5.4.

### 1.2 O vocabulário de content que o tablet vai usar e hoje vive só no site `[medido: git grep]`

| sentido | chave no site · `arquivo:linha` (na `main`) | texto |
| --- | --- | --- |
| o quinto chip | `dash.abas.favoritas` `frases-lista.ts:24` · `dash.favoritas` `:31` | *Favoritas* |
| L com Favoritas e 0 | `dash.vazio.favoritas` `frases-lista.ts:33` | *nenhuma favorita* |
| L vazia | `lib.vazio` `:56` | *nenhum conteúdo ainda* |
| L com filtro sem resultado | `lib.vazio.busca` `:58` · `lib.vazio.busca.apoio` `:59` | *nada encontrado* · *mude a busca ou os filtros* |
| o nome da estrela | `lib.favoritar.nome` `:46` · `lib.favorita.nome` `:47` | *Favoritar “{título}”* · *Tirar “{título}” das favoritas* |
| os tipos | `TIPOS` `:76-80` | *Letra · Cifra · Tab · Partitura* |
| a dificuldade | `DIFICULDADES` `:88-92` | *Iniciante · Intermediário · Avançado* |
| o voltar do avulso aberto de L | `view.voltar` `frases-visualizacao.ts:10` | *Voltar para a biblioteca* |
| o título dos detalhes | `view.detalhes` `:12` | *Detalhes* |
| formato que o app não mostra (N4-D43) | `view.erro.formato` `:38` | *não foi possível abrir o arquivo — confira o formato* |
| os rótulos dos campos | `campo.album` · `campo.dificuldade` · `campo.genero` · `campo.tom` · `campo.andamento` · `campo.andamento.bpm` · `campo.etiquetas` · `campo.criado` · `campo.alterado` `:48-57` | *álbum · dificuldade · gênero · tom · andamento · {x} BPM · etiquetas · criado · alterado* |

**27 entradas, 26 textos** (*Favoritas* são duas chaves). Ficam no site, porque o tablet não as usa: `campo.compasso`
(N4-D31), `lib.favoritar`/`lib.favorita` (a estrela é só ícone, N4-D58), `lib.filtros.favoritas` (*Só as favoritas*;
o nome do chip é a P-F9 com contagem — N4-D85), `lib.carregando`, `lib.vazio.apoio`, `view.notas`, os `view.vazio.*` e os
`motivo.*` (abaixo).

**Os pares — o mesmo sentido nos dois lados; vale a do tablet** (o desenho; `DESIGN-N4/README.md` §1 e §5.4):

| sentido | tablet (vale) | site (cede, e não muda) |
| --- | --- | --- |
| tipo desconhecido | *tipo desconhecido* (V, palco) · *tipo não reconhecido — edite na versão web* (linha) | ícone `tipo-desconhecido` e rótulo vazio — e, medido, o ramo nunca roda: o tipo fora do enum vira *Letra* (div. 1038) |
| corpo vazio | *este item não tem conteúdo* (os quatro tipos, N4-D66 P-O2) | *nenhuma letra · nenhuma cifra · nenhuma tablatura · nenhuma partitura* |
| carregando | *carregando…* | *carregando a biblioteca…* |
| L vazia, o apoio | **P-F10** (N4-D66, P-O3) | *adicione a primeira música para começar* |
| as notas | **P-F3** *notas da música* (N4-D62) | *Notas de palco* |
| favoritar sem rede | *sem conexão — nada foi salvo* | *sem conexão* |
| favoritar, sessão | *não foi possível salvar — confira sua conta no site* | *o servidor não aceitou a sessão — entre de novo* |
| favoritar, limite | *muitas alterações seguidas — tente de novo em {N} s* | *muitas tentativas — tente de novo em instantes* |
| favoritar, servidor | *falha no servidor — nada foi alterado aqui* | *falha no servidor* |
| favoritar, genérica | *não foi possível salvar* | *algo deu errado* (`motivo.generico`) |
| favoritar, sem resposta | *sem resposta do servidor* | — (só o tablet) |
| sem rede (leitura) | *sem conexão* | *sem conexão* — **iguais** |

A frase do tablet que vale **não entrou no core nesta PR**: ela mora na tela que já a mostra, e a PR proíbe mudar tela
(div. 1029). As seis do favoritar já estão no core (`FRASES`, grupo (a)).

### 1.3 O G-tok hoje `[medido: g-tok-antes-depois.txt]`

Na `main`: **132 arquivos** na lista (ii), **446 strings de `.ts` examinadas** (a posição da div. 828), 33 textos JSX, PASSA.
Os arquivos de frases do site que ele cobre — **os dez** `components/*/frases-*.ts`, todos na lista: `auth/frases-auth.ts`,
`auth/frases-sessao.ts`, `content/frases-visualizacao.ts`, `editors/frases-editor.ts`, `identidade/frases-casca.ts`,
`identidade/frases-erro.ts`, `landing/frases-landing.ts`, `library/frases-lista.ts`, `setlists/frases-setlists.ts`,
`upload/frases-upload.ts`. **Não cobre `packages/`** (a lista é de caminhos do site) — a div. 977.

### 1.4 O que dispara o APK

Pela leitura do `.github/workflows/native.yml:41-46`: o filtro `paths` do `pull_request` é `apps/native/**`,
`packages/identidade/**`, `native.yml`, **`gates.yml`** e `pnpm-workspace.yaml`; **`packages/core/**` está fora**
(o recorte da N1-PR8, `native.yml:3-8`). Esta PR toca `packages/core/src` — que sozinho **não** dispararia — e também o
**`gates.yml`** (commit 1, N4-D81) e **`apps/native/test/`** (commits 1 a 3). **O APK roda**, por esses dois; o
`mudou-nativo` confirmou (`pass`, e o `android-debug-apk` saiu da fila). O push só de docs, depois do APK verde, sai
`skipped` (regra 18).

### 1.5 O tipo desconhecido: o que mudou de casa (div. 1038) `[medido: git grep]`

**Só a tabela de rótulos.** O que foi ao core é `ROTULO_DO_TIPO` (`packages/core/src/frases-content.ts:60-65`): os quatro
rótulos, indexados pelos quatro valores do enum, e mais nada — não há ali função que receba um tipo e devolva um rótulo,
nem valor padrão; um tipo fora do enum não tem entrada. A função do site que devolve *Letra* para um tipo desconhecido
**ficou no site**: o `tipoDe` (`components/library/frases-lista.ts:87-90`), que chama o `normalizeContentType`
(`types/content.ts:19-42`, o `default: return ContentType.LYRICS` em `:39-40`). Nenhum dos dois é alcançável do
tablet: `git grep -n "normalizeContentType\|tipoDe\b" -- packages/core apps/native` só devolve duas linhas de **texto**
da fixture do G-par (`packages/core/fixtures/g-par.json:139`, `:147`), nenhuma de código. O tablet continua com o contrato
de leitura: tipo fora do enum é `unknown-type`, e a frase é *tipo desconhecido*.

**O defeito do site é do Bloco D** — e **não está** na tabela de heranças do Bloco D (`docs/ux/I1-ENCERRAMENTO.md` §10.1,
19 itens; `git grep -n "Bloco D" -- docs` com `enum`/`Letra`/`normaliz` só acha o `N4-PR1-anexos/README.md:146-150`, a
tabela *"fora do par"* do G-par, que diz *"O que o Bloco D decide é o lado do web"*; o `N4-REQUISITOS.md` §4 tem para o
Bloco D só o compasso, o capo e a afinação). **Este README o nomeia para o encerramento do N4**: *o site mostra o
`content_type` fora do enum como Letra (`types/content.ts:39-40`, via `tipoDe`), o tablet e o core como tipo desconhecido
— entra na tabela do Bloco D do `N4-ENCERRAMENTO.md`, com a div. 983 e a N4-D47 de origem.*

---

## 2. O que a PR entrega

### 2.1 O módulo — `packages/core/src/frases-content.ts`

Três grupos, e o cabeçalho do arquivo diz a regra de cada um:

1. **Do site, byte a byte**: `VOCABULARIO_DE_CONTENT` (19 chaves), `ROTULO_DO_TIPO` (4), `ROTULO_DA_DIFICULDADE` (3) —
   os 26 textos do §1.2. As chaves com `{título}` e `{x}` ficam com o buraco, porque o site as preenche assim
   (`comDado`, `fraseCom`); para o tablet, `nomeFavoritar`, `nomeTirar` e `andamentoEmBpm`, com o título entrando como
   **dado** (`replace` com função: um `$&` no título não vira padrão — testado).
2. **As P-F**: `FRASES_N4` (P-F3, P-F4, P-F6, P-F10, P-F11) e cinco funções — `nomeTocar` (P-F1), `nomeFavoritando` e
   `nomeTirando` (P-F5), `nomeVer` (P-F7), `nomeDoFiltro` e `nomeDoFiltroFavoritas` (P-F9, as duas formas da N4-D85). **Nenhuma tem plural**: a única contagem é o `({n})` da
   P-F9, a mesma forma para 0, 1 e muitos (testada com 0, 1 e 57). Aspas tipográficas `“ ”`, como a folha.
3. **O motivo isolado** (N4-D29): `SEPARADOR_DE_ORACOES = '  ·  '` e `compor(oracoes)`.

Exportado pelo `index.ts`. O site o importa **pelo caminho profundo** (`@octavia/core/src/frases-content`), não pelo
`index`, para o bundle levar só este módulo; `@octavia/core` entra como dependência de workspace da raiz
(`package.json` +1, `pnpm-lock.yaml` +3 — os números da L3).

### 2.2 As P-F, contra a folha

`apps/native/test/n4-pf-esperado.json` é a **lista esperada versionada**, gerada por `apps/native/test/n4-pf-extrair.mjs`
a partir da folha **renderizada** (a tabela *Frases* da seção 7), com o sha256 do `telas.html` de que saiu
(`dba757dd569dc26ee05406aa025f5f6c3e1ba26ec8df3e7f5daec754bf94cc41`) — o teste confere esse sha contra a árvore antes
de comparar. A célula da folha vem verbatim; duas trazem mais do que a frase, e o recorte está escrito no extrator
(P-F1: o que está entre *nome acessível* e o parêntese; P-F5: as duas, separadas por ` · `). Reextraída nesta sessão:
idêntica.

| P-F | no core | texto |
| --- | --- | --- |
| P-F1 | `nomeTocar(t)` | *Tocar “{título}”* |
| P-F3 | `FRASES_N4['notas-da-musica']` | *notas da música* |
| P-F4 | `FRASES_N4['sem-rede-favoritar']` | *Sem conexão: dá para ler e tocar, não para favoritar. O favoritar volta quando a rede voltar.* |
| P-F5 | `nomeFavoritando(t)` · `nomeTirando(t)` | *favoritando “{título}”…* · *tirando “{título}” das favoritas…* |
| P-F6 | `FRASES_N4['voltar-visualizacao']` | *Voltar para a visualização* |
| P-F7 | `nomeVer(t)` | *Ver “{título}”* |
| P-F9 | `nomeDoFiltro(tipo, n)` · `nomeDoFiltroFavoritas(n)` | *Só {tipo} ({n})* para os quatro tipos · *Só as favoritas ({n})* para o quinto chip — **N4-D85** (§2.4) |
| P-F10 | `FRASES_N4['biblioteca-vazia']` | *Sua conta não tem músicas. Crie na versão web — elas aparecem aqui na próxima sincronização.* |
| P-F11 | `FRASES_N4['biblioteca-sem-cache']` | *Nenhuma música foi salva neste aparelho ainda. Conecte-se à internet uma vez para baixar tudo — depois funciona offline.* |

A P-F8 (*1 resultado*) não entra: existe na S4 (`SearchScreen.tsx:156`, N4-E5).

### 2.3 O motivo isolado

Os motivos da escrita já moram sozinhos no core desde o N2 (`FRASES`: `rede`, `sem-resposta`, `auth`,
`limite-com-prazo`, `servidor`, `generica`); o favoritar usa os mesmos (a tabela das espécies da folha diz *"tablet"* na
origem das seis). O que entra é a composição do tablet, `compor`, com **o separador das telas de hoje** — e o
`apps/native/test/frases-n4.test.ts` prova, lendo o **fonte** das telas, que:

- as **4** junções com `·` que existem (`IndexScreen.tsx:207`, `:587`; `ModoDeReordenar.tsx:511`; `SearchScreen.tsx:91`)
  usam `'  ·  '`, o separador do core;
- para os seis motivos, a frase de S2 (`falhou-salvar` · motivo · `lista-relida`) e a do reordenar (`falhou-ordem` ·
  motivo · `ordem-relida`), com e sem a terceira oração, saem **byte a byte** iguais pelo core e pela tela;
- nenhum motivo tem `·` dentro (o motivo é isolado);
- as **seis linhas da tabela das espécies** do favoritar saem do core (`nomeFavoritar`/`nomeTirar` + o motivo), iguais à
  folha a menos do espaço do separador (div. 1031).

O site compõe como compõe hoje (*"não foi possível … — {motivo}"*, no próprio site); nada mudou ali.

### 2.4 A N4-D85 — a P-F9 das favoritas

> **N4-D85** `[Marcel, 2026-10-03]` (div. 1032): o nome acessível do chip *Favoritas* é **Só as favoritas ({n})**. A
> P-F9 fica com duas formas: *Só {tipo} ({n})* para os quatro tipos e esta para as favoritas.

Commit próprio, `d0012e7` `feat(core): P-F9 das favoritas (N4-D85)`: `nomeDoFiltroFavoritas(n)` no core; o caso da P-F9
do teste em par — o molde da folha para os tipos (n = 0, 1, 57) e a forma da decisão para as favoritas (n = 0, 1, 6),
com o texto da decisão numa constante do teste (a folha não o tem; a lista extraída dela não muda). O CN — um caractere
trocado (`Só` → `So`) — reprova a P-F9 e volta ao verde desfeito `[medido: cn.txt, CN8]`. G-tok **455 → 456** (o literal
de template da função nova).

### 2.5 O contrato da linha de aviso — `packages/core/src/linha-de-aviso.ts`

`ESPECIES_DE_AVISO` (`falha`, `rede`, `limite` — as dos dois; `teto`, `salvo-nao-relido` — as do tablet; `sucesso` — a
do site), `EspecieDeAviso`, `AcaoDoAviso` (a união: `rotulo`, `onPress`, `inativo?`, `motivoInativo?`) e
`ContratoDaLinhaDeAviso` (`motivo`, `especie`, `acao?`) — a forma da `N4-PRECHECK.md` A10. **As duas implementações
ficam, e nenhuma muda.**

- **Tablet**: o `LinhaDeAviso.tsx` não muda (a troca por espécie é da PR-9). `apps/native/test/linha-de-aviso-contrato.test.ts`
  afirma, por igualdade **estrita** de tipos, que a ação, o motivo e a prop `acao` do componente são os do contrato — e
  quem cobra é o `tsc --noEmit` do nativo, passo bloqueante do `native.yml`.
- **Site — não adotado.** Com o `import type` do contrato no `components/identidade/linha-de-aviso.tsx`, os 61 chunks
  saíram com **o mesmo conteúdo** (sha igual), mas **um mudou de nome** (`6370-bc0228c6bbd6d29b.js` →
  `6370-18be06e6605b9796.js`), e o nome está no `app-build-manifest.json`; sem a adoção, os 61 voltam idênticos ao
  commit 2, nome e conteúdo `[medido: build-antes-depois.txt]`. Pela regra da PR, **não se adota** (div. 1033). No
  lugar: `tests/gates-web/contrato/linha-de-aviso.tipos.ts`, a mesma igualdade estrita (as quatro espécies do site, a ação
  sem `motivoInativo`, o motivo), compilada por um `tsc` em subprocesso dentro do `pnpm test`
  (`tests/gates-web/linha-de-aviso-contrato.test.ts`) — o `tsconfig.json` da raiz exclui `tests/`, e o type-check dos
  testes do CI é informativo.

---

## 3. O gate das frases (div. 977) — o escolhido, e por quê

**Os dois, e por necessidade.** O critério do prompt manda primeiro **estender o G-tok** ao módulo do core, de modo que a
contagem não caia — e isso foi possível sem reescrever o G-tok: o módulo entrou na lista (ii)
(`scripts/gates-web/g-tok-arquivos.txt`), e o nome `frases-*.ts` o põe na posição (c) da div. 828 (todo valor de chave e
todo literal de template). **446 → 455**: saem 27 do site, entram 36 no core (26 + as 5 constantes P-F + os 5 templates
das funções P-F) `[medido]`.

Mas o G-tok procura **inglês e literal de identidade**: tirar uma frase do core ou trocar um caractere dela **passa** por
ele. Os dois primeiros controles do §3 não reprovariam — div. 1039. Por isso entra também o **gate de igualdade**,
`tests/gates-web/frases-n4.test.ts`, projeto `web` do Vitest:

1. **o site mostra o que mostrava**: as **151 folhas** que `frases-lista.ts` e `frases-visualizacao.ts` exportam
   (`FRASES_LISTA`, `FRASES_VIEW`, `TIPOS`, `DIFICULDADES`, `MESES` e o `tipoDe` de sete entradas), resolvidas, iguais
   **byte a byte** à base `tests/gates-web/esperado/frases-n4-site.json`, gerada **sobre a `main` de antes da PR**
   (`scripts/gates-web/frases-n4-base.ts`) — e o mesmo conjunto de caminhos (chave a mais ou a menos reprova);
2. **as que mudaram de casa estão no core**: para as **27** linhas de `MUDARAM_DE_CASA`, o valor do core é o da base, e o
   arquivo do site de onde ela saiu não tem mais o literal (o site importa; não guarda cópia).

E o teste das P-F do §2.2, contra a lista extraída da folha. **Os controles** `[medido: cn.txt]`:

| CN | o que se planta | quem reprova |
| --- | --- | --- |
| CN1 | tirar a linha `'vazio-biblioteca'` do core | igualdade: 2 ✗ (o site fica com `undefined`; o core não tem) · e o `tsc` da raiz, TS7053 |
| CN2a | `'nenhum conteúdo ainda'` → `'nenhum conteudo ainda'` no core | igualdade: 2 ✗ (Expected/Received) |
| CN2b | `'notas da música'` → `'notas da musica'` (P-F3) | P-F: 1 ✗ |
| CN2c | tirar a função `nomeVer` (P-F7) | P-F: 2 ✗ |
| CN3a | uma frase nova no site, fora do core, em inglês (`"lib.cn": "loading"`) | **G-tok REPROVA** (`[inglês, frases: valor de chave] "loading"`), 455 → 456 |
| CN3b | a mesma em pt-BR (`"frase nova do site"`) | o G-tok a **conta** (456) e passa; a igualdade a acusa como chave a mais |
| CN4 | um byte a mais no fim do `DESIGN-N4/telas.html` | `shasum -c`: `telas.html: FAILED`, exit 1 · e o teste das P-F (o sha da folha) |
| CN5 | o separador de `IndexScreen.tsx:587` vira `' · '` | o motivo isolado: `expected ' · ' to be '  ·  '` |
| CN6 | o `LinhaDeAviso.tsx` do tablet sem o `motivoInativo` | `tsc` do nativo: TS2322 no teste do contrato, exit 2 |
| CN7 | a ação do site com um `motivoInativo` a mais | o teste do contrato do site: TS2322 |
| CN8 | (N4-D85, sobre o `d0012e7`) `Só as favoritas` → `So as favoritas` no core | P-F: 1 ✗ (`expected 'So as favoritas (0)' to be 'Só as favoritas (0)'`) |

CN1–CN7 sobre o `5d96a70`, desfeitos com `git checkout`, `git status --short` vazio no fim; CN8 sobre o `d0012e7`, desfeito
e verde de novo (33/33).

---

## 4. As saídas `[medido]`

| prova | resultado | arquivo |
| --- | --- | --- |
| commit 1 sobre a `main` | web **27 ✗** · 152 ✓ (o site como estava); native **24 ✗** · 8 ✓; G-tok **REPROVA** (o arquivo da lista não existe) | `commit1-reprovando.txt`, `g-tok-antes-depois.txt` |
| commit 2 | web 179/179 · native 33/33 · G-tok PASSA, 455 | — |
| N4-D85 (`d0012e7`) | native 33/33 (a P-F9 com as duas formas) · G-tok PASSA, 456 · suíte 1418 ✓ · lint · G1a/G1b | `cn.txt` (CN8) |
| G-tok antes → depois | 446 → **455** strings de `.ts` (commit 2) → **456** (N4-D85) · 33 → 33 textos JSX · 132 → 133 arquivos | `g-tok-antes-depois.txt` |
| G-tok cobertura | 129 de 129 arquivos de tela na lista; 4 da lista que não são de tela (informa; era 3) | `g-tok.txt` |
| `pnpm build` | **27 → 27 rotas**; compartilhado **102 kB** igual; primeiro carregamento **+1 kB** em 4 rotas — `/add-content` 277 → 278, `/content/[id]` 393 → 394, `/content/[id]/edit` 279 → 280, `/setlists` 275 → 276 —, as outras 23 iguais. A L3 previa **+2 kB em 3 rotas** (div. 1036) | `build-antes-depois.txt` |
| build commit 2 × commit 3 | **idênticos**: os 61 chunks (nome e conteúdo) e a tabela de rotas | `build-antes-depois.txt` |
| G1a/G1b | G1a diff vazio com as 3 exceções do bloco `gates`, nenhum arquivo novo fora delas; G1b só adição | `g1.txt` |
| G2/G3 | testIDs 80 → 80; linhas `log(` 68 → 68 — nenhum `testID`, nenhuma linha de log | `g2g3.txt` |
| `gate:a20` · `gate:icones` | 0 acusações · 0 acusações, 0 avisos | `a20-icones.txt` |
| G-back | PASSA — núcleo 39/40, diff vazio; `package.json` e `pnpm-lock.yaml` declarados como registro (fora do núcleo) | `g-back.txt` |
| G-palco · G-faixa | PASSA · PASSA | `g-palco.txt`, `g-faixa.txt` |
| G-par · favoritar | G-par: 16 itens, 9 pares, 9 iguais, **0 reprovações, lista vazia** ✓; favoritar 64 B / 65 B iguais à fixture | `g-par-favoritar.txt` |
| `SHA256SUMS` | V1, N2, N3, **N4** e I1: todos OK | `shasum.txt` |
| a suíte | **124** arquivos ✓ · 3 pulados; **1418** testes ✓ · 59 pulados; 0 ✗ (no commit 2, antes do contrato: 122 · 1415) | `suite.txt` |
| cobertura (`test:ci`) | exit 0; 1418 ✓ | `cobertura.txt` |
| `tsc` | raiz 0 · core 0 · identidade 0 · nativo 0 | `tsc-lint.txt` |
| lint | *No ESLint warnings or errors* | `tsc-lint.txt` |
| CI | ver §8 | — |

Nenhum arquivo do núcleo do G-back tocado.

---

## 5. Extras, declarados

- **O extrator das P-F** (`apps/native/test/n4-pf-extrair.mjs`) e **o gerador da base do site**
  (`scripts/gates-web/frases-n4-base.ts`) entram versionados, ao lado do que geram — para a lista e a base serem
  reproduzíveis, não para rodar no CI.
- **O caso `$&`** no teste das P-F (commit 2): `nomeFavoritar`/`nomeTirar` usam `replace` sobre o molde do site, e um título
  com `$&` viraria padrão de substituição; o core usa `replace` com função.
- **O teste do contrato do site roda o `tsc`** como subprocesso (o molde do `apps/native/test/gates.test.ts`): ≈ 1,3 s na
  suíte.

---

## 6. Os blocos de declaração desta PR

```gates
# N4-PR3 — o vocabulário de content, as frases do N4 e o contrato da linha de aviso no core (N4-D14, N4-D16, N4-D67).
g1a: packages/core/src/frases-content.ts
g1a: packages/core/src/linha-de-aviso.ts
g1a: packages/core/src/index.ts
```

```gates-web
# N4-PR3 — nenhum arquivo do núcleo do G-back tocado.
# Arquivos do site tocados: components/library/frases-lista.ts e components/content/frases-visualizacao.ts (importam do core, texto byte a byte igual — tests/gates-web/frases-n4.test.ts).
gtok: a lista (ii) ganha packages/core/src/frases-content.ts (div. 977): a frase que muda do site para o core continua ao alcance do G-tok (446 → 455 strings de .ts)
gback: package.json — @octavia/core entra como dependência de workspace da raiz (N4-D14; a L3 do pre-check mediu +1 linha), fora do núcleo: registro
gback: pnpm-lock.yaml — o link:packages/core do @octavia/core (+3 linhas, como a L3), fora do núcleo: registro
```

---

## 7. Divergências — 1029 a 1040

A última usada era a **1028** (`DESIGN-N4/README.md` §13.1) `[medido: git grep -h -o -E '^\| \*\*1[0-9]{3}\*\*' -- docs |
sort -u | tail -4` → `1026 · 1027 · 1028 · 1138`, este último uma linha de medida]. Origem: **P** premissa do prompt ·
**D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
| --- | --- | --- | --- |
| **1029** | P | O §1.1 dá três grupos — no core, só no site, nova. **39** frases da folha existem **no tablet fora do core** (as telas e o `files.ts`; a tabela do §1.1, com arquivo:linha) e não cabem em nenhum | ficam onde estão nesta PR. A PR que reusar uma frase da tabela a move para o core, sob o mesmo gate de igualdade: **PR-6 — 3 · PR-7 — 14 · PR-8 — 6**; as outras 16 são da div. 1040. O **N4-R21 fecha no encerramento** com a tabela zerada nas três |
| **1030** | P | *"os nomes dos tipos … hoje vive só no site"*: o tablet tem os quatro, com o mesmo texto, em três telas (`StageScreen.tsx:108-111`, `IndexScreen.tsx:170-173`, `SearchScreen.tsx:80-83`) — a A9 já dizia *"igual"* | o core recebe os do site (texto igual); as três telas ficam, como a div. 1029 |
| **1031** | P | *"o tablet compõe com ` · `"* — e a tabela das espécies da folha também. As **quatro** composições do tablet usam **`'  ·  '`**, dois espaços de cada lado (`IndexScreen.tsx:207`, `:587`; `ModoDeReordenar.tsx:511`; `SearchScreen.tsx:91`); no HTML os espaços colapsam | vale o das telas — é o que sai byte a byte igual (`SEPARADOR_DE_ORACOES`; CN5). A tabela da folha confere a menos do espaço |
| **1032** | D | A P-F9 é *Só {tipo} ({n})*, e a folha não diz o `{tipo}` do quinto chip; o `DESIGN-N4/README.md` §5.4 diz que *Só as favoritas* (o site) *"vira o nome acessível pela P-F9"* | **fechada pela N4-D85** `[Marcel, 2026-10-03]`: *Só as favoritas ({n})*; no core pelo `d0012e7` (`nomeDoFiltroFavoritas`), com teste e CN (§2.4) |
| **1033** | T | O `import type` do contrato no `linha-de-aviso.tsx` do site, apagado no JS, **muda o nome** de um chunk (`6370-…`; o conteúdo, sha igual) — o hash do nome entra no `app-build-manifest.json` | não adotado (a regra da PR); igualdade de tipos em `tests/gates-web/contrato/`, compilada na suíte |
| **1034** | T | O G-tok lê **genérico de TypeScript como texto JSX**: o `>` de `Record<…>`/`Omit<…>` seguido de texto até um `<` ou `{` conta (as regras `texto JSX` de `scripts/gates-web/g-tok.mjs`). Duas vezes nesta PR (`as const satisfies Record` no core; `export interface LinhaDeAvisoProps` no site, com a adoção); a contagem subia 33 → 34 sem frase nova | **contornado no código** (o core sem o genérico; a tentativa de adoção desfeita). Pela regra 32 o conserto é no instrumento: **W5** (o bloco de instrumento). `git grep` nas heranças não acha destino já escrito para defeito do G-tok: o `I1-ENCERRAMENTO.md` §10.4 (W5) tem os do G1b, do `g1.sh`, do APK, dos testes do editor e do `g-faixa-auth.ts`, e nenhum do G-tok — entra lá como item novo, no encerramento do N4 |
| **1035** | T | O `gate:a20` (o inglês do tablet) não lê `packages/core/src/frases-content.ts`: os `EXTRAS` são só o `frases.ts` (`apps/native/scripts/a20.mjs:85`) — o caso da div. 229. As frases que o tablet vai mostrar ficam sob o G-tok (o do site), não sob o a20 | a **PR-7**, a primeira tela do tablet que lê o módulo, o põe nos `EXTRAS` no commit 1 dela |
| **1036** | D | A L3 do pre-check mediu **+2 kB em 3 rotas** (`/add-content`, `/content/[id]/edit`, `/setlists`); esta PR mede **+1 kB em 4** (as três e `/content/[id]`) | registro: a L3 mexeu no `frases-editor.ts` e importou o core pelo `index`; esta PR mexe em `frases-lista.ts` e `frases-visualizacao.ts` (que `/content/[id]` usa) e importa o módulo pelo caminho profundo |
| **1037** | D | Duas formas de V diferem do site sem par no tablet: a dificuldade com maiúscula (*Avançado*, `V-tab`) — o site, em *Detalhes*, a escreve minúscula (`dificuldadeDe`, `frases-visualizacao.ts:108-111`) — e as datas no formato de S1 (*criado 2026-03-14 · alterado 2026-09-30*) — o site usa *14 mar 2026* (`dataCurta`) | o core guarda os rótulos (*Avançado*, *criado*, *alterado*) como o site; a forma — maiúscula, formato da data, a linha composta — é da **PR-8** (V), que a mede contra a folha |
| **1038** | D | A A9 do pre-check e o brief §8.1 dão o tipo desconhecido do site como *"rótulo vazio, ícone de tipo desconhecido"* (`tipoDe`, `frases-lista.ts:83-85`). Medido na base: `tipoDe("Desconhecido")` e `tipoDe("")` devolvem **Letra** — o `normalizeContentType` (`types/content.ts:39-40`) cai em `Lyrics` no `default`, e o ramo do rótulo vazio nunca roda. É o mesmo fato da div. 983 (o `tipo-fora-do-enum` fora do par, N4-D47), visto pelo site | §1.5: **só a tabela de rótulos foi ao core**; o `tipoDe` e o `normalizeContentType` ficaram no site, e nenhum código do tablet os alcança. O defeito do site é do **Bloco D** e não está na tabela do Bloco D (`I1-ENCERRAMENTO.md` §10.1): **o encerramento do N4 o põe lá** |
| **1039** | P | O §3 manda escolher *"primeiro, estender o G-tok …; se não for possível …, um gate de igualdade"*, e pede, *"qualquer que seja"*, que tirar uma frase do core e trocar um caractere reprovem. Estender o G-tok foi possível, mas ele não reprova nenhum dos dois (procura inglês e literal de identidade) | os dois: o G-tok estendido (a contagem não cai, e a frase nova do site continua vista — CN3) **e** o gate de igualdade (CN1, CN2) |
| **1040** | P | O item 4 do prompt de fecho pede, para cada uma das frases da div. 1029, *"a PR em que entra (PR-6, PR-7 ou PR-8)"*. **16** delas (as linhas 24–39 da tabela do §1.1) só aparecem nas molduras de S1, e S1 não muda no N4 (N4-D59): nenhuma das três PRs as reusa | ficam na tela de S1, sem PR do N4; o encerramento as registra como **fora do N4-R21** (não são vocabulário de content que uma tela nova use). Se o Marcel quiser o vocabulário do tablet inteiro no core, é item de herança com bloco a definir |

**Contagem**: 12 — P 5 · D 4 · T 3 · A 0 · X 0. **Fechada**: 1032 (N4-D85). **Próxima divergência livre: 1041.**

---

## 8. Contabilidade

- **Requests a prod**: 0. **Escritas**: 0. **Aparelho**: nenhum. **`.env*`**: nenhum lido nem criado.
- **Builds locais**: 4 `pnpm build` (a `main`; o commit 2; o commit 3 com a adoção; o commit 3 sem ela).
- **Árvores**: `../octavia-n4-pr3` (a da PR); duas árvores temporárias `--detach` (a `main` e o commit 1, para o G-tok
  antes/depois), removidas na mesma sessão (`git worktree list` sem elas).
- **CI** (nível job, dos carimbos do `gh pr checks`; `n` = 1 por push):
  - push 1 (`f7803d0`…`5d96a70`): os 10 checks verdes — `android-debug-apk` **13m40s** (disparado pelo `gates.yml` e por
    `apps/native/test/`, §1.4), `build` 4m14s, `g-tok` 36s, `g-back` 34s, `gates-nativos` 12s, `g-palco` 11s, `g-faixa` 9s,
    `mudou-nativo` 8s, Vercel;
  - push 2 (`d0012e7`, N4-D85): os 10 verdes — `android-debug-apk` **13m18s** (run `37154736628`), `build` 4m13s
    (`37154736654`), `g-back` 26s, `g-tok` 25s, `g-faixa` 16s, `gates-nativos` 11s, `g-palco` 11s, `mudou-nativo` 8s, Vercel;
  - push 3 (este, só docs): o APK deve sair `skipped` (regra 18) — conferido depois do push, no relato da PR.
  - As duas corridas do APK entram no `CI-FAIXA.md` no encerramento do N4 (regra 22).

---

**A próxima PR** (N4-D72): **PR-4 — identidade**.
