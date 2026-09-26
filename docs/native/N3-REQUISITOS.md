# N3 — requisitos e aceites: faixas de largura

> **Bloco N3 · PR de desenho** (só docs). Data: 2026-09-24. Base: `origin/main` = `8e38e56` (merge da #324, o pre-check).
> **O N3 não teve PRD separado; este documento faz esse papel.** Formato: o do [`PRD-TELA-2.md`](PRD-TELA-2.md) — todo requisito `T3-Rn` cita a fonte e tem *Aceite* verificável.
> **Fontes**: [`N3-PRECHECK.md`](N3-PRECHECK.md) (N3-D0…D11, §3 a tabela por dump, §8 as perguntas), [`DESIGN-N3/README.md`](DESIGN-N3/README.md) (N3-D12…D25, a folha congelada, as medidas a conferir) e os congelados [`DESIGN-V1/`](DESIGN-V1/) e [`DESIGN-N2/`](DESIGN-N2/) (a faixa C).
> **Regra de leitura**: `[lido]` = do documento citado; `[derivado]` = conta ou consequência de decisões, com a conta à vista. Nada aqui é `[medido]` novo: as medidas desta PR estão no `DESIGN-N3/README.md` §4.2.
> **Divergências**: as desta PR estão no `DESIGN-N3/README.md` §9 (**393 a 400**).

---

## 0. As faixas, em uma linha

| faixa | largura útil da janela | composição | onde se mede |
| --- | --- | --- | --- |
| **C** | **> 960** dp | o congelado V1/N2 (1138 × 627) — **não muda** | Tab S6 e AVD `octavia_tab32` em paisagem (1137,8 dp) |
| **B** | **700–960** dp | `DESIGN-N3`, faixa B (711 × 1054) — **implementada no N3** | Tab S6 e AVD em retrato (711,1 dp); o celular deitado (914,3 dp) cai aqui pela largura |
| **A** | **< 700** dp | `DESIGN-N3`, faixa A (411 × 874) — **desenhada no N3, implementada no N5** | `octavia_phone` em retrato (411,4 dp) |

Fontes: N3-D8 (faixas e canvas), **N3-D12** (limite A \| B em 700), **N3-D24** (tudo decide pela faixa), N3-D0 (A é o N5).

---

## 1. Requisitos

**T3-R1 — A faixa se decide pela largura útil da janela, num ponto só** `[N3-D1; N3-D8; N3-D12; N3-D24]`. A faixa é função da **largura útil da janela** em dp — não da orientação, não do aparelho: **A < 700 · B 700–960 · C > 960**. **Um único ponto de decisão no app**: nenhuma tela ou componente compara largura por conta própria (a regra de componente, com os limiares 667,5 / 474 / 430, é herança do iOS, N3-D24). A decisão sai em **uma linha de log** `faixa=<A|B|C> w=<dp> h=<dp>` **no boot e a cada rotação** (e a cada mudança de tamanho de janela que troque a faixa), registrada no catálogo `LOGS-OCTAVIA.md` na mesma PR em que nasce — ao lado da `rotation=landscape|portrait n=<i>/<N>` do T1-R27, que continua só na mudança de orientação.
*Aceite*: A-N3-1.

**T3-R2 — Invariante C** `[N3-D3; H-N3-5; N3-PRECHECK.md §3.4]`. Na faixa C, **os dumps em paisagem são idênticos em dp** à linha de base: [`N3-PRECHECK-anexos/B5-baseline/`](N3-PRECHECK-anexos/B5-baseline/) (18 estados no AVD, 16 no Tab — sem S0, div. 386) **mais** os do palco do W4-b3, [`W4B3-anexos/dumps-palco/`](W4B3-anexos/dumps-palco/) (AVD 3 estados, Tab 7). Tab e AVD, para **toda tela e estado** da linha de base. É **gate do bloco**: toda PR de implementação do N3 o roda, e uma diferença de `bounds` em C reprova — inclusive as que vierem da T3-R7 e da P2 (tokens por faixa, N3-D25).
*Aceite*: A-N3-2.

**T3-R3 — B implementada por superfície; A não quebra** `[N3-D0; N3-D8; DESIGN-N3 §1]`. A faixa **B** é implementada **superfície por superfície como a folha** — S1 (e S1-sem-rede, S1f), S2 com e sem edição, reordenar, folha, picker, diálogo, palco (barra superior, N3-D13), S4, S0, S5 —, contra as molduras `N3-B-…` e as da faixa C onde a folha diz "passa". A faixa **A não é implementada no N3** (é o N5), mas **o app não pode quebrar em A**: *aceite mínimo* = **nenhum controle de escrita inalcançável** (alcançável por toque, com rolagem se preciso) e **nenhum crash**, em todas as superfícies. O que a folha manda para A (as 16 molduras `N3-A-…` e as 3 `N3-A699-…`) fica registrado como **T5-R** do N5, não como aceite do N3.
`[derivado]`: pela largura, o **celular deitado** (914,3 × 371,4 dp, pre-check §2.1) cai na faixa **B**, que foi desenhada para 1054 de altura. A regra de altura (janela útil < ~480 dp → composição compacta) é do **N5** (N3-D8); no N3 ele tem o mesmo aceite mínimo de A.
*Aceite*: A-N3-3.

> **Errata do T3-R3 (decisão do Marcel, 2026-09-25, no prompt da N3-PR3; divs. 416, 417).** O aceite mínimo de **A** no N3 é **nenhum crash** mais **a lista dos controles de escrita inalcançáveis, por superfície** — e a lista é **herança do N5**, não reprovação. O *"nenhum controle de escrita inalcançável"* acima não vale mais para A no N3: com os tokens de B em 411 dp (N3-D28, div. 416) a composição não cabe, e é a faixa de A do N5 que devolve os controles. A lista de cada superfície sai da PR dela; a da folha (`form-cancelar` ausente, `form-salvar` de 12 px) tem destino na PR-4 (div. 417).

**T3-R4 — O gate G-N3, contra a folha** `[N3-D10; N3-D23; N3-D9; div. 384]`. Cada estado de B e A é comparado ao **mesmo estado em paisagem** (o critério é defeito **novo** em relação à paisagem, N3-D9), com o instrumento do pre-check (`N3-PRECHECK-anexos/inventario.mjs`):
- **(e)** texto que está no dump da paisagem e **some** do dump da faixa = **reprova** (critério duro);
- **(d′)** texto com **menos espaço** que na paisagem = **triagem**, confirmada no PNG antes de virar defeito;
- **4 dp**: medida do dump **> 4 dp** diferente da tabela de origem da folha = **errata** do `DESIGN-N3`, não reprova. As duas primeiras erratas da folha já existem, decididas antes do merge do desenho: **N3-E1** (o limite A | B é 700, não os 600 do cabeçalho) e **N3-E2** (`Nova setlist` = 152,0, não 190; `DESIGN-N3/README.md` §9) — as do dump começam na **N3-E3**. As dez `[estimado]` e as duas `[soma]` (`DESIGN-N3/README.md` §4.1) se medem **primeiro, na ordem da folha**; os dumps saem no formato do [`MEDIDAS.md`](N2-BRIEF-anexos/MEDIDAS.md).

O `(d)` literal (texto terminando em `…`) é zero por construção no RN (div. 384) e não é critério. **O gate vem antes do que ele mede**: ele entra, e **reprova contra a `main` atual em retrato**, antes de qualquer tela mudar.
*Aceite*: A-N3-4.

**T3-R5 — G5 e G6 em quatro colunas** `[N3-D4]`. G5 (todo alvo ≥ 48 dp) e G6 (todo estado alcançável por `resource-id`, todo alvo tocável com `testID`) passam a ter **quatro colunas: Tab × AVD, paisagem × retrato**. **Todo estado do congelado** — as 22 molduras do V1 e as 18 do N2, com as erratas — é **alcançável nas duas orientações do tablet**. Os `testID` são os mesmos (nenhum novo, renomeado ou removido; `DESIGN-N3` §7); muda a posição, e ela é a da seção "testIDs" da folha.
*Aceite*: A-N3-5.

**T3-R6 — Rótulos curtos com nome acessível longo** `[N3-D17]`. Na faixa de edição de S2 em B (e em A, no N5), `picker-abrir` mostra **`Adicionar`** e `setlist-apagar` mostra **`Apagar`** — frases existentes no conjunto (o botão do picker e o do diálogo) —, e o **nome acessível** continua o longo: **`Adicionar música`**, **`Apagar setlist`**. Nenhuma frase nova; o `gate:a20` cobre, inclusive `accessibilityLabel`.
*Aceite*: A-N3-6.

**T3-R7 — A linha de aviso cresce e nunca elide, em toda faixa** `[N3-D19; DESIGN-N2 §3.3]`. A linha de aviso de S1 e S2 tem **48 dp mínimos e cresce 20 dp por linha de texto**; **nunca elide** o motivo. É **regra do componente**, e vale **também em C** — onde hoje toda frase cabe numa linha, e por isso **nenhum dump de C muda** (a T3-R2 prova). Em B a ação fica à direita, centrada; em A (N5) desce para baixo do texto. Uma frase por vez, e vale a que bloqueia mais (N2, inalterado).
*Aceite*: A-N3-7.

---

## 2. Aceites do N3

O N3 está pronto quando **todos** abaixo passam, no **Tab S6 e no AVD `octavia_tab32`**, com o **mock** (`aceite.py servidor`, 8788) e a fixture do pre-check — e, onde o critério diz A, no **`octavia_phone`**. Evidência nomeada em cada linha; os anexos são os da PR que fecha o critério (`N3-PRn-anexos/`).

| # | Critério | Evidência | Rastreio |
|---|---|---|---|
| A-N3-1 | A linha `faixa=` sai no boot e em cada rotação, com a faixa certa: **C** w=1137,8 (tablet deitado), **B** w=711,1 (tablet em pé), **A** w=411,4 (celular em pé), **B** w=914,3 (celular deitado); a linha está no catálogo; um só ponto de decisão no código | logcat nos quatro casos; `grep` do limiar no `apps/native/src` com uma ocorrência; `LOGS-OCTAVIA.md` | T3-R1 |
| A-N3-2 | Dumps de paisagem **idênticos em dp** à `B5-baseline/` (AVD 18, Tab 16) e à `W4B3-anexos/dumps-palco/` (AVD 3, Tab 7), em **toda** PR de implementação | saída do gate (diff de `bounds` vazio), por PR | T3-R2 |
| A-N3-3 | **B**: cada superfície confere com a sua moldura `N3-B-…` (ou com C onde a folha diz "passa"); **A** e celular deitado: nenhum crash, e a **lista dos controles de escrita inalcançáveis** por superfície, herdada pelo N5 (errata do T3-R3) | dumps + PNG de B por superfície; roteiro de A e do celular deitado com logcat sem `FATAL` e o toque em cada controle de escrita | T3-R3 |
| A-N3-4 | O G-N3 **reprova a `main` de hoje em retrato** (antes de qualquer tela) e passa depois; as dez `[estimado]` e as duas `[soma]` medidas na ordem da folha, cada uma com o valor do dump e, se > 4 dp, a errata N3-En aberta | saída do gate contra a `main` (reprovando) e contra a PR; tabela das doze medidas no formato do `MEDIDAS.md` | T3-R4 |
| A-N3-5 | G5 e G6 com **quatro colunas** (Tab × AVD, paisagem × retrato), todos os estados do congelado alcançados nas duas orientações do tablet | relatório do G5/G6 com as quatro colunas | T3-R5 |
| A-N3-6 | Em B, `picker-abrir` com texto `Adicionar` e nome acessível `Adicionar música`; `setlist-apagar` com `Apagar` e `Apagar setlist`; `gate:a20` com 0 acusações | dump (`text` e `content-desc`); saída do `gate:a20` | T3-R6 |
| A-N3-7 | A linha de aviso em B nas cinco amostras `N3-B-X-…` com as alturas da folha (sem rede 68 · salvo-não-relido 68 · falhou 70 · limite 48 · teto de 100 68), sem elidir; em C, 48 e **nenhum `bounds` diferente** da linha de base | dumps de B dos cinco estados; o A-N3-2 para C | T3-R7 |

---

## 3. A ordem

**O gate vem antes do que ele mede** (`V1-ENCERRAMENTO.md:204`). A **N3-PR1 é o gate**, sem tela: o commit 1 mede as dez `[estimado]` no aparelho (a próxima errata provável — seria a N3-E3 — é o `Adicionar`, se não der 137), a invariante de C contra a B5, a linha de log de faixa, e o **G-N3 reprovando contra a `main` atual em retrato**. Na mesma PR entra o `DESIGN-N3` no laço do `shasum -c` do `gates-nativos` (div. 398) e se decide a P2 (tokens por faixa, N3-D25). As PRs de superfície vêm depois.

---

## 4. Herança, com destino

| # | item | origem | destino |
|---|---|---|---|
| 1 | **faixa A inteira** — as 16 molduras `N3-A-…` e as 3 `N3-A699-…` viram **T5-R** | N3-D0; T3-R3 | **N5** |
| 2 | **quebra de linha na letra, nunca na tab** — bloco próprio, **pré-requisito** do N5 | N3-D15 (R1·3) | **bloco próprio, antes do N5** |
| 3 | **regra de altura**: janela útil < ~480 dp → composição compacta (o celular deitado, 914,3 × 371,4) | N3-D8; div. 388 | **N5** |
| 4 | **regra de componente** (limiares 667,5 / 474 / 430) — iPad em janela passa por 600–699 | N3-D24; `DESIGN-N3/telas.html` §11 | **bloco iOS** |
| 5 | `supportsTablet` e o iPad herdando a composição (H-N3-6, nenhum aparelho iOS medido) | N3-D5; `N2-ENCERRAMENTO.md` §10.7.2 | **bloco iOS** |
| 6 | **P1** — o FAB do dev client cobre o canto superior direito nas capturas de retrato | N3-D25 | **aparato** — hipótese no `APARATO.md`, dono a N3-PR1 |
| 7 | **P2** — a faixa como tokens no `theme.ts` | N3-D25 | **N3-PR1** (decisão com a invariante de C medida) |
| 8 | Bloco D | — | **nada**: o N3 não toca backend |
| 9 | **o flake do `escrita.test.ts` › "ÚLTIMO 200"**: o modo `escrita-releitura-fora-de-ordem` do `aceite.py` passa a segurar a 1ª releitura **até a 2ª chegar** (evento, não a janela de 600 ms), com **CN que reprova quando a inversão não acontece** | div. 432 (N3-PR4) | **W5** |

---

## 5. O que a N3-PR1 fechou (o gate)

Evidência em [`N3-PR1-anexos/`](N3-PR1-anexos/README.md); erratas e divergências no `DESIGN-N3/README.md` §9 (N3-E3…E12, divs. 401–411).

| # | estado | evidência |
|---|---|---|
| **T3-R1** | **atendido** — `faixaDe()` em `apps/native/src/faixa.ts`, o único arquivo com 700 e 960 (`test/faixa.test.ts` o garante); a linha `faixa=` sai da raiz do app (`useFaixa.ts`) no boot e a cada troca de orientação ou de faixa, e está no catálogo. **Nenhuma tela lê a faixa ainda** | `faixa-test-commit1.txt` (reprova por ausência) e `-commit2.txt` (4/4) |
| **A-N3-1** | **atende**: Tab deitado `faixa=C w=1137.8` · Tab em pé `faixa=B w=711.1` · celular em pé `faixa=A w=411.4` · celular deitado `faixa=B w=914.3`, uma linha por troca; limiar numa ocorrência | `faixa-tab.txt`, `faixa-phone.txt`, `faixa-avd.txt`; o `h` é a janela com as barras (div. 410) |
| **A-N3-2** | **atende na N3-PR1**: os 52 dumps de paisagem do build desta PR, **idênticos em dp** à `B5-baseline/` (AVD 18, Tab 16 — **34 de 34**) e ao palco (AVD 9, Tab 9 — **18 de 18**), pelo `apps/native/scripts/g-inv.sh`. O palco contra `B3-referencia-paisagem/`, não contra `W4B3-anexos/dumps-palco/` (div. 401). Vale de novo em **toda** PR de implementação, reproduzindo o estado de dados da base (div. 403) | `G-inv-B5.txt`, `G-inv-palco.txt` |
| **A-N3-4** | **metade da N3-PR1 atende**: o G-N3 (`apps/native/scripts/g-n3.mjs`) **reprova a `main` de hoje em retrato** — (e) = 1 no tablet, 101 em 11 dumps no celular, dump a dump igual ao B3 do pre-check; as dez `[estimado]` e as duas `[soma]` medidas na ordem da folha, com nove erratas abertas (N3-E3…E11) e a da div. 395 (N3-E12). **Falta**: o G-N3 passar, nas PRs de superfície | `G-N3-main-*.txt`; tabela das doze no `N3-PR1-anexos/README.md` §1 |

A **P2** (tokens por faixa, herança item 7) **não foi decidida** nesta PR — div. 406, com a recomendação. A **P1** (herança item 6) tem a hipótese escrita no `APARATO.md`, sem medida: nenhuma captura de retrato nova nesta PR.

## 6. O que a N3-PR2 fechou (S1 na faixa B)

Evidência em [`N3-PR2-anexos/`](N3-PR2-anexos/README.md); decisões, divergências e a ausência de errata nova no `DESIGN-N3/README.md` §9 (N3-D27, N3-D28; divs. 412–417). **A P2 foi adotada** (N3-D28): `faixas` no `theme.ts`, e S1 é a primeira tela que lê a faixa (`useFaixa()`).

| # | estado | evidência |
|---|---|---|
| **A-N3-2** | **atende de novo**: 34/34 (B5) e 18/18 (palco, `B3-referencia-paisagem/` pela N3-D27). Os 52 dumps de paisagem com par na N3-PR1 são iguais a ele byte a byte | `G-inv-B5.txt`, `G-inv-palco.txt` |
| **A-N3-3 — S1** | **B atende**: S1, S1-sem-rede e S1f conferem com `N3-B-S1`, `N3-B-S1-sem-rede` e `N3-B-S1f` no Tab e no AVD (barra 144,0 · cartão 184,0 · nome 581,3 · botões 152,0/171,1 · chip 192,4; nada > 4 dp). **A, mínimo de S1**: sem `FATAL`, `Nova setlist` e `Buscar música` alcançáveis — com a composição de B, que não cabe em 411 (div. 416, a de A é do N5). **A não fecha para a folha** (div. 417, anterior a esta PR) | `medidas-s1-B.txt`, `dumps-ret/`, `dumps-phone/`, `phone-logcat.txt` |
| **A-N3-4 — S1** | **o G-N3 passa em S1**: (e) = 0 nos 10 pares de retrato (era 1 na `main`); (d′) = 12, conferidos no PNG, nenhum defeito | `G-N3-retrato.txt` |
| **A-N3-5 — S1** | **atende para S1**: cinco estados × quatro colunas (Tab/AVD × paisagem/retrato), todo alvo ≥ 48 e com `testID`, os mesmos ids nas quatro | `G5G6-S1.txt` |
| **A-N3-7 — S1** | **atende para S1**: sem rede 66,2 e salvo-não-relido 66,2 (68 na folha), nenhum dos dois elidido, a ação à direita e centrada; em C, 48 e **nenhum `bounds` diferente** (A-N3-2). A regra é do componente: S2, reordenar e picker a herdam. As outras três amostras (falhou, limite, teto de 100) são de S2 — S1 não tem estado de limite (div. 413) | `dumps-ret/*aviso*`, `*salvo*`; `G-inv-B5.txt` |

## 7. O que a N3-PR3 fechou (S2 na faixa B)

Evidência em [`N3-PR3-anexos/`](N3-PR3-anexos/README.md); decisão, erratas e divergências no `DESIGN-N3/README.md` §9 (N3-D29; N3-E13, N3-E14; divs. 418–424). S2 lê a faixa (`useFaixa()`), com os tokens `s2` do `theme.ts`: em B, coluna única nas duas entradas e os rótulos curtos da faixa.

| # | estado | evidência |
|---|---|---|
| **A-N3-2** | **atende de novo**: 34/34 (B5) e 18/18 (palco); os 52 dumps de paisagem iguais aos da N3-PR2 byte a byte | `G-inv-B5.txt`, `G-inv-palco.txt` |
| **A-N3-3 — S2** | **B atende**: S2e e S2p conferem com `N3-B-S2e` e `N3-B-S2p` no Tab e no AVD (barra 88,0 · faixa 64,0 com soma 688,4 · linha 663,1 × 116,0 no mesmo x · `remover` 48,0), com a N3-E13 (título 398,2, tipo 84,0 — "como em C"). **A, mínimo de S2** (errata do T3-R3): sem `FATAL`; S2e com **`setlist-apagar` inalcançável** e `setlist-editar` cortado mas tocável; S2p sem controle de escrita — **herança do N5** | `medidas-s2-B.txt`, `dumps-ret/`, `inalcancaveis-A.txt`, `phone-logcat.txt` |
| **A-N3-4 — S2** | **o G-N3 passa em S2**: (e)=0 · nome-acessível=28 · rolagem=18 nos 16 pares (N3-D29); (d′) = 32, conferidos no PNG, nenhum defeito; 4 dp = 0 depois do `medidas.json` com as erratas (div. 424) | `G-N3-retrato.txt`, `G-N3-retrato-commit4.txt`, `CN-g-n3.txt` |
| **A-N3-5 — S2** | **atende para S2**: oito estados × quatro colunas, todo alvo ≥ 48 e com `testID`, os mesmos ids nas quatro | `G5G6-S2.txt` |
| **A-N3-6** | **atende**: em B, `picker-abrir` com `Adicionar` e `content-desc` `Adicionar música`; `setlist-apagar` com `Apagar` e `Apagar setlist`; `gate:a20` 0 acusações | `dumps-ret/`, `a20-commit2.txt` |
| **A-N3-7 — S2** | **atende**: as cinco amostras em B — sem rede 66,2 · salvo-não-relido 66,2 · falhou 66,2 · limite 48,0 · teto de 100 48,0 (N3-E14: uma linha no app) —, nenhuma elidida; em C, nenhum `bounds` diferente (A-N3-2). Com a de limite, a div. 413 fica fechada | `medidas-s2-B.txt` |

## 8. O que a N3-PR4 fechou (reordenar, folha e diálogo na faixa B)

Evidência em [`N3-PR4-anexos/`](N3-PR4-anexos/README.md); errata e divergências no `DESIGN-N3/README.md` §9 (N3-E15; divs. 425–431). O reordenar e a folha leem a faixa (`useFaixa()`), com os tokens `reordenar` e `folha` do `theme.ts`; o diálogo "em B passa" e não muda.

| # | estado | evidência |
|---|---|---|
| **A-N3-2** | **atende de novo**: 34/34 (B5) e 18/18 (palco); os 52 dumps de paisagem iguais aos da N3-PR3 byte a byte | `G-inv-B5.txt`, `G-inv-palco.txt` |
| **A-N3-3 — reordenar, folha, diálogo** | **B atende**: o reordenar confere com `N3-B-reordenar` (barra 144,0 · linha 663,1 × 72,0 · alça 48 × 72 · artista mínimo 60,0 · `Cancelar` 94,7 · motivo 237,8 · `Salvar a ordem` 191,6), nos estados da N2 (arrastando, salvando, falhou com o arrasto, 400 com o arrasto descartado); a folha confere com `N3-B-F-validacao` (663,1 a 96,0, botões numa linha, acima do teclado: `form-salvar` termina em 487,6 com o teclado em 752,4/761,3), com a **N3-E15** (altura 424,4); o diálogo, 620 × 300, passa. **A, mínimo** (errata do T3-R3): sem `FATAL`; reordenar e folha sem controle de escrita inalcançável (a folha com `form-cancelar` e `form-salvar` **cortados**, tocados com efeito — div. 425); o diálogo **não abre** em A (a entrada, `setlist-apagar`, é inalcançável desde a N3-PR3) — **herança do N5** | `medidas-r-f-B.txt`, `teclado.txt`, `dumps-ret/`, `inalcancaveis-A.txt`, `phone-logcat.txt` |
| **A-N3-4 — reordenar, folha, diálogo** | **o G-N3 passa**: (e)=0 · nome-acessível=0 · rolagem=0 nos 28 pares; 4 dp = 0; (d′) = 78, conferidos no PNG, nenhum defeito | `G-N3-retrato.txt` |
| **A-N3-5 — reordenar, folha, diálogo** | **atende**: 14 estados × quatro colunas, todo alvo ≥ 48 e com `testID`, os mesmos ids nas quatro | `G5G6-r-f.txt` |

**A div. 417** (a folha no celular), medida de novo: não fecha, e o destino N5 fica confirmado — a lista da folha em A deixa de ter controle inalcançável, mas os dois botões da linha só aparecem pela ponta (div. 425).

## 9. O que a N3-PR5 fechou (a barra superior do palco em B, e as provas de "passa")

Evidência em [`N3-PR5-anexos/`](N3-PR5-anexos/README.md); errata e divergências no `DESIGN-N3/README.md` §9 (N3-E16; divs. 433–444). O palco lê a faixa (`useFaixa()`) com o token `palco` do `theme.ts` — **só a barra superior**: 64 em C, 88 em B em duas linhas (N3-D13). Picker, S0, S4 e S5 *"em B passam"* e não mudam. Com esta PR, **toda superfície da T3-R3 tem B implementada ou provada**.

| # | estado | evidência |
|---|---|---|
| **A-N3-2** | **atende de novo**: 34/34 (B5) e **18/18 (palco)**; os 52 dumps de paisagem iguais aos da N3-PR4 byte a byte | `G-inv-B5.txt`, `G-inv-palco.txt` |
| **A-N3-3 — palco** | **B atende**: `N3-B-S3` nos dez estados do palco (S3a 1ª, S3b claro e escuro, S3c, S3d, S3e, título longo, última, placeholder, A14) no Tab e no AVD — barra 88,0 em duas linhas · título 663,1 · corpo 869,8 (AVD; 881,8 no Tab) · zonas 106,7 · a base **nó a nó** a do pre-check —, com a **N3-E16** (a soma da base, controles de 66). As zonas de 106,7 navegam a 104 dp da borda e não a 112. **A, mínimo** (errata do T3-R3): sem `FATAL`; o palco não tem controle de escrita, e em A `busca` e `sair` ficam sem nó e `indice` cortado — **herança do N5** (`N3-A-S3`, N3-D14) | `medidas-palco-B.txt`, `base-igual.txt`, `zonas-B.txt`, `dumps-ret/`, `inalcancaveis-A.txt`, `phone-logcat.txt` |
| **A-N3-3 — picker, S0, S4, S5** | **B passa, provado**: os dumps de retrato têm **os mesmos `bounds` do pre-check**, 12 de 12 (picker vazio e resultados, S4 vazio e resultados, S5 nos dois aparelhos; S0 login e erro no AVD). O `picker-relendo` (sem par no pre-check, div. 436), pelo G-N3 | `prova-passa.txt` |
| **A-N3-4 — palco e provas** | **o G-N3 passa**: (e)=0 · nome-acessível=0 · rolagem=0 nos 34 pares; 4 dp = 0; (d′) = 108, conferidos no PNG, nenhum defeito | `G-N3-retrato.txt` |
| **A-N3-5 — palco e provas** | **atende**: 20 estados × quatro colunas, todo alvo ≥ 48 e com `testID`, os mesmos ids nas quatro (o S0 só no AVD, div. 436) | `G5G6-palco.txt` |
| **T1-R27 / A14 em B** | **atende**: girar o palco da música 3 dá `rotation=portrait n=3/8` e `3 DE 8`, e a volta `rotation=landscape n=3/8`; a barra muda de forma (64 ↔ 88), a posição fica — errata no `PRD-TELA-1.md` | `a14-retrato.txt` |

**A div. 442** fica com o Marcel: em B a barra superior da S5 continua com 64 (*"passa"*), e a do palco tem 88.

## 10. O que a N3-PR6 fechou (o aceite completo em B) — e o que ficou aberto

Evidência em [`N3-PR6-anexos/`](N3-PR6-anexos/README.md); erratas e divergências no `DESIGN-N3/README.md` §9 (N3-E17, N3-E18; divs. 445–456). A S5 lê o token da barra do palco (N3-E17); o picker ganha o token `picker` da linha que falha (N3-E18, o defeito que o aceite achou, consertado nesta PR por decisão do Marcel).

| # | estado | evidência |
|---|---|---|
| **A-N3-1** | **fechado** (N3-PR1): `faixa=C w=1137.8` · `B w=711.1` · `A w=411.4` · `B w=914.3`, limiar numa ocorrência. Nesta PR, de novo no celular: 31 linhas `faixa=A w=411.4` e 31 `faixa=B w=914.3` na sessão | `N3-PR1-anexos/faixa-*.txt`; `N3-PR6-anexos/phone-logcat.txt` |
| **A-N3-2** | **fechado**: G-inv 34/34 e 18/18 em toda PR de implementação (PR1…PR6) e, **no fim de tudo**, sobre o build do conserto da N3-E18: 34/34 e 18/18 | `N3-PR6-anexos/G-inv-commit2.txt`, `G-inv-final.txt` |
| **A-N3-3** | **fechado**. **B**: toda superfície confere com a sua moldura ou prova o "passa" (PR2…PR5), mais a S5 com a barra de 88 (N3-E17: salto 0) e o picker com falha e limite em dois andares (N3-E18). **A**, em pé: nenhum crash e a **lista final** — inalcançáveis `setlist-apagar` (e com ele o diálogo), `busca` e `sair` do palco; cortados e tocados, `setlist-editar`, `form-cancelar`, `form-salvar`, `indice`. **Celular deitado** (a primeira prova do bloco): nada inalcançável, a folha passa do fundo da janela. FATAL 0 | `N3-PR6-anexos/s5-barra.txt`, `CN-E18-*.txt`, `inalcancaveis-A.txt`, `phone-logcat.txt` |
| **A-N3-4** | **fechado**: o G-N3 reprovou a `main` de antes (N3-PR1) e passa no bloco inteiro — **102 pares, (e)=0 · nome-acessível=28 · rolagem=18 · 4 dp = 0**, um relatório só; (d′) = 354, conferidos no PNG. As doze medidas da folha, na N3-PR1 | `N3-PR6-anexos/G-N3-consolidado.txt` (e o controle com o defeito, `G-N3-controle-defeito.txt`: (e)=2) |
| **A-N3-5** | **fechado para o N2 e para 13 das 20 molduras do V1; aberto para 7**. G5/G6 consolidados: 55 estados × quatro colunas, 209 de 220 células (as 11 vazias por construção: S0 só no AVD, div. 436; J3 e A14 numa orientação), todo alvo ≥ 48 e com `testID`, os mesmos ids nas quatro. **As 18 molduras do N2** e os estados de edição têm dump nas quatro colunas. **Do V1, 7 não**: `S1a` (sincronizando sem cache) e `S1d` (offline sem cache) pedem o app sem cache nenhum; `S2-invalidos` e `S3-nobody` pedem a fixture de itens sem corpo (o `placeholder` da N3-PR5 é a música ausente da biblioteca, outro estado); `S3-avulsa` (o palco aberto pela busca), `S4b` (busca sem resultados) e `S5-n-grande` (60 músicas) não estão em nenhum roteiro do bloco — a folha não os desenha em B, e as capturas são de paisagem só (V1-PR7). **Razão de ficarem abertos**: nenhum arnês do N3 os alcança; é arnês novo, não tela. Destino: o encerramento do N3 decide (herança, item 10) | `N3-PR6-anexos/G5G6-consolidado.txt` |
| **A-N3-6** | **fechado** (N3-PR3): `Adicionar`/`Adicionar música`, `Apagar`/`Apagar setlist`, `gate:a20` 0 — e de novo nesta PR: nome-acessível = 28 no G-N3, a20 0 | `N3-PR3-anexos/a20-commit2.txt`; `N3-PR6-anexos/gates-E18.txt` |
| **A-N3-7** | **fechado**: a linha de aviso em **toda superfície que a tem**, retrato, Tab = AVD — sem rede, salvo-não-relido e falhou **66,2**; limite e acima de 100 **48,0**; no picker +0,9 (o fio do rodapé, div. 449); nenhum motivo elidido; a folha tem o cartão `form-falha` (87,6); em C **48,0** em todo estado e nenhum `bounds` de C mudou. A matriz de quem tem o quê (div. 448) no README dos anexos, §3 | `N3-PR6-anexos/medidas-x.txt` |

**T3-R1…R7**: atendidos, com o A-N3-5 aberto nos 7 estados do V1 acima.

**Herança nova, com destino** (acrescenta ao §4):

| # | item | origem | destino |
|---|---|---|---|
| 10 | os 7 estados do V1 sem dump de retrato (`S1a`, `S1d`, `S2-invalidos`, `S3-nobody`, `S3-avulsa`, `S4b`, `S5-n-grande`) — A-N3-5 | N3-PR6 | **encerramento do N3** (decide: arnês novo no bloco, ou herança) |
| 11 | em B, o teclado encaixado cobre o rodapé do picker (`Concluir`): um gesto a mais no J3 em retrato | div. 450 | **com o Marcel** (desenho) |
| 12 | na S5 em B, o `8 DE 8` centrado nos 88 fica 16 dp abaixo da linha 1 do palco | div. 447 | **com o Marcel** |

## 11. O que a N3-PR6b fechou (as sete molduras do V1 em retrato) — e o defeito que ela achou

Só aceite, nenhuma linha de código. Evidência em [`N3-PR6b-anexos/`](N3-PR6b-anexos/README.md); a errata N3-E19 e
as divergências 457–461 no `DESIGN-N3/README.md` §9. As sete que a N3-PR6 deixou abertas, cada uma com a receita no
mock (store apagado + `atraso`; store apagado + avião; inválidos `no-body`/`unknown-type` na setlist; a busca do S1;
`xablau`; a setlist de 60), capturadas **nas quatro colunas** (Tab × AVD, paisagem × retrato).

| # | estado | evidência |
|---|---|---|
| **A-N3-5** | **fechado**: **as 20 molduras do V1** (as 22 do §7 do DESIGN-V1 menos as duas de proposta, que não existem no app) **e as 18 do N2** alcançadas nas duas orientações do tablet. As sete desta PR: 7 estados × quatro colunas, **28 de 28 células**, todo alvo ≥ 48 dp e com `testID`, os mesmos ids nas quatro; as linhas inválidas (9 e 10) conferidas no rolado. O S0 segue só no AVD (div. 436), como na N3-PR6. **G-N3 das sete: 14 pares, (e)=0 · nome-acessível=4 · rolagem=4 · 4 dp = 0**; (d′) = 10, conferidos no PNG, nenhum defeito | `N3-PR6b-anexos/G5G6.txt`, `G-N3.txt` |
| **A-N3-3** | **reaberto num ponto**: a `S5-n-grande` em B — a fileira de marcas calcula contra 900 dp fixos e passa da janela de 711,1 a partir de N = 19 (com 60: 48 de 60 marcas no dump, as das pontas cortadas). É a H-N3-3 do pre-check, agora medida. Div. 461; **registrado, não consertado** | `N3-PR6b-anexos/s5-marcas.txt` |

**T3-R5**: atendido. **T3-R3** (B): atendido, salvo a div. 461.

**Herança, com destino** (atualiza o §10):

| # | item | origem | destino |
|---|---|---|---|
| 10 | os 7 estados do V1 sem dump de retrato — A-N3-5 | N3-PR6 | **fechado** pela N3-PR6b |
| 11 | em B, o teclado encaixado cobre o rodapé do picker (`Concluir`) | div. 450 | **polimento do nativo, pós-N3** (decisão do Marcel): o rodapé acima do teclado, com aceite nas três faixas |
| 12 | na S5 em B, o `8 DE 8` centrado nos 88 fica 16 dp abaixo da linha 1 do palco | div. 447 | **fechado**: N3-E19, *"decisão: sem alinhamento no N3"* |
| 13 | na S5 em B, com N ≥ 19 a fileira de marcas passa da janela (e nenhum gate a vê) | div. 461 | **com o Marcel** (o conserto e o gate) |

## 12. O que a N3-PR6c fechou (o (b) no G-N3 e a fileira da S5 por faixa)

Evidência em [`N3-PR6c-anexos/`](N3-PR6c-anexos/README.md); a errata N3-E20 e as divergências 462–466 no
`DESIGN-N3/README.md` §9.

| # | estado | evidência |
|---|---|---|
| **div. 461** | **fechada** (N3-E20): a fileira de marcas da S5 é token de faixa — 900 em C, **663** em B. Em retrato, Tab = AVD: N = 60 → 60 de 60 marcas dentro da janela (28,0 → 683,1); N = 19 → 660 dp; N = 18 → 661; N = 8 → a de antes | `N3-PR6c-anexos/s5-marcas.txt` |
| **A-N3-3** | **fechado de novo**: a S5 em B com N = 60, 19, 18 e 8 — G-N3 (e)=0 · **(b)=0**, G5/G6 16 de 16 | `G-N3-S5.txt`, `G5G6-S5.txt` |
| **A-N3-2** | **fechado** no build do conserto: G-inv **34/34** e **18/18**; a paisagem da S5 com 60, nó a nó, igual à da N3-PR6b | `G-inv-final.txt`, `G-inv-S5-60-pai.txt` |
| **A-N3-4** | o G-N3 ganha o **(b) corte** (reprova, contagem própria). O consolidado da N3-PR6 (102 pares) dá **(b)=0**; a S5 da N3-PR6b dá (b)=4; o picker de antes da N3-E18, (b)=6; e o (b) é igual ao do pre-check em 105 de 105 dumps | `cn-n3pr6c-commit1.txt` |
| **H-N3-3** | **fechada como medida**: derivada no pre-check (*"o S5 com N ≥ 24 transborda abaixo de ~883 dp"*), medida na N3-PR6b (em B a partir de N = 19), consertada aqui | `N3-PRECHECK.md` §H |

**Herança** (atualiza o §11):

| # | item | origem | destino |
|---|---|---|---|
| 13 | na S5 em B, com N ≥ 19 a fileira de marcas passava da janela | div. 461 | **fechado** (N3-E20) |
| 14 | os quatro AppleDouble `._*` no cache do app no Tab (163 B cada, a div. 420) | N3-PR6b | **ficam onde estão** (decisão do Marcel): nota para o encerramento do N3 |
