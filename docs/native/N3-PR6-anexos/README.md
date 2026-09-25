# N3-PR6-anexos — o aceite completo em B, a N3-E17, a N3-E18 e a poda

**Rastro.** A fonte é o [`DESIGN-N3/README.md`](../DESIGN-N3/README.md) §9 (as erratas N3-E17 e N3-E18 e as
divergências 445–456) e o [`N3-REQUISITOS.md`](../N3-REQUISITOS.md) §10. Árvore `../octavia-n3-pr6`, branch
`n3/pr6-aceite`, sobre `origin/main` = `0a71da8` (merge da #330).

**Nenhum texto de música de terceiro**: todo dump é do **mock** (`aceite.py servidor`) com a fixture do pre-check
(`N3-PRECHECK-anexos/instrumentos/fixture.py`, "hoje" = 2026-09-23). Conferido: dos **244** `text`/`content-desc`
distintos dos 234 dumps desta pasta, 228 estão nos anexos do pre-check e das N3-PR1…PR5, e os 16 restantes são
frases do app (`Adicionada`, `não entrou na setlist`, o "salvo, não relido" de S1 e do picker, o "há 1/2 min"),
a setlist `J3 FINAL` do J3, as posições da fixture reordenada e as marcas `já na setlist · 12×/13×` da setlist de
101. `grep` do uid do Tab, `eyJ`, e-mail real e `UX-AUDIT` sobre esta pasta: vazio; o arquivo do Marcel no cache
do Tab aparece como `<o arquivo do Marcel>.pdf`. **PNGs não commitados** (a prova é o `bounds`); os (d′) e os dois
recortes do defeito foram conferidos nos PNGs da sessão.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `CN-commit1.txt` · `CN-commit2.txt` | o `s5-faixa.test.tsx`: B reprovando (64 ≠ 88) e o CP de C passando (commit 1); 4/4, nativo 201/201, core 202/202, `tsc` (commit 2) |
| `G1-commit2.txt` · `G2G3-commit2.txt` · `a20-commit2.txt` | os gates do commit 2 com o bloco `gates` de então (duas exceções) |
| `CN-E18-antes.txt` | o gate da N3-E18: o bloco (k) do `picker.test.tsx` — 2 reprovam (`row` ≠ `column`), os estados base e o CP de C passam — e o **CN de dump** (`instrumentos/cn-picker-b.py`) reprovando nos dumps de `55bbd40` pelos dois sintomas |
| `CN-E18-depois.txt` · `gates-E18.txt` · `CN-E18-dump-depois.txt` | o conserto: CN 4/4, nativo 205/205, core 202/202, `tsc`; G1/G2G3 com o bloco `gates` final e a20; o CN de dump passando no build de `017570c` |
| `G-inv-commit2.txt` | **G-inv do commit 2**: 34/34 (B5) e 18/18 (palco); e o `cmp` contra a passada final |
| `G-inv-final.txt` | **a invariante C no fim de tudo**: 34/34 e 18/18 sobre a passada final, no build do conserto; e a 1ª tentativa do S0 frio, descartada |
| `G-N3-consolidado.txt` | **o G-N3 do bloco num relatório só**: 102 pares, (e)=0 · nome-acessível=28 · rolagem=18, 4 dp = 0, (d′) = 354 |
| `G-N3-controle-defeito.txt` | o mesmo G-N3 com os 4 dumps de ANTES do conserto: (e)=2 — o defeito que a N3-E18 fecha |
| `G5G6-consolidado.txt` | **G5 e G6 consolidados**: 55 estados × quatro colunas, 209 de 220 células |
| `medidas-x.txt` | a linha de aviso em toda superfície que a tem, as duas orientações, os dois aparelhos |
| `s5-barra.txt` | N3-E17 no aparelho: a barra do palco na última × a da S5, e o controle (a `main` da N3-PR5) |
| `j3-retrato.txt` | J3 ponta a ponta em retrato no Tab, contra os 16 gestos da paisagem (N2-PR7) |
| `inalcancaveis-A.txt` · `phone-logcat.txt` | **a lista final do celular**, em pé (A) e deitado (B pela largura), com `bounds`; o logcat da sessão (FATAL 0) |
| `limpeza-444.txt` | a `partitura-12p.pdf` da fixture sai do cache de demanda do Tab; o `md5` do resto idêntico |
| `dumps-pai/` | 52 dumps de paisagem da **passada final** (build de `017570c`): a base do G-inv (Tab 25, AVD 27) |
| `dumps-pai-extra/` | 38 dumps de paisagem dos estados que a base não tem: os transversais, o picker (relendo e os cinco estados), o A14 na volta |
| `dumps-ret/` | 105 dumps de retrato (faixa B): toda superfície, os transversais, o picker do build do conserto, o J3, o S0 do AVD |
| `dumps-ret-rolada/` | 14 dumps rolados de S2 (a prova do `--rolada`, N3-D29) |
| `dumps-defeito/` | os 4 dumps do picker com falha e limite em retrato **antes do conserto** (`55bbd40`) — a prova da div. 445 |
| `dumps-phone/` | 18 dumps do `octavia_phone`: uma por superfície, em pé e deitado, e o picker com falha em A |
| `dumps-descartados/` · `dumps-medida-e18/` | o S0 frio da 1ª tentativa (div. 452); os dois dumps de onde saiu o 138,7 do token (com o mínimo ainda em 80) |
| `estado/` | estado de cada aparelho lido e restaurado, o `md5` do cache do Tab antes e depois, os dois bundles |
| `roteiros/` | a saída de cada rodada, verbatim — inclusive as que caíram (§8) |
| `instrumentos/` | `n3pr6.py` (a matriz dos transversais, o S0), `cadeia.sh` · `cadeia-e18.sh` (as rodadas por aparelho), `j3.py`, `phone-a-n3p6.py`, `cn-picker-b.py`, `medidas-x.py`, `s5-barra.py`, `g5g6-todos.py`, as duas `passada4-*.py`, e `copias.diff` (o que mudou nas cópias dos arneses do pre-check e das PRs 3–5) |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |

## O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3-PR6: N3-E17 — a barra superior da S5 lê o token da barra do palco (64 em C, 88 em B).
# N3-PR6: N3-E18 — a linha do picker na fase falhou (falha e limite) empilha em B; token picker no theme.ts.
g1a: apps/native/src/screens/EndScreen.tsx
g1a: apps/native/src/screens/Picker.tsx
g1a: apps/native/src/theme.ts
```

G2: 80 → 80 `testID`, nenhum novo, nenhum some. G3: 68 → 68 linhas `log(`. **Poda**: nenhuma — a `main` não
tinha exceção sobrando (as listas locais do `g1.sh` e do `g2g3.sh` estão vazias, e a declaração vive no corpo da
PR desde o W4-b2); nenhum gate mudou nesta PR.

## 1. N3-E17 — a barra da S5 em B (`s5-barra.txt`)

| aparelho | orientação | palco na última | S5 | salto |
|---|---|---|---|---|
| Tab · AVD | retrato (B) | 24,0 → 112,0 = **88,0** | 24,0 → 112,0 = **88,0** | **0** |
| Tab · AVD | paisagem (C) | 64,0 | 64,0 | 0 |
| controle: a `main` da N3-PR5 | retrato | 88,0 | 64,0 | **−24** |

"Vazia", lido como: a barra tem a altura da do palco e **nenhum conteúdo novo** — `8 DE 8` e a setlist numa linha,
como em C. Consequência declarada (div. 447): a barra não salta, mas o `8 DE 8` fica em y **36,0** no palco (linha
1 de duas) e em **52,0** na S5 (centrado nos 88) — o texto desce 16 dp.

## 2. N3-E18 — o picker em B com falha ou limite (divs. 445, decisão do Marcel)

O aceite completo achou o defeito que a folha não desenhou (*"picker, B: passa"* só valia no estado base):

| estado da linha 1, retrato | título | o bloco de estado |
|---|---|---|
| falhou (500), **antes** (`dumps-defeito/`) | **ausente do dump** (largura 0) | `picker-estado-1` 227 → **711,1**, o `Tentar de novo` cortado na borda da janela |
| limite (429), **antes** | **43,1 dp** | 270 → 662 |
| falhou, **depois** (`dumps-ret/`) | **451,1 dp**, no 1º andar | 2º andar 96,9 → 662,2; o `Tentar de novo` 443,6 → 616,9 |
| limite, depois | 451,1 dp | 2º andar, sem botão (o limite não repete) |

A linha empilhada mede **138,7** com o botão (`dumps-medida-e18/`: 24,0 → 687,1 × 170,2 → 308,9) e **131,1** sem ele;
o token de B é 138,7, e a linha não cresce quando o `Tentar de novo` aparece depois da releitura. **Os estados base
não mudam**: picker vazio, resultados e relendo, nos dois aparelhos, com os mesmos `bounds` nó a nó da N3-PR5
(`CN-E18-dump-depois.txt`, (3)). **C não muda**: os cinco estados do picker em paisagem, antes e depois do conserto,
idênticos em `bounds` nos dois aparelhos, e o G-inv final 34/34 e 18/18. **Em A** (os tokens de B) a linha também
empilha: título 151,3 dp, `Tentar de novo` inteiro em `[188,6..362,3]`.

## 3. Os cinco estados transversais em toda superfície (`medidas-x.txt`; A-N3-7)

A matriz, lida no código (quem monta a `LinhaDeAviso`, com que frase) — div. 448:

| superfície | sem rede | salvo-não-relido | falhou | limite | acima de 100 |
|---|---|---|---|---|---|
| S1 | 66,2 | 66,2 | — (é da folha) | — (div. 413) | — |
| S2e | 66,2 | 66,2 | 66,2 (`Tentar de novo` depois da releitura) | 48,0 (`tente de novo em 30 s`) | 48,0 (N3-E14) |
| reordenar | 66,2 | — (o 200 fecha o modo) | 66,2 (idem) | 48,0 | — (o modo não abre acima de 100) |
| folha | — (a entrada fica inativa sem rede) | — (vira o aviso de S1) | cartão `form-falha` 87,6 | cartão `form-falha` 87,6 | — |
| picker | 67,1 | 67,1 | na **linha** (N3-E18) | na **linha** (N3-E18) | 48,9 |

Todos em retrato, **idênticos no Tab e no AVD**; nenhum motivo elidido; em paisagem (C) a linha tem **48,0** em todo
estado — a régua de C (T3-R7), e nenhum `bounds` de C mudou (G-inv). O picker mede +0,9 porque o invólucro do
rodapé tem o fio de 1 dp em cima (`avisoDoRodape`, div. 313 do N2): a linha em si é a mesma (div. 449). Os (d′)
destes estados no G-N3 são a linha que passa a duas linhas em B (altura ×1,9), conferida no PNG.

## 4. J3 em retrato (`j3-retrato.txt`)

| | paisagem (N2-PR7) | retrato (N3-PR6) |
|---|---|---|
| gestos | 16 | **16** |
| relógio de parede | 73,2 s | 70,0 s |
| lado do app (7 escritas) | 1287 ms | 764 ms |

A mesma contagem, por troca: a paisagem rola a lista para a 5ª música; em retrato as cinco cabem, mas o **teclado
encaixado** (topo 761,3 dp) cobre o `Concluir` (y 1034,2) e o músico fecha o teclado antes — a 1ª rodada tocou numa
tecla (`roteiros/j3-tab-ret-1.txt`). Div. 450.

## 5. G-inv, G-N3, G5/G6 consolidados

- **G-inv** (A-N3-2): 34/34 e 18/18 no commit 2 e **no fim de tudo**, sobre o build do conserto. Os 51 dumps de
  paisagem que não são o S0-login são byte a byte iguais entre as duas passadas.
- **G-N3** (A-N3-4): um relatório para o bloco inteiro — os 102 pares de retrato desta PR contra a paisagem (a
  `B5-baseline/`, a `B3-referencia-paisagem/`, esta PR, e as N3-PR3…PR5 para os estados que só elas têm: div. 455).
  **(e)=0 · nome-acessível=28 · rolagem=18 · 4 dp = 0**. (d′) = 354, todos conferidos no PNG, nenhum defeito:
  título/artista/sublinha em linhas mais estreitas (a coluna única de S2, a folha de 663, o picker e a S4 que
  "passam"), a linha de aviso em duas linhas, o título e o corpo do palco, a linha 7 do reordenar cortada pela borda
  em paisagem. O controle com os dumps de antes do conserto dá (e)=2.
- **G5/G6** (A-N3-5): **55 estados × quatro colunas, 209 de 220 células**, todo alvo ≥ 48 dp e com `testID`, os
  mesmos ids nas quatro. As 11 vazias são por construção: o S0 não roda no Tab (div. 436), o J3 só no Tab em
  retrato, o A14 numa orientação cada. Abaixo de 48, só linhas cortadas pela borda da lista (div. 291).
  **Contra as molduras do congelado** (T3-R5: *"todo estado do congelado alcançável nas duas orientações"*): as
  **18 do N2** têm dump nas quatro colunas; das **20 do V1**, 13 têm e **7 não** — `S1a` e `S1d` (sem cache
  nenhum), `S2-invalidos` e `S3-nobody` (itens sem corpo), `S3-avulsa`, `S4b` (sem resultados) e `S5-n-grande` (60
  músicas): nenhum roteiro do bloco os alcança. Aberto no A-N3-5 (`N3-REQUISITOS.md` §10).

## 6. O celular (`inalcancaveis-A.txt`; A-N3-3)

**Em pé (faixa A, 411,4)** — a lista final, herança do N5 (T5-R):

| superfície | inalcançável | cortado, tocado com efeito |
|---|---|---|
| S1 | — | — |
| S2e | **`setlist-apagar`** (sem nó) | `setlist-editar` (75,0 de 193,8) |
| diálogo | **não abre** (a entrada é o `setlist-apagar`) | — |
| picker · S4 · reordenar · S5 | — | — |
| folha | — | `form-cancelar` (29,0 de 122,2) · `form-salvar` (31,2 de 127,1) |
| palco | **`busca`, `sair`** (sem nó) | `indice` (43,4 de 65,8) |

**Deitado (faixa B pela largura, 914,3 × 371,4 — a primeira prova do bloco)**: **nada inalcançável**; o diálogo abre,
e a folha passa do fundo da janela (os dois botões com 11,4 dp visíveis, tocados com efeito) — a regra de altura do
N5 (div. 454). **FATAL: 0** na sessão inteira (`phone-logcat.txt`, 17:58:41 → 19:43:12, o buffer limpo uma vez),
31 linhas `faixa=A w=411.4` e 31 `faixa=B w=914.3`.

## 7. A limpeza da 444 (`limpeza-444.txt`)

A `partitura-12p.pdf` da fixture (4198 B, `ad81bb81…`, de 2026-09-24 21:11) saiu do cache de demanda do Tab no fim,
depois da passada final, com o app parado; o cache de demanda ficou vazio, e o `md5` dos quatro arquivos do cache do
Marcel é o mesmo do início (e do fim da N3-PR5).

## 8. As rodadas que caíram, e por quê (verbatim em `roteiros/`; div. 451)

| rodada | o que aconteceu | o que foi feito |
|---|---|---|
| `x-avd-pai.txt` (`s1Salvo`) | o toque em `Nova setlist` veio antes de a lista assentar depois do avião | espera por `sincronizado agora`; refeito (`x-avd-pai-2.txt`) |
| `x-avd-*` (`fSemRede`) | a folha não tem estado sem rede: sem rede, a entrada fica inativa | fora da matriz (div. 448) |
| `ret-avd-roteiro.txt` (`S1f`) | a lista vazia não chegou no prazo | refeito (`ret-avd-roteiro-2.txt`) |
| `ret-*-n3pr5.txt` (`placeholder`) | a cópia do `n3pr5.py` derivava a árvore do caminho do instrumento; o mock nem subiu | `R.ARVORE` (`copias.diff`); refeito nos dois |
| `s0-avd-pai.txt` | o `401` durou 12 s fixos e o app leu depois | o `401` fica até o S0 aparecer; refeito (`-2`) |
| `e18-avd-pai-x.txt` (`pCem`) | a lista não assentou | refeito (`-2`) |
| `j3-tab-ret-1.txt` | o teclado encaixado cobre o `Concluir` | o gesto de fechar o teclado, contado (div. 450) |
| `phone-ret.txt` · `phone-pai.txt` | `remover-1` sem a lista; a S5 por `song-8` (abaixo da dobra); a alça 5 abaixo da dobra deitado; a prova de `sair` esperava S2 — o destino é **S1** (`navigation.tsx`); a docstring do `phone-palco.py` da N3-PR5 dizia o mesmo, mas lá `sair` nunca foi tocado | caminhos consertados; refeitos (`-2`, `-3`) |
| `final2-avd-pai-s0.txt` | o S0 frio saiu com os campos 0,5 dp mais altos (a div. 404) | numa subida limpa, idêntico (div. 452) |

## Aparato

- **Um mock por aparelho** (div. 446): `aceite.py servidor` na 8788 (AVD), **8789 (Tab)** e **8792 (celular)**, cada
  um com a sua cópia da fixture (`$SCR/<aparelho>/mock/`); no aparelho a porta continua 8788 (`adb reverse tcp:8788
  tcp:8789`), e o bundle não muda. Sem isso a troca de modo de um aparelho derrubava a rodada do outro; com isso os
  três rodaram em paralelo. Arquivos (8790) e Metro (8081) compartilhados.
- **Metro** na 8081 **sem `CI=1`**, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline. **Bundle
  conferido** antes de cada fase (`estado/bundle-1.txt`, `bundle-2.txt`): `localhost:8788` 1 · `octavia.rocks` **0**
  · `N3-E17` 3 · depois do conserto `N3-E18` 3 · `linhaFalha: 138.7` 1.
- **Dev client**: sem módulo nativo novo, sem rebuild. AVD `2026-09-24 14:00:01`, Tab `2026-09-23 19:11:34`,
  celular `2026-09-23 21:10:37`.
- **`.env`**: copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro; **apagado** no fim.
- **Escritas**: prod **zero**. Mock: criar, adicionar, remover, reordenar e apagar contra os modos da matriz; o J3
  contra `escrita`; o `401` dos S0. O mock se relê da fixture a cada troca de modo.
- **O snapshot do AVD** (div. 453): o `ram.bin` segue de 2026-09-24 14:00; só o `snapshot.pb` (metadado) muda a cada
  subida com `-no-snapshot-save`.

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido | mudado, e por quê | no fim |
|---|---|---|---|
| **AVD `octavia_tab32`** (cinco subidas) | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, audit | **`-no-snapshot-save`**; avião desligado e wifi/data ligados (div. 418); rotação; `reverse`; sessão derrubada pelos S0 (mock `401`) — por isso as subidas | `reverse` vazio; desligado sem salvar; o estado da sessão some no boot |
| **`octavia_phone`** | `stay_on=1 accel=0 user_rot=0 airplane=0 wifi=1 data=1`, sem sessão (o `accel=0` difere do lido na N3-PR5, 1) | `-no-snapshot-save`; rotação; `reverse` (8788 → 8792); **login de audit pelo Marcel**, derrubado no fim pelo `401` do mock | settings iguais ao lido; S0; desligado |
| **Tab S6** | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **bloqueado** (o Marcel destravou) | `stay_on` 0→7; rotação; `reverse` (8788 → 8789); **cache do app trocado pelo do mock** | settings iguais ao lido; `reverse` vazio. Cache **guardado antes** arquivo a arquivo e **regravado** com o app parado: `md5` dos quatro idêntico; `partitura-1p.pdf` da fixture apagada de `files/`; **a `partitura-12p.pdf` do cache de demanda apagada (a 444)**; as cópias do host apagadas |
| **host** | 8081/8788/8789/8790/8792 livres | Metro, três mocks, arquivos | as cinco livres; `.env` apagado |

## Extras (declarados antes de commitar)

Os dois commits da N3-E18 (o gate e o conserto) entre o 2 e o 3 da lista fechada; a passada final do G-inv no build
do conserto (além da do commit 2); o picker com falha no celular; a lista do celular **deitado**, que o A-N3-3 pedia
e nenhuma PR do bloco tinha medido.
