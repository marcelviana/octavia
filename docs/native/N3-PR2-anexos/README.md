# N3-PR2-anexos — S1 na faixa B (tokens por faixa)

**Rastro.** A fonte é o [`DESIGN-N3/README.md`](../DESIGN-N3/README.md) §9 (as divergências
412–417) e o [`N3-REQUISITOS.md`](../N3-REQUISITOS.md) (A-N3-3/5/7, parte de S1). Árvore
`../octavia-n3-pr2`, branch `n3/pr2-s1`, sobre `origin/main` = `3a9b24f` (merge da #326).
Decisões do Marcel que a PR implementa: **N3-D27** (a base do palco é a `B3-referencia-paisagem/`)
e **N3-D28** (tokens por faixa no `theme.ts`).

**Nenhum texto de música de terceiro**: todo dump é do **mock** (`aceite.py servidor`, 8788) com a
fixture do pre-check (`N3-PRECHECK-anexos/instrumentos/fixture.py`, "hoje" = 2026-09-23). Conferido:
dos **136** `text` distintos dos 68 dumps desta pasta, 132 estão nos dumps do pre-check (B2, B4, B5,
B3-referência) e os 4 restantes são frases do app e o nome de fixture que a própria PR digitou
(`Fixture N3 PR2 foi criada. …`, `Tentar recarregar`, `sem conexão`, `última sincronização agora`).
`grep` de `eyJ`, e-mail e o uid do Tab sobre esta pasta: vazio. **PNGs não commitados** (a prova é o
`bounds`, como na N3-PR1); os (d′) foram conferidos nos PNGs da sessão.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `CN-commit1.txt` · `CN-commit2.txt` | o `s1-faixa.test.tsx`: os 5 CNs de B reprovando por ausência e o CP de C passando (commit 1); 18/18 com o `s1-criar.test.tsx` da N2 sem mudança (commit 2) |
| `G1-commit2.txt` · `G2G3-commit2.txt` | G1 e G2/G3 contra `origin/main` com o bloco `gates` abaixo |
| `G-inv-B5.txt` · `G-inv-palco.txt` | **o G-inv do commit 2**: 34/34 contra `B5-baseline/` e 18/18 contra `B3-referencia-paisagem/` (N3-D27) |
| `G-N3-retrato.txt` | o G-N3 nos 10 dumps de S1 em retrato (Tab e AVD): (e) = 0 |
| `medidas-s1-B.txt` | as medidas de S1 em B contra a folha, dump a dump (§2) |
| `G5G6-S1.txt` | G5 e G6 dos cinco estados de S1 em quatro colunas (§4) |
| `dumps-pai/` | 54 dumps em paisagem: AVD 28 (18 da B5 + 9 do palco + salvo-não-relido), Tab 26 (16 + 9 + salvo) |
| `dumps-ret/` | 10 dumps de S1 em retrato (faixa B): cinco estados × Tab e AVD |
| `dumps-phone/` | o aceite mínimo do celular (faixa A): S1, a folha aberta por `Nova setlist`, S4 aberto por `Buscar música` |
| `dumps-descartados/` | o S0-login do AVD alcançado por logout na sessão — de novo a div. 404 —, trocado pelo de abertura fria |
| `phone-logcat.txt` | o logcat do celular na rodada: `faixa=A w=411.4`, nenhum `FATAL` |
| `estado/` | estado de cada aparelho lido e restaurado, o `md5` do cache do Tab antes e depois, a conferência do bundle |
| `roteiros/` | a saída de cada rodada de captura, verbatim — inclusive as que caíram (§5) |
| `instrumentos/` | `n3pr2.py` (os estados de S1 que o roteiro do pre-check não tem, e S1 em retrato), `medidas-s1.py`, `g5g6-s1.py` |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |

## O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3-PR2: S1 lê a faixa (N3-D28, tokens por faixa); a linha de aviso cresce (N3-D19).
g1a: apps/native/App.tsx
g1a: apps/native/src/theme.ts
g1a: apps/native/src/useFaixa.ts
g1a: apps/native/src/screens/SetlistsScreen.tsx
g1a: apps/native/src/screens/LinhaDeAviso.tsx
```

G2: 80 → 80 `testID`, nenhum novo, nenhum some. G3: 68 → 68 linhas `log(` — a `faixa=` não mudou
de texto nem de momento, só de função (`useLinhaDaFaixa`, na raiz).

## 1. G-inv — o commit 2 não mudou uma tela em C (A-N3-2)

**34 de 34** idênticos em dp contra a `B5-baseline/` (AVD 18, Tab 16) e **18 de 18** contra a
`B3-referencia-paisagem/` (AVD 9, Tab 9). O estado de dados da base foi reproduzido pelo caminho da
N3-PR1 (div. 403): palco antes das telas de S1; no AVD o aviso com o app **aberto já sem rede** e o
S1e com o cache de 60–119 s (`passada4.py` da N3-PR1, prefixo trocado para `N3P2`); no Tab o aviso
com o avião ligado com o app aberto e o S1e logo depois do sync; o S0 por abertura fria.

Mais forte que o gate: **os 52 dumps de paisagem que têm par na N3-PR1 (`N3-PR1-anexos/dumps-pai/`)
são iguais a ele byte a byte** (`cmp`, 52 de 52; só os dois salvo-não-relido, novos, não têm par) —
inclusive os três avisos (`S1-aviso-sem-rede` nos dois aparelhos,
`S2-com-edicao-aviso-sem-rede`), que agora passam pela `LinhaDeAviso` da N3-D19: com uma linha de
texto, `minHeight` 48 e o respiro de 12 em volta do texto dão o mesmo pixel que a altura fixa de 48.

## 2. S1 em B contra a folha (G-N3, 4 dp; A-N3-3/7)

Tab S6 e AVD em retrato (711,1 dp) deram **o mesmo valor em toda linha**. Folha = o README do
DESIGN-N3 com as erratas da §9 (E2 `Nova setlist` 152; E6 chip empilhado 192,4; E8 a frase de aviso,
duas linhas em B).

| medida | folha | Tab | AVD | Δ | |
|---|---:|---:|---:|---:|---|
| barra | 144 | 144,0 | 144,0 | 0,0 | confere |
| cartão (altura) | 184 | 184,0 | 184,0 | 0,0 | confere |
| nome (largura) | 583 | 581,3 | 581,3 | −1,7 | confere — a folha soma a borda de 1 dp no 583 |
| `Nova setlist` | 152 (E2) | 152,0 | 152,0 | 0,0 | confere |
| `Buscar música` | 171,1 | 171,1 | 171,1 | 0,0 | confere |
| `Baixar esta setlist` | 193,8 | 194,2 | 194,2 | +0,4 | confere |
| chip sem rede, empilhado | 192,4 (E6) | 192,4 | 192,4 | 0,0 | confere |
| chip `sincronizado agora` | 144,9 (m3) | 144,9 | 144,9 | 0,0 | confere |
| linha de aviso, 2 linhas (sem rede; salvo-não-relido) | 68 | 66,2 | 66,2 | −1,8 | confere |

**Nenhuma diferença > 4 dp: nenhuma errata nova nesta PR** (a próxima continua sendo a N3-E13).
A linha de aviso mede 66,2 porque cada linha de texto do app tem 21,1 dp (o motivo é 15 dp no app, 14
na folha — a div. 409), e o respiro é 12 + 12: 24 + 42,2 = 66,2. A regra "+20 por linha" da N3-D19
fica dentro da tolerância; com três linhas (A, N5) seriam ≈ 87,3 contra 88.

**G-N3 (e) = 0** nos 10 pares (na `main` era 1: `"SETLISTS"` empurrado para fora no aviso do AVD).
**(d′) = 12**, duas causas, as duas conferidas no PNG e nenhuma é defeito: o nome
`SHOW DE SEXTA NO TEATRO DA FIXTURE` num nó de 581,3 (era 762,2 em C) aparece **inteiro**, porque o nó é
o andar, não o texto; e o motivo do aviso quebra em duas linhas inteiras (altura ×1,9), que é a N3-D19.

## 3. O celular (faixa A, aceite mínimo; A-N3-3)

`octavia_phone` em retrato, conta de audit logada pelo Marcel nesta sessão: S1 abriu (`faixa=A
w=411.4`), `Nova setlist` abriu a folha, `Buscar música` abriu S4 e voltou; **nenhum `FATAL`**. Os
dois alvos estão no dump de S1 (`criar-setlist` 152,4 × 58,3, `buscar` 172,6 × 58,3). Duas coisas que
o aceite mínimo não cobre e ficam registradas: em A com os tokens de B a composição **não cabe** em
411 (div. 416), e a folha de criar em A **não tem `form-cancelar` alcançável** e o `form-salvar` tem
12 px de largura — igual ao pre-check, sem relação com esta PR (div. 417).

## 4. G5 e G6 em quatro colunas (A-N3-5, parte de S1)

`G5G6-S1.txt`: cinco estados de S1 (setlists, S1f, sem rede, salvo-não-relido, S1e) × Tab/AVD ×
paisagem/retrato: **todo alvo ≥ 48 dp** e **todo alvo com `testID`**, em todas as 20 células. Os
mesmos ids nas quatro colunas; muda a posição, que é a da seção "testIDs" da folha
(`criar-setlist` na linha 2 da barra em B, e no centro de S1f nas duas faixas).

## 5. As rodadas que caíram, e por quê (verbatim em `roteiros/`)

| rodada | o que aconteceu | o que foi feito |
|---|---|---|
| `roteiro-avd-pai-S1.txt` | a recarga com o avião ligado passou dos 60 s de espera (a mesma queda da passada 2 da N3-PR1); o `salvo` seguinte tocou `Nova setlist` com o app ainda "sem conexão" (inerte) | refeitas depois de o app voltar online (`-S1-2.txt`, `-salvo.txt`); o `n3pr2.py` passou a esperar `sincronizado agora` antes do toque |
| `roteiro-avd-ret.txt`, estado `aviso` | com o avião ligado com o app aberto, o chip continua `sincronizado agora` até a próxima abertura — e a folha `N3-B-S1-sem-rede` desenha o chip empilhado | o `aviso` do `n3pr2.py` abre o app já sem rede (`-avd-ret-aviso.txt`), nos dois aparelhos em retrato |
| `roteiro-avd-pai-S0.txt` | S0 por logout na sessão: os dois campos com 0,5 dp a mais — **de novo a div. 404** | recapturado por abertura fria (`-S0-frio.txt`), idêntico; o descartado em `dumps-descartados/` |
| `roteiro-tab-pai-bloqueado.txt` | o Tab bloqueou (tela de 30 s) enquanto o celular rodava, antes do `stay_on`: **0 capturas**, 11 falhas, nada escrito no app | o Marcel destravou; `stay_on` 7 antes da rodada (`roteiro-tab-pai.txt`, 25 de 25) |

## Aparato

- **Mock** `aceite.py servidor 8788` + arquivos (`http.server 8790`) sobre a fixture do pre-check,
  "hoje" = 2026-09-23; **Metro** na 8081 **sem `CI=1`**, `--clear`, com
  `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; `adb reverse` dos três.
- **Bundle conferido** antes da primeira captura (`estado/bundle-1.txt`): `localhost:8788` 1 ·
  `octavia.rocks` **0** · `cartaoEmAndares` 2 · `tituloEmLinhaPropria` 2 · `useLinhaDaFaixa` 6 · `faixa=` 4.
  Um bundle só na sessão inteira (nenhuma mudança de código depois dele).
- **Dev client**: sem módulo nativo novo, sem rebuild. AVD `2026-09-24 14:00:01`, Tab `2026-09-23 19:11:34`.
- **`.env`**: copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro; **apagado** no fim.
- **Escritas**: prod **zero** requests. Mock: a folha do salvo-não-relido grava **no mock**
  (`escrita-resync-500`, 201 com a releitura em 500), que se relê da fixture a cada troca de modo;
  a "folha falhou" tenta `POST` no `escrita-500`, nada gravado.
- **P1 (o FAB do dev client em retrato)**: em B o FAB fica na linha do **título** de S1, à direita, e
  **não cobre** `buscar` nem `criar-setlist`, que desceram para a linha 2 (PNGs da sessão). Vale para S1;
  as outras superfícies se medem nas PRs delas.

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido | mudado, e por quê | no fim |
|---|---|---|---|
| **AVD `octavia_tab32`** | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, audit, dev client 2026-09-24 14:00:01 | **`-no-snapshot-save`**; avião desligado + wifi/data para o mock; rotação; `reverse`; **sessão derrubada pelo S0** (mock `401`) | settings iguais ao lido, `ping` → `Network is unreachable`, `reverse` vazio, desligado. A sessão volta no próximo boot (snapshot intacto) |
| **`octavia_phone`** | `stay_on=1 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, sem sessão | `-no-snapshot-save`; rotação; `reverse`; **login de audit pelo Marcel**, derrubado no fim pelo `401` do mock | settings iguais ao lido; sem sessão (o S0 é o repouso); desligado |
| **Tab S6** | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **bloqueado** (o Marcel destravou, duas vezes) | `stay_on` 0→7; rotação; avião nos estados sem rede; `reverse`; **cache do app trocado pelo do mock** | settings iguais ao lido; `reverse` vazio. Cache **guardado antes** (`run-as … tar`) e **restaurado** com o app parado: `md5` dos 4 idêntico (`estado/md5-*.txt`, os mesmos da N3-PR1); as partituras da fixture apagadas; o tar **apagado** do host |
| **host** | 8081/8788/8790 livres | Metro, mock, arquivos | as três livres; `.env` apagado |

## Extras

Declarados antes de serem feitos, na conversa: nenhum de código. Fora da lista do prompt, e
declarados aqui: o **salvo-não-relido em paisagem** (Tab e AVD) — o estado não tem par na B5, e sem
ele o G-N3 e o G6 do salvo não teriam paisagem de referência; o **S1e em retrato** (não pedido; é
estado de S1 com par na B5, e custa uma captura). Mudança de aparato de teste: o duplo de
`react-native` ganhou `useWindowDimensions` e `__janela()` (commit 1), com o padrão de C.
