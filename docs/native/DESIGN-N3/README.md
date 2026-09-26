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

O limite **A | B em 700** é da **N3-D12** (errata da N3-D8, que dizia 600); o cabeçalho da folha ainda diz "600–960" e "< 600", e a **N3-E1** prevalece sobre ele (§9; div. 393).

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

A tabela "medidas por origem" da folha (R1·4) tem seis origens. As **`[estimado]`** e as **`[soma]`** são contas do designer, *"as primeiras a conferir"* (folha); a **N3-D23** manda medi-las **primeiro, na ordem da folha**, e diferença **> 4 dp** contra o dump é errata desta folha (a partir da **N3-E3**; a E1 e a E2 já estão na §9).

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
| **`Nova setlist`** (`[C]`) | **190** | **152,0** | **38,0** | `B2-S1-setlists-avd.xml`, `criar-setlist` — **N3-E2** (div. 394) |
| `Apagar setlist` (s2, `[soma]`) | ≈ 169 | 166,7 | 2,3 | `B5-baseline/B5-S2-com-edicao-avd-pai.xml`, `setlist-apagar` (paisagem) |

**Leitura**: das **13** linhas `[captura]` comparáveis, **12** conferem dentro de **1,2 dp** e a 13ª é o `FIM DA SETLIST` (7,2); a `[medido]` `Buscar na biblioteca` confere em 0,0 e a `[soma]` s2 dentro de 2,3. Duas passam de 4 dp: `Nova setlist` virou a **N3-E2** (decisão do Marcel antes do merge, §9); `FIM DA SETLIST` fica como divergência com destino na N3-PR1 (div. 395). O divisor que a folha declara para B (2,127) não é o fator do aparelho (2,25), mas os valores conferem — [div. 399](#9--divergências-e-erratas).

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

**Desde a N3-PR1 confere**: o laço lista também `docs/native/DESIGN-N3` (div. 398 fechada; CN no `N3-PR1-anexos/CN-commit1.txt`). O `medidas.json` desta pasta — a tabela "medidas por origem" extraída para o G-N3 — é derivado e fica fora do `SHA256SUMS`, como este README.

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

### Erratas desta folha

*(Decisão do Marcel, 2026-09-24, antes do merge desta PR.)* As próximas nascem do dump da implementação (N3-D23), a partir da **N3-E3**.

**N3-E1 — o limite A | B é 700, não 600** (div. 393). O cabeçalho de `telas.html` diz *"Faixa B (600–960 dp, tablet em pé) … faixa A (< 600, celular em pé)"*; vale a **N3-D12**: **A < 700, B 700–960** (C > 960 não muda). O congelado não se reescreve; **esta errata prevalece sobre a moldura** — e sobre qualquer outro "600" da folha que descreva o limite das faixas.

**N3-E2 — `Nova setlist` mede 152,0 dp, não 190** (div. 394). A folha usa `Nova setlist` = **190** dp (`[C]`, "N2, valor desenhado") na tabela de origem e nas somas da barra de S1; a **N2-E6** mediu **152,0 × 57,8 dp** no Tab S6 (e o dump de retrato do pre-check dá o mesmo 152,0, §4.2). Consequência: a segunda linha da barra de S1 em B soma **145 + 16 + 152 + 16 + 171,1 = 500**, não 538, em 647 úteis — **folga de 147, não 109**. Nada muda no desenho; a implementação usa **152**.

### Divergências abertas nesta PR, **393 a 399** (o pre-check parou em 392)

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **393** | D | O cabeçalho da folha diz *"Faixa B (600–960 dp, tablet em pé) … faixa A (< 600, celular em pé)"*. É o valor da N3-D8, de antes da Q1; a **N3-D12** move o limite para **700** — e a própria folha, no quadro da revisão 1 e na §11, já trabalha com 700. | **N3-E1**. O congelado não se reescreve; vale a N3-D12, e esta README (§1) e o `N3-REQUISITOS.md` (T3-R1) dizem 700. |
| **394** | D | A tabela de origem da folha dá `Nova setlist` = **190 `[C]`** ("N2, valor desenhado"), e as somas da barra de S1 em B (*"sync 145 + 16 + 190 + 16 + 171,1 = 538"*) e da §11 usam esse número. A **N2-E6** já tinha medido **152,0 × 57,8 dp** no Tab S6, e o dump de retrato do pre-check dá o mesmo **152,0** (§4.2). Δ = 38 dp. | **N3-E2** (decisão do Marcel antes do merge). A consequência só **folga**: a segunda linha da barra B cai de 538 para **500** em 647 úteis. A N3-PR1 confere no dump de B, como qualquer medida da folha. |
| **395** | D | `FIM DA SETLIST` em 52: a folha diz **543** `[captura]`; o nó do dump de retrato mede **550,2** (`B2-S5-fim-avd.xml`) — Δ 7,2 > 4. Causa provável: o rastreamento de .2em põe 0,2 × 52 = 10,4 dp **depois** da última letra, dentro do nó e fora da tinta (550,2 − 10,4 = 539,8). A `[soma]` s1 herda: pelo nó, 550,2 × 32 / 52 = **338,6** (folga de 40,4 em 379, contra os 45 da folha). | Destino: a **N3-PR1** registra contra qual medida o 4 dp se compara (a N3-D23 diz "dumps … no formato do `MEDIDAS.md`", que é o `bounds` do nó) e abre a errata se for o caso. Não muda desenho: 32 continua cabendo. |
| **396** | P | O prompt pede *"as dez `[estimado]` e as duas `[soma]`"*; a tabela da folha tem **três** linhas `[soma]`. A terceira é o grupo *"barras novas 144 · 152 · 168 · 184 · 200 · faixa 128"*, sem valor único. | A §4.1 lista as duas com valor (s1, s2) e registra a terceira como grupo, conferido pelas alturas nos dumps de cada superfície. |
| **397** | P | O prompt manda marcar *"o item 'retrato'"* no **`W4-ENCERRAMENTO.md` §7**. A §7 do W4 tem seis itens e nenhum é retrato; o cabeçalho dela diz que *"nada aqui repete o que já está em N3, N4 ou N5 (`N2-ENCERRAMENTO.md` §10.2–§10.8)"*. O item vive só no **`N2-ENCERRAMENTO.md` §10.7.1**. O único item do W4 §7 com destino N3 é o **§7.3** (a hipótese do ◔), já fechado pelo pre-check (H-N3-2). | Marcado só no N2 §10.7.1. **O `W4-ENCERRAMENTO.md` não foi tocado**; se o Marcel quiser o §7.3 riscado como fechado, é uma linha na próxima PR que tocar o arquivo. |
| **398** | T | O passo *"Congelados — `shasum -c`"* do `gates-nativos` (`.github/workflows/gates.yml:74-79`) itera sobre `DESIGN-V1` e `DESIGN-N2` só. O `SHA256SUMS` do DESIGN-N3 entra na `main` **sem gate que o cobre**. | Esta PR é só docs — mexer no workflow seria código. Destino: **commit 1 da N3-PR1** (o gate vem antes do que ele mede, `V1-ENCERRAMENTO.md:204`), junto com o G-N3. Conferido à mão nesta PR (§6). |
| **399** | D | A folha converte px das capturas por **2,127** em B e **2,628** em A; o fator dos aparelhos é **2,25** (360/160) e **2,625** (420/160) (`B1-janelas.txt`), e as PNGs de B têm 1600 px de largura. Pelo fator, os `[captura]` de B estariam ~6 % acima do real. | **Medido, sem consequência**: 12 dos 13 `[captura]` comparáveis conferem com os dumps dentro de 1,2 dp, e o 13º (div. 395) tem causa própria (§4.2). O 2,127 é o divisor da imagem que o designer recebeu, não do aparelho; a folha é consistente com ela mesma. Registrado para quem refizer a conta a partir do texto da folha. |

### Divergência do commit das erratas, **400**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **400** | D | A **N3-D23** faz a errata nascer do **dump da implementação** (*"diferença > 4 dp contra a tabela de origem da folha é errata"*). As duas primeiras não nasceram assim: a **N3-E1** não é medida (é o cabeçalho contra a N3-D12), e a **N3-E2** vem de um dump que **já existia** — o da N2-E6, em paisagem no Tab S6, e o de retrato do pre-check —, não de um dump de B da implementação. | Decisão do Marcel, antes do merge: as duas entram agora. A N3-D23 continua valendo para as seguintes (a partir da N3-E3); a N3-PR1 confere o 152,0 no dump de B como qualquer outra medida. |

### Erratas da N3-PR1 — N3-E3 a N3-E12 (N3-D23)

Medidas pela régua de desenvolvimento no Tab S6 e no AVD `octavia_tab32` (iguais nas 24 linhas; 13 de 13 controles régua × dump iguais ao nó), na ordem da folha; tabela completa e contas em [`N3-PR1-anexos/README.md`](../N3-PR1-anexos/README.md) §1. **O 4 dp se compara contra o `bounds` do nó** (o formato do `MEDIDAS.md` que a N3-D23 nomeia) — **div. 395 fechada**: o rastreamento depois da última letra conta. Confere dentro de 4 dp: e1 `Adicionar` **136,0** (137), s2 `Apagar setlist` **166,7** (169), e10 `Tentar de novo` **173,3** (170). O desenho não muda em nenhuma: nenhuma errata tira folga abaixo de zero em B.

| errata | medida | folha → medido (Δ) | consequência declarada |
|---|---|---|---|
| **N3-E3** | s1 `FIM DA SETLIST` em 32 | 334 → **338,7** (+4,7) | display de S5 em A: 338,7 em 379, folga **40,3** (não 45); 36 continua sem caber (381,0). Nada muda |
| **N3-E4** | e2 `Apagar` (faixa) | 115 → **119,6** (+4,6) | faixa de edição em B: 683,5 − 137 − 115 + 136,0 + 119,6 = **687,1** em 711, folga **23,9** (não 27,5) — **cabe em uma linha; a faixa de B não vira a de A** |
| **N3-E5** | e3 motivo `nada mudou desde que você abriu` | 205 → **237,8** (+32,8) | o motivo é 15 dp no app (`motivoInativo`, `size.bodySmall`), não 13 (div. 409). Segunda linha do reordenar em B: 96 + 237,8 + 191 em 663, sobram **≈ 127** (não ≈ 160). Em A a linha própria do motivo tem 379: cabe |
| **N3-E6** | e4 chip `sem conexão` empilhado (B) | 198 → **192,4** (−5,6) | só folga: com a N3-E2, a segunda linha da barra de S1 em B soma 192,4 + 16 + 152 + 16 + 171,1 = **547,5** em 647 |
| **N3-E7** | e5 chip em uma linha (A) | 292 → **281,8** (−10,2) | só folga: 281,8 em 379 |
| **N3-E8** | e6 frase de aviso de S1 sem rede | 800 → **747,6** (−52,4) | a altura da linha de aviso depende da largura útil do TEXTO em cada faixa, não da frase inteira: duas linhas em B e três em A (68 e 88) a conferir nos dumps de B da PR de S1 (A-N3-7). Em C, uma linha — como hoje |
| **N3-E9** | e7 título `Reordenar · Ensaio de retrato` | 464 → **605,8** (+141,8) | o título do reordenar é 26 dp, .22em (`titulo26`), e a folha usou os 16 dp/caractere do título de S2, que no app é 22 dp, .14em (div. 409; `Ensaio de retrato` no estilo do reordenar = 359,1, não 271). **B**: o título tem a primeira linha inteira (663): cabe, folga 57,2. **A**: 605,8 em 379 **não cabe em uma linha** — a barra de A (200) ganha a segunda linha do título; vai como T5-R do N5 |
| **N3-E10** | e8 régua do picker (rótulo + contador) | 400 → **424,0** (+24,0) | B: 424 em 663, passa. A: a régua já é de duas linhas na folha |
| **N3-E11** | e9 marca `já na setlist · 2×` | 108 → **120,9** (+12,9) | A: o segundo andar da linha (marca + `Adicionar` 135,5) soma 272,4 em 351: cabe. B: passa |
| **N3-E12** | `FIM DA SETLIST` em 52 (`[captura]`, não é das doze) | 543 → **550,2** (+7,2) | a div. 395: o nó inclui 0,22 × 52 = 11,4 dp de rastreamento depois do T. B: 550,2 em 663, passa |

### Divergências abertas na N3-PR1, **401 a 411**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **401** | P | A T3-R2 põe na linha de base do palco os dumps do W4-b3 (`W4B3-anexos/dumps-palco/`). Eles foram tirados com conteúdo de **prod** — a conta do Marcel no Tab, a de audit no AVD (W4-b3 div. 379) — e a largura de cada título entra no `bounds`: não se reproduzem com o mock, e esta PR não lê prod. | O palco se provou contra `N3-PRECHECK-anexos/B3-referencia-paisagem/` (mock, a mesma fixture), capturada em `aa91b5d`: `git diff --stat aa91b5d d25e00d -- apps packages` é vazio. **18 de 18 idênticos.** Decisão do Marcel: aceitar a B3-referência como linha de base do palco no N3, ou pedir uma leitura de prod por PR. |
| **402** | T | O botão "Tools" do dev client (`ComposeView`, mesmo pacote) muda de tamanho sozinho — expande com o rótulo por alguns segundos depois de carregar o bundle (84 × 126 na base do S1e, 84 × 84 no novo). O G-inv do commit 1 o comparava, como o `dp.mjs` do W4-b3. | O G-inv tira a subárvore do `ComposeView` da conta (commit 3), como o `inventario.mjs` do pre-check e o G-N3 já faziam; CN rodado de novo (`CN-commit3.txt`). |
| **403** | T | O G-inv reprova diferença de **estado de dados**, não só de layout: o arco do ◔ desenha a fração de arquivos no disco ("1 de 2" × "0 de 2"), e "há 1 min" × "agora" é texto vivo. E a base não tem o mesmo estado nos dois aparelhos: o aviso de S1 do AVD foi capturado com o app aberto **já sem rede**, o do Tab com o avião ligado **com o app aberto**; o S1e do AVD com o cache de 1 min, o do Tab logo depois do sync. | O arnês reproduz o estado da base por aparelho (`N3-PR1-anexos/README.md` §3). Cinco XML de S1 saíram byte a byte iguais aos do pre-check. **Quem rodar o G-inv nas PRs de superfície herda isso**: palco antes das telas de S1, e cada estado de S1 pelo caminho da base do seu aparelho. |
| **404** | A | O S0-login do AVD alcançado por **logout dentro da sessão** (mock `401`) mede os dois campos com 1 px (0,5 dp) a mais que o S0 de **abertura fria** — que é o caminho da base, e deu idêntico. Não é código desta PR (nenhuma tela mudou; o G-inv do resto prova). | Registrado; o dump do logout está em `N3-PR1-anexos/dumps-descartados/`. Destino: nenhum no N3 — o S0 de B é "passa" na folha. |
| **405** | P | O prompt lista as doze numa ordem (`Adicionar`, `Apagar`, o chip empilhado…) diferente da folha (s1 `FIM` em 32 primeiro, depois e1, e2, s2, e3…e10). | A N3-D23 manda "na ordem da folha": seguida a da folha. |
| **406** | P | O `N3-REQUISITOS.md` (§3; herança item 7) põe a decisão da **P2** (a faixa como tokens no `theme.ts`, N3-D25) nesta PR, "com a invariante de C medida"; o prompt da N3-PR1 não a menciona. | **Não decidida aqui.** Recomendação: decidir na primeira PR de superfície, que é a primeira a ter o que trocar — nesta nenhuma tela lê a faixa. A invariante que a P2 pede está medida (G-inv 34 + 18). Decisão do Marcel. |
| **407** | P | "O G-N3 reprovando a `main` em retrato": nenhum dump de retrato novo foi tirado. | Rodado sobre os dumps de retrato do pre-check (`B2/`, `B4/`), que são da `main` de hoje em código (div. 401, o mesmo `diff` vazio); o commit 2 não muda tela (G-inv). |
| **408** | D | A folha diz ".2em" para o display de S5 (e o 543 × 32 / 52 supõe o mesmo rastreamento); o app usa **.22em** (`tracking.displayWide`). | A s1 foi medida com o token do app (`fim-32` = o `EndScreen.titulo` em 32). A N3-D18 diz ".2em": se o degrau de A usar .2em, a s1 cai 0,02 × 32 × 14 caracteres = 9,0 dp, para ≈ 329,7 — a conferir no dump de A (N5). |
| **409** | D | Os tamanhos que a folha usou nas estimativas não são os do app: frase de aviso "14 dp" (app 15), motivo "13 dp" (app 15), título do reordenar "16 dp/caractere" (tirado do título de S2, 22 dp .14em; o do reordenar é 26 dp .22em). | É a raiz das N3-E5 e N3-E9. A régua mede com o token do app; a folha não se reescreve. |
| **410** | T | O `h` da linha `faixa=` é a janela do `useWindowDimensions`, **com** as barras do sistema (Tab deitado `h=711.1`, não os 663,1 úteis do `APARATO.md`). | O A-N3-1 decide pelo `w`, que é a largura útil (nenhuma barra lateral nos quatro casos). Registrado no catálogo. |
| **411** | T | O prompt pede `faixaDe()` "num ponto só". O teste de unidade roda no projeto `native` do Vitest, que não troca o `react-native` por duplo: um `faixa.ts` com o hook quebrava a suíte (`Expected 'from', got 'typeOf'`). | A decisão (e os dois limiares) fica em `src/faixa.ts`, pura; o hook do log em `src/useFaixa.ts`, que a importa. O teste garante que 700 e 960 só existem no `faixa.ts`. |

### Decisões do Marcel para a N3-PR2 — N3-D27 e N3-D28 (2026-09-24)

Texto do prompt da N3-PR2, verbatim:

**N3-D27** A base do G-inv para o palco é `B3-referencia-paisagem/` (mock, mesmo código); os dumps do W4-b3 são registro de prod. — **fecha a div. 401.**

**N3-D28** P2 adotada: **tokens por faixa** em `theme.ts` (três jogos de valores, C = os de hoje); nenhuma tela faz aritmética de largura; o que varia por faixa é token; o README do DESIGN-N3 é a fonte dos valores. — **fecha a div. 406** e a herança item 7 do `N3-REQUISITOS.md`.

(A N3-D26 é a régua de desenvolvimento da N3-PR1, citada no cabeçalho de `apps/native/src/screens/ReguaDeDev.tsx` como *"N3-D26 se aceita"*.)

### Erratas da N3-PR2 — nenhuma

S1 em B medido no Tab S6 e no AVD em retrato (os dois deram o mesmo valor em toda linha; tabela em [`N3-PR2-anexos/README.md`](../N3-PR2-anexos/README.md) §2): barra **144,0** (144) · cartão **184,0** (184) · nome **581,3** (583) · `Nova setlist` **152,0** (E2) · `Buscar música` **171,1** · `Baixar esta setlist` **194,2** (193,8) · chip sem rede empilhado **192,4** (E6) · linha de aviso de duas linhas **66,2** (68). **Nenhuma diferença > 4 dp**; a próxima errata continua sendo a **N3-E13**. A linha de aviso tem 21,1 dp por linha de texto no app (motivo em 15 dp, não 14 — a div. 409), com respiro de 12 + 12: "48 mín., +20 por linha" fica dentro da tolerância em B (66,2 × 68) e, estimado, em A (≈ 87,3 × 88).

### Divergências abertas na N3-PR2, **412 a 417**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **412** | P | O prompt pede nos CNs *"os três testIDs (`criar-setlist`, `buscar`, o chip)"*. O chip de sync de S1 **não tem `testID`** no app (o único chip com id é o `chip-offline` da S4), e a folha manda os ids inalterados (§7). | Nenhum id novo (G2 80 → 80). Os CNs acham o chip pelo texto e afirmam que ele está na linha 2 da barra, antes de `criar-setlist`. |
| **413** | P | O aceite do prompt pede S1 *"com aviso de limite"*. **S1 não tem estado de limite**: a frase de limite (`limite-sem-prazo`/`-com-prazo`) é da S2 e do picker; em S1 o 429 da criação aparece **dentro da folha**, não na linha de aviso. | S1 foi aceita nos estados que existem (com setlists, S1f, sem rede, salvo-não-relido, e S1e). A amostra `N3-B-X-limite` (1 linha, 48) é de S2 e se mede na PR de S2 — a `LinhaDeAviso` é a mesma, e a N3-D19 já vale para ela. |
| **414** | P | *"S1 lendo `useFaixa()`"*: o `useFaixa()` da N3-PR1 era o hook da raiz, que **loga** a linha `faixa=`. Uma tela que o chamasse repetiria a linha a cada montagem. | `useFaixa()` passou a só **ler** a faixa (as telas); a linha `faixa=` ficou na raiz, em `useLinhaDaFaixa()`, com o mesmo texto e no mesmo momento (G3 68 → 68). O `App.tsx` mudou uma chamada — está no `g1a` do bloco `gates`. |
| **415** | T | S1 **sem rede em retrato**: com o avião ligado com o app aberto (o caminho do Tab na base, div. 403), o chip continua `sincronizado agora` até a próxima abertura, e a moldura `N3-B-S1-sem-rede` desenha o chip de rede empilhado. | Em retrato o app **abre já sem rede** nos dois aparelhos (`n3pr2.py`, `aviso`); em paisagem cada aparelho seguiu o caminho da sua base, e o G-inv deu idêntico. |
| **416** | A | **Faixa A com os tokens de B** (declarado, N3-D28: A usa B até o N5): no `octavia_phone` (411,4 dp) a composição de B **não cabe** — a linha de botões passa da borda da barra de 144, o chip encolhe até sobrar só o ícone, o andar de ação do cartão estoura à direita e os metadados elidem. Os dois controles de S1 continuam alcançáveis (tocados), e não há `FATAL`. | É o aceite mínimo de A (T3-R3), e passa. A composição de A (`N3-A-S1`: barra de 168, chip em linha própria, botões dividindo 379) é **T5-R do N5**. |
| **417** | A | No celular (faixa A), a **folha de criar** não tem `form-cancelar` no dump e o `form-salvar` tem **12 px** de largura (`[1068,1138][1080,1290]`) — **controle de escrita inalcançável**, que o aceite mínimo de A proíbe. **Igual ao pre-check** (`B4-folha-criar-phone-ret`, mesmos `bounds`): não vem desta PR, e a folha não é superfície dela. | Registrado com destino: a **PR da folha** (`N3-B-F`), que ou resolve A junto ou declara o que fica para o N5. Até lá, A-N3-3 **não fecha para a folha**. Fechar a folha pelo `BACK` funciona. |

### Decisão do Marcel na N3-PR3 — N3-D29 (2026-09-25)

**N3-D29** O G-N3 separa do (e) duas saídas, com contagem própria no relatório, nunca somada ao zero de (e) (*"(e)=0 · nome-acessível=2 · rolagem=1", não "(e)=0"*): **nome-acessível** — só quando o nó de MESMO `resource-id` existe na faixa e o texto longo está no `content-desc` dele (CN: `content-desc` alterado → reprova; CP: os dois rótulos da N3-D17 → passa); **rolagem** — só com o dump rolado passado explicitamente (`--rolada`), com sha nos anexos, e o texto tem de estar NELE (CN: rolado sem a linha 8 → reprova). Declarado como extra; CNs no `cn-n3pr3.sh`; registro no `LOGS-OCTAVIA.md`. — **fecha a div. 422.**

Na implementação, duas coisas que a decisão não dizia e ficam declaradas: o nome-acessível exige também que o nó **mostre outro rótulo** (um `TextView` com texto diferente) — sem isso, um texto **cortado** para fora do dump passava, porque no Android o `content-desc` de um alvo sem `accessibilityLabel` é o texto dos filhos (os `B4-…-phone-ret` do pre-check); e o filtro de distância do topo **na paisagem** não mudou, porque é o critério do pre-check e o CT-N3 do `cn-n3pr1.sh` exige a contagem igual à do `B3-inventario.jsonl` — a rolagem nova se decide só pelo dump rolado do mesmo estado. `N3-PR3-anexos/CN-g-n3.txt`, `CN-n3pr1-apos.txt`.

### Erratas da N3-PR3 — N3-E13 e N3-E14 (N3-D23)

S2 em B medido no Tab S6 e no AVD em retrato (os dois deram o mesmo valor em toda linha; tabela em [`N3-PR3-anexos/README.md`](../N3-PR3-anexos/README.md) §2): barra **88,0** · faixa **64,0** · `Adicionar` **136,0** · `Reordenar` **143,1** · `Renomear e datar` **193,8** · `Apagar` **119,6** · soma da faixa **688,4** (687,1) · linha **663,1 × 116,0**, toda linha no mesmo x · `remover` **48,0** · avisos sem rede, salvo-não-relido e falhou **66,2** (68, 68, 70) e limite **48,0**.

| errata | medida | folha → medido (Δ) | consequência declarada |
|---|---|---|---|
| **N3-E13** | tipo e título da linha de S2 em B | tipo 104 → **84,0** (−20,0); título 377 → **398,2** (+21,2) | a folha diz *"número 32 · título / artista · tipo 104 · remover 48, como em C"*; em C o tipo mede **84** (ícone 20 + 8 + rótulo de `minWidth` 56 — `B5-S2-com-edicao-*-pai`) e a implementação segue C. O título ganha os 20 dp. Só folga |
| **N3-E14** | linha de aviso do teto de 100 em B | 2 linhas, 68 → **1 linha, 48,0** (−20,0) | o motivo mede 611,1 dp no app (15 dp, a div. 409) e cabe nos 631 da linha em B (663 − ícone 20 − 12). Em A (N5) a conta é outra; a folha dá 3 linhas, 88 |

### Divergências abertas na N3-PR3, **418 a 424**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **418** | T | O AVD `octavia_tab32` repousa com `airplane=1 wifi=0 data=0`; `cmd connectivity airplane-mode disable` **não religa** wifi e dados. A 1ª rodada de paisagem abriu o app "sem conexão", com o cache de audit: 7 de 10 estados caíram, e as 3 capturas eram a mesma tela. | `svc wifi enable` + `svc data enable` depois do avião, `ping` conferido; refeita, 27 de 27. Os 12 dumps descartados não entraram; o roteiro da queda está nos anexos. A receita vai para o `APARATO.md`. |
| **419** | T | O `run-as … tar cf - files` por `adb exec-out` saiu **truncado** no fim (`tar: Truncated input file`) — não serve para restaurar o cache do Tab. | Os 4 arquivos do cache guardados **um a um** por `run-as cat` e regravados por `exec-in … cat >`, com o app parado; `md5` dos 4 idêntico nas duas sessões. Receita no `APARATO.md`. |
| **420** | A | O cache do app no Tab tem arquivos **AppleDouble** (`._content.json`, `._files`, …, 163 B, de 11 a 24/09) — sobra de restaurações anteriores por `tar` do macOS. Na rodada, a reconciliação de arquivos do próprio app **apagou** o `files/._1751910900697-Easy_-_Guitar.pdf`, e ele não foi reposto: os bytes não tinham sido guardados. | Os 4 arquivos de cache voltaram idênticos; os `._*` fora de `files/` não foram tocados. Registrado; se o Marcel quiser o cache sem os `._*`, é uma limpeza de uma linha, fora desta PR. |
| **421** | P | O prompt dá a linha de B como *"número 32 · título/artista · tipo 104 · `remover` 48, título 377"*; a folha diz o mesmo e acrescenta *"como em C"*. Em C o tipo mede 84. | Seguido C (o "como em C"); a diferença é a **N3-E13**. |
| **422** | P | O G-N3 deu **(e) = 46** em S2 retrato, todo ele de desenho: os rótulos curtos da N3-D17 e a linha 8 abaixo da dobra na coluna única (a folha: *"7 linhas inteiras em B"*). A regra de rolagem do gate olhava só a distância do topo na paisagem. | Pergunta ao Marcel antes de mexer no gate → **N3-D29**. Com ela: (e)=0 · nome-acessível=28 · rolagem=18. |
| **423** | T | A 1ª rodada dos rolados capturou o `removendo-rolada` **depois** dos 20 s do prazo do cliente (N2-D35): o dump mostrava "sem resposta do servidor" — outro estado, que a N3-D29 não aceita como prova. | Refeito nos dois aparelhos rolando logo depois do toque (8,0 s e 8,3 s); o dump prova o estado (sem `aviso-motivo`; faixa e `remover-2…8` com `enabled=false`). Os dois velhos em `N3-PR3-anexos/dumps-descartados/`. |
| **424** | D | O `medidas.json` diz que *"onde uma errata da §9 muda um valor, o valor é o da errata"*, mas a N3-PR1 abriu as N3-E3…E12 **só no README**: o G-N3 da N3-PR3 acusou 14 vezes o `e2 Apagar` 119,6 contra 115, que é a N3-E4. | Levados os dez valores ao `medidas.json` (`valor` = o da errata, `folha` = o antigo, `errata` = o id). O G-N3 de novo: 4 dp = 0 (`N3-PR3-anexos/G-N3-retrato-commit4.txt`). |

### Erratas da N3-PR4 — N3-E15 (N3-D23)

Reordenar, folha e diálogo em B medidos no Tab S6 e no AVD em retrato (os dois deram o mesmo valor em toda linha; tabela em [`N3-PR4-anexos/README.md`](../N3-PR4-anexos/README.md) §2): reordenar — barra **144,0** · `Cancelar` **94,7** · motivo **237,8** (E5) · `Salvar a ordem` **191,6** · folga da linha 2 **139,1** (≈ 138) · linha **663,1 × 72,0** · alça **48 × 72** · artista mínimo **60,0**; folha — **663,1** a **96,0** · campo **597,3** · `Cancelar` · motivo · `Criar` **122,2 · 197,8 · 127,1** numa linha; diálogo **620,0 × 300,0** (passa). O `medidas.json` não muda: a E15 não é linha da tabela de origem.

| errata | medida | folha → medido (Δ) | consequência declarada |
|---|---|---|---|
| **N3-E15** | altura da folha em B na validação | *"663 × ≈ 486 com as duas validações abertas, topo em 96 → fundo em ≈ 582"* → **424,4**, fundo **520,4** (−61,6) | a folha de criar só abre **uma** validação que a UI alcança (o nome vazio: o erro no campo e o motivo ao lado de `Criar`); a data impossível não sai do seletor do sistema (div. 244 do N2). Só folga: o teclado começa em **752,4** (AVD) e **761,3** (Tab); o `form-salvar` termina em 487,6. A folha mais alta de B é a de falha: 506,2, fundo em 602,2 |

### Divergências abertas na N3-PR4, **425 a 431**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **425** | P | O prompt esperava, no celular, *"a 417 como estava"*. Não ficou: A usa os tokens de B (N3-D28), e a folha de 663 centrada em 411,4 passa 125,9 dp de cada lado — o `form-cancelar` (antes sem nó) e o `form-salvar` (antes 4,6 dp) aparecem **cortados**, 29,0 e 33,1 dp visíveis, e foram **tocados com efeito**. | Medido e registrado (`N3-PR4-anexos/inalcancaveis-A.txt`). A 417 não fecha: controles cortados pelas duas bordas não são a folha de A. Destino confirmado: **N5** (`N3-A-F-*`, 379 × conteúdo, topo 16). |
| **426** | A | No reordenar em A o motivo `nada mudou…` fica espremido em **4,2 × 48,0 dp**: o `flexShrink` que em B deixa o motivo quebrar linha em vez de empurrar `Salvar a ordem` para fora da janela. Em A ele mantém o botão alcançável (192,4), mas o texto não se lê. Em B o motivo cabe inteiro (237,8). | Declarado; não é controle de escrita, e fica fora da lista de inalcançáveis. Destino: **N5** — a moldura `N3-A-reordenar` põe o motivo numa terceira linha. |
| **427** | T | A linha de ações do reordenar em B (a `View` só de layout que agrupa `Cancelar`, motivo e `Salvar a ordem`) **não é nó no dump**: o RN achata a vista que não desenha nada. | O CN a vê no duplo (é o menor ancestral comum dos dois botões); no aparelho, o instrumento mede o vão da borda esquerda de `reordenar-sair` à direita de `reordenar-salvar` (663,1). |
| **428** | T | O arnês lia o topo do teclado na moldura (`mFrame`) da janela do IME, que é a tela inteira (`[0,54][1600,2560]`). | Passou a ler a região tocável (`touchable region=SkRegion(…)`, `dumpsys window windows`): 1693 px no AVD, 1713 no Tab. As duas capturas com teclado do AVD foram refeitas — **com os mesmos XML byte a byte**; as da 1ª rodada não entraram. Receita no `APARATO.md`. |
| **429** | T | O G5 do instrumento da N3-PR3 reconhece a lista pelo `scrollable="true"`. Durante o arrasto o reordenar desliga a rolagem do dedo (`scrollEnabled={false}`), o dump perde o atributo, e a `alca-7` cortada pela borda (paisagem) reprovou como alvo pequeno. | O `g5g6-r-f.py` reconhece a lista também pela classe `ScrollView`; a `alca-7` sai como "cortada pela rolagem" (div. 291), como nos outros estados. |
| **430** | P | O prompt lista *"folha vazia, validação (com teclado aberto)"* como dois estados, e dá a folha de B como *"663 × ≈ 486 com as duas validações"*. A folha vazia de criar **é** a `N3-B-F-validacao` (nome vazio); e só uma validação é alcançável pela UI. | Capturados os dois com teclado: `folha-criar` (a moldura) e `folha-validacao` (editar com o nome apagado, o estado da base). A altura é a **N3-E15**. |
| **431** | P | *"arrastando (`input swipe` pela alça)"*: o `input swipe` termina o gesto antes de o `uiautomator` ler a tela, e o dump sairia já com a linha solta. | O `arrastando` foi capturado com `input motionevent` DOWN/MOVE — o dedo no vidro durante o dump — e só depois o UP. O `input swipe` pela alça é o arrasto que se salva (salvando, falhou, 400, e no celular). |

### Divergência do CI da N3-PR4, **432**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **432** | T/X | O `build` do commit 3 (`b2c0d92`, run `36165365271`) caiu no passo `Test`, em `apps/native/test/escrita.test.ts` › *"e o cache acaba igual ao ÚLTIMO 200, não ao último a chegar"*: `expect(so('cache write kind=setlists')).toHaveLength(1)` recebeu 2. O modo `escrita-releitura-fora-de-ordem` do mock segura o 1º `GET` depois de uma escrita por uma **janela fixa de 600 ms**; a inversão que o teste mede só acontece se a 2ª escrita e a releitura dela cabem na janela. Num runner lento, as duas releituras chegam na ordem e as duas gravam o cache (que termina certo). | Classificado **(b), runner**, com a prova da regra do `APARATO.md`: o rerun **uma vez** (`gh run rerun --failed`) passou na mesma árvore (`attempt=2`, `success`); **5/5 local**; e o `diff c1d845f..b2c0d92 -- apps packages` não toca o caminho (só `theme.ts`, `ModoDeReordenar.tsx`, `FolhaDeCriar.tsx` e um teste de tela; o `escrita.test.ts` roda no projeto `native`, sem tela). Primeira ocorrência nas 15 falhas do CI desde 14/08. Nenhum conserto nesta PR. Destino do conserto do teste: **W5** (`N3-REQUISITOS.md` §4, item 9). |

### Erratas da N3-PR5 — N3-E16 (N3-D23)

O palco em B medido no Tab S6 e no AVD em retrato, em dez estados (os dois deram o mesmo valor em toda linha, menos o corpo, que é a janela de cada um; tabela em [`N3-PR5-anexos/README.md`](../N3-PR5-anexos/README.md) §2): barra superior **88,0** em **duas linhas** · título **663,1** · corpo **869,8** (AVD; 881,8 no Tab, a mesma regra: janela útil − 88 − 96) · zonas **106,7** · base **96,0**, **nó a nó a do pre-check** (16 de 16). Picker, S0, S4 e S5 *"em B passam"*: **os mesmos `bounds` do pre-check**, 12 de 12. O `medidas.json` não muda: a E16 não é linha da tabela de origem.

| errata | medida | folha → medido (Δ) | consequência declarada |
|---|---|---|---|
| **N3-E16** | a barra inferior do palco em B (e em C) | *"4 × 64 + 3 × 16 = 304 à esquerda, 224 à direita, 135 de vão"* → **312,0 · 229,8 · 121,3** (+8,0 · +5,8 · −13,7) | o controle do palco é 66 × 66 (64 + a moldura de 1 dp de cada lado, `touch.stage + 2`, V1-PR3 div. 36), não 64. Nada muda: a base de B **é** a de C, nó a nó (`N3-PR5-anexos/base-igual.txt`), e em A (N5) os quatro de leitura somam 312 em 379, não 304 |

### Divergências abertas na N3-PR5, **433 a 444**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **433** | P | O prompt pede *"C forçada → os testes do palco do V1/N1 passam sem mudança (CP)"*. **Nenhum teste de tela montava o palco**: o palco do V1/N1 se aceitou no aparelho (A12–A18), e o `native-tela` não o importava (div. 434). | O CP de C em jsdom é o bloco "C" do `palco-faixa.test.tsx` (janela de C escrita e o padrão do duplo: posição, setlist e título no mesmo nó de 64); a invariante de verdade é o G-inv 18/18 contra a `B3-referencia-paisagem/` (N3-D27). |
| **434** | T | O `react-native-pdf` publica **JSX dentro de um `.js`** (`index.js:462`), e o `vite:import-analysis` do `native-tela` o recusa antes de qualquer `vi.mock` — nem o `import()` dinâmico passa. | Duplo `apps/native/test/fake-react-native-pdf.tsx` por **alias no `vitest.config.mts`**, como o do `datetimepicker` (extra declarado; o arquivo da raiz está fora do escopo do G1a). O `APARATO.md` lista o duplo. |
| **435** | D | A folha soma a base do palco com controles de 64 (304 · 224 · 135); o app os desenha com 66 desde a V1-PR3. | **N3-E16**. |
| **436** | P | O prompt pede *"picker (vazio, resultados, relendo), S0 (vazio, erro) … dumps em retrato contra os do pre-check: mesmos `bounds`"*. O pre-check **não tem** o `picker-relendo`, e o S0 só existe no **AVD** (no Tab ele derrubaria a sessão do Marcel — div. 386). | Relendo capturado em retrato e em paisagem (mock `resync-pendurado`), conferido pelo G-N3 contra a paisagem e no PNG (`Relendo…` na linha 1, `1 adicionada nesta visita` no rodapé). S0 só no AVD, como na base. |
| **437** | T | O **S0-login em retrato** por abertura fria mede os campos **0,4 dp mais baixos** que o do pre-check de retrato (`B2-S0-login-avd`), que foi alcançado **por logout na sessão** (o `S0()` do `roteiro.py`) — o inverso da div. 404, em que a base de **paisagem** (`B5`) é a fria. | O AVD subiu de novo e o S0 saiu pelo caminho do pre-check: **idêntico**. O frio fica em `N3-PR5-anexos/dumps-descartados/` e no `prova-passa.txt` como controle. Receita no `APARATO.md`: cada base pelo caminho dela. |
| **438** | P | *"S3a–S3e (o que existir no mock)"*, *"texto longo"* e o placeholder (§1): a fixture não tem música **sem conteúdo**, e o `S3-baixando` é transitório. | "Texto longo" lido como o **título longo** (a letra da fixture já é longa em todo estado de letra). O **placeholder** saiu de uma cópia da fixture com a música 9 apontando para um content que não existe (a forma do `content-ausente` do `aceite.py`) e `updated_at` novo — extra declarado, por último em cada aparelho. O `S3-baixando` não foi capturado. |
| **439** | T | A 1ª rodada do `picker-relendo` esperou `relendo` no dump; o rótulo sai **capitalizado**, `Relendo…` (`styles.capital`). | O arnês espera `elendo`; refeito nos dois aparelhos, nas duas orientações. |
| **440** | T | A 1ª rodada do celular limpava o logcat a cada toque (para ler o `zoom dp=`), e a contagem de `FATAL` não cobria a rodada. | Refeita com o buffer limpo **uma vez**, antes; a prova de cada toque lê só as linhas que chegaram depois dele. A mesma lista; `FATAL: 0`. |
| **441** | T | **P1, palco**: em B o FAB do dev client fica na linha 1 da barra, à direita, **sobre o ponto de sem rede** e o fim da linha do título. Em C o ponto também fica sob ele. | Medido e registrado no `APARATO.md`. Nenhum controle do palco fica sob o FAB; o ponto só existe no dump (o `bounds` prova que ele está lá). |
| **442** | D | Em B a barra superior do palco tem **88** e a da **S5** continua com **64** (*"S5, B: passa"*): ao chegar ao fim da setlist a barra superior encolhe 24 dp. Em A a folha deixa as barras *"presentes e vazias, para que a altura do conteúdo não salte ao chegar de S3 — a mesma razão do V1"*; para B ela não diz. | Nada mudou (a folha diz *passa*, e a S5 tem os mesmos `bounds` do pre-check). **Decisão do Marcel**: aceitar o salto em B, ou dar à S5 o mesmo token da barra do palco numa PR futura. |
| **443** | A | **Celular (faixa A) com os tokens de B**: o palco abre, sem `FATAL`; `busca` e `sair` **sem nó** (a base de C passa de 411,4) e `indice` cortado (43,4 dp visíveis, tocado com efeito). Não é controle de escrita. | É o aceite mínimo de A (errata do T3-R3), e passa. A composição de A (`N3-A-S3`, N3-D14: navegação na barra superior de 144) é **T5-R do N5**; até lá, sair do palco em A é o `BACK`. |
| **444** | T | O cache do app no Tab tem uma **segunda pasta**, a de demanda (`cache/octavia-<uid>/files/`, `files.ts` `dirDemanda`), fora da receita de guardar e regravar do `APARATO.md`, que só cobre `files/octavia-<uid>/`. Nela está a `partitura-12p.pdf` da fixture desde **2026-09-24 21:11**, de uma PR anterior. | Não tocada: é de antes desta sessão, e o estado de partida do Tab tem de ser o mesmo nas PRs do bloco (div. 403). Receita no `APARATO.md` ganha a pasta; se o Marcel quiser o cache de demanda sem a fixture, é uma linha, fora desta PR. |

### Decisões do Marcel na N3-PR6 — N3-E17 e o conserto da N3-E18 (2026-09-25)

- **N3-E17** (a div. 442): *"a barra superior de S5 em B usa o token da barra do palco (88), vazia; sem salto de 24 dp ao chegar ao fim."*
- **N3-E18** (a div. 445, achada no aceite desta PR): o picker em B se conserta **nesta PR**, com quatro condições — só a fase de falha e de limite muda (os estados adicionar / adicionando… / adicionada / relendo… continuam a fileira de 80, e o dump igual ao da N3-PR5); a frase do estado e o `Tentar de novo` descem para um 2º andar abaixo do título, no molde dos dois andares de A, com recuo alinhado ao título e alvo de 48, e a altura da linha nesses estados é token de faixa com o valor medido no dump; CN primeiro, reprovando pelos dois sintomas; errata N3-E18 aqui; o G-N3 consolidado com (e)=0 de verdade.

### Erratas da N3-PR6 — N3-E17 e N3-E18 (N3-D23)

O aceite completo em B, no Tab S6 e no AVD, retrato e paisagem ([`N3-PR6-anexos/README.md`](../N3-PR6-anexos/README.md)). O `medidas.json` não muda: nenhuma das duas é linha da tabela de origem. A `e10 Tentar de novo (linha do picker)` (170 na folha) só apareceu agora no 4 dp porque o picker com falha nunca tinha sido capturado em B: antes do conserto o dump dava 137,3 (o botão cortado pela janela, `G-N3-controle-defeito.txt`); depois, **173,3** — dentro da tolerância, 4 dp = 0.

| errata | medida | folha → medido | consequência declarada |
|---|---|---|---|
| **N3-E17** | a barra superior da S5 em B | *"S5, B: passa"* (64) → **88,0**, o token da barra do palco (`faixas[…].palco.barra`), vazia | palco na última e S5 com a barra de **24,0 → 112,0** nos dois aparelhos: salto **0** (era −24, `N3-PR6-anexos/s5-barra.txt`). "Vazia" = nenhum conteúdo novo: `8 DE 8` e a setlist numa linha, como em C — o texto fica centrado nos 88 (y 52,0), e no palco a linha 1 fica em y 36,0 (div. 447). Em C, 64, como sempre (G-inv 18/18, que tem a S5) |
| **N3-E18** | a linha do picker em B na fase `falhou` (falha e limite) | *"picker, B: passa"* (a fileira de 80) → **dois andares, 138,7** | **o picker em B só foi medido no estado base; na falha e no limite a linha de 80 não comporta frase + ação, e a composição empilha como em A.** Antes: o título **some** do dump (falha; limite: 43,1 dp) e o `Tentar de novo` vai até 711,1, cortado na borda. Depois: título 451,1 dp no 1º andar; frase e `Tentar de novo` no 2º (96,9 → 662,2; o botão 443,6 → 616,9, 48 de alto); a linha mede 138,7 com o botão e 131,1 sem ele, e o token de B (`faixas[…].picker.linhaFalha`) é 138,7. C: a fileira de 80, idêntica antes e depois (os cinco estados do picker em paisagem). A: a mesma composição (os tokens de B) — título 151,3, botão inteiro na janela |

### Divergências abertas na N3-PR6, **445 a 456**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **445** | D | **O picker em B quebra na linha com falha ou limite**: a fileira de 80 junta título, marca e o bloco de estado (frase + `Tentar de novo`, até 520 dp); em 711 o título vai a largura zero e **some** do dump (G-N3 (e)=2, Tab e AVD), e o `Tentar de novo` passa do cartão e é cortado na borda da janela (84 dp visíveis). No limite, o título fica em 43,1 dp. A folha dizia *"picker, B: passa"*, e a N3-PR5 provou só vazio, resultados e relendo (div. 436). | **Destino: esta PR** (decisão do Marcel). Gate primeiro (`1f4e8b9`: CN de árvore reprovando `row` ≠ `column`; CN de dump reprovando pelos dois sintomas), conserto (`017570c`), **N3-E18**. O G-N3 consolidado passa a (e)=0 sem declaração; o controle com os dumps de antes dá (e)=2 (`G-N3-controle-defeito.txt`). |
| **446** | T | O mock é um só na 8788, e cada estado transversal troca o modo dele: dois aparelhos rodando ao mesmo tempo derrubariam a rodada um do outro. | **Um mock por aparelho**: AVD 8788, Tab **8789**, celular **8792**, cada um com a cópia da fixture; no aparelho a porta continua 8788 (`adb reverse tcp:8788 tcp:8789`). O bundle não muda. Receita no `APARATO.md`. |
| **447** | P | *"vazia"* (N3-E17) tem duas leituras: a barra sem conteúdo nenhum, ou a barra do palco sem a 2ª linha. A primeira faria `8 DE 8` e a setlist sumirem em B — (e) no G-N3. | Lida a segunda: a altura do token, o conteúdo de C numa linha, centrado. A barra não salta; o **`8 DE 8` desce 16 dp** (36,0 no palco, 52,0 na S5). **Com o Marcel**: alinhar o texto da S5 à linha 1 do palco é outra PR. |
| **448** | P | *"Os cinco estados transversais em toda superfície que os tem (S1, S2e, reordenar, folha, picker)"*: nem toda superfície tem os cinco. | A matriz lida no código (`N3-PR6-anexos/README.md` §3): S1 tem sem rede e salvo-não-relido (a falha de criar é da folha; o limite não existe em S1, div. 413); S2e tem os cinco; o reordenar tem sem rede, falhou e limite (o 200 fecha o modo; acima de 100 ele não abre); a folha tem falhou e limite no cartão `form-falha` (sem rede a entrada `Nova setlist` fica inativa, e a folha não abre — a 1ª rodada procurou o estado e caiu); o picker tem os cinco, com falha e limite **na linha** (a N3-E18). |
| **449** | T | A linha de aviso do picker mede 67,1 e 48,9, não 66,2 e 48,0. | O invólucro `avisoDoRodape` tem o fio de 1 dp em cima (div. 313 do N2): +0,9 (2 px). A linha é o mesmo componente. Não é errata. |
| **450** | A | **J3 em retrato**: o teclado encaixado (topo 761,3 dp) cobre o rodapé do picker, e o `Concluir` (y 1034,2) fica sob ele — a 1ª rodada tocou numa tecla. | Contado como gesto (fechar o teclado): **16 gestos**, como a paisagem, que tinha um "rolar" que o retrato não precisa. Errata no `PRD-TELA-2.md` (T2-R6). **Com o Marcel**: subir o rodapé acima do teclado em B é desenho, não aceite. |
| **451** | T | As rodadas que caíram por arnês: `s1Salvo` (o toque antes de a lista assentar), `S1f` e `pCem` (a lista não chegou no prazo), `placeholder` (a cópia do `n3pr5.py` derivava a árvore do caminho do instrumento e o mock não subiu), o `401` dos S0 (12 s fixos), a S5 e a alça 5 do celular (abaixo da dobra), e a prova de `sair` no celular — que vai a **S1** (`navigation.tsx`), não a S2; a docstring do `phone-palco.py` da N3-PR5 dizia S2, mas lá `sair` não tinha nó e nunca foi tocado. | Todas refeitas; cada queda verbatim em `N3-PR6-anexos/roteiros/`, o conserto do arnês em `instrumentos/`. Nenhuma é do app. |
| **452** | T | Na passada final, o S0-login do AVD por abertura fria saiu com os campos **0,5 dp mais altos** — a assinatura da div. 404 —, e o G-inv deu 33/34. | Refeito numa subida limpa do AVD: idêntico, 34/34. A 1ª tentativa em `dumps-descartados/`. O conserto não toca o S0 (o G1a desta PR: `EndScreen`, `Picker`, `theme`). |
| **453** | T | O `snapshot.pb` do `octavia_tab32` muda de data a cada subida com `-no-snapshot-save`. | O `ram.bin` (o estado) segue de 2026-09-24 14:00, e o `lastUpdateTime` do dev client também: o `.pb` é metadado de carga. Registrado no `APARATO.md`. |
| **454** | A | **O celular deitado** (914,3 × 371,4, faixa B pela largura) — o A-N3-3 pedia o aceite mínimo dele, e nenhuma PR do bloco o tinha medido. | Medido: **nada inalcançável**, FATAL 0; a folha passa do fundo da janela (os dois botões com 11,4 dp visíveis, tocados com efeito). É a regra de altura do N5 (div. 388; `N3-REQUISITOS.md` §4, item 3). |
| **455** | P | *"G-N3 consolidado: todos os pares da `main` atual, um relatório só"*. | O retrato **inteiro** foi recapturado nesta PR (105 dumps); a paisagem de referência é a `B5-baseline/`, a `B3-referencia-paisagem/`, a passada desta PR e, para os estados que só elas têm (`reordenar-arrastando`, `folha-salvando`, `S2-removendo`, o `placeholder`…), as `dumps-pai/` das N3-PR3…PR5 — a paisagem é invariante (G-inv em toda PR). 102 pares. |
| **456** | P | A lista fechada era commits 1–4. | Dois commits a mais entre o 2 e o 3, declarados antes: o gate e o conserto da N3-E18. |

### Decisões do Marcel para a N3-PR6b (2026-09-25)

- **447** fica como está: *"decisão: sem alinhamento no N3"* — errata **N3-E19** abaixo.
- **450** registrada com destino **"polimento do nativo, pós-N3"**: o rodapé do picker acima do teclado, com aceite
  nas três faixas.

### Erratas da N3-PR6b — N3-E19 (N3-D23)

A N3-PR6b não muda código nem medida: as sete molduras do V1 que faltavam, em retrato
([`N3-PR6b-anexos/README.md`](../N3-PR6b-anexos/README.md)). O `medidas.json` não muda.

| errata | medida | folha → medido | consequência declarada |
|---|---|---|---|
| **N3-E19** | o texto da barra superior da S5 em B | N3-E17, *"vazia"* (lida como o conteúdo de C numa linha, div. 447) → o `8 DE 8` e a setlist **centrados nos 88** (y 52,0), **16 dp abaixo** da linha 1 do palco (y 36,0) | **decisão do Marcel: sem alinhamento no N3.** A barra não salta (N3-E17, salto 0); o texto desce 16 dp ao chegar ao fim, e fica assim no bloco. Nada muda no app nem no G-inv |

### Divergências abertas na N3-PR6b, **457 a 461**

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **450** (destino) | A | O teclado encaixado cobre o rodapé do picker em B (o `Concluir`). | **Destino: polimento do nativo, pós-N3** (decisão do Marcel): o rodapé acima do teclado, com aceite nas três faixas. |
| **457** | T | As rodadas que caíram por arnês: a lista de estados como um argumento só; o `set -- $o` do zsh sem divisão de palavra (`ROT` vazio); o **store que não era apagado** (`adb shell run-as … sh -c rm -f …` junta os argumentos e o `sh -c` recebe só `rm`); a rotação do Tab (retrato = `user_rotation` **0**, paisagem = 1 — o inverso do AVD); a `n60` com o mesmo `updated_at` da de inválidos (o sync compara por `!==` e guardou a de 10). E o Tab que travou entre o destravar e o `stay_on` a 7. | Todas refeitas; cada queda verbatim em `N3-PR6b-anexos/roteiros/`; o `rm` numa string só, e o arnês reprova se sobrar `.json`. A rotação por aparelho e a receita do store apagado entram no `APARATO.md`. Nenhuma é do app. |
| **458** | T | O `g5g6-todos.py` (N3-PR6) reconhece linha cortada pela rolagem só pela **borda de baixo** da lista; no dump **rolado** da `S2-invalidos` as linhas cortadas estão na borda **de cima** (y 176,0), e o instrumento as reprovaria como alvo pequeno. | O rolado fica fora do G5/G6 (o instrumento pula `-rolada`, como na N3-PR6) e é conferido nó a nó contra a lista de músicas (`N3-PR6b-anexos/G5G6.txt`, fim): as linhas 9 e 10 com 116,0 e `remover-9/10` com 48,0 × 48,0 nas quatro colunas; todo < 48 é corte pela borda de cima. O instrumento não muda nesta PR (só docs). |
| **459** | P | *"o G-N3 em cada par (paisagem do V1/pre-check × retrato)"*: o pre-check não tem nenhum dos sete estados, e as capturas do V1 (V1-PR7, `dumps-avd/`) são da **conta de audit** (outro dado) num build de 2026-09-13 — o par daria (e) de dado, não de layout (div. 403). | A paisagem de referência é capturada **nesta PR**, com a mesma fixture, nos dois aparelhos: a paisagem é o congelado e é invariante (G-inv 34/34 e 18/18 no fim da N3-PR6, e nenhuma linha de `apps/` mudou desde então). |
| **460** | P | A `S2-invalidos` do V1 é o índice **sem** edição (duas colunas, 8 + 2); o S2 que se abre do S1 na `main` é o de **edição** (N2, a faixa de 64/88). E *"9 e 10 sem corpo e sem tipo"*: o `aceite.py` tem três formas de inválido (`no-body`, `no-key`, `unknown-type`). | Capturado o S2 que o S1 abre (o S2e): o objeto da moldura são as **linhas** inválidas, e a linha é o mesmo `Pressable` `song-<n>` (`IndexScreen.tsx:299–308`) com e sem edição — a edição acrescenta o `remover-<n>` ao lado. O S2 sem edição (o índice do palco, S2p) com inválidos não foi capturado. Usadas as duas formas que a moldura nomeia — 9 = `no-body`, 10 = `unknown-type`; a `no-key` fica fora (o V1 a provou no A6, `A6-palco-nokey`). |
| **461** | D | **A `S5-n-grande` em B: a fileira de marcas passa da janela.** A fileira calcula contra **900 dp fixos** (`FILEIRA`, `EndScreen.tsx:65`, DESIGN-V1 §7.1): com 60 ela mede 895, centrada em 711,1 — no dump de retrato, **48 de 60 marcas**, de 0,0 a 711,1, as das pontas cortadas (7,6 e 8,9 dp); em paisagem, 60 de 60 (121,3 → 1016,4); com 8 (N3-PR6), 8 de 8. Pela fórmula, em B cabe até N = 18 (697) e passa a partir de N = 19 (736); acima de 128 a barra sólida de 900 passa também. É a **H-N3-3** do pre-check (derivada, nunca medida), e a regra da folha (*"o conteúdo não sai"*) quebrada. **Nem o G-N3 nem o G5/G6 a veem**: marca não tem texto nem é alvo. | **Registrada, não consertada** (instrução da PR: o conserto é decisão à parte). Evidência: `N3-PR6b-anexos/s5-marcas.txt`, os quatro dumps `N3P6B-S5-S5-n-grande-*` e os PNGs. **Com o Marcel**: o conserto (a fileira contra a largura da janela, como token de faixa?) e o gate que a veria. |

### Decisões do Marcel para a N3-PR6c (2026-09-26)

- O G-N3 ganha o **(b) corte**, que reprova, com contagem própria; e a div. 461 se conserta com a largura da fileira
  de marcas como **token de faixa** (C 900 · B 663).

### Erratas da N3-PR6c — N3-E20 (N3-D23)

O conserto e o aceite em [`N3-PR6c-anexos/README.md`](../N3-PR6c-anexos/README.md). O `medidas.json` não muda: a
fileira não é linha da tabela de origem.

| errata | medida | folha → medido | consequência declarada |
|---|---|---|---|
| **N3-E20** | a fileira de marcas da S5 em B (a regra de N grande, §7.1 do DESIGN-V1) | *"S5, B: passa"* (a fileira de 900 fixos) → **663**, o token `faixas[…].s5.fileira` (a largura útil de B, a mesma da folha) | **a S5 em B só foi medida com 8 músicas**; com N ≥ 19 a fileira de 900 passava da janela de 711,1 (div. 461). Com 663: N = 60 → 60 de 60 marcas dentro da janela (28,0 → 683,1), marca de **6 dp** (em C, 10); a marca chega ao piso em N = 60 (em C, 82); o último N com marca é **94** (em C, 128), e acima dele a barra sólida tem 663. C: 900, idêntico (G-inv 34/34 e 18/18; a paisagem da S5 com 60, nó a nó, igual à da N3-PR6b) |

### Divergências abertas na N3-PR6c, **462 a 466** — e a 461 fechada

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **461** (fechada) | D | A fileira de marcas da S5 passava da janela de B a partir de N = 19. | **Fechada** pela N3-E20: gate primeiro (o (b) do G-N3 reprovando, `cn-n3pr6c.sh` CN-B1 com (b)=4; o CN de tela `s5-fileira-faixa.test.tsx` reprovando com 895/736/697 > 663), o conserto, e o aceite: N = 60, 19, 18 e 8 em retrato com **(b)=0** nos dois aparelhos. |
| **462** | P | *"CN: o dump `S5-n-grande` em retrato desta PR → (b)=48 (cole)"*. | O (b) real é **2 por dump** (4 nos dois aparelhos): o uiautomator recorta os `bounds` na tela e **omite** o nó que está inteiro fora dela, e o Fabric achata a árvore (o contêiner da fileira não chega ao dump). Das 60 marcas, 12 não existem no dump e 46 estão inteiras na janela; só as duas das pontas (0,0 → 7,6 e 702,2 → 711,1) carregam a assinatura de corte. O 48 é o número de marcas no dump — e, por coincidência, o (b) do celular do pre-check no CN-N2 do `cn-n3pr1.sh`. O CN colado é o real. |
| **463** | P | *"(b) como o `inventario.mjs` do pre-check já fazia"*: o (b) de lá tinha **três** partes — sob a barra, borda lateral e **ausente** (o `resource-id` da paisagem que some) — e contava o **novo** contra a paisagem. | Copiadas as duas partes de `bounds` e o "novo" pela mesma assinatura (as zonas do palco encostam na borda por desenho, nas duas orientações). O **ausente fica fora**: depende de rolagem (a lista de ids variáveis do pre-check) e é o que o (e) e o G6 cobrem. Controle: o CT-B5, o (b) do G-N3 igual ao do `B3-inventario.jsonl` sem o ausente, **105 de 105 dumps**. |
| **464** | P | *"N = 19 e N = 18 (a fronteira da fórmula)"*: a fronteira de 18/19 era a da **janela** (697 cabia em 711,1). Contra a largura útil de B (663), o **18 também não cabia** (697 > 663) — o CN de tela reprovou os três. | Com o token não há fronteira em B até N = 94; o 18 e o 19 ficam como o par que a H-N3-3 e a div. 461 nomearam, e medem **661** e **660**. |
| **465** | T | A #332 (N3-PR6b) não estava mergeada quando a N3-PR6c começou, e os controles do (b) leem os anexos dela. | A branch nasceu de `origin/main` (`73b45ea`); os anexos da 6b foram extraídos **sem stage** para rodar os controles; antes do commit 4 a branch foi rebaseada **localmente** sobre a cabeça da #332 (`63ea60e`) — ela **nunca tinha subido**, então nada de force. Depois do merge da #332 (merge commit), o rebase sobre a `main` descarta o commit da 6b como já aplicado. |
| **466** | P | *"O `APARATO.md` ganha a lição da div. 458 se o instrumento do G5/G6 mudou"*. | **Não mudou**: os dumps da S5 não têm rolado, e o G5/G6 rodou como estava (16 de 16). O `APARATO.md` fica como está. |

**Próxima divergência livre: 467.**
