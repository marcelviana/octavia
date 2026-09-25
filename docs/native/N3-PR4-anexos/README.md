# N3-PR4-anexos — reordenar, folha e diálogo na faixa B

**Rastro.** A fonte é o [`DESIGN-N3/README.md`](../DESIGN-N3/README.md) §9 (a errata N3-E15 e as
divergências 425–431) e o [`N3-REQUISITOS.md`](../N3-REQUISITOS.md) §8. Árvore `../octavia-n3-pr4`,
branch `n3/pr4-reordenar-folha`, sobre `origin/main` = `c1d845f` (merge da #328).

**Nenhum texto de música de terceiro**: todo dump é do **mock** (`aceite.py servidor`, 8788) com a
fixture do pre-check (`N3-PRECHECK-anexos/instrumentos/fixture.py`, "hoje" = 2026-09-23). Conferido:
dos **145** `text` distintos dos 102 dumps desta pasta, 132 estão nos dumps do pre-check e das
N3-PR1…PR3, e os 13 restantes são frases do app (`Salvando a ordem no servidor…`, `Criando no
servidor…`, `Apagando no servidor…`, `Sair sem salvar`, `Limpar`, `movida de 5`, `de 5 para 2`,
`soltar aqui · posição 2`, o apoio do arrasto e as duas frases de falha do reordenar), o nome da
setlist da fixture (`Ensaio de retrato`) e a data que o seletor do sistema devolveu (`25 / 09 / 2026`).
`grep` de `eyJ`, e-mail, `UX-AUDIT` e o uid do Tab sobre esta pasta: vazio. **PNGs não commitados**
(a prova é o `bounds`); os (d′) e o teclado foram conferidos nos PNGs da sessão.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `CN-commit1.txt` · `CN-commit2.txt` | o `reordenar-folha-faixa.test.tsx`: 6 de B reprovando e 5 passando (commit 1; os que passam estão declarados no teste), e o CP da N2 em C; 75/75 com os testes de faixa e da N2, a suíte 189/189, core 202/202 e o `tsc` (commit 2) |
| `G1-commit2.txt` · `G2G3-commit2.txt` · `a20-commit2.txt` | G1 e G2/G3 contra `origin/main` com o bloco `gates` abaixo; o `gate:a20` (0) |
| `G-inv-B5.txt` · `G-inv-palco.txt` | **o G-inv do commit 2**: 34/34 contra `B5-baseline/` e 18/18 contra `B3-referencia-paisagem/` |
| `G-N3-retrato.txt` | o G-N3 nos 28 pares (14 estados × Tab/AVD): **(e)=0 · nome-acessível=0 · rolagem=0**, 4 dp = 0 |
| `medidas-r-f-B.txt` | as medidas das três superfícies em B contra a folha, dump a dump (§2) |
| `teclado.txt` | o `form-salvar` contra o topo do teclado, nos dois aparelhos (§2.3) |
| `G5G6-r-f.txt` | G5 e G6 dos 14 estados em quatro colunas (§4) |
| `inalcancaveis-A.txt` · `phone-logcat.txt` | o aceite mínimo de A: a lista dos controles de escrita por alcance, a div. 417 medida de novo, e o logcat — nenhum `FATAL` (§3) |
| `dumps-pai/` | 70 dumps em paisagem: os 52 da base (AVD 27, Tab 25) e os 9 estados que a base não tem × 2 aparelhos |
| `dumps-ret/` | 28 dumps em retrato (faixa B): 14 estados × Tab e AVD |
| `dumps-phone/` | o reordenar (aberto, arrastado) e a folha (criar, com data) no `octavia_phone` em retrato (faixa A) |
| `estado/` | estado de cada aparelho lido e restaurado, o `md5` do cache do Tab antes e depois, o bundle |
| `roteiros/` | a saída de cada rodada, verbatim — inclusive a que caiu (§5) |
| `instrumentos/` | `n3pr4.py` (os estados e o S0 frio), `passada4-n3p4.py`, `medidas-r-f.py`, `g5g6-r-f.py`, `phone-a-n3p4.py` |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |

## O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3-PR4: reordenar e folha leem a faixa (N3-D28): barra de 144 e o artista cedendo no reordenar, folha de 663 a 96 em B.
g1a: apps/native/src/theme.ts
g1a: apps/native/src/screens/ModoDeReordenar.tsx
g1a: apps/native/src/screens/FolhaDeCriar.tsx
```

G2: 80 → 80 `testID`, nenhum novo, nenhum some. G3: 68 → 68 linhas `log(`. Nenhum gate mudou nesta
PR: os instrumentos novos são de anexo.

## 1. G-inv — o commit 2 não mudou uma tela em C (A-N3-2)

**34 de 34** idênticos em dp contra a `B5-baseline/` (AVD 18, Tab 16) e **18 de 18** contra a
`B3-referencia-paisagem/` (AVD 9, Tab 9), com o estado de dados da base reproduzido pela receita do
`APARATO.md`. **Os 52 dumps de paisagem são iguais aos da N3-PR3 byte a byte** (`cmp`, 52 de 52) —
entre eles o `reordenar-aberto`, as três folhas e o diálogo, as superfícies que esta PR mexeu.

## 2. B contra a folha (G-N3, 4 dp; A-N3-3)

Tab S6 e AVD em retrato (711,1 dp) deram **o mesmo valor em toda linha** (`medidas-r-f-B.txt`). Folha =
o README do DESIGN-N3 com as erratas da §9 (E5: o motivo 237,8) e o `medidas.json`.

### 2.1 Reordenar (`N3-B-reordenar`)

| medida | folha | Tab = AVD | Δ | |
|---|---:|---:|---:|---|
| barra | 144 (20 + 31 + 6 + 19 + 14 + 48 + 6) | **144,0** | 0,0 | confere — o título tem a primeira linha inteira (a caixa de 663,1; o texto, 605,8 pela N3-E9) |
| `Cancelar` | 96 | 94,7 | −1,3 | confere |
| motivo `nada mudou desde que você abriu` | 237,8 (E5) | 237,8 | 0,0 | confere |
| `Salvar a ordem` | 191 | 191,6 | +0,6 | confere |
| folga da linha 2 | ≈ 138 | 139,1 = 663,1 − 94,7 − 237,8 − 191,6 | +1,1 | confere |
| linha | 663 × 72 | 663,1 × 72,0 | 0,1 | confere; toda alça no mesmo x (24,9) |
| alça | 48 × 72 | 48,0 × 72,0 | 0,0 | confere |
| artista (a linha 6, a de título comprido) | mín. 60 | **60,0** | 0,0 | confere — o artista cede primeiro, o título fica com 433,3 |

Os estados da N2, na mesma barra de 144 (os três rótulos cabem nas posições desenhadas): **arrastando**
(`soltar aqui · posição 2`, `de 5 para 2` na flutuante); **salvando** (`Salvando a ordem no servidor…`
no lugar do apoio, `Cancelar` fora, `Salvar a ordem` 191,1 inativo); **falhou** (`Sair sem salvar` 135,1
à esquerda, `Tentar de novo` 188,9 à direita, `movida de 5` na linha 2, a linha de aviso de duas linhas
abaixo da barra); **400 de permutação** (N2-D37: 7 linhas, sem `movida de`, o aviso com "a ordem foi
recarregada", sem `Tentar de novo`).

### 2.2 Folha (`N3-B-F-validacao`) e diálogo

| medida | folha | Tab = AVD | Δ | |
|---|---:|---:|---:|---|
| cartão (largura) | 663 | 663,1 | +0,1 | confere, nos sete estados |
| cartão (topo) | 96 | 96,0 | 0,0 | confere |
| cartão (altura) na validação | ≈ 486 "com as duas validações abertas" | **424,4** | −61,6 | **N3-E15** |
| fundo na validação | ≈ 582 | **520,4** | −61,6 | **N3-E15** |
| campo | 599 | 597,3 | −1,7 | confere (as bordas de 1 dp) |
| `Cancelar` · motivo · `Criar` | 121 · 197 · 126 = 444 | 122,2 · 197,8 · 127,1 = 447,1 | +3,1 | confere — numa linha, `Cancelar` à esquerda, motivo + `Criar` à direita, 597,3 de vão |
| diálogo | 620 (passa) | 620,0 × 300,0 | 0,0 | confere; `Manter a setlist` 174,2 · `Apagar` 143,1 lado a lado |

Os outros estados da folha: **salvando** (394,7 de altura, `Criando no servidor…`, `Cancelar` fora);
**falhou** (506,2, fundo em 602,2: banner `Não foi possível criar` + a causa, `Fechar` 104,9, `Tentar de
novo` 206,2 — capturado DEPOIS da releitura, com o `form-tentar` ativo); **editar-igual** (`Salvar`
137,3 inativo, "nada mudou" 237,8 ao lado); **editar com data** (`form-data` 476,0 + `form-data-limpar`
109,3 × 48,0 na mesma linha — *"entre o valor e o calendário"*); **depois do `Limpar`** (o dump é
igual ao editar-igual byte a byte: a data voltou a vazia e o "nada mudou" volta). Diálogo **apagando**:
`Apagando no servidor…`, os dois botões inativos.

**N3-E15**: a folha dá à folha de validação em B *"663 × ≈ 486 com as duas validações abertas, topo em
96 → fundo em ≈ 582"*. A folha de criar só abre **uma** validação de cada vez que a UI alcança: o nome
vazio (o erro no campo e o motivo ao lado de `Criar`); a data impossível não sai do seletor do sistema
(div. 244 do N2). O estado que existe mede 424,4 × fundo 520,4. Só dá folga: o teclado começa em 752,4
(AVD) e 761,3 (Tab). Com o banner de falha, a folha mais alta desta PR, o fundo fica em 602,2.

### 2.3 A folha acima do teclado (`teclado.txt`)

`folha-criar` e `folha-validacao` capturadas **com o teclado de pé** (`mInputShown=true` antes e depois do
dump; o arnês não o esconde nessas duas). O topo do teclado é a região tocável da janela do IME
(`touchable region`, `dumpsys window windows`):

| aparelho | topo do teclado | `form-salvar` (criar) | folga |
|---|---|---|---:|
| AVD | 1693 px = **752,4 dp** | px `[1186,966][1472,1097]` = dp `[527.1,429.3][654.2,487.6]` | 264,8 |
| Tab | 1713 px = **761,3 dp** | px `[1186,966][1472,1097]` = dp `[527.1,429.3][654.2,487.6]` | 273,7 |

No `folha-validacao` (editar, nome apagado) o `form-salvar` (`Salvar`, mais largo que `Criar`) fica em
px `[1163,966][1472,1097]` = dp `[516.9,429.3][654.2,487.6]` nos dois aparelhos: a mesma folga. Nenhum
campo nem botão fica sob o teclado.

### 2.4 G-N3 (T3-R4): (e)=0 · nome-acessível=0 · rolagem=0

Nos 28 pares. **4 dp = 0**: os nós que casam com o `medidas.json` (c6 `Salvar a ordem`, c7 `Cancelar`,
c8 `Criar`, c9 o motivo do nome, c10 `Manter a setlist`, c11 `Apagar`, e3 o motivo "nada mudou") ficam
dentro de 4 dp. **Rolagem = 0**: em B a coluna do reordenar (8 × 80 + 24) cabe inteira sob a barra de
144, e nenhuma folha rola — nenhum dump rolado foi preciso. **(d′) = 78**, conferidos no PNG, nenhum é
defeito:

| texto | n | por quê |
|---|---:|---|
| `Nome`, `Data do show · opcional`, `dd / mm / aaaa` | 40 | a folha de 663 (e os campos de 597,3) no lugar da de 720 |
| o título e o artista da linha 6 do reordenar | 20 | *"o artista cede primeiro, mínimo 60"*: 278,7 → 60,0 e 641,8 → 433,3, os dois inteiros até a reticência, como na paisagem |
| `REORDENAR · ENSAIO DE RETRATO` e o apoio do arrasto | 6 | a caixa de 663,1 é menor que a de 717,8/874,7 da barra de uma linha; os textos cabem inteiros |
| `7` e `Sétima do ensaio` (altura ×2,1) | 6 | na PAISAGEM a linha 7 está cortada pela borda da lista; em B ela está inteira |
| `aviso-motivo` (altura ×1,9) · a causa no banner da folha | 4 | a linha de aviso em duas linhas (N3-D19); a causa numa caixa de 563,6 em vez de 620, inteira |
| `25 / 09 / 2026` | 2 | o campo da data divide a linha com o `Limpar` |

## 3. O celular (faixa A, aceite mínimo — a errata do T3-R3)

`octavia_phone` em retrato, conta de audit logada pelo Marcel nesta sessão, faixa `A w=411.4`: o
reordenar abriu, arrastou e salvou (`write op=reorder … status=200`); a folha abriu, fechou, recebeu
nome e data, limpou a data e criou (`write op=create … status=201`) — tudo no mock. **Nenhum `FATAL`**
(`phone-logcat.txt`). A lista está em `inalcancaveis-A.txt`; o resumo:

| superfície | inalcançáveis | cortados, mas tocados com efeito |
|---|---|---|
| reordenar | nenhum | — |
| folha | nenhum | `form-cancelar` 29,0 de 122,2 · `form-salvar` 31,2 de 127,1 · `form-data-limpar` 16,4 de 109,3 · os campos |
| diálogo | **`apagar-manter`, `apagar-confirmar`** — o diálogo não abre, porque a entrada (`setlist-apagar`, S2) é inalcançável em A desde a N3-PR3 | — |

**A div. 417, de novo**: no pre-check (folha de 720) o `form-cancelar` não tinha nó e o `form-salvar`
mostrava 4,6 dp; com a folha de 663 (o token de B, que A usa até o N5) os dois aparecem cortados pelas
duas bordas e **foram tocados com efeito**. A folha de 663 centrada em 411,4 passa 125,9 dp de cada lado.
Não era o esperado pelo prompt ("a 417 como estava") — div. 425. O destino continua o **N5**
(`N3-A-F-*`: 379 × conteúdo, topo 16).

**No reordenar de A**, fora da lista (não é controle de escrita): o motivo `nada mudou…` fica espremido
em 4,2 × 48,0 dp — o `flexShrink` que em B deixa o motivo quebrar linha em vez de empurrar `Salvar a
ordem` para fora. Em A ele mantém o botão alcançável (192,4), mas o texto não se lê. Div. 426, destino N5
(a moldura `N3-A-reordenar` põe o motivo numa terceira linha).

## 4. G5 e G6 em quatro colunas (A-N3-5, parte do reordenar, da folha e do diálogo)

`G5G6-r-f.txt`: 14 estados × Tab/AVD × paisagem/retrato (os 5 da base, com `folha-criar` e
`folha-validacao` sem teclado na paisagem): **todo alvo ≥ 48 dp** e **todo alvo com `testID`**; os
mesmos ids nas quatro colunas. A alça (`alca-<n>`) entra como alvo mesmo sem `clickable` (div. 291). Os
únicos alvos abaixo de 48 são a `alca-7` na paisagem, cortada pela borda da lista, listada à parte.

O `g5g6-r-f.py` é o da N3-PR3 com duas mudanças: acha os estados pelo nome das três superfícies, e
reconhece a lista pela classe `ScrollView` — durante o arrasto o reordenar desliga a rolagem do dedo
(`scrollEnabled={false}`), o dump perde o `scrollable="true"`, e a `alca-7` cortada reprovava como alvo
pequeno na 1ª rodada do instrumento (div. 429).

## 5. As rodadas que caíram, e por quê (verbatim em `roteiros/`)

| rodada | o que aconteceu | o que foi feito |
|---|---|---|
| `roteiro-avd-pai-novos.txt` | os quatro estados do reordenar em paisagem esperavam `alca-8`, que na paisagem fica abaixo da dobra | o arnês espera `alca-5` (`roteiro-avd-pai-novos-2.txt`, 4 de 4) |
| as duas capturas com teclado do AVD (1ª rodada, `roteiro-avd-ret.txt`) | o `ime()` do arnês lia a moldura (`mFrame`) da janela do IME, que é a tela inteira — o topo do teclado não saía | o `ime()` lê a região tocável; refeitas (`roteiro-avd-ret-teclado.txt`), **com os mesmos XML byte a byte** (sha `63acee779816`, `8830951610f1`); as da 1ª rodada não entraram (div. 428) |
| Tab: o G-inv esperou o destravamento | o Tab lido estava bloqueado; o Marcel destravou, a tela apagou antes de o `stay_on` 7 entrar, e ele destravou de novo | — |

## Aparato

- **Mock** `aceite.py servidor 8788` + arquivos (`http.server 8790`) sobre a fixture do pre-check;
  **Metro** na 8081 **sem `CI=1`**, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline;
  `adb reverse` dos três.
- **Bundle conferido** antes da primeira captura (`estado/bundle-1.txt`, 7.210.057 B): `localhost:8788` 1 ·
  `octavia.rocks` **0** · `artistaCede` 3 · `barraEmpilhada` 4 · `linhaDeAcoes` 2 · `motivoQuebra` 2 ·
  `alturaMin` 3 · `rotulosCurtos` 6 · `useLinhaDaFaixa` 6 · `faixa=` 4. Nenhuma mudança de código do app
  depois do commit 2.
- **Dev client**: sem módulo nativo novo, sem rebuild. AVD `2026-09-24 14:00:01`, Tab
  `2026-09-23 19:11:34`, celular `2026-09-23 21:10:37`.
- **`.env`**: copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro; **apagado** no fim.
- **Escritas**: prod **zero**. Mock: reordenar e criar contra `escrita-pendurada` e `escrita-500`
  (nada grava), o 400 de permutação (um `DELETE` de "outro aparelho" direto no mock, depois o `PUT`),
  apagar contra `escrita-pendurada`, e no celular um `reorder` e um `create` no modo `normal` — o mock
  se relê da fixture a cada troca de modo.
- **O arrasto**: o `arrastando` foi capturado com `input motionevent` DOWN/MOVE — o dedo no vidro
  durante o dump — e só depois o UP; o arrasto que se salva é `input swipe` pela alça 5 até a 2, 1500 ms
  (div. 431).
- **P1 (o FAB do dev client em retrato), reordenar e folha**: em B o FAB fica logo depois do fim do
  título do reordenar (a caixa do título é a linha inteira, e o texto de 605,8 termina antes dele), e na
  folha fica sobre a barra de S1, fora do cartão; nenhum controle das duas superfícies fica sob ele.

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido | mudado, e por quê | no fim |
|---|---|---|---|
| **AVD `octavia_tab32`** (duas subidas) | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, audit | **`-no-snapshot-save`**; avião desligado e wifi/data ligados (div. 418); rotação; `reverse`; **sessão derrubada pelo S0** (mock `401`) na 1ª subida — a 2ª subiu do snapshot com a de audit | settings iguais ao lido, `ping` → `Network is unreachable`, `reverse` vazio, desligado sem salvar snapshot |
| **`octavia_phone`** | `stay_on=1 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, sem sessão (a N3-PR3 leu `accel=0`; este é o lido de hoje) | `-no-snapshot-save`; rotação; `reverse`; **login de audit pelo Marcel**, derrubado no fim pelo `401` do mock | settings iguais ao lido; S0; desligado |
| **Tab S6** | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **bloqueado** (o Marcel destravou, duas vezes) | `stay_on` 0→7; rotação; `reverse`; **cache do app trocado pelo do mock** | settings iguais ao lido; `reverse` vazio. Cache **guardado antes**, os 4 arquivos um a um por `run-as cat`, e **regravado** com o app parado: `md5` dos 4 idêntico (`md5-antes`, `md5-depois`) — e idêntico ao do fim da N3-PR3; `partitura-1p.pdf` da fixture apagada; as cópias do host apagadas |
| **host** | 8081/8788/8790 livres | Metro, mock, arquivos | as três livres; `.env` apagado |

## Extras

Declarados aqui: os 9 estados em **paisagem** que a base não tem (sem eles o G-N3 e o G6 não teriam
par); as capturas com **teclado de pé** e o topo do teclado pelo `dumpsys`; o `form-data-limpar` pelo
seletor do sistema (a data é a de hoje do aparelho, não da fixture).
