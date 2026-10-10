# DESIGN-QL — a quebra de linha no palco e em V

Congelado no **QL · PR de desenho**, 2026-10-08. Molde: [`docs/native/DESIGN-N4/README.md`](../DESIGN-N4/README.md). Brief:
[`docs/native/QL-BRIEF.md`](../QL-BRIEF.md). Pre-check: [`docs/native/QL-PRECHECK.md`](../QL-PRECHECK.md) (QL-D1…D27). Os
requisitos e aceites que as PRs de implementação medem contra esta folha estão em
[`docs/native/QL-REQUISITOS.md`](../QL-REQUISITOS.md) — o QL não tem PRD.

Conteúdo desta pasta:

| arquivo | o que é |
| --- | --- |
| `README.md` | este documento — o que a folha é, as decisões, a conferência, as erratas e o aparato |
| `telas.html` | a folha da **rodada 2**, arquivo único offline (`Octavia QL · a quebra de linha · rodada 2`): **56 molduras normativas**, 6 de estudo e a amostra da divisa |
| `SHA256SUMS` | a impressão digital do congelado (o README fica **fora**, como no N2, no N3 e no N4) |

**A origem**: `~/Downloads/Octavia QL - telas rodada 2 (offline).html`, no computador do Marcel, 1 079 331 bytes, copiado
**byte a byte** (`cmp` → igual) `[medido]`:

```
4bf90636255c4280137a23067621a0cb4bf239cb60172c79c79fccc1685f6adc  ~/Downloads/Octavia QL - telas rodada 2 (offline).html
4bf90636255c4280137a23067621a0cb4bf239cb60172c79c79fccc1685f6adc  docs/native/DESIGN-QL/telas.html
$ shasum -a 256 -c SHA256SUMS
telas.html: OK
```

**Os geradores do designer** (`build/ql-*.js`) **não entram**: leem arquivos do N4 que só existem no ambiente dele
(QL-D38). **Sem `telas.pdf`**, como no N4 (div. 1005): nenhum veio.

`[medido]` = comando + saída literal nesta sessão. A folha é **um pacote que se monta no navegador**: toda conferência
renderizou o arquivo no Chromium do `@playwright/test` do repositório, **sem rede**, e leu o DOM. Os instrumentos e as
saídas estão em [`../DESIGN-QL-anexos/`](../DESIGN-QL-anexos/README.md).

---

## 1 · O que a folha é

**Duas superfícies, nas três faixas; o palco nos dois temas, V no escuro** — o recorte do §9 do brief:

| superfície | estados | molduras normativas |
| --- | --- | --- |
| **o palco (S3)** | Letra · Cifra · Tab rolando · notas abertas · notas recolhidas · nota longa — × C, B, A × escuro, claro | 6 × 3 × 2 = **36** |
| **o palco em B no zoom 40** | Letra · Cifra × escuro, claro | **4** |
| **V** | Letra · Cifra · Tab × C, B, A, escuro | **9** |
| **a âncora** | giro B → C, giro C → B e um passo de zoom em B, antes e depois (escuro) | **6** |
| **o "nada muda"** | a Letra de 77 colunas no palco em C, zoom 22 (escuro) | **1** |
| **total** | | **56** normativas |

E, fora das normativas: **6 de estudo** (`EST-QL-…`: as três formas da continuação — recuo, fio, seta —, as duas posições
das notas — no corpo, na faixa fixa — e o par sem saída em A no zoom 40) e **1 amostra** (`QL-divisa-amostra`, a divisa
ao lado da estrela e do ▶ do N4). As seções da folha: 1 regras do corte · 2 palco · 3 divisa e notas · 4 zoom 40 · 5 V ·
6 âncora · 7 nada muda · 8 estudo · 9 respostas · 10 medidas · 11 propostas · 12 objeções · 13 conferência.

**O quadro-resumo da folha** `[medido: o texto renderizado]`: *"56 molduras normativas · 6 de estudo · 1 ícone novo
aprovado · divisa · catálogo 42 · 0 tokens ou frases novos · 3 propostas aprovadas · 2 recusadas · 1 para o bloco do
celular · 6 registros com destino"*.

## 2 · As duas rodadas

| rodada | o quê |
| --- | --- |
| **1** | a proposta: as molduras do §9 do brief, as respostas às seis perguntas do §8 como proposta, as propostas P-QL1…P-QL6 e as objeções O1…O6 |
| **2** | **decidida** pelo dono do app (*"Rodada 2 · decidida · fecha a folha · 2026-10-08"*): as decisões **1 a 10** da folha, registradas abaixo como **QL-D28…QL-D38** |

As decisões da folha, pelo número que ela usa: **1** → QL-D29 (a continuação) · **2, 3, 4, 5** → QL-D30, D31, D32, D33 (as
notas e a divisa) · **6** → QL-D28 (as regras do corte) · **7** → QL-D34 (as colunas estimadas) · **8** → QL-D35 (o respiro
em A) · **9** → QL-D36 (o que vai ao N5) · **10** → a O6, só registro (div. 1197). As respostas da seção 9 que viram regra
são a QL-D37; o congelamento é a QL-D38.

## 3 · As decisões das duas rodadas — QL-D28…QL-D38 `[Marcel, 2026-10-08]`

| # | decisão |
| --- | --- |
| **QL-D28** | **As regras do corte**, a especificação da função de quebra (seção 1 da folha). **R1**: a Letra corta no último espaço que cabe; só parte uma palavra se ela sozinha for maior que a coluna. **R2**: o par da Cifra corta acordes e letra na mesma coluna e recua até o primeiro ponto que não parte nem um acorde nem uma palavra, nas duas linhas; **se esse ponto não existe, a palavra pode partir, mas o acorde nunca**. A consequência, aprovada: o par de 50 em A recua para a coluna 18, não para a 22 do §5.2 do brief (O5) — errata de ponteiro no brief. |
| **QL-D29** | **A continuação é o recuo de 2 colunas, sem glifo** (P-QL1). O fio na margem (P-QL2) e a seta no fim ficam recusados e seguem no estudo como registro. No par, as duas continuações têm o mesmo recuo, e o acorde fica sobre a mesma sílaba. |
| **QL-D30** | **As notas da música no palco ficam no topo do corpo, rolam com a letra**, em Manrope, sob a régua *notas da música* de V e fechadas por um fio `line`. **Abertas por padrão; um toque na régua (48 de altura) recolhe ou abre.** Música sem nota não mostra nada, nem a régua. A faixa fixa sob a barra fica recusada. |
| **QL-D31** | **A divisa é um ícone novo: um registro com dois estados** (aberta para cima, recolhida para baixo; o mesmo traço espelhado), 20 em `muted`, na ponta direita da régua. **O catálogo vai de 41 para 42** (P-QL3). A frase *"notas da música — recolhidas"* (P-QL4) fica recusada. O nome acessível é *notas da música*, com o estado dado pelo sistema. **O Marcel julga o traço no Tab, em 20 dp, na PR que implementar as notas.** |
| **QL-D32** | **O tamanho das notas acompanha o zoom do corpo**: 16 × zoom ÷ 22. O rótulo da régua fica em 12 (P-QL5). |
| **QL-D33** | **O estado recolhido das notas vale para todas as músicas e fica lembrado entre aberturas**, do mesmo jeito que o zoom e o tema. A PR das notas lê como esses dois são lembrados hoje e faz igual. *(Ver a div. 1198 e a pergunta do §9: hoje o zoom e o tema não são lembrados entre aberturas.)* |
| **QL-D34** | **As colunas fora do zoom 22 ficam como estimadas**, com os dois cálculos lado a lado: o do pre-check (arredondado ao pixel) e o da folha (escala linear, O1). A PR-1 mede a largura do caractere em cada zoom. Nenhuma moldura normativa depende disso. |
| **QL-D35** | **O respiro do corpo em A é 32**, como no brief e no leitor de hoje. A folha do N3 desenhou 16 (O2). Fica registrado para o bloco do celular confirmar. |
| **QL-D36** | **A nota da posição em A** (O4, P-QL6) **e a barra de baixo de A saindo da tela** (O3) **vão para o bloco do celular** (N5). |
| **QL-D37** | **As respostas da folha que viram regra:** a âncora põe o começo da linha lógica no topo, a 32 da barra, sem sinal de rearranjo; **só a Tab rola para o lado**; no escuro e no claro do palco só as tintas trocam (o par em `text`; nas notas, o texto em `text`, o rótulo em `muted` e o fio em `line`). Nas molduras com setlist, a nota da posição aparece na barra de cima, ao lado das notas da música no corpo, com o texto inventado. |
| **QL-D38** | **Congela-se o arquivo único offline**, como `DESIGN-QL/telas.html`, com sha. Os geradores do designer ficam fora do repositório. |
| **QL-D39** | `[Marcel, 2026-10-08]` — o aval do congelamento, a Q1 do §8. **O estado recolhido das notas é lembrado de verdade** — gravado no aparelho; ao reabrir o app ou o palco, volta como estava. **O zoom e o tema seguem como hoje** (estado do palco, T1-R31 e T1-R32 intactos). É a primeira preferência do app gravada no aparelho fora do Firebase: a PR-4 declara a chave, prova com teste (gravar, reabrir, ler) e declara a mudança nos gates que a contam. *(Fica ao lado da QL-D33, cujo texto não muda.)* |
| **QL-D52** | `[Marcel, 2026-10-09]` — a QL-PR4, a pergunta da âncora com algo acima do corpo (a folha não diz). **Quando o giro ou o zoom acontece com a marca de 32 ainda DENTRO das notas** (no palco) — **ou dentro dos *Detalhes*** (em V em B) —, **ou com nada rolado, a rolagem volta ao topo**: as notas (ou os *Detalhes*) começam do topo de novo. Fora disso, a conta é a da QL-D37 somada a altura do que está acima do corpo. *(`QL-PR4-anexos/README.md` §1.)* |
| **QL-D53** | `[Marcel, 2026-10-09]` — a QL-PR4, a régua das notas no palco. **Vale a régua de V** (o rótulo com `tracking.display`, nenhum token novo) **e 48 de altura em todo zoom**, como a QL-D30 escreve. A folha desenhou o rótulo com 0,2 em (144 dp contra 133,2) e, no zoom 40, a régua com 62 (herdou a entrelinha do corpo): errata de medida **QL-E3** (§6). |

### 3.1 As regras do corte — o resumo da seção 1 da folha `[lido: o texto renderizado]`

| regra | o que faz |
| --- | --- |
| **R1 · Letra** | corta no último espaço que cabe; o espaço do corte não aparece em nenhum dos dois pedaços; só corta dentro de uma palavra se ela sozinha for maior que a coluna, e aí na última coluna |
| **R2 · par da Cifra** | acordes e letra cortados na mesma coluna; o corte recua até o primeiro ponto que não parte nem um acorde nem uma palavra da letra; sem esse ponto, a palavra pode partir, o acorde nunca — o corte vai para a última coluna fora de acorde |
| **R3 · continuação** | cada pedaço depois do primeiro começa com 2 colunas de recuo, nas duas linhas do par; a coluna útil da continuação é colunas − 2; os espaços que sobram no começo do resto saem na mesma quantidade das duas linhas, para o acorde continuar sobre a mesma sílaba; um pedaço de acordes vazio não ocupa linha |
| **R4 · fora do par** | a linha quase acorde (*Intro: Am  E*) quebra como letra; a progressão (*Am  F  C  G*) faz par com a linha de baixo; a Tab não quebra |

Os exemplos da seção 1 são a saída da função que gerou as molduras: a Letra de 77 em A (4 pedaços, cortes em espaço); **o
par de 50 em A, que recua para a coluna 18** (no 26 cairia dentro do `F#m7(11)`, colunas 23–30; no 22 partiria *conta*); e
**o par sem saída em A no zoom 40** (14 colunas: a palavra parte, *hi|stória*, e o acorde fica inteiro).

### 3.2 As propostas e as objeções, com destino

| | o quê | destino |
| --- | --- | --- |
| P-QL1 | o recuo de 2 colunas, sem glifo | **aprovada** — QL-D29 |
| P-QL2 | o fio vertical de 2 dp em `lineInfo` no respiro | **recusada** — QL-D29; fica no estudo |
| P-QL3 | a divisa, ícone novo (catálogo 41 → 42) | **aprovada** — QL-D31 |
| P-QL4 | a frase *"notas da música — recolhidas"* | **recusada** — QL-D31 |
| P-QL5 | as notas acompanham o zoom; o rótulo em 12 | **aprovada** — QL-D32 |
| P-QL6 | o lugar da nota da posição no topo de A | **N5** — QL-D36 |
| O1 | seis colunas estimadas do brief não fecham pela escala linear (98, 68, 55, 59, 31, 17) | QL-D34: as duas contas lado a lado; a PR-1 mede |
| O2 | o respiro em A: 32 no brief, 16 no `N3-A-S3` | QL-D35: 32; o N5 confirma |
| O3 | a barra de baixo de A sai pela direita no app de hoje | QL-D36: N5 |
| O4 | a nota da posição não tem lugar no topo congelado de A | QL-D36: N5 |
| O5 | o par de 50 em A recua para 18, não 22 | QL-D28; **QL-E1**; errata de ponteiro no brief §5.2 |
| O6 | *"a Letra das capturas tem a linha mais longa com 87 colunas, não 110"* | **não procede** — medido 110 (div. 1197); o brief §7 fica como está |

## 4 · As medidas — a seção 10 da folha `[lido]`

| medida | valor | origem |
| --- | --- | --- |
| caractere no 22 | 13,33 dp | medida (100 caracteres = 1333,3 dp) |
| caractere por zoom | 13,33 × zoom ÷ 22 | derivada (escala linear) |
| respiro do corpo | 32 dos lados e em cima, 48 embaixo, nas três faixas | medida; em A, o N5 confirma (QL-D35) |
| entrelinha | 1,55 Letra e Cifra · 1,45 Tab | token |
| colunas no 22 | C 80 · V em C 55 · B 48 · A 26 | medida |
| colunas nos outros zooms | C 18: 100 → 98 · 26: 69 → 68 · 32: 56 → 55 · 40: 44 — B 18: 60 → 59 · 26: 41 · 32: 33 · 40: 26 — A 18: 32 → 31 · 26: 22 · 32: 18 → 17 · 40: 14 | **estimada** — à esquerda a conta do pre-check (o pixel arredondado), à direita a da folha (linear), onde divergem (QL-D34) |
| recuo da continuação | 2 colunas = 26,7 dp no 22, 48,5 no 40 | derivada |
| altura do corpo | C 467 · B 870 · A 634 | derivada (canvas − barras) |
| barras | topo C 64 · B 88 · A 144 · base 96 · controles 64 | congelada (V1, N3) |
| bordas de toque | 15 % da largura: 170,7 · 106,7 · 61,7 | congelada |
| nota da posição | 230 dp em C, 12,5 px, triângulo de 20, `offlineInk` | congelada (V1 S3d) |
| notas · texto | Manrope 16 × zoom ÷ 22 (13,1 · 16 · 18,9 · 23,3 · 29,1), entrelinha 1,55 | derivada (QL-D32) |
| notas · régua | 48 de altura, mono 12, .2em, a divisa de 20 em `muted` na ponta | derivada (QL-D30, QL-D31) |
| divisa | viewBox 24 · 13 × 6,5 · 45° · traço 1,5 em 20, 1,75 em 24 · centro 12,00 | derivada (o traço do catálogo) |
| notas · espaços | 8 entre parágrafos · 24 antes da letra | derivada |
| âncora | o começo da linha lógica a 32 do topo do corpo | derivada (QL-D37) |
| coluna de detalhes de V | 340 | congelada (N4) |

**As primeiras a conferir na PR-1**: a largura do caractere nos zooms 18, 26, 32 e 40 (QL-D34), que decide qual das duas
contas de colunas vale.

> **Errata de ponteiro — QL-E2 (medida), QL-PR1, 2026-10-08** (QL-D34, QL-R21, A-QL-6; `docs/native/QL-PR1-anexos/medida-por-zoom.txt`,
> `[medido]` no AVD `octavia_tab32` pela régua de desenvolvimento, tokens `leitor-18` … `leitor-40`). As duas linhas
> *estimadas* da tabela acima — **caractere por zoom** e **colunas nos outros zooms** — dão lugar à medida. **O caractere**:
> **18 → 10,93 · 22 → 13,33 · 26 → 15,73 · 32 → 19,20 · 40 → 24,00 dp** (100 caracteres; o 22 igual ao da N4-PR8; régua ×
> dump igual onde o texto cabe na tela). **As colunas de C e de B**: **C 98 · 80 · 68 · 55 · 44** e **B 59 · 48 · 41 · 33 ·
> 26** (18 · 22 · 26 · 32 · 40) — **vale a conta da folha** (a escala linear) nas dez células; a do pre-check (o pixel
> arredondado) erra em quatro (C 18/26/32, B 18). V em C no 22: 55, como estava. **A não foi medida** (o celular é do N5): a
> coluna de A fica estimada, com a leitura que os cinco números sugerem no anexo `[hipótese]`. O recuo de 2 colunas no 40
> mede 48,0 dp (a folha dizia 48,5: Δ −0,5, abaixo dos 4 dp). Nenhuma moldura normativa muda (QL-D34). O texto da tabela
> acima não foi reescrito.

## 5 · A conferência da folha antes de congelar `[medido]`

Instrumento: [`../DESIGN-QL-anexos/instrumentos/conferir.mjs`](../DESIGN-QL-anexos/instrumentos/conferir.mjs); saída verbatim
em [`../DESIGN-QL-anexos/conferencia.txt`](../DESIGN-QL-anexos/conferencia.txt).

### 5.1 A checagem que a página faz ao abrir

A seção 13 da folha confere, no navegador, cada moldura contra a função que a desenhou. O resumo, verbatim:

> *Resumo: 56 molduras normativas e 1 de estudo conferidas (a do par sem saída; as outras 5 de estudo comparam forma, não
> colunas). Colunas, acorde e Tab: tudo bate. O F#m7(11) não parte em nenhuma faixa nem zoom. Em A no zoom 40, quem parte
> é a palavra (R2). A Tab mantém as 6 linhas e as 78 colunas em todas as molduras. A divisa está em 18 molduras de notas,
> no estado certo. Na tela: todas as molduras ok*

**`"Na tela: todas as molduras ok"` presente: `true`.** A tabela inteira (57 linhas: as 56 normativas e o estudo do par sem
saída — colunas, maior linha visual, cabe, `F#m7(11)` inteiro, Tab sem quebra, divisa, na tela) está no `conferencia.txt`
§2: **57 de 57 `ok`**.

### 5.2 As molduras

```
normativas (no molde): 56 · de estudo (EST-): 6 · outras: 1 (QL-divisa-amostra)
canvas fora da faixa: 0
pedidas por nome: 47 · faltam: 0
âncora (antes e depois de giro e de zoom): 6
"nada muda" (Letra de 77 em C, zoom 22): 1
```

- **O molde do §9 do brief** (`QL-<faixa>-<superfície>-<estado>-<tema>`): as 56 normativas casam; as 6 de estudo levam o
  prefixo `EST-` e três delas não trazem o tema (`EST-QL-A-S3-cont-a-recuo` …) — são estudo, fora do molde normativo.
- **O canvas da legenda** contra C 1138 × 627, B 711 × 1054 e A 411 × 874: **62 de 62** batem com a faixa do ID.
- **O que o §9 do brief pede e falta: nada.** As 47 pedidas por nome (o palco nas três faixas e nos dois temas com Letra,
  Cifra, Tab rolando, notas abertas, recolhidas e longa; o zoom 40 em B; V nas três faixas no escuro) estão todas; a âncora
  tem 6 molduras (três pares antes/depois) e o "nada muda" 1.

### 5.3 Os textos

**As molduras não usam só os textos do §5 do brief e a nota da posição** (div. 1195). Usam também **textos de fixture do
projeto**: os títulos, artistas e o nome de setlist da barra do palco (*Manhã de ensaio*, *Segunda do ensaio*, *Banda da
fixture*, *Duo Manacá*, *Ensaio de retrato* …), os valores de *Detalhes* em V (*Disco de fixture*, *Toada de fixture*, as
datas, o andamento) e, nas molduras da âncora, a Letra das capturas (*"Quando a noite chega o ensaio começa"*, *"Linha N
do verso de fixture, para rolar a tela do palco"*). **Todos são do projeto**: cada um aparece em 19 a 1266 arquivos do
repositório (`git grep -il`), e são os das fixtures do N3/N4 que as folhas congeladas já usam.

**Nenhum título nem artista real** `[medido: nomes.txt]`: a lista do D-0 (`fixtures-nomes-reais.txt`) **não traz os nomes**
— só arquivo, linha e contagem, de propósito (div. 1196) —, então o instrumento extrai **todo** valor de `artist`/`title`
dos 17 arquivos que ela aponta (40 valores, reais e fabricados) e procura cada um no texto renderizado:

```
arquivos da lista: 17 · valores de artist/title extraídos (≥ 4 caracteres): 40 · presentes no texto da folha: 0
# controle negativo (o 1º valor acrescentado ao texto): presentes no texto da folha: 1
```

### 5.4 A rede

```
requisições: 1 · por esquema: {"file":1} · abortadas (fora de file/data/blob): 0
erros da página: 0
```

A única requisição é o próprio arquivo. **Nenhuma** requisição de rede ao abrir.

### 5.5 As capturas de referência

Em [`../DESIGN-QL-anexos/capturas/`](../DESIGN-QL-anexos/capturas/), uma por moldura, o elemento inteiro (legenda + canvas),
1 px por px de CSS:

| captura | o que mostra |
| --- | --- |
| `QL-B-S3-letra-escuro.png` | a Letra em B (48 colunas) |
| `QL-A-S3-cifra-escuro.png` | a Cifra em A — o par de 50 recuado para a coluna 18, a progressão em par, a quase acorde |
| `QL-C-S3-notas-abertas-escuro.png` · `QL-C-S3-notas-recolhidas-escuro.png` | as notas abertas e recolhidas em C |
| `QL-B-S3-letra-zoom40-escuro.png` | o zoom 40 em B (26 colunas, estimada) |
| `QL-B-S3-ancora-giro-antes-escuro.png` · `QL-C-S3-ancora-giro-depois-escuro.png` · `QL-B-S3-ancora-zoom-antes-escuro.png` · `QL-B-S3-ancora-zoom-depois-escuro.png` | a âncora antes e depois do giro e do zoom |
| `QL-C-S3-letra-z22-77col-escuro.png` | o "nada muda": a Letra de 77 em C, zoom 22 |
| `QL-divisa-amostra.png` | a amostra da divisa |

## 6 · Erratas desta folha — QL-E1

A folha vence o brief **em um ponto**; o efeito, no molde das N4-E (**comportamento** — o app faz outra coisa que o brief
dizia; **medida**; **leitura**):

**QL-E1 — o par de 50 em A recua para a coluna 18, não para a 22** (O5; QL-D28). O brief §5.2 dizia que, no celular, o
corte que cairia dentro do `F#m7(11)` (colunas 23–30) *"recua para a coluna 22"*. A R2 manda recuar até o primeiro ponto
que não parte **nem um acorde nem uma palavra** — e a 22 partiria *conta*. O corte vai para a 18, antes de *conta*.
**Comportamento.** Errata de ponteiro no `QL-BRIEF.md` §5.2. *(As erratas seguintes começam na QL-E2.)*

**QL-E2 — o caractere e as colunas fora do 22, medidos** (QL-PR1; QL-D34). **Medida.** A errata de ponteiro do §4: vale a
conta da folha em C e B; A segue estimada até o N5. *(A próxima é a QL-E3.)*

**QL-E3 — a régua das notas: a de V, 48 em todo zoom** (QL-PR4; **QL-D53**). **Medida.** As molduras `QL-*-S3-notas-*`
desenham o rótulo *notas da música* em mono 12 com espaçamento de 0,2 em (2,4 dp; o rótulo mede **144 dp**) e, nas
`*-notas-longa-*` (zoom 40), a régua com **62** de altura — o rótulo herda a entrelinha do corpo no zoom 40. Vale a régua de
V, com o espaçamento `tracking.display` (0,14; o rótulo mede **133,3 dp** no dump, AVD e Tab — Δ −10,7) e a altura do alvo,
**48 em todo zoom** (Δ −14 no zoom 40). Nenhuma moldura se edita; a errata prevalece. `QL-PR4-anexos/README.md` §2.
*(A próxima é a QL-E4.)*

**QL-E4 — as bordas de toque não cobrem a régua das notas** (QL-PR4; **QL-D56**, div. 1233). **Comportamento.** As
molduras `QL-*-S3-notas-*` desenham a régua de ponta a ponta do corpo, e o palco tem, invisíveis, as bordas de 15 % que
avançam e voltam a música (T1-R27) — a folha não as desenha, e a régua passava por baixo delas: o toque na divisa avançava,
no rótulo voltava. **A régua fica fora das bordas**: um toque em qualquer ponto dela recolhe ou abre (a borda entrega à régua
o toque que cai nela). Sobre o texto, as bordas seguem valendo. Nenhuma moldura se edita; a errata prevalece.
`QL-PR4-anexos/README.md`, o aval. *(A próxima é a QL-E5.)*

**O que não é errata**: as colunas fora do 22 (O1) ficam com as **duas** contas (QL-D34), sem vencedor até a PR-1 medir; o
respiro em A (O2) fica o do brief (QL-D35); a O6 da folha não procede (div. 1197).

## 7 · O que a folha deixa em aberto

- **Como o estado recolhido das notas é lembrado** (QL-D33, div. 1198). A decisão diz *"lembrado entre aberturas, do mesmo
  jeito que o zoom e o tema"*, mas **hoje o zoom e o tema não são lembrados entre aberturas**: são estado do palco
  (`apps/native/src/screens/StageScreen.tsx:263-264`, `useState(zoomDefault)` e `useState('dark')`), que recomeça a cada
  palco aberto, e nada os grava no aparelho (o único `AsyncStorage` do app é o do Firebase, `apps/native/src/firebase.ts:9`).
  O PRD da tela 1 diz que o zoom *"persiste por música durante a sessão"* (T1-R31) e o tema *"persiste ao trocar de
  música"* (T1-R32). **Pergunta para o aval** (§8).
  **→ Resolvido pela QL-D39** (§3): gravado no aparelho e lembrado de verdade; o zoom e o tema seguem como hoje.
- **As medidas estimadas** (§4): a PR-1 mede.
- **A nota da posição em A, a barra de baixo de A e o respiro de A**: N5 (QL-D35, QL-D36).

## 8 · Pergunta para o aval do congelamento

**Q1 — o estado recolhido das notas (QL-D33, div. 1198).** (a) **lembrado entre aberturas de verdade** — gravado no
aparelho, e reaberto o app ou o palco ele volta como estava —, sem mudar o zoom e o tema, que seguem como hoje; (b) **do
mesmo jeito que o zoom e o tema hoje** — vale enquanto o palco está aberto e recomeça aberto a cada palco; (c) (a) para os
três — as notas, o zoom e o tema passam a ser lembrados (muda o T1-R31/T1-R32 e o palco de hoje). **Recomendo (a)**: é o
que a decisão diz que o músico quer (recolheu uma vez, fica recolhido); (c) muda o palco em C, o que a QL-D25 diz que não
muda.
→ **Respondida: QL-D39** (§3).

## 9 · Aparato

- **O Chromium**: o do `@playwright/test` do repositório (`node_modules/@playwright/test`), sem cabeça, viewport 1600 ×
  1200, `deviceScaleFactor` 1. Toda requisição fora de `file:`/`data:`/`blob:` é **abortada** e registrada. Espera de 6 s
  para o pacote se montar.
- **O texto renderizado** (`document.body.innerText`, 63 055 caracteres) **não entra no anexo**: é a folha inteira,
  reproduzível pelo `texto-renderizado.mjs`.
- **Os instrumentos são de anexo** (fora de CI, lint e typecheck — N4-D117).

## 10 · Os blocos de declaração desta PR

```gates
# QL desenho: nenhuma declaração — só docs.
```

```gates-web
# só docs — QL desenho: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

## 11 · Divergências desta PR — 1195 a 1198

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
| --- | --- | --- | --- |
| **1195** | P | *"As molduras usam só os textos do §5 do brief e o texto inventado da nota da posição"*: usam também textos de **fixture do projeto** — a barra do palco (títulos, artistas, setlist), os *Detalhes* de V e, na âncora, a Letra das capturas. Todos do projeto (19 a 1266 arquivos cada); nenhum real | §5.3 |
| **1196** | P | *"Confira por `grep` … que nenhum título, artista ou linha da lista `fixtures-nomes-reais.txt` aparece"*: a lista **não traz nomes** — só arquivo, linha e contagem, de propósito (*"o texto da linha NÃO entra"*) | o `nomes.py` extrai os valores de `artist`/`title` dos 17 arquivos dela: 40 valores, 0 na folha; CN com 1 (§5.3) |
| **1197** | D | A **O6 da folha** (*"a Letra das capturas tem a linha mais longa com 87 colunas, não 110"*) **não procede**: a maior linha é de **110** nas capturas (`N4BR-S3-com-setlist-tab-pai.xml`, `REF-S3-S3a-letra-1a-tab-pai.xml`) e na fixture (`N3-PRECHECK-anexos/instrumentos/fixture.py:103`); as molduras da âncora usam essa linha **cortada em 87** (sem *"para passar da largura"*) | **a errata do `QL-BRIEF.md` §7 que o prompt pede não se aplica**: o brief estava certo. As molduras da âncora seguem valendo (a forma não depende do comprimento exato) |
| **1198** | P | QL-D33: *"lembrado entre aberturas, do mesmo jeito que o zoom e o tema"* — **hoje o zoom e o tema não são lembrados entre aberturas** (`StageScreen.tsx:263-264`; T1-R31, T1-R32) | §7; pergunta Q1 do §8 |

**Contagem** `[medido: a coluna]`: **4 — P 3 · D 1**. A próxima livre é a **1199**.
