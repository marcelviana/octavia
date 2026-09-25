# N3-PR3-anexos — S2 com e sem edição na faixa B

**Rastro.** A fonte é o [`DESIGN-N3/README.md`](../DESIGN-N3/README.md) §9 (N3-D29, as erratas
N3-E13 e N3-E14, as divergências 418–424) e o [`N3-REQUISITOS.md`](../N3-REQUISITOS.md) (a errata do
T3-R3 e a parte de S2 dos A-N3-2…7). Árvore `../octavia-n3-pr3`, branch `n3/pr3-s2`, sobre
`origin/main` = `58d2296` (merge da #327).

**Nenhum texto de música de terceiro**: todo dump é do **mock** (`aceite.py servidor`, 8788) com a
fixture do pre-check (`N3-PRECHECK-anexos/instrumentos/fixture.py`, "hoje" = 2026-09-23). Conferido:
dos **150** `text` distintos dos 96 dumps desta pasta (com os 2 descartados), 133 estão nos dumps do pre-check e da N3-PR2, e
os 17 restantes são os números 9–18 e `101 músicas` (a setlist de 101 linhas, feita da mesma fixture) e
frases do app (`removendo…`, o motivo do teto, do limite, da falha e do salvo-não-relido). `grep` de
`eyJ`, e-mail, `UX-AUDIT` e o uid do Tab sobre esta pasta: vazio. **PNGs não commitados** (a prova é o
`bounds`); os (d′) foram conferidos nos PNGs da sessão.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `CN-commit1.txt` · `CN-commit2.txt` | o `s2-faixa.test.tsx`: 8 de B reprovando por ausência e os 2 de C passando (commit 1); 67/67 com o `s2-edicao`, o `reordenar` e o `picker` da N2 sem mudança (commit 2) |
| `G1-commit2.txt` · `G2G3-commit2.txt` | G1 e G2/G3 contra `origin/main` com o bloco `gates` abaixo |
| `G-inv-B5.txt` · `G-inv-palco.txt` | **o G-inv do commit 2**: 34/34 contra `B5-baseline/` e 18/18 contra `B3-referencia-paisagem/` |
| `G-N3-retrato.txt` | o G-N3 nos 16 pares de S2 em retrato, com `--rolada` (N3-D29): **(e)=0 · nome-acessível=28 · rolagem=18** |
| `CN-g-n3.txt` · `CN-n3pr1-apos.txt` | os controles da mudança do `g-n3.mjs` (`cn-n3pr3.sh`) e o CN da N3-PR1 rodado de novo depois dela |
| `medidas-s2-B.txt` | as medidas de S2 em B contra a folha, dump a dump (§2) |
| `G5G6-S2.txt` | G5 e G6 dos oito estados de S2 em quatro colunas (§4) |
| `inalcancaveis-A.txt` · `phone-logcat.txt` | o aceite mínimo de A (errata do T3-R3): a lista dos controles de escrita de S2 por alcance, e o logcat — nenhum `FATAL` (§3) |
| `dumps-pai/` | 62 dumps em paisagem: os 52 da base (AVD 27, Tab 25) e os 10 estados de S2 que a base não tem (salvo, falhou, limite, acima de 100, removendo × 2 aparelhos) |
| `dumps-ret/` | 30 dumps em retrato (faixa B): 8 estados de S2 × Tab e AVD, e os **14 rolados** (`…-rolada-…`) que o G-N3 lê como prova de rolagem |
| `dumps-phone/` | S2e e S2p no `octavia_phone` em retrato (faixa A) |
| `dumps-descartados/` | os dois `removendo-rolada` da 1ª rodada, que saíram **depois** do prazo de 20 s — outro estado (div. 423) |
| `estado/` | estado de cada aparelho lido e restaurado (duas sessões), o `md5` do cache do Tab antes e depois, os dois bundles |
| `roteiros/` | a saída de cada rodada, verbatim — inclusive as que caíram (§5) |
| `instrumentos/` | `n3pr3.py` (os estados de S2 e o S0 frio), `passada4-n3p3.py`, `rolar.py`, `phone-a.py`, `medidas-s2.py`, `g5g6-s2.py` |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |

## O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3-PR3: S2 lê a faixa (N3-D28): coluna única e rótulos curtos da faixa em B (N3-D17).
g1a: apps/native/src/theme.ts
g1a: apps/native/src/screens/IndexScreen.tsx
```

G2: 80 → 80 `testID`, nenhum novo, nenhum some. G3: 68 → 68 linhas `log(`. O `g-n3.mjs` e o
`cn-n3pr3.sh` estão em `apps/native/scripts/`, fora do escopo do G1a.

## 1. G-inv — o commit 2 não mudou uma tela em C (A-N3-2)

**34 de 34** idênticos em dp contra a `B5-baseline/` (AVD 18, Tab 16) e **18 de 18** contra a
`B3-referencia-paisagem/` (AVD 9, Tab 9), com o estado de dados da base reproduzido pela receita do
`APARATO.md` (palco antes das telas de S1; no AVD o aviso aberto já sem rede e o S1e com cache de
60–119 s pela `passada4`; no Tab o aviso com o avião ligado com o app aberto; o S0 por abertura fria).
**Os 52 dumps de paisagem são iguais aos da N3-PR2 byte a byte** (`cmp`, 52 de 52).

## 2. S2 em B contra a folha (G-N3, 4 dp; A-N3-3/6/7)

Tab S6 e AVD em retrato (711,1 dp) deram **o mesmo valor em toda linha**. Folha = o README do
DESIGN-N3 com as erratas da §9 (E4: `Apagar` 119,6 e a faixa 687,1).

| medida | folha | Tab = AVD | Δ | |
|---|---:|---:|---:|---|
| barra | 88 | 88,0 | 0,0 | confere (= C) |
| faixa (altura) | 64 | 64,0 | 0,0 | confere |
| `Adicionar` | 136,0 (e1) | 136,0 | 0,0 | confere — nome acessível `Adicionar música` |
| `Reordenar` | 142,5 | 143,1 | +0,6 | confere |
| `Renomear e datar` | 193 | 193,8 | +0,8 | confere |
| `Apagar` | 119,6 (E4) | 119,6 | 0,0 | confere — nome acessível `Apagar setlist` |
| **soma da faixa** | 687,1 | **688,4** = 24,0 + 136,0 + 16,0 + 143,1 + 16 + 193,8 + 16,0 + 119,6 + 24,0 | +1,3 | confere; folga 22,7 (o vão real entre os grupos é 38,7) |
| linha | 663 × 116 | 663,1 × 116,0 | 0,1 | confere; **todo `song-<n>` no mesmo x (24,0)** |
| `remover` | 48 | 48,0 | 0,0 | confere |
| tipo | 104 | **84,0** | −20,0 | **N3-E13** |
| título | 377 | **398,2** | +21,2 | **N3-E13** |
| aviso sem rede (2 linhas) | 68 | 66,2 | −1,8 | confere |
| aviso salvo-não-relido (2 linhas) | 68 | 66,2 | −1,8 | confere |
| aviso falhou (2 linhas) | 70 | 66,2 | −3,8 | confere |
| aviso limite (1 linha) | 48 | 48,0 | 0,0 | confere — **a amostra que S1 não tinha (div. 413)** |
| aviso acima de 100 | 68 (2 linhas) | **48,0** (1 linha) | −20,0 | **N3-E14** |

**N3-E13**: a folha diz *"número 32 · título / artista · tipo 104 · remover 48, como em C"*; em C o
tipo mede **84** (ícone 20 + 8 + rótulo de `minWidth` 56 — `B5-S2-com-edicao-*-pai`, `Letra` 56,0), e a
implementação segue C. O título herda os 20 dp: 663,1 − 5 (bordas) − 48 (respiro) − 32 − 84 − 48 − 3 × 16
= **398,2**. **N3-E14**: o motivo do teto mede 611,1 dp no app e cabe nos 631 da linha em B — uma linha,
48; a folha supôs duas. Nenhuma das duas tira folga: só a dão.

Fora da comparação, e por quê: o título em **S2p** mede 462,2 (sem o `remover`, a folha não dá valor de
B); em **`removendo…`** o alvo de 48 dá lugar ao estado (109,3) e o título da linha 1 cai para 336,9 —
igual em C, é o desenho da N2.

**A-N3-6**: nos 14 dumps de S2e em B, `picker-abrir` tem `text` `Adicionar` e `content-desc`
`Adicionar música`; `setlist-apagar`, `Apagar` e `Apagar setlist`. `gate:a20`: 0 acusações.

**G-N3 (N3-D29): (e)=0 · nome-acessível=28 · rolagem=18**, nos 16 pares. O (e) cru dava 46: as 28
ocorrências de `Adicionar música`/`Apagar setlist` (a N3-D17) e as 18 de `Oitava do ensaio`/`8` (a linha
8 abaixo da dobra: a folha diz *"7 linhas inteiras em B"*). Os 14 dumps rolados estão em `dumps-ret/`,
com sha na saída do gate. **(d′) = 32**, três causas, conferidas no PNG, nenhuma é defeito: o nó do título
de S2 (`ENSAIO DE RETRATO`, 783,6 → 356,9) é a caixa flex e o título aparece inteiro; o motivo do aviso
quebra em duas linhas inteiras (N3-D19); e `Sétima do ensaio` "cresce" 22× porque na paisagem a linha 7
está cortada pela borda da lista. **4 dp = 14**, todas `e2 Apagar` 119,6 contra os 115 da folha: é a N3-E4,
que a N3-PR1 abriu no README mas não levou ao `medidas.json` (div. 424; o commit 4 leva).

## 3. O celular (faixa A, aceite mínimo — a errata do T3-R3)

`octavia_phone` em retrato, conta de audit logada pelo Marcel nesta sessão, faixa `A w=411.4`: S2e
abriu, S2p abriu pelo `indice` do palco; **nenhum `FATAL`** (`phone-logcat.txt`). A lista, controle a
controle (o toque no centro da parte visível e o efeito conferido no dump seguinte):

| superfície | controle | alcance |
|---|---|---|
| S2e | `picker-abrir` | alcançável — abriu o picker |
| S2e | `reordenar` | alcançável — abriu o modo |
| S2e | `setlist-editar` | alcançável, **cortado** na borda: `[883,314][1080,440]` = 75,0 de 193,8 dp — abriu a folha |
| S2e | **`setlist-apagar`** | **INALCANÇÁVEL** — fora da janela, sem nó no dump |
| S2e | `remover-1` | alcançável — `write op=remove status=200` no logcat |
| S2p | — | nenhum controle de escrita (a moldura não tem nenhum) |

É o esperado pelo pre-check (`Apagar` cortado) e é **herança do N5**, não reprovação: a faixa de A
(duas linhas de 48, N3-D16) é do N5. O dump do uiautomator já recorta o `bounds` à janela — por isso o
`setlist-editar` aparece com a largura visível, não a dele.

## 4. G5 e G6 em quatro colunas (A-N3-5, parte de S2)

`G5G6-S2.txt`: oito estados de S2 × Tab/AVD × paisagem/retrato (as 4 células de cada estado; S2p e
S2e com e sem aviso na paisagem vêm da base): **todo alvo ≥ 48 dp** e **todo alvo com `testID`**. Os
únicos alvos abaixo de 48 são linhas cortadas pela borda da lista (div. 291), listados à parte. Os mesmos
ids nas quatro colunas; em retrato a linha é 663,1 × 116,0 em vez de 536,9 × 116,0.

O `g5g6-s2.py` é o da N3-PR2 com dois consertos: arredonda a 0,1 dp **antes** de comparar (377/2,25 −
269/2,25 = 47,999…, e um alvo de 108 px reprovava) e separa o alvo cortado pela rolagem.

## 5. As rodadas que caíram, e por quê (verbatim em `roteiros/`)

| rodada | o que aconteceu | o que foi feito |
|---|---|---|
| `roteiro-avd-pai-sem-radio.txt` | o AVD em repouso tem `wifi=0 data=0`; desligar o avião não religa o rádio, e o app ficou "sem conexão" com o cache de audit: 7 de 10 estados caíram e as 3 capturas eram a mesma tela | `svc wifi enable` + `svc data enable`, `ping` conferido; refeita (`roteiro-avd-pai.txt`, 27 de 27). Os 12 dumps descartados não entraram (div. 418) |
| `roteiro-tab-pai-s2-queda.txt` · `roteiro-tab-ret-queda.txt` | em retrato `remover-8` fica abaixo da dobra; e a setlist de 101 chegou com 8 — o sync guarda a setlist cujo `updated_at` não mudou | o `n3pr3.py` passou a remover a linha 1 e a dar à fixture de 101 um `updated_at` posterior (a volta à de 8 também troca: o sync compara com `!==`) |
| `roteiro-phone-ret-queda.txt` | o arnês esperava `sincronizado agora`; em A o chip encolhe até o ícone (div. 416) e o texto não chega ao dump | espera o cartão da fixture |
| `…-rolada` do `removendo` (1ª rodada) | a rolada saiu depois dos 20 s do prazo do cliente e mostra "sem resposta do servidor" — **outro estado** | refeita rolando logo depois do toque (8,0 s no AVD, 8,3 s no Tab); o dump prova o estado: sem `aviso-motivo`, faixa e `remover-2…8` com `enabled=false` (escrita em voo). As duas velhas em `dumps-descartados/` (div. 423) |

## Aparato

- **Mock** `aceite.py servidor 8788` + arquivos (`http.server 8790`) sobre a fixture do pre-check;
  **Metro** na 8081 **sem `CI=1`**, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline;
  `adb reverse` dos três.
- **Bundle conferido** antes da primeira captura de cada sessão (`estado/bundle-1.txt`, `bundle-2.txt`,
  os dois com 7.205.798 B): `localhost:8788` 1 · `octavia.rocks` **0** · `rotulosCurtos` 6 ·
  `itemNaGrade` 2 · `colunas-` 1 · `useLinhaDaFaixa` 6 · `faixa=` 4. Nenhuma mudança de código do app
  depois do commit 2.
- **Dev client**: sem módulo nativo novo, sem rebuild. AVD `2026-09-24 14:00:01`, Tab
  `2026-09-23 19:11:34`, celular `2026-09-23 21:10:37`.
- **`.env`**: copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro; **apagado**
  no fim de cada sessão.
- **Escritas**: prod **zero**. Mock: `remover-1` nos modos `escrita-resync-500` (grava), `escrita-500`,
  `escrita-429`, `escrita-pendurada` (nada) e `normal` (o do celular, grava) — o mock se relê da fixture a
  cada troca de modo.
- **P1 (o FAB do dev client em retrato), S2**: em B o FAB fica sobre o **fim do rótulo** de
  `Buscar na biblioteca`, à direita da barra de 88; o alvo continua tocável pela esquerda e nenhum
  controle da faixa fica sob ele.

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido | mudado, e por quê | no fim |
|---|---|---|---|
| **AVD `octavia_tab32`** (duas sessões) | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, audit | **`-no-snapshot-save`**; avião desligado **e wifi/data ligados** (div. 418); rotação; `reverse`; **sessão derrubada pelo S0** (mock `401`) na 1ª sessão — um reboot sem salvar a trouxe de volta | settings iguais ao lido, `ping` → `Network is unreachable`, `reverse` vazio, desligado sem salvar snapshot |
| **`octavia_phone`** | `stay_on=1 accel=0 user_rot=0 airplane=0 wifi=1 data=1`, sem sessão | `-no-snapshot-save`; `reverse`; **login de audit pelo Marcel**, derrubado no fim pelo `401` do mock | settings iguais ao lido; S0; desligado |
| **Tab S6** (duas sessões) | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **bloqueado** (o Marcel destravou, duas vezes) | `stay_on` 0→7; rotação; avião nos estados sem rede; `reverse`; **cache do app trocado pelo do mock** | settings iguais ao lido; `reverse` vazio. Cache **guardado antes** — os 4 arquivos um a um por `run-as cat` (o `tar` por `exec-out` veio truncado, div. 419) — e **regravado** com o app parado: `md5` dos 4 idêntico nas duas sessões (`md5-antes`, `md5-depois`, `md5-depois-2`); `partitura-1p.pdf` da fixture apagada; as cópias do host apagadas. O `files/._…Guitar.pdf` (AppleDouble) foi apagado **pelo app** na rodada e não foi reposto (div. 420) |
| **host** | 8081/8788/8790 livres | Metro, mock, arquivos | as três livres; `.env` apagado |

## Extras

Declarados antes de serem feitos: **a mudança do `g-n3.mjs`** (N3-D29 — decisão do Marcel na conversa,
com as três condições), com o `cn-n3pr3.sh`. Fora da lista do prompt, e declarados aqui: os estados de S2
em **paisagem** que a base não tem (sem eles o G-N3 e o G6 não teriam par); os **14 dumps rolados**;
o `data-numcolumns` no `FlatList` do duplo (commit 1); o `medidas.json` com os valores das erratas
N3-E4, N3-E5 e N3-E12 (commit 4, div. 424).
