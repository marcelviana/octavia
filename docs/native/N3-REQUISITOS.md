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
| A-N3-3 | **B**: cada superfície confere com a sua moldura `N3-B-…` (ou com C onde a folha diz "passa"); **A** e celular deitado: nenhum crash e nenhum controle de escrita inalcançável | dumps + PNG de B por superfície; roteiro de A e do celular deitado com logcat sem `FATAL` e o toque em cada controle de escrita | T3-R3 |
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
