# D-0 — ENCERRAMENTO

**A fonte do bloco — e um índice, não uma segunda cópia.** Tudo o que este arquivo afirma aponta para o documento, a PR
ou o anexo onde está; onde a prosa daqui e a fonte divergirem, vale a fonte. Nenhum texto de decisão é reescrito aqui.

- **Bloco**: D-0 — **o editor do site volta a salvar** (D0-D20). Nasceu como *"a Tab editada no site que nenhum leitor
  vê"* (D0-D1, só a Tab) e cresceu no aval do pre-check, quando a Fase B mediu que o editor recusava quase todo salvar.
- **Janela**: 2026-10-08 — o pre-check ([#367](https://github.com/marcelviana/octavia/pull/367), merge `a613b1d` às
  11:53:40Z) e a PR-1 ([#368](https://github.com/marcelviana/octavia/pull/368), merge `9c1f23c` às 13:19:32Z), e a prova em
  prod (M2) depois do deploy.
- **Esta PR**: só docs, árvore `../octavia-d0-encerramento`, branch `d0/encerramento`, sobre `origin/main` = `9c1f23c`.
  Commit 1 `5ac7f0a` — **a prova em prod** ([`D0-ENCERRAMENTO-anexos/m2/`](D0-ENCERRAMENTO-anexos/m2/README.md)); commit 2 —
  este documento, a regra 39 no `LOGS-OCTAVIA.md`, as erratas de ponteiro e os gates na ponta da `main`
  ([`D0-ENCERRAMENTO-anexos/gates/`](D0-ENCERRAMENTO-anexos/gates/)).
- **Convenção**: `[medido]` = comando + saída literal nesta sessão (no anexo); `[lido]` = tirado do documento citado. As
  contagens de decisões e divergências são `[medido]` por `grep` (§3, §4).
- **Divergências desta PR**: **1170–1173** (§10).

> **"(i) salvou · (ii) salvou"** — o Marcel, em octavia.rocks, na conta de audit, depois do deploy (M2, 2026-10-08). E o
> palco do AVD mostrou a Tab que ele editou no site: 59 caracteres, `sha12` `9b51694daeac`, sem nenhum arquivo do tablet
> ter mudado.

---

## 1. O que a D-0 entregou

**Para quem usa o site: o editor salva de novo.** Desde 2025-07-08 (`f0947c3`, div. 1152) todo salvar de um content sem
dificuldade voltava 400 — a tela dizia *"não foi possível salvar — o servidor recusou os dados"*. No dado de 2026-10-08,
**158 de 196 contents (81 %)**, em todas as contas, estavam nesse caso (M1, `D0-PRECHECK.md` §9.2). E a Tab: o editor
abria um compasso de exemplo no lugar da tab do músico e gravava a edição num campo que nenhum leitor lê (`measures`); a
Tab de upload não salvava (div. 1149). Agora:

- a dificuldade vazia vai `null` e o servidor aceita, em todo tipo;
- a Tab abre **o texto dela** num painel e grava a `tablature` — a chave que o site, o palco, V e a busca leem;
- a Tab de upload e a Cifra com `content_data` nulo salvam; a Cifra escaneada segue abrindo o PDF no palco;
- salvar não apaga o que o músico não editou: as chaves que nenhum editor edita, o `measures` antigo e as anotações.

| medida | antes | depois | onde |
|---|---|---|---|
| o gate do `PUT` do editor, com a rota real | **4 de 5** corpos recusados (`difficulty … received ''`) | 6 de 6 com 200 (um caso a mais, as anotações) | `D0-PR1-anexos/README.md` §2.1, §3.1, §14 |
| o gate da D-0 | **15 de 19** reprovam na `main` | 35 de 35 (grupos a–h) | §2.2, §13, §14 |
| o M0 (o editor medido com a rota real) | 3 × 200 · **7 × 400** | **10 × 200** | `D0-PRECHECK.md` §9.1; `D0-PR1-anexos/README.md` §6.1 |
| o M2 (prod) | — | o site salvou (i) e (ii); o palco do AVD mostra a Tab editada, 59 / `9b51694daeac`, no cache e no nó `corpo` | [`D0-ENCERRAMENTO-anexos/m2/`](D0-ENCERRAMENTO-anexos/m2/README.md) |

**As duas PRs** `[lido: gh pr view]`:

| PR | o quê | commits |
|---|---|---|
| **#367** pre-check | a Fase A (leitura, os caminhos), o aval D0-D6…D15, a Fase B (M0 local, M1 no console pelo Marcel), a segunda rodada D0-D16…D20 | `6cde4d3` · `d89e291` → merge `a613b1d` |
| **#368** PR-1 | gates (`9be3503`) · conserto (`f5e2542`) · o gravar do gate (`2d90f60`) · G-faixa e erratas (`08cdca6`) · docs (`67e15b6`) · a conferência — o editor não apaga o que não conhece (`349b9c5`, docs `22c2b2f`) · as anotações, teste e conserto (`8c606be`, `fd8c8a5`, docs `8d190b2`) | → merge `9c1f23c` |

**O tablet não mudou** — nenhum arquivo de `apps/native` nem de `packages/core/src` em todo o bloco
(`git diff --stat a613b1d 9c1f23c -- apps/native packages/core/src` → vazio, §5); o release de repouso do Tab
(`cf58f7f`) já lia a `tablature` (D0-D10). **O backend não mudou** — o G-back passou sem declaração nas duas PRs.

## 2. O que mudou no que o editor envia

`components/content-editor.tsx`, `corpoDoPut` e `anotacoesDaLinha`. Os pares são os do gate do `PUT`
(`tests/gates/i1-editor-put.test.tsx`, `PARES`; antes × depois = exatamente os pares, regra 14) e os grupos do gate da D-0
(`tests/gates/d0-editor-salva.test.tsx`).

| chave | antes → depois | por quê | prova |
|---|---|---|---|
| `difficulty` | `""` → `null` quando vazia | D0-D19, div. 1152: o esquema aceita `null` e recusa `""` | 4 pares (cifra ×2, letra, partitura); grupo (a) |
| `content_data` | `{ annotations: [] }` → `null` quando a linha era nula e nenhum editor de tipo a tocou | D0-D22: o nulo fica nulo — a Cifra escaneada segue arquivo no palco | par da partitura; grupos (b), (c) |
| `content_data.tablature` | ausente → `""` quando o objeto vai sem ela | D0-D13, div. 1149: o contrato de escrita exige a chave | grupo (b), *Informações* |
| `content_data.chords` | ausente → `""` quando o objeto vai sem ela | D0-D21, div. 1156 | grupo (c) |
| `content_data.tablature` | a da linha, intacta → **o texto editado** | D0-D6: a edição vai à chave que os leitores leem | par da tab; grupos (d), (e) |
| `content_data.measures` | o compasso de exemplo editado → **ausente** (nunca mais escrito; o que a linha tinha viaja intacto) | D0-D7, D0-D8 | par da tab; grupo (e) |
| `content_data.annotations` | `[]` em todo salvar → **o da linha** | D0-D23, div. 1168 | par da *letra com anotações*; grupo (h) |
| as outras chaves do `content_data` | intactas (já eram) | o editor não apaga o que não conhece | grupo (g), na PR e na `main` |

**8 pares, 8 chaves, 0 não declaradas, 0 órfãos** (`D0-PR1-anexos/README.md` §3.1, §14). A poluição (a linha inteira
dentro do `content_data`) é a de antes — herança D (§7).

## 3. As decisões — D0-D1…D23

`[medido]`: `git grep -hoE '^\| \*\*D0-D[0-9]+\*\*' -- docs/ux/D0-PRECHECK.md docs/ux/D0-PR1-anexos/README.md | sort -u |
wc -l` → **23**, de D0-D1 a D0-D23, cada uma uma vez.

| decisões | onde | o quê, em uma linha |
|---|---|---|
| D0-D1…D5 | `D0-PRECHECK.md` §0 | a D-0 existe, antes da quebra de linha, só a Tab; o `updated_at` e a Cifra fora; a ordem; o *como* em aberto |
| D0-D6…D15 | `D0-PRECHECK.md` §7 | o caminho **1a** (a Tab como texto); o exemplo sai; o `measures` gravado fica; uma PR; o executor mede o site e o AVD confere; a 1147 e a 1148 ao D; a 1149 entra se o M0 confirmar; os nomes reais do editor trocados; a árvore `../octavia-d0` |
| D0-D16…D20 | `D0-PRECHECK.md` §12 | a remoção forçada da árvore; sem desenho novo (erratas); os nomes reais além do editor ao D; **a 1152 entra, para todo tipo**, e o gate do `PUT` valida pelo esquema real; **a D-0 faz o editor voltar a salvar** |
| D0-D21…D23 | `D0-PR1-anexos/README.md` §1 | a 1156 (a Cifra) entra; **null fica null**; as anotações se mantêm |

**As que mudaram por decisão posterior**:
- **D0-D1** (*"só da Tab"*) → **D0-D19/D20**: a dificuldade de todo tipo entrou, e o bloco passou a ser *"o editor volta a
  salvar"*.
- **D0-D3** (*"a Cifra fica fora"*) → **D0-D21**: entrou o salvar da Cifra com `content_data` nulo; a D0-D3 segue valendo
  para as seções × o `chords` antigo.
- **D0-D13** (*"a `tablature` sempre presente"*) e **D0-D21** (*"o mesmo conserto a resolve"*) → **D0-D22**: a chave do
  tipo vai sempre **quando o `content_data` vai como objeto**; o nulo que ninguém editou fica nulo (div. 1160).
- **D0-D15** (parar se o Git recusar) → **D0-D16** (forçar a remoção de `../octavia-d0`).
- O orçamento do M1 (opção a) e a recomendação do caminho 3 *"só se o M1 achar"* → o M1 achou 0 Tabs com `measures`: o
  caminho 3 não entrou (`D0-PRECHECK.md` §10).

## 4. Divergências 1145–1169

### 4.1 A contagem

`[medido]`, a coluna de origem lida na célula de cada linha de tabela:

```
$ git grep -nE '^\| \*\*(11[4-6][0-9])\*\*' -- docs/ux/D0-PRECHECK.md docs/ux/D0-PR1-anexos/README.md \
    | sed -E 's/^[^:]+:[0-9]+:\| \*\*([0-9]+)\*\* \| ([A-Z]) \|.*/\1 \2/' | sort -nu
25 números, 1145 a 1169, cada um uma vez · nenhum só em prosa · nenhum sem letra
A 9 · D 6 · P 2 · T 8
```

| PR | faixa | P | D | A | T | total | declarado no documento |
|---|---|---|---|---|---|---|---|
| pre-check | 1145–1159 | 0 | 4 | 8 | 3 | 15 | `D0-PRECHECK.md` §11: *"P 0 · D 4 · A 8 · T 3"* ✓ |
| PR-1 | 1160–1169 | 2 | 2 | 1 | 5 | 10 | `D0-PR1-anexos/README.md` §8: *"P 2 · D 2 · A 1 · T 5"* ✓ |
| encerramento (esta PR) | 1170–1173 | 2 | 1 | 0 | 1 | 4 | §10 |
| **D-0** | | **4** | **7** | **9** | **9** | **29** | |

As contagens declaradas batem com a coluna nas duas PRs.

### 4.2 As lições

- **Div. 1157 (T) — o gate que travou um corpo que o servidor recusava.** O gate do `PUT` do editor do I1 gravou byte a
  byte, em 4 de 5 casos, um corpo com `difficulty: ""` que a rota recusava desde 2025-07-08: o `fetch` falso devolvia 200 a
  qualquer corpo, e o aceite rodava sem `PUT` real (I1-D37). *"Não mudou"* não era *"funciona"*. O conserto foi no
  instrumento, no commit 1 (D0-D19): o corpo passa pelo handler real. E o controle negativo 5 achou o defeito do passo de
  gravar (div. 1161), consertado no instrumento. → **regra 39** no `LOGS-OCTAVIA.md` (§6).
- **Div. 1150 (D) — medir antes de escolher.** As duas formas de conserto escritas antes do pre-check
  (`N4-ENCERRAMENTO.md` §15.1: *"o editor serializa os compassos para a `tablature`, ou o salvar grava os dois"*) teriam,
  com o editor ainda abrindo o exemplo, **apagado a tab real no primeiro salvar**. Só a leitura do A2 (o que o editor abre)
  mostrou isso. A condição entrou no caminho 1 (abrir pela `tablature`).
- **O caminho 2, que a leitura derrubou** (div. 1170, esta PR — não estava numerada). O pre-check partia da hipótese de que
  o caminho 2 (*os leitores leem `measures`*) era o que a N4-PR2 fez com a Cifra (H5, `D0-PRECHECK.md` §2). A leitura
  mostrou que o precedente não se transpõe: a Cifra abre o editor a partir do texto real, a Tab abria o exemplo; com o
  caminho 2, toda Tab em que alguém mudou só *Informações* passaria a mostrar **o exemplo no lugar da tab, no palco** (A6).
- **Div. 1160 (P) — o "mesmo conserto" da D0-D21.** A chave do tipo sempre no corpo faria a Cifra escaneada trocar o PDF
  por texto vazio no palco — o tablet piorando sem nenhum arquivo dele mudar. Perguntado antes do primeiro gate; virou a
  D0-D22, com prova no grupo (c).
- **Div. 1152 (A) — o achado maior veio de um eixo a mais.** O M0 rodou cada roteiro com a dificuldade nula e preenchida
  (extra declarado); o eixo isolou a 1149 da 1152 e achou o defeito que alcança 81 % dos contents.
- **Div. 1163 (T) — o instrumento que pediu login sem precisar.** A checagem de sessão do G-faixa sem janela disse *"sem
  sessão"*; a com janela, dois minutos depois, achou. O executor pediu ao Marcel que entrasse — e a janela nunca abriu.
  Antes de pedir um passo ao Marcel, repetir a leitura pelo outro caminho.
- **Divs. 1166 e 1169 (T)** — instrumentos que supunham a forma de antes (o M0 com `content_data` objeto) e uma variável
  que o zsh não divide (a rodada "sobre a `main`" mediu a PR). As duas vistas pela saída, não pelo veredito.

## 5. Os gates na ponta da `main` (`9c1f23c`) `[medido: D0-ENCERRAMENTO-anexos/gates/]`

| gate | resultado |
|---|---|
| o da D-0 · o do `PUT` · o G-par | `Test Files 3 passed (3)` · `Tests 44 passed \| 1 skipped (45)` · G-par: `itens 17 · pares comparados 10 · iguais 10 · diferentes 0 · fora do par 7`, lista vazia (N4-D50) |
| G-faixa (o veredito) | `G-faixa: PASSA` · erratas candidatas sem cobertura: 0 |
| G-tok (i), (ii) · cobertura | `PASSA` · `PASSA` |
| G-back, `a613b1d` → `9c1f23c` | `PASSA` — diff vazio no núcleo, sem declaração |
| G-palco | `PASSA — 0 ocorrências` |
| G1a / G1b · G2 / G3 (tablet), `a613b1d` → `9c1f23c` | G1a diff vazio · G1b só adição · G2 `antes=121 depois=121` · G3 `antes=70 depois=70` |
| o tablet | `git diff --stat a613b1d 9c1f23c -- apps/native packages/core/src` → **vazio** |
| `SHA256SUMS` | DESIGN-V1 3/3 · N2 2/2 · N3 2/2 · N4 2/2 · I1 14/14 |
| a suíte (`pnpm test`) | `Test Files 140 passed \| 3 skipped (143)` · `Tests 1706 passed \| 59 skipped (1765)` |
| `tsc --noEmit` · `pnpm lint` | exit 0 · sem avisos |
| o APK (`native.yml`) | **0 corridas** no bloco (`gh run list --workflow native.yml` desde 2026-10-08, nas três branches): o `CI-FAIXA.md` não ganha linha (regra 22) |

## 6. O catálogo — a regra 39

A última do `LOGS-OCTAVIA.md` era a 38 (N4). Entra neste commit, em *"A regra que a D-0 firmou — 39"*, com o caso:

> **39. Um gate de corpo prova que o corpo é aceito pelo esquema real, não só que ele não mudou.**

O texto completo está no `LOGS-OCTAVIA.md`; a proposta veio do `D0-PR1-anexos/README.md` §9. **Sujeita ao aval** (§9, Q4).

## 7. A contabilidade de prod do bloco

| fase | quem | o quê | escritas |
|---|---|---|---|
| pre-check, M1 | **o Marcel**, no SQL Editor do Supabase | 3 consultas só de leitura (`D0-PRECHECK-anexos/m1-saida-marcel.txt`) | 0 |
| PR-1, aceite e G-faixa | o servidor local (`localhost:3000`, o `.env.local` do Marcel, o perfil persistente) | leituras: a sessão (`/api/profile`, `securetoken`) e, depois de cada salvar do aceite, a `/library` (SSR e a lista); todo `GET /api/content/<id>` do editor **fabricado**; todo `PUT` parado no navegador | **0** |
| M2, site | **o Marcel**, conta de audit | (i) criar a Tab descartável e editar o texto; (ii) salvar uma música sem dificuldade — *"salvou"* nos dois; o número exato de `PUT` não foi medido | as dele, na audit |
| M2, AVD | o executor, conta de audit | `GET /api/setlists`, `GET /api/content` e 2 PDFs da biblioteca da audit (garantia de arquivos) | **0** (`OCTAVIA: write` → 0) |
| todo o bloco | **o executor** | requisições diretas a prod: 0 fora do sync do M2 · logins 0 · `.env*` abertos 0 · contas 0 | **0** |

**O que ficou em prod**: a Tab **`D0 descartável`** (id8 `f9b78d0e`) e a nota `D0` da música do item (ii), na conta de
audit — **do Marcel apagar** (regra 12). O rastro da sonda da Fase D (div. 1159) segue onde estava (§8).

## 8. Heranças, com destino — **proposta para o aval**

Tiradas do `D0-PRECHECK.md` §12.2, do `D0-PR1-anexos/README.md` e das listas do D do `I1-ENCERRAMENTO.md` §10.1 e do
`N4-ENCERRAMENTO.md` §10.4.

### 8.1 O que a D-0 fechou

| item | onde estava | fechado por |
|---|---|---|
| a Tab editada no site que nenhum leitor vê | I1 §10.1 item 17 · N4 §10.4 item 1 | D0-D6 (`f5e2542`) |
| a Tab sem `measures` abre o compasso-fixture e o grava (div. 776) | I1 §10.1 item 3, a 1ª metade | D0-D7 |
| `annotations: []` gravado em todo salvar | I1 §10.1 item 1, a parte das anotações | D0-D23 (`fd8c8a5`) |
| a 1149 (Tab de upload) · a 1152 (a dificuldade) · a 1156 (o desenho na Cifra) | `D0-PRECHECK.md` §11; §12.2 item 5 | D0-D13, D0-D19, D0-D21/D22 |
| os nomes reais nas fixtures **do editor** (div. 1151) | §9.3 | D0-D14/D18 (`f5e2542`) |

### 8.2 O resto do Bloco D, nesta ordem

| # | item | origem |
|---|---|---|
| 1 | **o título digitado em *Informações* que não chega à coluna** (Tab e Cifra) — **primeiro da fila** | div. 1147; D0-D11 |
| 2 | **a Tab criada do zero** (`tablature: ""`): o core diz texto de comprimento 0, o site o vazio | div. 1148; D0-D12 |
| 3 | **o `updated_at` mexido pelo favoritar** — **amarrado à N4-D91**: o tablet protege a estrela comparando o `updated_at` da linha que o `PUT` devolveu com o da linha que o sync leu (`packages/core/src/favoritar.ts`, `naoRegredir`); se o favoritar parar de mexer no `updated_at`, essa proteção deixa de funcionar — **os dois mudam juntos** | D0-D2; N4 §10.4 item 3; I1 §10.1 item 19 |
| 4 | **as seções da Cifra e o `chords` antigo** (o editor grava `sections` e não regrava o `chords`) | D0-D3; N4 §10.4 item 2; I1 §10.1 item 18 |
| 5 | **a limpeza do `content_data`**: a poluição (a linha inteira dentro dele), o `measures` gravado (0 em prod no M1), o rastro da sonda da Fase D numa Cifra da audit | D0-D8; I1 §10.1 item 1; divs. 1159 |
| 6 | **as 5 Tabs e as 2 Cifras com `content_data` nulo e sem arquivo**, numa conta a identificar (as 5 Tabs com o mesmo `updated_at`, uma carga inicial; as 3 outras Cifras nulas são escaneadas) — salvam desde a D-0; nenhum leitor as mostra | divs. 1155, 1156; div. 1171 (esta PR) |
| 7 | **os nomes reais em fixture e nas folhas**: 419 linhas em 29 arquivos e as 5 folhas com sha (a troca exige errata da folha, superfície por superfície); inclui a cópia da folha 6 que a medição do `content-edit.json` guarda | divs. 1153, 1165; D0-D18; `D0-PRECHECK-anexos/fixtures-nomes-reais.txt` |
| 8 | **o que o I1 e o N4 já tinham deixado** e a D-0 não tocou: I1 §10.1 itens 1 (a poluição), 2 (os campos que não se salvam), 3 (2ª metade, *"Verse 1"*/*"Content"*, div. 784), 4–14 e 16; N4 §10.4 itens 4–7 | `I1-ENCERRAMENTO.md` §10.1; `N4-ENCERRAMENTO.md` §10.4 |

### 8.3 W5 (instrumento)

| # | item | origem |
|---|---|---|
| 1 | o Vitest coleta teste dentro de `docs/` (o `include` do projeto `web`); a N4-D117 só vale para instrumento sem sufixo | div. 1154 (o pre-check o destinava ao `LOGS-OCTAVIA.md` — div. 1172, Q3) |
| 2 | a checagem de sessão do G-faixa sem janela deu falso *"sem sessão"* | div. 1163 |
| 3 | o Chromium do Playwright fora do cache (reinstalado com `pnpm exec playwright install chromium`, o fixado) | div. 1162 |
| 4 | instrumento que pede substituição à mão devolve o que foi colado (o uid do M1) | div. 1158 |

### 8.4 Sem mudança

O **tablet** e o **release** de repouso do Tab (`cf58f7f`): a D-0 não tocou nenhum dos dois (§5; D0-D10).

## 9. Perguntas para o aval

**Q1 — os destinos do §8?** (a) **como estão**: o resto do D na ordem do §8.2, com a 1147 primeiro; o W5 com os quatro do
§8.3; o tablet sem mudança. (b) outra ordem no D. **Recomendo (a).**

**Q2 — a ordem dos blocos: o próximo é a quebra de linha?** O que está decidido `[lido]`: a N4-D109 (*quebra de linha → D
→ N5 → identidade → iOS*, o W5 à parte) e a D0-D4, que pôs a D-0 antes da quebra (`PLANO-TRANSICAO.md`, as notas do N4 e
do pre-check). Com a D-0 encerrada, **o próximo é o bloco da quebra de linha** (`N4-ENCERRAMENTO.md` §10.2: a quebra na
letra, nunca na tab, no palco e em V; as notas no palco; as corridas do APK fora do filtro). **Algo do D deveria passar à
frente?** A D-0 tirou o que apagava ou perdia dado em silêncio. O candidato mais forte é a **1147**: com a D-0, os
salvamentos que davam 400 passam a dar certo, e o título digitado em *Informações* agora "salva" sem chegar à coluna — mas
o músico vê o título velho na lista logo depois, e *Detalhes* edita o título. O `updated_at` do favoritar não apaga dado e
depende da N4-D91. **Recomendo: o próximo é a quebra de linha, como decidido; a 1147 primeiro no D.**

**Q3 — a div. 1154 (o Vitest coletando teste em `docs/`)**: o pre-check a destinava ao `LOGS-OCTAVIA.md` *"no
encerramento do bloco"*; este encerramento a põe no W5 (o conserto é de instrumento: o `include` do `vitest.config.mts`).
(a) **W5**, sem regra nova; (b) também um caso no catálogo. **Recomendo (a)**: a N4-D117 já é a regra; falta o instrumento
cumpri-la.

**Q4 — a regra 39**: (a) **aprovada como está no `LOGS-OCTAVIA.md`**; (b) com ajuste. **Recomendo (a).**

**Q5 — a Tab `D0 descartável` e a nota `D0`** na conta de audit: (a) **o Marcel apaga** (regra 12); (b) ficam como
fixture de prova. **Recomendo (a).**

## 10. Divergências desta PR — 1170 a 1173

| div. | origem | o quê | destino |
|---|---|---|---|
| **1170** | P | O prompt deste encerramento lista como divergência P *"a preferência pelo caminho 2, que a leitura derrubou"*; ela **não está numerada** nos documentos — o registro é a hipótese H5 do pre-check (*"procede, mas o precedente não se transpõe"*, `D0-PRECHECK.md` §2) e o A6 | registrada aqui; lição no §4.2 |
| **1171** | P | O prompt lista *"as 5 Tabs e as 5 Cifras com `content_data` nulo e sem arquivo"*: o M1 mediu **5 Cifras nulas, 2 sem arquivo** (3 escaneadas); e o desenho da 1149 na Cifra (o salvar) foi **fechado** pela D0-D21/D22 | §8.2 item 6: as 5 Tabs e as 2 Cifras sem arquivo |
| **1172** | D | A div. 1154 tinha destino *"registrada para o `LOGS-OCTAVIA.md` no encerramento do bloco"* (`D0-PRECHECK.md` §11); o prompt a põe no W5 | W5 (§8.3), pergunta Q3 |
| **1173** | T | O bruto do M2 deixado na árvore da PR-1 tinha só o estado, o logcat e a captura: **as duas medições do M2** (o cache e o nó `corpo` do palco, comprimento e `sha12`) foram impressas na sessão e não gravadas em arquivo | transcritas, com os comandos, no `D0-ENCERRAMENTO-anexos/m2/README.md` (extra declarado no commit 1) |

**Contagem**: 4 — P 2 · D 1 · T 1. **A próxima livre é a 1174.**

## 11. Erratas de ponteiro — neste commit

No molde das existentes, sem reescrever:
- **`docs/ux/I1-ENCERRAMENTO.md` §10.1** — uma nota depois da tabela: os itens 17 e a 1ª metade do 3 fechados pela D-0; o
  item 1 sem as anotações; o 18 e o 19 seguem, com a amarração da N4-D91.
- **`docs/native/N4-ENCERRAMENTO.md`** — uma nota depois da errata do §10.4 (o item 1 fechado) e uma errata no fim do §15
  (a D-0 encerrada; o próximo).
- **`docs/ux/PLANO-TRANSICAO.md`** — a nota do encerramento da D-0, depois da nota do pre-check.

## 12. Contabilidade desta PR

| item | valor |
|---|---|
| requisições a prod · logins · `.env*` abertos · escritas | **0 · 0 · 0 · 0** |
| aparelho | nenhum |
| a árvore `../octavia-d0-pr1` | o bruto do M2 copiado (sha256 idêntico), a cópia do `.env.local` e o bruto apagados por nome, `git worktree remove` **sem `--force`** (exit 0) |
| gates na ponta da `main` | rodados nesta árvore (`D0-ENCERRAMENTO-anexos/gates/`) |

```gates
# D-0 encerramento: nenhuma declaração — só docs.
```

```gates-web
# só docs — D-0 encerramento: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

---

**O bloco só se declara encerrado depois do aval.** O próximo, pela N4-D109 e pela D0-D4: **o bloco da quebra de linha**.
