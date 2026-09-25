# N3-PR5-anexos — a barra superior do palco em B, e as provas de "passa"

**Rastro.** A fonte é o [`DESIGN-N3/README.md`](../DESIGN-N3/README.md) §9 (a errata N3-E16 e as
divergências 433–444) e o [`N3-REQUISITOS.md`](../N3-REQUISITOS.md) §9. Árvore `../octavia-n3-pr5`,
branch `n3/pr5-palco-provas`, sobre `origin/main` = `59269a0` (merge da #329).

**Nenhum texto de música de terceiro**: todo dump é do **mock** (`aceite.py servidor`, 8788) com a
fixture do pre-check (`N3-PRECHECK-anexos/instrumentos/fixture.py`, "hoje" = 2026-09-23). Conferido:
dos **141** `text` distintos dos 97 dumps desta pasta, 135 estão nos dumps do pre-check e das
N3-PR1…PR4, e os 6 restantes são frases do app (`Relendo…`, ` · 1 adicionada nesta visita`,
`conteúdo não baixado` e o apoio dele, o `—` do título sem música) e a posição `9 DE 9` do
placeholder. `grep` de `eyJ`, e-mail real, `UX-AUDIT` e o uid do Tab sobre esta pasta: vazio (os dois
e-mails que aparecem são os da fixture, `fixture@exemplo.invalid`, e o *placeholder* do campo,
`voce@exemplo.com.br`). **PNGs não commitados** (a prova é o `bounds`); os (d′) foram conferidos nos
PNGs da sessão.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `CN-commit1.txt` · `CN-commit2.txt` | o `palco-faixa.test.tsx`: 6 de B reprovando por ausência e 2 de C passando (commit 1); 8/8, a suíte do nativo 197/197, core 202/202 e o `tsc` (commit 2) |
| `G1-commit2.txt` · `G2G3-commit2.txt` · `a20-commit2.txt` | G1 e G2/G3 contra `origin/main` com o bloco `gates` abaixo; o `gate:a20` (0) |
| `G-inv-B5.txt` · `G-inv-palco.txt` | **o G-inv do commit 2**: 34/34 contra `B5-baseline/` e **18/18** contra `B3-referencia-paisagem/` |
| `medidas-palco-B.txt` | o palco em B contra a folha, dump a dump (§2), e o controle: o dump de retrato do pre-check |
| `base-igual.txt` | "a base é a de C": a barra inferior e as bordas em B contra o pre-check, 16 pares (§2.2) |
| `a14-retrato.txt` · `zonas-B.txt` | o A14 em retrato (a linha `rotation=`, a posição) e os toques nas zonas de 106,7 (§3) |
| `prova-passa.txt` | picker, S0, S4 e S5 em retrato contra os dumps do pre-check, nó a nó (§4) |
| `G-N3-retrato.txt` | o G-N3 nos 34 pares: **(e)=0 · nome-acessível=0 · rolagem=0**, 4 dp = 0 (§5) |
| `G5G6-palco.txt` | G5 e G6 de 20 estados em quatro colunas (§6) |
| `inalcancaveis-A.txt` · `phone-logcat.txt` | o aceite mínimo de A no palco: a lista, e o logcat — nenhum `FATAL` (§7) |
| `dumps-pai/` | 58 dumps em paisagem: os 52 da base (AVD 27, Tab 25) e os estados que a base não tem (`picker-relendo`, `S3-placeholder`, `S3-a14-volta`) × 2 aparelhos |
| `dumps-ret/` | 36 dumps em retrato (faixa B): 17 estados × Tab e AVD, mais o S0 (login, erro) no AVD |
| `dumps-phone/` | o palco no `octavia_phone` em retrato (faixa A): letra (1ª) e PDF |
| `dumps-descartados/` | o S0-login em retrato por **abertura fria**, que não é o caminho da base de retrato (div. 437) |
| `estado/` | estado de cada aparelho lido e restaurado, o `md5` do cache do Tab antes e depois, o bundle |
| `roteiros/` | a saída de cada rodada, verbatim — inclusive as que caíram (§8) |
| `instrumentos/` | `n3pr5.py` (relendo, S0 frio, A14, zonas, placeholder), `passada4-n3p5.py`, `medidas-palco.py`, `base-igual.py`, `prova-passa.py`, `g5g6-palco.py`, `phone-palco.py` |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |

## O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3-PR5: a barra superior do palco lê a faixa (N3-D13): 88 em duas linhas em B; a base, o corpo e as zonas de 15 % são os de C.
g1a: apps/native/src/theme.ts
g1a: apps/native/src/screens/StageScreen.tsx
```

G2: 80 → 80 `testID`, nenhum novo, nenhum some. G3: 68 → 68 linhas `log(`. Nenhum gate mudou nesta
PR. **Fora do escopo do G1a, declarado**: o `vitest.config.mts` da raiz ganhou o alias do duplo
`apps/native/test/fake-react-native-pdf.tsx` (div. 434) — sem ele nenhum teste de tela monta o palco.

## 1. G-inv — o commit 2 não mudou uma tela em C (A-N3-2)

**34 de 34** idênticos em dp contra a `B5-baseline/` (AVD 18, Tab 16) e **18 de 18** contra a
`B3-referencia-paisagem/` (AVD 9, Tab 9 — **o palco, a superfície que esta PR mexeu**), com o estado
de dados da base reproduzido pela receita do `APARATO.md` (palco antes de S1; S1 do AVD com o app
aberto já sem rede e o S1e com o cache de 1 min; S0 por abertura fria). **Os 52 dumps de paisagem são
iguais aos da N3-PR4 byte a byte** (`cmp`, 52 de 52). Em C a barra superior é a mesma árvore de
antes, nó por nó: os nós da barra são os mesmos, na mesma ordem, e só a composição de B os empilha.

## 2. O palco em B contra a folha (`N3-B-S3`; G-N3, 4 dp; A-N3-3)

Tab S6 e AVD em retrato (711,1 dp), nos 10 estados do palco (S3a 1ª, S3b claro e escuro, S3c com
auto-scroll, S3d PDF de 12 p, S3e não baixado, título longo, última, placeholder e o A14): **o mesmo
valor em toda linha e em todo estado** (`medidas-palco-B.txt`), menos o corpo, que é a janela de
cada aparelho.

| medida | folha | Tab | AVD | Δ | |
|---|---:|---:|---:|---:|---|
| barra superior | 88 (`bar.top + 24`) | **88,0** | **88,0** | 0,0 | confere — de 24,0 a 112,0 |
| linhas da barra | 2 | **2** | **2** | — | posição + setlist na 1ª; título · artista · tipo na 2ª |
| título | 663 (*"com os 663 dp inteiros"*) | **663,1** | **663,1** | +0,1 | confere — x 24,0 → 687,1 (era 404,9, de 282,2) |
| corpo | 870 (canvas de 1054) | 881,8 | **869,8** | −0,2 (AVD) | confere — a folha conta o canvas do AVD; a regra é janela útil − 88 − 96, e dá 881,8 no Tab (1065,8) |
| zonas | 106,7 (15 % de 711) | **106,7** | **106,7** | 0,0 | confere, as duas |
| base (altura) | 96 | **96,0** | **96,0** | 0,0 | confere |
| base: esquerda · direita · vão | 304 · 224 · 135 | 312,0 · 229,8 · 121,3 | idem | +8,0 · +5,8 · −13,7 | **N3-E16** — a folha somou controles de 64; o app os desenha com 66 (a moldura de 1 dp, V1-PR3 div. 36), em C como em B |

**N3-E16**: *"A barra inferior é a de C: 4 × 64 + 3 × 16 = 304 à esquerda, 224 à direita, 135 de
vão"* → **312,0 · 229,8 · 121,3**. O controle do palco é `touch.stage + 2` = 66 × 66 desde a V1-PR3
(div. 36, *"caixa 66 × 66 (64 + a moldura de 1 de cada lado)"*): 4 × 66 + 3 × 16 = 312 e 3 × 66 + 2 × 16
= 230. O desenho não muda — a base **é** a de C, nó a nó (§2.2), e a folha só errou a soma.

### 2.1 A barra em B, na árvore

Linha 1: `n DE 8` (ou `AVULSA`), o nome da setlist (que cresce e elide), e — quando há — a página do
PDF, a nota da posição e o ponto de sem rede. Linha 2: o título, com ` · artista · tipo` dentro dele,
à esquerda, numa linha, com reticência (o título longo elide em `…em ret…`, como elidia em C). Em C,
posição, setlist e título lado a lado numa barra de 64, com o título centrado — a árvore de antes.
**Onde a folha não dizia**, declarado: a página, a nota e o ponto ficam na linha 1 (a folha só diz
*"posição + setlist"*); o título começa à esquerda (em C é centrado no espaço que sobra).

### 2.2 "Base = C" (`base-igual.txt`)

Nos 8 estados de palco que o pre-check tem em retrato (`B2-S3-*`, a `main` de antes do N3: a barra de
64 e a base de C espremida em 711), × Tab e AVD: **a barra inferior é a mesma, nó a nó** (36–38 nós:
os sete controles, os ícones e os traços, nos mesmos `bounds`; x0 dos sete = 24,0 · 106,2 · 188,0 ·
270,2 · 457,3 · 539,1 · 621,3), e as duas bordas têm a **mesma largura (106,7) e o mesmo fundo**
(981,8 no AVD, 993,8 no Tab). O que muda é o topo delas, 88,0 → 112,0: o corpo perde os 24 da barra
(D-1, *"a altura ENTRE as barras"*), e nada mais.

## 3. A14 em retrato e as zonas (`a14-retrato.txt`, `zonas-B.txt`)

**A14**: no palco da música 3 em paisagem, girar para retrato dá `rotation=portrait n=3/8` e o dump
com `3 DE 8` (barra 88 em duas linhas, título 663,1, zonas 106,7); voltar dá `rotation=landscape
n=3/8` e `3 DE 8` — nos dois aparelhos. A rotação muda a FORMA da barra (64 ↔ 88) e a altura das
bordas, e preserva a posição: é a errata do T1-R27/A14 no `PRD-TELA-1.md`.

**Zonas**: música 3, retrato. Toque a **104 dp** da borda direita → `4 DE 8` e `nav n=4/8 … t=71`
(Tab; `t=83` no AVD); a **112 dp** → nada. A 104 dp da esquerda → `3 DE 8` (`t=68`; `t=84`); a 112 dp
→ nada. A zona tem 106,7 e é só ela que navega.

## 4. As provas de "passa" (`prova-passa.txt`)

A folha diz que o picker, o S0, a S4 e a S5 **passam em B sem mudança**. A prova: o dump de retrato
desta PR tem **os mesmos `bounds`, nó a nó**, que o do pre-check (tirado em `aa91b5d`, antes de qualquer
tela do N3), no mesmo formato do `g-inv.sh` (sem texto, sem `enabled`, sem o "Tools"):

| estado | AVD | Tab |
|---|---|---|
| picker vazio · resultados | ✓ 43 · 173 nós | ✓ 44 · 174 nós |
| S4 vazio · resultados | ✓ 36 · 97 | ✓ 37 · 98 |
| S5 fim | ✓ 48 | ✓ 49 |
| S0 login · erro | ✓ 38 · 44 | — (div. 436) |

**12 de 12.** O `picker-relendo` não tem dump no pre-check (div. 436): foi capturado em retrato e em
paisagem e entra no G-N3 (§5). A 4 dp: o G-N3 compara o `FIM DA SETLIST` (c16, 550,2) e dá 0.

## 5. G-N3 (T3-R4): (e)=0 · nome-acessível=0 · rolagem=0

Nos **34 pares** (16 estados × Tab/AVD, mais o S0 no AVD). **4 dp = 0.** **(d′) = 108**, conferidos no
PNG, nenhum é defeito:

| texto | n | por quê |
|---|---:|---|
| o título do palco (` · artista · tipo`) | 18 | a caixa do título passa de 832 (o `flex: 1` da barra de C) para 663,1 (a linha 2 inteira); o texto cabe inteiro, e o título longo elide como elidia |
| o corpo (altura ×1,9–2) | 12 | a caixa VISÍVEL do corpo é a janela do `ScrollView`, mais alta em retrato; o corpo não quebra linha (N3-D15, conferido no PNG: as linhas cortam à direita) |
| `linha-motivo` do S3d | 2 | a dica do PDF ocupa a largura da janela (711,1 × 1137,8); a frase cabe |
| `ENSAIO DE RETRATO` (S2p) | 2 | o título de S2 na coluna única da N3-PR3 |
| títulos, artistas e sublinhas do picker e da S4 | 74 | a mesma geometria do pre-check (§4: `bounds` idênticos) — a folha: *"B: passa"* |

## 6. G5 e G6 em quatro colunas (A-N3-5, parte do palco e das provas)

`G5G6-palco.txt`: 20 estados × Tab/AVD × paisagem/retrato: **todo alvo ≥ 48 dp** e **todo alvo com
`testID`**; os mesmos ids nas quatro colunas. No palco: os sete controles 65,8–66,2 × 65,8 nas quatro;
`borda-voltar`/`borda-avancar` 170,7 × 479,1 (Tab) e × 467,1 (AVD) na paisagem, **106,7 × 881,8** e
**× 869,8** em retrato. Os únicos alvos abaixo de 48 são linhas cortadas pela borda da lista (div.
291): `resultado-…` da S4 e `picker-adicionar-5`/`-9` do picker, listados à parte. O S0 só tem as
colunas do AVD (div. 436); o A14 só tem a sua orientação.

## 7. O celular (faixa A, aceite mínimo — a errata do T3-R3)

`octavia_phone` em retrato, conta de audit logada pelo Marcel nesta sessão, faixa `A w=411.4`: o
palco abre (letra e PDF), **nenhum `FATAL`** (`phone-logcat.txt`, o buffer limpo uma vez, antes da
rodada). A barra superior usa o token de B (88 em duas linhas, título 363,4). O palco não tem controle
de escrita; a lista (`inalcancaveis-A.txt`) é a dos controles dele:

| grupo | alcançáveis (tocados com efeito) | não alcançáveis |
|---|---|---|
| bordas | `borda-avancar` · `borda-voltar` (61,7 × 690,3 — os 15 % de 411,4) | — |
| leitura | `auto-scroll` · `zoom-mais` · `zoom-menos` · `tema` | — |
| navegação | `indice` — **cortado**: 43,4 dp visíveis dos 65,8, abriu S2p | **`busca`, `sair`: sem nó** — a base de C passa de 411,4 |

Destino: **N5** — a moldura `N3-A-S3` (N3-D14) sobe `indice` · `busca` · `sair` para a barra superior
de 144 e deixa a base com os quatro de leitura (div. 443). Sair do palco em A, até lá, é o `BACK`.

## 8. As rodadas que caíram, e por quê (verbatim em `roteiros/`)

| rodada | o que aconteceu | o que foi feito |
|---|---|---|
| `roteiro-tab-ret.txt`, `roteiro-tab-pai-novos.txt` (`pickerRelendo`) | o arnês esperava `relendo`; o rótulo sai **capitalizado** (`Relendo…`, `styles.capital`) | o arnês espera `elendo`; refeito nos dois (`-2`), 2 de 2 (div. 439) |
| `roteiro-avd-ret-s0.txt` (S0 frio em retrato) | o S0-login por abertura fria mede os campos 0,4 dp mais baixos que o do pre-check de retrato, que foi alcançado **por logout** na sessão | o AVD subiu de novo (a sessão volta do snapshot) e o S0 saiu pelo caminho do pre-check: idêntico (`roteiro-avd-ret-s0-logout.txt`); o frio em `dumps-descartados/` (div. 437) |
| `roteiro-phone-ret-1.txt` | o arnês limpava o logcat a cada toque — a contagem de `FATAL` não cobria a rodada | refeito com o buffer limpo uma vez (`roteiro-phone-ret.txt`), a mesma lista (div. 440) |

## Aparato

- **Mock** `aceite.py servidor 8788` + arquivos (`http.server 8790`) sobre a fixture do pre-check;
  **Metro** na 8081 **sem `CI=1`**, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline;
  `adb reverse` dos três.
- **Bundle conferido** antes da primeira captura (`estado/bundle-1.txt`, 7.212.596 B): `localhost:8788` 1 ·
  `octavia.rocks` **0** · `barraEmpilhada` 6 · `linhaDaBarra` 7 · `tituloNaLinha` 2 · `nomeSetlistNaLinha` 2 ·
  `faixa=` 4. Nenhuma mudança de código do app depois do commit 2.
- **Dev client**: sem módulo nativo novo, sem rebuild. AVD `2026-09-24 14:00:01`, Tab
  `2026-09-23 19:11:34`, celular `2026-09-23 21:10:37`.
- **`.env`**: copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro; **apagado** no fim.
- **Escritas**: prod **zero**. Mock: o `Adicionar` do picker contra `resync-pendurado` (o `relendo`), a
  folha contra `escrita-500` (o G-inv), o `401` do S0 — o mock se relê da fixture a cada troca de modo.
  O placeholder: uma cópia da fixture com a música 9 da `Ensaio de retrato` apontando para um content
  que não existe (a forma do `content-ausente` do `aceite.py`) e `updated_at` novo, servida numa
  rodada só; a fixture de volta na seguinte.
- **P1 (o FAB do dev client), palco**: em B o FAB fica na **linha 1**, à direita (`[643,1,40,0][695,1,92,0]`),
  sobre o **ponto de sem rede** (`[679,1,47,6][687,1,55,6]`) e o fim da linha do título; em C o ponto
  (`[1105,8,51,6][1113,8,59,6]`) também fica sob ele. Nenhum controle do palco fica sob o FAB (div. 441).

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido | mudado, e por quê | no fim |
|---|---|---|---|
| **AVD `octavia_tab32`** (três subidas) | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, audit | **`-no-snapshot-save`**; avião desligado e wifi/data ligados (div. 418); rotação; `reverse`; **sessão derrubada pelo S0** (mock `401`) na 1ª e na 3ª subida; a 2ª e a 3ª subiram do snapshot com a de audit | settings iguais ao lido, `ping` → `Network is unreachable`, `reverse` vazio, desligado sem salvar snapshot |
| **`octavia_phone`** | `stay_on=1 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, sem sessão | `-no-snapshot-save`; rotação; `reverse`; **login de audit pelo Marcel**, derrubado no fim pelo `401` do mock | settings iguais ao lido; S0; desligado |
| **Tab S6** | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **bloqueado** (o Marcel destravou) | `stay_on` 0→7; rotação; `reverse`; **cache do app trocado pelo do mock** | settings iguais ao lido; `reverse` vazio. Cache **guardado antes**, os 4 arquivos um a um por `run-as cat`, e **regravado** com o app parado: `md5` dos 4 idêntico (`md5-antes`, `md5-depois`) — e idêntico ao do fim da N3-PR4; `partitura-1p.pdf` da fixture apagada de `files/`; as cópias do host apagadas. **No cache de demanda** (`cache/octavia-<uid>/files/`) está a `partitura-12p.pdf` da fixture desde **2026-09-24 21:11** — de antes desta sessão, fora da receita do `APARATO.md`, não tocada (div. 444) |
| **host** | 8081/8788/8790 livres | Metro, mock, arquivos | as três livres; `.env` apagado |

## Extras

Declarados aqui: o **duplo do `react-native-pdf`** e o alias no `vitest.config.mts` (div. 434); os
estados em **paisagem** que a base não tem (`picker-relendo`, `S3-placeholder`, `S3-a14-volta` — sem
eles o G-N3 e o G6 não teriam par); o **placeholder** por uma fixture derivada (div. 438); o S0 de
retrato **pelos dois caminhos** (div. 437); os toques a 112 dp, **fora** das zonas (a prova de que a
zona tem 106,7 e não mais).
