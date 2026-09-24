# DESIGN-N3 — as três faixas de largura

Congelado no **N3 · PR de desenho**, 2026-09-24. Molde: [`docs/native/DESIGN-N2/README.md`](../DESIGN-N2/README.md). Os requisitos e aceites que as PRs de implementação medem contra esta folha estão em [`docs/native/N3-REQUISITOS.md`](../N3-REQUISITOS.md) — o N3 não teve PRD separado.

Conteúdo desta pasta:

| arquivo | o que é |
| --- | --- |
| `README.md` | este documento — as decisões, o aval, as medidas a conferir e o aparato |
| `telas.html` | as 27 molduras, arquivo único offline (`Octavia N3 · as três faixas de largura`) |
| `telas.pdf` | impressão do mesmo arquivo |
| `SHA256SUMS` | impressão digital dos dois congelados (o README fica **fora**, como no N2) |

---

## 1 · O que este design é

**Três faixas de largura útil da janela**, cada uma congelada em dp:

| faixa | largura | desenhada em | o que é |
| --- | --- | --- | --- |
| **C** | **> 960** dp | 1138 × 627 | o congelado **V1/N2** — **não muda** (N3-D3) |
| **B** | **700–960** dp | **711 × 1054** | tablet em retrato; janela reduzida |
| **A** | **< 700** dp | **411 × 874** | celular em retrato — desenhada no N3, implementada no **N5** (N3-D0) |

O limite **A | B em 700** é da **N3-D12** (errata da N3-D8, que dizia 600); o cabeçalho da folha ainda diz "600–960" e "< 600" — [div. 393](#9--divergências-e-erratas).

O que a folha traz, medido no arquivo congelado:

| | quanto | como se conta |
| --- | --- | --- |
| molduras | **27**: 8 em B (711 × 1054), 16 em A (411 × 874), 3 de A em 699 × 1054 (R1·2) | as legendas `N3-B-…`, `N3-A-…` e `N3-A699-…` com dimensão, no documento interno do `telas.html` `[medido]`; o chip da folha diz "27 molduras" |
| amostras da linha de aviso | **10** em tamanho real: os cinco estados do N2 em B e em A | §10 da folha (`N3-B-X-…`, `N3-A-X-…`) |
| frases novas | **0** | chip da folha; `Adicionar` e `Apagar` na faixa são frases **existentes** (N3-D17) |
| ícones novos | **0** — o catálogo continua em **39** | seção "ícones" da folha |
| `testID` | **inalterados**: nenhum novo, renomeado ou removido; a folha dá a **posição** de cada um por faixa | seção "testIDs" da folha (§7 abaixo) |
| perguntas | **13**, todas respondidas (Q1–Q12 na revisão 1, Q13 na revisão 2) | §5 |
| propostas | **3** (P1–P3), com destino na N3-D25 | §5 |

**A regra única da folha**, verbatim: *"quando não cabe, a composição empilha; o conteúdo não sai."* Linha de controles vira duas linhas, cartão cresce em altura, grade de duas colunas vira uma. **Nenhum controle some, nenhum texto de leitura encolhe**; a única exceção é o display de S5 na faixa A (N3-D18).

Como nas duas folhas anteriores, **nada do congelado é redesenhado**: a folha anota por cima (padrão da E16) — mesmos tokens, mesmas frases, mesmos testIDs, mesmo catálogo. É apontada do V1 pela **E18** e do N2 pela **N2-E24**.

O que ele **não** é:

- **Não muda C.** A coluna C da tabela "0 · o sistema em uma tabela" da folha é o congelado repetido como controle; a invariante é gate (T3-R2).
- **Não redesenha o corpo do palco.** O corpo não quebra linha em nenhuma faixa (N3-D15); a quebra na letra é bloco próprio, pré-requisito do N5.
- **Não decide por componente.** Tudo decide pela faixa (N3-D24); a regra de componente fica registrada na §11 da folha como herança do bloco iOS.
- **Não é implementação.** Nenhuma linha de código nesta PR.

---

## 2 · Decisões do Marcel no desenho — N3-D12…D25

Texto verbatim da decisão (2026-09-24). Q1–Q12 foram respondidas na revisão 1, a Q13 na revisão 2.

**N3-D12** (Q1) Limite A|B em **700** dp; B vale 700–960. Errata da N3-D8.

**N3-D13** (Q2) Palco em B: barra superior de 88 em duas linhas; corpo 870; base igual a C.

**N3-D14** (Q3) Palco em A: índice, busca e sair na barra superior (144); leitura na base (96).

**N3-D15** (Q4) O corpo do palco não quebra linha em nenhuma faixa; a quebra na letra (nunca na tab) é **bloco próprio e pré-requisito do N5** (celular).

**N3-D16** (Q5) Faixa de edição em A: duas linhas de 48 (128), os dois grupos de C; sem menu.

**N3-D17** (Q6) `Adicionar` e `Apagar` como rótulos curtos da faixa em B e A são frases **existentes**; nome acessível longo (`Adicionar música`, `Apagar setlist`).

**N3-D18** (Q7) Display de S5 em A: 32 dp, .2em, uma linha.

**N3-D19** (Q8) A linha de aviso cresce (48 mín., +20 por linha) e nunca elide; regra do componente, válida também em C — onde hoje nada muda visivelmente (a invariante confirma).

**N3-D20** (Q9) Folha em A: cartão ancorado no topo, margem 16, acima do teclado; sem gesto de arrastar.

**N3-D21** (Q10) O chip de S1 empilhado em B não é frase nova.

**N3-D22** (Q11) Diálogo em A: botões empilhados, `Manter a setlist` em cima, `Apagar` embaixo.

**N3-D23** (Q12) A implementação entrega dumps de B e A no formato do `MEDIDAS.md`; diferença **> 4 dp** contra a tabela de origem da folha é errata. As dez `[estimado]` se medem primeiro, na ordem da folha.

**N3-D24** (Q13) Tudo decide pela faixa; 700 vale para todos os componentes. A regra de componente (limiares 667,5 / 474 / 430) fica registrada como herança do bloco iOS (iPad em janela).

**N3-D25** P1 (FAB do dev client) → hipótese de aparato; P2 (faixa como tokens no `theme.ts`) → decisão da PR-1 de implementação, com a invariante de C medida; P3 → fora.

---

## 3 · O aval do revisor

Duas revisões antes do aval. **Nenhuma mudou o que estava desenhado**; a primeira acrescentou quatro coisas e corrigiu um número, a segunda decidiu a Q13.

### 3.1 Revisão 1 — quatro acréscimos (R1·1 … R1·4)

| # | o que faltava | o que entrou na folha |
| --- | --- | --- |
| **R1·1** | o palco em A só tinha o estado de letra | **§7b**: `N3-A-S3-baixando` e `N3-A-S3-erro`, com a regra de separação das barras — o inerte fica todo embaixo (leitura), o ativo todo em cima (índice, busca e sair: dá para sair de uma música que não baixou); os demais estados de S3 (claro, avulsa, PDF, nobody, sem conexão, auto-scroll ligado) **por analogia**, descritos em uma linha cada |
| **R1·2** | o pior caso de A é o **mais largo**, e ninguém o tinha olhado | **§11**: três molduras em **699 × 1054** (`N3-A699-S1`, `N3-A699-S2e`, `N3-A699-F`). Resultado: nada quebra em 699; em três componentes a folga é tanta que a composição de A desperdiça altura — de onde nasceu a Q13 |
| **R1·3** | o corte das linhas do corpo do palco em A (≈ 26 colunas em 22 dp) não tinha destino | registro verbatim na folha: *"o corpo do palco em A não quebra linha; a quebra na letra (nunca na tab) é bloco próprio e pré-requisito do bloco de celular (N5)"* — é a **N3-D15** |
| **R1·4** | as medidas não diziam de onde vinham | a **tabela de medidas por origem** — `[captura]`, `[medido]`, `[token]`, `[C]`, `[soma]`, `[estimado]` — e a das **folgas mais apertadas**. É contra ela que a implementação mede, com tolerância de 4 dp (N3-D23) |

**Número corrigido na revisão 1**: `Salvar a ordem` mede **191** `[captura]`, não ≈ 186.

### 3.2 Revisão 2 — a Q13

A Q13 (que a R1·2 devolveu) foi decidida **não**: tudo segue a faixa, e em 600–699 vale a composição de A inteira, como nas três molduras da §11. A regra de componente fica registrada na folha como alternativa, com os três limiares medidos, marcada **herança do bloco iOS: iPad em janela** (N3-D24). *"Nada mais muda."*

---

## 4 · As medidas a conferir primeiro

A tabela "medidas por origem" da folha (R1·4) tem seis origens. As **`[estimado]`** e as **`[soma]`** são contas do designer, *"as primeiras a conferir"* (folha); a **N3-D23** manda medi-las **primeiro, na ordem da folha**, e diferença **> 4 dp** contra o dump é errata desta folha (N3-E1, N3-E2, …).

### 4.1 As dez `[estimado]` e as duas `[soma]`, na ordem da folha

| # | elemento | valor da folha | origem | conta da folha |
| --- | --- | --- | --- | --- |
| s1 | `FIM DA SETLIST` em 32 (S5, A) | **334** | `[soma]` | 543 × 32 / 52 |
| e1 | `Adicionar` (faixa, rótulo curto) | **137** | `[estimado]` | 188 − 7,4 × 7 caracteres (7,4 dp/caractere da captura) |
| e2 | `Apagar` (faixa, rótulo curto) | **115** | `[estimado]` | idem, a partir de `Adicionar música` |
| s2 | `Apagar setlist` (faixa, C) | **≈ 169** | `[soma]` | 788,5 do brief − os três medidos − margens e vãos |
| e3 | motivo `nada mudou desde que você abriu` | **≈ 205** | `[estimado]` | 13 dp, 31 caracteres |
| e4 | chip `sem conexão` empilhado (B) | **≈ 198** | `[estimado]` | 20 + 8 + "última sincronização agora" em 13 |
| e5 | chip `sem conexão` em uma linha (A) | **≈ 292** | `[estimado]` | — |
| e6 | frase de aviso de S1 sem rede | **≈ 800** | `[estimado]` | 14 dp, 112 caracteres |
| e7 | título `Reordenar · Ensaio de retrato` | **≈ 464** | `[estimado]` | 29 caracteres a 16 dp (da captura de 271) |
| e8 | régua do picker (rótulo + contador) | **≈ 400** | `[estimado]` | mono 12, .14em |
| e9 | marca `já na setlist · 2×` | **≈ 108** | `[estimado]` | 20 + 8 + texto 13 |
| e10 | `Tentar de novo` (linha do picker) | **≈ 170** | `[estimado]` | — |

A tabela da folha tem uma terceira linha `[soma]` — *"barras novas 144 · 152 · 168 · 184 · 200 · faixa 128"* —, que é um **grupo** de alturas sem valor único de largura; ela se confere nos dumps de cada superfície, pela soma declarada na nota da seção ([div. 396](#9--divergências-e-erratas)).

**A folga que depende de estimativa**: a faixa de edição em B soma **683,5 de 711** (27,5 de folga) com e1 e e2 dentro; *"se estourar, faixa de A (duas linhas)"* (folha, "as folgas mais apertadas"). É por isso que o `Adicionar` é a primeira errata provável.

### 4.2 Conferência prévia dos `[captura]` contra os dumps de retrato que já existem — **extra-1**

**Declarado como extra**: a folha mede larguras nas capturas do brief; os dumps de retrato do pre-check (`N3-PRECHECK-anexos/B2/`, AVD `octavia_tab32` a 711,1 dp; `B4/`, `octavia_phone` a 411,4 dp) já têm o nó de boa parte desses elementos, **no estado de hoje** (composição C espremida em retrato — o elemento é o mesmo, a largura do botão depende só do rótulo). `[medido]`: `bounds` ÷ 2,25 (tablet) ou ÷ 2,625 (celular), script ad hoc no scratch da sessão, sem arquivo novo no repositório.

| elemento | folha | dump | Δ | dump de origem |
| --- | --- | --- | --- | --- |
| `Adicionar música` (faixa) | 188 | 188,9 | 0,9 | `B2-S2-com-edicao-avd.xml`, `picker-abrir` |
| `Reordenar` (faixa) | 142,5 | 143,1 | 0,6 | idem, `reordenar` |
| `Renomear e datar` (faixa) | 193 | 193,8 | 0,8 | idem, `setlist-editar` |
| `Buscar na biblioteca` | 210,2 | 210,2 | 0,0 | idem, `buscar` |
| `Salvar a ordem` | 191 | 191,6 | 0,6 | `B2-reordenar-aberto-avd.xml`, `reordenar-salvar` |
| `Cancelar` (folha) | 121 | 122,2 | 1,2 | `B2-folha-criar-avd.xml`, `form-cancelar` |
| `Criar` | 126 | 127,1 | 1,1 | idem, `form-salvar` |
| motivo `a setlist precisa de um nome` | 197 | 197,8 | 0,8 | idem, `form-salvar-motivo` |
| `Manter a setlist` | 173 | 174,2 | 1,2 | `B2-dialogo-apagar-avd.xml`, `apagar-manter` |
| `Apagar` (diálogo) | 142 | 143,1 | 1,1 | idem, `apagar-confirmar` |
| `Adicionar` (picker) | 135,5 | 136,4 | 0,9 | `B4-picker-resultados-phone-ret.xml`, `picker-adicionar-1` |
| `Concluir` | 108 | 109,0 | 1,0 | idem, `picker-concluir` |
| `Voltar ao início` · `Sair` (S5) | 227 · 118 | 227,4 · 118,5 | 0,4 · 0,5 | `B4-S5-fim-phone-ret.xml` |
| **`FIM DA SETLIST` em 52** | **543** | **550,2** | **7,2** | `B2-S5-fim-avd.xml` — [div. 395](#9--divergências-e-erratas) |
| **`Nova setlist`** (`[C]`) | **190** | **152,0** | **38,0** | `B2-S1-setlists-avd.xml`, `criar-setlist` — [div. 394](#9--divergências-e-erratas) |
| `Apagar setlist` (s2, `[soma]`) | ≈ 169 | 166,7 | 2,3 | `B5-baseline/B5-S2-com-edicao-avd-pai.xml`, `setlist-apagar` (paisagem) |

**Leitura**: das **13** linhas `[captura]` comparáveis, **12** conferem dentro de **1,2 dp** e a 13ª é o `FIM DA SETLIST` (7,2); a `[medido]` `Buscar na biblioteca` confere em 0,0 e a `[soma]` s2 dentro de 2,3. Duas passam de 4 dp e ficam como divergência com destino na N3-PR1 — **não viram errata aqui**, porque a N3-D23 manda a errata nascer do dump da implementação, e esta seção é só antecipação. O divisor que a folha declara para B (2,127) não é o fator do aparelho (2,25), mas os valores conferem — [div. 399](#9--divergências-e-erratas).

---

## 5 · Perguntas do designer — Q1…Q13, e as propostas

Histórico da decisão. As recomendações são as da folha; as respostas, as decisões da §2.

| # | pergunta | recomendação da folha | decisão |
| --- | --- | --- | --- |
| **Q1** | B começa em 600, mas a faixa de S2e pede 683,5 dp: entre 600 e 683 ela quebra de novo | mover o limite A \| B para 700; de 600 a 699 vale a composição de A | **N3-D12** (condicionada à R1·2, que devolveu a Q13) |
| **Q2** | barra superior do palco em B com 88 em duas linhas, tirando 24 dp do corpo? | sim — título de 405 elidido para 663; corpo de 870 | **N3-D13** |
| **Q3** | palco em A: navegação na barra superior, ou base em duas linhas (172)? | barra superior — grupos de C juntos, controles de 64, corpo 20 dp maior | **N3-D14** |
| **Q4** | o corpo do palco não quebra linha; em A cabem ≈ 26 colunas. Fica assim? | bloco próprio, fora do N3: quebra na letra, nunca na tab | **N3-D15** (R1·3) |
| **Q5** | faixa de edição em A com duas linhas de 48 (128)? | sim; nenhum par de ícones sozinhos resolve (faltam 20,5 dp) e menu não | **N3-D16** |
| **Q6** | `Adicionar` e `Apagar` na faixa contam como frase nova? | não — existentes, com o nome acessível longo | **N3-D17** |
| **Q7** | degrau do display em A: 32, .2em, uma linha? | 32 — ocupa 334 de 379; 36 sem folga, 28 empata com títulos | **N3-D18** |
| **Q8** | a linha de aviso cresce em vez de elidir? | sim, e a regra vale também em C | **N3-D19** |
| **Q9** | folha em A como cartão no topo, não folha inferior? | sim — sem gesto de sistema, sempre acima do teclado | **N3-D20** |
| **Q10** | o chip de S1 empilhado em B, sem o "·", muda a frase? | não — a quebra faz o papel do separador | **N3-D21** |
| **Q11** | diálogo de A: `Manter a setlist` em cima, `Apagar` embaixo? | sim — ordem de leitura de C | **N3-D22** |
| **Q12** | quem confere as larguras e as somas? | dumps de B e A no formato do `MEDIDAS.md`; > 4 dp é errata | **N3-D23** |
| **Q13** | em 699, três componentes caberiam na forma de B: seguem a faixa ou decidem pela própria largura? | pela própria largura, com os limiares medidos | **N3-D24 — não**: tudo pela faixa; a regra de componente é herança do iOS |

| proposta | o que é | destino (N3-D25) |
| --- | --- | --- |
| **P1** | tirar o FAB do dev client do canto superior direito (tampa controles nas capturas de retrato) | **hipótese de aparato** — `APARATO.md`, com dono na N3-PR1 |
| **P2** | a faixa como troca de valores no `theme.ts` (margem, barras, linhas da faixa como tokens por faixa) | **decisão da PR-1 de implementação**, com a invariante de C medida |
| **P3** | palco A: barras recolhem durante o auto-scroll | **fora** |

---

## 6 · Aparato

| item | valor |
| --- | --- |
| **desenho** | Claude Design, contra o brief e as capturas; **não leu o código** |
| **capturas de origem** | [`N3-PRECHECK-anexos/`](../N3-PRECHECK-anexos/README.md) (§5.2 do pre-check): `B2/B2-*-avd.png` e `-tab.png` (711,1 dp), `B4/B4-*-phone-ret.png` (411,4) e `-phone-pai.png`, `B5-baseline/` e `B3-referencia-paisagem/` (o congelado de partida); os XML ao lado de cada PNG. Todas de **fixture do projeto**, sem letra de terceiro |
| **canvas medido** | faixa B: **711,1 × 1053,8 dp** — AVD `octavia_tab32` em retrato, o pior caso (o Tab S6 dá 711,1 × 1065,8); faixa A: **411,4 × 874,3 dp** — `octavia_phone` em retrato (`N3-PRECHECK-anexos/B1-janelas.txt`, pre-check §2.1) |
| **canvas desenhado** | **711 × 1054** e **411 × 874**; as três molduras da R1·2 em **699 × 1054** |
| **sha do levantamento** | **`aa91b5d`** (merge da #323, W4 encerrado) — a árvore das capturas do pre-check (div. 382) |
| **bundle das capturas** | conferido antes de cada rodada (regra 13 ampliada): `localhost:8788` 1 · `octavia.rocks` **0** · `lru over` 2 · `jaVoando.guaranteed` 1 (pre-check §2.3) |
| **conta e rede** | mock (`aceite.py servidor`, 8788) com a fixture do pre-check; **nenhuma escrita em prod, nenhum request a `octavia.rocks`** |
| **origem dos arquivos** | `~/Downloads/design-n3/telas.html` e `telas.pdf`, copiados sem alteração (`cmp` idêntico) |
| **revisões** | duas (§3), aplicadas no arquivo congelado |
| **aval** | Marcel, 2026-09-24 — as catorze decisões da §2 |

**Fonte dos tokens**: `DESIGN-V1/README.md` §3–§5. Nenhum token novo nasce nesta folha; se a P2 for adotada, é a PR-1 que o decide.

**O que prova o congelamento**: o `SHA256SUMS` desta pasta, com os dois arquivos, **sem o `README.md`** — pela mesma razão do N2 (a div. 223 do V1). `[medido]`:

```
$ shasum -a 256 telas.html telas.pdf > SHA256SUMS && cat SHA256SUMS && shasum -a 256 -c SHA256SUMS
1b52170881ba8396014b173d22ea3a52a8b2d83d1de35f6304b2a32253ad99c7  telas.html
b2e782f45df8a40cd9c02bbf293398ab4fdf3e2a5dcc49a8309687eb613d587b  telas.pdf
telas.html: OK
telas.pdf: OK
```

O `gates-nativos` do CI ainda **não** confere esta pasta: o laço do `gates.yml:77` lista só `DESIGN-V1` e `DESIGN-N2` ([div. 398](#9--divergências-e-erratas)).

---

## 7 · testIDs — os mesmos, com posição por faixa

**Nenhum id novo, nenhum renomeado, nenhum removido.** A folha traz, na seção "testIDs", a posição de cada um em C, B e A (19 linhas); ela é a referência do G6 nas quatro colunas (T3-R5) e **não é transcrita aqui** — o congelado é a fonte. Os de S0, S5, do chip de sync e de `Baixar esta setlist` são os do V1 e a folha não os lista (os dumps não os trazem).

Duas mudanças de **posição** que o G6 vai notar e que são desenho, não defeito: em A, `indice` · `busca` · `sair` sobem para a barra superior do palco (N3-D14); em A, `apagar-manter` fica **acima** de `apagar-confirmar` (N3-D22).

---

## 8 · O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3 desenho congelado: nenhuma declaração — só docs (DESIGN-N3/, N3-REQUISITOS.md, erratas E18/N2-E24, notas de estado).
```

---

## 9 · Divergências e erratas

> **Origem**: **P** premissa do prompt · **D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros (`N1-ENCERRAMENTO.md` §7).

**Erratas desta folha: nenhuma.** A primeira nasce do dump da implementação (N3-D23), no formato **N3-E1, N3-E2, …**.

### Divergências abertas nesta PR, **393 a 399** (o pre-check parou em 392)

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **393** | D | O cabeçalho da folha diz *"Faixa B (600–960 dp, tablet em pé) … faixa A (< 600, celular em pé)"*. É o valor da N3-D8, de antes da Q1; a **N3-D12** move o limite para **700** — e a própria folha, no quadro da revisão 1 e na §11, já trabalha com 700. | **O congelado não se reescreve.** Vale a N3-D12; esta README (§1) e o `N3-REQUISITOS.md` (T3-R1) dizem 700. Quem ler só o cabeçalho da folha lê o número velho. |
| **394** | D | A tabela de origem da folha dá `Nova setlist` = **190 `[C]`** ("N2, valor desenhado"), e as somas da barra de S1 em B (*"sync 145 + 16 + 190 + 16 + 171,1 = 538"*) e da §11 usam esse número. A **N2-E6** já tinha medido **152,0 × 57,8 dp** no Tab S6, e o dump de retrato do pre-check dá o mesmo **152,0** (§4.2). Δ = 38 dp. | **Não é errata aqui** (N3-D23: a errata nasce do dump da implementação). A consequência só **folga**: a segunda linha da barra B cai de 538 para **500** em 647 úteis. Destino: a **N3-PR1** confirma no dump de B e registra a **N3-E1** se se confirmar. |
| **395** | D | `FIM DA SETLIST` em 52: a folha diz **543** `[captura]`; o nó do dump de retrato mede **550,2** (`B2-S5-fim-avd.xml`) — Δ 7,2 > 4. Causa provável: o rastreamento de .2em põe 0,2 × 52 = 10,4 dp **depois** da última letra, dentro do nó e fora da tinta (550,2 − 10,4 = 539,8). A `[soma]` s1 herda: pelo nó, 550,2 × 32 / 52 = **338,6** (folga de 40,4 em 379, contra os 45 da folha). | Destino: a **N3-PR1** registra contra qual medida o 4 dp se compara (a N3-D23 diz "dumps … no formato do `MEDIDAS.md`", que é o `bounds` do nó) e abre a errata se for o caso. Não muda desenho: 32 continua cabendo. |
| **396** | P | O prompt pede *"as dez `[estimado]` e as duas `[soma]`"*; a tabela da folha tem **três** linhas `[soma]`. A terceira é o grupo *"barras novas 144 · 152 · 168 · 184 · 200 · faixa 128"*, sem valor único. | A §4.1 lista as duas com valor (s1, s2) e registra a terceira como grupo, conferido pelas alturas nos dumps de cada superfície. |
| **397** | P | O prompt manda marcar *"o item 'retrato'"* no **`W4-ENCERRAMENTO.md` §7**. A §7 do W4 tem seis itens e nenhum é retrato; o cabeçalho dela diz que *"nada aqui repete o que já está em N3, N4 ou N5 (`N2-ENCERRAMENTO.md` §10.2–§10.8)"*. O item vive só no **`N2-ENCERRAMENTO.md` §10.7.1**. O único item do W4 §7 com destino N3 é o **§7.3** (a hipótese do ◔), já fechado pelo pre-check (H-N3-2). | Marcado só no N2 §10.7.1. **O `W4-ENCERRAMENTO.md` não foi tocado**; se o Marcel quiser o §7.3 riscado como fechado, é uma linha na próxima PR que tocar o arquivo. |
| **398** | T | O passo *"Congelados — `shasum -c`"* do `gates-nativos` (`.github/workflows/gates.yml:74-79`) itera sobre `DESIGN-V1` e `DESIGN-N2` só. O `SHA256SUMS` do DESIGN-N3 entra na `main` **sem gate que o cobre**. | Esta PR é só docs — mexer no workflow seria código. Destino: **commit 1 da N3-PR1** (o gate vem antes do que ele mede, `V1-ENCERRAMENTO.md:204`), junto com o G-N3. Conferido à mão nesta PR (§6). |
| **399** | D | A folha converte px das capturas por **2,127** em B e **2,628** em A; o fator dos aparelhos é **2,25** (360/160) e **2,625** (420/160) (`B1-janelas.txt`), e as PNGs de B têm 1600 px de largura. Pelo fator, os `[captura]` de B estariam ~6 % acima do real. | **Medido, sem consequência**: 12 dos 13 `[captura]` comparáveis conferem com os dumps dentro de 1,2 dp, e o 13º (div. 395) tem causa própria (§4.2). O 2,127 é o divisor da imagem que o designer recebeu, não do aparelho; a folha é consistente com ela mesma. Registrado para quem refizer a conta a partir do texto da folha. |

**Próxima divergência livre: 400.**
