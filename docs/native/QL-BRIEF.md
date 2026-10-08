# QL — brief do desenho: a quebra de linha no palco e na visualização

**Para o Claude Design.** Este brief e os arquivos que o Marcel anexa à sessão (§7) são tudo o que você precisa: não é
preciso ler código nem o resto do repositório. As decisões do dono do app estão citadas pelo número (`QL-D…`) só para
quem conferir depois; o texto diz o que cada uma manda. Fonte do bloco: [`QL-PRECHECK.md`](QL-PRECHECK.md). Amostras e
script: [`QL-BRIEF-anexos/`](QL-BRIEF-anexos/README.md). O desenho congelado vai para `docs/native/DESIGN-QL/`.

---

## 1. O que é o bloco, e o que se desenha

Hoje o tablet mostra o corpo de uma música (a letra, a cifra, a tab) **sem quebrar linha**: a linha que não cabe na
coluna **sai pela direita**, e o músico só a lê rolando o corpo inteiro para o lado. É assim no **palco** (onde se toca)
e na **visualização**, **V** (onde se vê o cadastro da música). O bloco QL faz a **letra quebrar** — para caber na
coluna, em qualquer largura e em qualquer tamanho de texto —, **sem mudar o texto**: a quebra é só de exibição.

**Entra no desenho:**

1. **a linha continuada da Letra** — a parte de uma linha longa que desce para a linha de baixo: recuo, marca, ou outra
   forma (pergunta 1);
2. **o par da Cifra quebrado** — a linha de acordes e a linha de letra logo abaixo dela quebram **juntas**, com o acorde
   continuando sobre a sílaba (pergunta 2);
3. **as notas da música no palco** — onde ficam, em que fonte, e se recolhem (pergunta 3);
4. **o que fica no topo depois de girar o tablet e de mudar o tamanho do texto** — com a quebra, girar ou mudar o zoom
   muda o número de linhas, e o trecho que o músico lia não pode se perder (pergunta 5).

**As superfícies**: o **palco** e **V**, nas três faixas — **C** (tablet deitado), **B** (tablet em pé) e **A**
(celular em pé). **O palco tem dois temas**, escuro e claro (o controle de tema fica na barra de baixo); **V é só escura**,
como as telas de lista do app. **Implementam-se C e B**; A se desenha agora e se implementa no bloco do celular
(QL-D6).

**Fica fora — e o desenho não precisa tratar:**

- **o site** (a versão web): não muda;
- **as outras telas do app** (a lista de setlists, a busca, a biblioteca, o índice): não têm corpo de música;
- **o aviso de "versão nova"** de uma música aberta: é de outro bloco, o da sincronização (QL-D12);
- **a Tab**: **não quebra** — as cordas têm de ficar alinhadas coluna a coluna — e **continua rolando para o lado**,
  como hoje.

## 2. Onde a quebra aparece de verdade

**O ponto mais importante do brief** (QL-D25): **no palco deitado (C), no tamanho de texto padrão (22), nada muda para
nenhuma música do Marcel.** A maior linha da biblioteca dele tem **77** colunas, e o palco deitado mostra **80**. A
quebra aparece:

- **em V no tablet deitado** — a coluna do corpo é mais estreita (55), porque os detalhes ficam ao lado;
- **no tablet em pé** (B, 48 colunas), no palco e em V;
- **no palco com o texto aumentado** — no zoom 32 e 40, mesmo deitado;
- **no celular** (A, 26 colunas) — em quase tudo.

O dado real da conta do Marcel (63 músicas; só números, nenhum texto — `QL-PRECHECK.md` §10.1):

| tipo | músicas | linhas | passam de 26 (A) | passam de 48 (B) | passam de 55 (V em C) | passam de 80 (palco em C) | a maior | p95 |
|---|---|---|---|---|---|---|---|---|
| **Letra** | 57 | 2646 | **56** músicas · **956** linhas (36 %) | **22** · **89** | **11** · **27** | **0** · 0 | **77** | 46 |
| **Cifra** | 3 | 109 | 1 · 20 | 1 · 1 | 0 | 0 | 50 | 39 |
| **Tab** | 2 | 2 | 0 | 0 | 0 | 0 | **7** | 7 |
| Partitura | 1 | — | — | — | — | — | — | — |

E da Cifra: **46 pares** acorde/letra em 2 das 3 Cifras; **19** pares passam de 26, **1** passa de 48, nenhum passa de
55. **Nenhuma** música tem nota escrita (§5.4).

## 3. As larguras

**A fonte do corpo é IBM Plex Mono** (monoespaçada: todo caractere tem a mesma largura). No tamanho padrão, 22, **um
caractere mede 13,33 dp** (medido: 100 caracteres = 1333,3 dp). O corpo tem **32 dp de respiro de cada lado** (48
embaixo). A entrelinha é **1,55** do tamanho na Letra e na Cifra, e **1,45** na Tab.

**Quantas colunas cabem, no tamanho 22:**

| superfície | largura do corpo | colunas |
|---|---|---|
| **palco em C** (tablet deitado) | 1137,8 − 2 × 32 = **1073,8 dp** | **80** |
| **V em C** (a coluna do leitor, ao lado dos detalhes de 340) | **733,8 dp** | **55** |
| **palco e V em B** (tablet em pé) | 711,1 − 2 × 32 = **647,1 dp** | **48** |
| **A** (celular em pé) | 411,4 − 2 × 32 = **347,4 dp** | **26** |

**O músico muda o tamanho do texto só no palco** — os passos são **18 · 22 · 26 · 32 · 40** (V não tem zoom: fica no
22). As colunas por zoom (**só o 22 está medido**; os outros são cálculo, a conferir na primeira PR de código):

| superfície | 18 | **22** | 26 | 32 | 40 |
|---|---|---|---|---|---|
| palco em C | 100 | **80** | 69 | 56 | 44 |
| palco em B | 60 | **48** | 41 | 33 | **26** |
| A | 32 | **26** | 22 | 18 | 14 |

**O palco em pé no zoom 40 tem as mesmas 26 colunas do celular no 22.**

**As medidas do palco que o desenho já conhece** (o congelado do V1 e do N3): barra de cima de **64** em C (uma linha:
posição, setlist, título · artista · tipo, página, a nota **da posição na setlist** e o ponto de sem rede) e **88** em B
(duas linhas); barra de baixo de **96** com sete controles só ícone; e as **bordas invisíveis de 15 %** da largura, de
cada lado do corpo, entre as barras, que avançam e voltam de música às cegas.

## 4. As regras já decididas — o desenho não as reabre

1. **A quebra é só de exibição**: o texto da música não muda; a busca e tudo o mais continuam vendo a linha inteira.
2. **O par acorde/letra vale só na Cifra** (QL-D22). **A Letra quebra sempre como letra**, mesmo se tiver um acorde
   digitado (hoje nenhuma Letra do Marcel tem).
3. **O par quebra na mesma coluna**: a linha de acordes e a de letra são cortadas no mesmo ponto, para o acorde
   continuar sobre a sílaba. **Se o corte cairia dentro de um acorde, ele recua ao começo do acorde** — nas duas linhas
   (QL-D14). O alinhamento da parte continuada é do desenho (pergunta 2).
4. **A reserva é por linha** (QL-D23): a linha que **parece** de acordes mas não é com certeza (uma palavra junto dos
   acordes, como *"Intro: Am  E"*) **não forma par**; ela quebra como letra, se precisar.
5. **A progressão de uma seção vira par** com a primeira linha de letra embaixo dela (QL-D22): na Cifra feita por seções
   no site, cada seção tem o nome, uma linha de **progressão** (*"Am  F  C  G"*) e a letra; a progressão é tratada como
   linha de acordes. O desenho a mostra.
6. **A Tab não quebra**: rola para o lado, como hoje.
7. **Âncora na primeira linha lógica visível** (QL-D18): ao girar e ao mudar o zoom, a linha **da música** (não a
   pedaço da tela) que estava no topo continua no topo. *Linha lógica* = a linha como o músico a escreveu; *linha visual*
   = cada pedaço dela na tela.
8. **Quando não cabe, a composição empilha; o conteúdo não sai**: nenhum componente cortado nem escondido em nenhuma
   faixa, **inclusive em A**. *(A regra da folha do N3.)*
9. **Nenhum token fora do pacote de identidade**: cores, tamanhos e espaços são os que existem. O que faltar, o desenho
   **propõe numa lista separada**, com o porquê, e quem decide é o dono do app.
10. **Frase nova só como proposta**, na mesma lista. Estilo do app: minúsculas, travessão, sem ponto final.
11. **O palco com setlist e o avulso têm o mesmo corpo**: o que se desenha para um vale para os dois.

**Os tokens que o corpo usa hoje** (para o desenho não inventar): a tinta do texto `text` (escuro `#F9F5F1` sobre
`#100F16`; claro `#100F16` sobre `#F6F1EA`), o secundário `muted` (`#A9A5B5` / `#5E5A6A`), o fio `line` (`#2A2836` /
`#D6CFC3`) e a tinta de informação `lineInfo` (`#6E6A80` / `#8E8779`) — a dos controles inertes. Em V, as notas da
música aparecem em **Manrope 16**, entrelinha 1,55, abaixo da régua *notas da música*.

## 5. Os textos de desenho

**Use só estes textos, ou os das capturas (§7)**: são inventados pelo projeto. **Nenhuma linha de música real, nenhum
título nem artista real** nas molduras.

### 5.1 Letra — a forma real (a maior 77, p95 46)

```
Acendi a lanterna do quintal e
Quando a maré da fixture sobe devagar pelo cais lá
o vento assobia baixinho

Cada passo que eu dou na areia fria deixa um rastro de sal e
e a cidade inteira dorme enquanto o barco da fixture segue sem pressa pro mar
ô ô ô
```

Linhas de **30, 50, 24, 60, 77 e 5** colunas, e uma vazia.

### 5.2 Cifra — os pares, o acorde que atravessa o corte, a progressão e a linha quase acorde

```
Intro: Am  E

Am            F              C
Dobrei a esquina da fixture, e
Am                    F#m7(11)        G          C
Cada janela acesa conta uma história de quem passa

Refrão
Am  F  C  G
E a noite inteira cabe numa canção de exemplo
```

- *"Intro: Am  E"* — **quase acorde**: não forma par (regra 4);
- o **par de 30** (linhas 3–4);
- o **par de 50** (linhas 5–6), em que o **`F#m7(11)` ocupa as colunas 23 a 30**: no celular (26) o corte cairia dentro
  dele e recua para a coluna 22;
- *"Refrão"* — o nome da seção; *"Am  F  C  G"* — a **progressão**, que vira par com a linha de baixo (regra 5).

### 5.3 Tab — 78 colunas (não quebra)

```
e|-----0-----0---------0-----0---------0-----0---------0-----0---------0-----|
B|---1---1-----1-----1---1-----1-----1---1-----1-----1---1-----1-----1---1---|
G|-2-------2-------2-------2-------2-------2-------2-------2-------2-------2-|
D|---------------------------------------------------------------------------|
A|-3---------3-----3---------3-----3---------3-----3---------3-----3---------|
E|---------------------------------------------------------------------------|
```

### 5.4 Nota da música — várias linhas, uma longa

```
Capo na 2.
Entrar depois da contagem de quatro do metrônomo da fixture.
Segunda voz só no refrão; no fim, segurar o último acorde até a luz da sala apagar de vez.
```

**Nenhuma música do Marcel tem nota hoje**: o site oferece o campo (*Notas*), e o tablet já mostra as notas em V. No
palco elas são novas. **A nota da música não é a nota da posição**: o palco já mostra, na barra de cima, a nota que o
músico escreve **para aquela música naquela setlist** (*"Nota: …"*, uma linha, cortada). As notas da música são do
cadastro da música e valem em qualquer setlist. Em V elas têm o rótulo *notas da música*.

## 6. O "antes" em texto — cada texto, como está hoje, e onde cada largura cai

Gerado por [`QL-BRIEF-anexos/instrumentos/amostras.mjs`](QL-BRIEF-anexos/instrumentos/amostras.mjs) (sem aparelho), saída
em [`QL-BRIEF-anexos/amostras.txt`](QL-BRIEF-anexos/amostras.txt). Cada **▼** fica sobre a **última coluna que cabe**
naquela largura; hoje, tudo o que passa dela sai pela direita. **O "depois" é o desenho.**

```
LETRA
                               26                    48     55                       80
                               ▼                     ▼      ▼                        ▼
   1 │Acendi a lanterna do quintal e                                          30 · passa de 26
   2 │Quando a maré da fixture sobe devagar pelo cais lá                      50 · passa de 26, 48
   3 │o vento assobia baixinho                                                24 · cabe em todas
   4 │
   5 │Cada passo que eu dou na areia fria deixa um rastro de sal e            60 · passa de 26, 48, 55
   6 │e a cidade inteira dorme enquanto o barco da fixture segue sem pressa pro mar   77 · passa de 26, 48, 55
   7 │ô ô ô                                                                    5 · cabe em todas

CIFRA
                               26                    48     55                       80
                               ▼                     ▼      ▼                        ▼
   1 │Intro: Am  E                                                            quase acorde
   2 │
   3 │Am            F              C                                         acordes do par de 30
   4 │Dobrei a esquina da fixture, e                                          letra do par de 30
   5 │Am                    F#m7(11)        G          C                     acordes do par de 50 · o 26 cai dentro do F#m7(11)
   6 │Cada janela acesa conta uma história de quem passa                      letra do par de 50
   7 │
   8 │Refrão                                                                  nome da seção
   9 │Am  F  C  G                                                             progressão (vira par)
  10 │E a noite inteira cabe numa canção de exemplo                           45 · passa de 26

TAB (não quebra)
                               26                    48     55                       80
                               ▼                     ▼      ▼                        ▼
   1 │e|-----0-----0---------0-----0---------0-----0---------0-----0---------0-----|   78 · passa de 26, 48, 55

NOTA
                               26                    48     55                       80
                               ▼                     ▼      ▼                        ▼
   2 │Entrar depois da contagem de quatro do metrônomo da fixture.            60 · passa de 26, 48, 55
   3 │Segunda voz só no refrão; no fim, segurar o último acorde até a luz da sala apagar de vez.   90 · passa de todas
```

(Resumo; o arquivo completo traz todas as linhas e as cinco cordas que faltam.)

## 7. O "antes" em imagem — os arquivos que o Marcel anexa à sessão

Todas as capturas são do **mock**, com textos do projeto — nenhuma traz dado da conta do Marcel. A Letra delas tem uma
linha de **110** colunas (mais que qualquer música real; serve de pior caso), a Cifra **68** e a Tab **78**. Caminhos a
partir da raiz do repositório:

| # | o quê | arquivo |
|---|---|---|
| 1 | **este brief** | `docs/native/QL-BRIEF.md` |
| 2 | as amostras em texto (§6, completas) | `docs/native/QL-BRIEF-anexos/amostras.txt` |
| 3 | o palco em **C**, Letra, escuro — o app de hoje | `docs/native/N4-BRIEF-anexos/capturas/N4BR-S3-com-setlist-tab-pai.png` |
| 4 | o palco em **B**, Letra, escuro — o app de hoje (a barra de 88 em duas linhas) | `docs/native/N4-BRIEF-anexos/capturas/N4BR-S3-com-setlist-tab-ret.png` |
| 5 | o palco em **C**, Cifra, **escuro** | `docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem/REF-S3-S3b-cifra-escuro-tab-pai.png` |
| 6 | o palco em **C**, Cifra, **claro** | `docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem/REF-S3-S3b-cifra-claro-tab-pai.png` |
| 7 | o palco em **B**, Cifra, **claro** (o corpo é o de hoje; a barra de cima é a de antes do N3, uma linha) | `docs/native/N3-PRECHECK-anexos/B2/B2-S3-S3b-cifra-claro-tab.png` |
| 8 | o palco em **C**, **Tab** (rola, como deve continuar) | `docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem/REF-S3-S3c-tab-autoscroll-tab-pai.png` |
| 9 | o palco em **A** (celular), Letra | `docs/native/N4-PR9-anexos/dumps/N3P6-S3-S3a-letra-1a-phone-ret.png` |
| 10 | **V em C**, Letra (a coluna de 55, os detalhes ao lado) | `docs/native/N4-PR8-anexos/dumps/N4P8V-V-letra-tab-pai.png` |
| 11 | **V em B**, Letra | `docs/native/N4-PR8-anexos/dumps/N4P8V-V-letra-tab-ret.png` |
| 12 | **V em C**, Cifra por seções (o nome, a progressão, a letra) | `docs/native/N4-PR8-anexos/dumps/N4P8V-V-cifra-secoes-tab-pai.png` |
| 13 | **V em C**, Tab | `docs/native/N4-PR8-anexos/dumps/N4P8V-V-tab-tab-pai.png` |
| 14 | **V em A**, Letra | `docs/native/N4-PR8-anexos/dumps/N4P8A-V-letra-phone-ret.png` |
| 15 | o congelado do palco em C (`S3-letra`, `S3-claro`, `S3-avulsa`) | `docs/native/DESIGN-V1/telas.html` |
| 16 | o congelado do palco em B e A (`N3-B-S3`, `N3-A-S3`) e a regra da folha | `docs/native/DESIGN-N3/telas.html` |
| 17 | o congelado de V nas três faixas (`N4-C-V-*`, `N4-B-V-*`, `N4-A-V-*`) | `docs/native/DESIGN-N4/telas.html` |

## 8. Perguntas para o desenho

1. **A forma da linha continuada.** Recuo, marca no começo da continuação, marca no fim da linha cortada, ou outra? Ela
   tem de se ler de relance, no palco, a um metro, sem confundir com uma linha nova da música. **Proposta do brief**: um
   **recuo** de duas colunas, sem glifo — o recuo custa duas colunas por continuação (em A, 24 de 26) e não acrescenta
   caractere ao texto. Se o desenho preferir uma marca, ela vem na tinta `lineInfo` e não conta como texto.
2. **O par quebrado.** A parte continuada da linha de acordes fica alinhada a quê — à parte continuada da letra, com o
   mesmo recuo das duas? Como se lê o par continuado (a continuação dos acordes sobre a continuação da letra) sem parecer
   um par novo? E o corte que recuou para não partir o `F#m7(11)` deixa a letra mais curta naquela linha visual: isso se
   mostra de algum jeito? **Proposta do brief**: as duas continuações com o mesmo recuo da pergunta 1, o acorde sobre a
   mesma sílaba de antes, e nada além disso.
3. **As notas da música no palco.** Onde ficam (no topo do corpo, antes da letra? numa faixa recolhível? atrás de um
   controle da barra?), em que fonte (a de UI, como em V, ou a mono do corpo?), se recolhem e como — e como não se
   confundem com a nota **da posição** que a barra de cima já mostra. Uma nota longa quebra (a regra é a mesma do corpo).
   **Proposta do brief**: no topo do corpo, antes da letra, em fonte de UI, com o rótulo *notas da música* de V; abertas
   por padrão e recolhíveis com um toque; sem nota, nada aparece.
4. **O escuro e o claro do palco.** O que muda entre os dois na continuação (pergunta 1), no par (pergunta 2) e nas notas
   (pergunta 3) — a marca, se houver, e o fio das notas.
5. **A âncora ao girar e ao mudar o zoom.** Depois do giro (C ↔ B) ou de um passo de zoom, a primeira linha **lógica**
   visível fica no topo (regra 7). Se o topo estava no meio de uma linha que quebrou, o que se vê: o começo dela, ou o
   pedaço que estava lá? Há algum sinal de que a tela se rearranjou? **Proposta do brief**: o começo da linha lógica no
   topo, sem sinal.
6. *(acréscimo do executor)* **A rolagem para o lado no corpo que já quebra.** Com a Letra quebrando, o corpo dela deixa
   de rolar para o lado; a Tab continua rolando. Numa Cifra com uma linha que **não** forma par (a quase acorde) e é
   maior que a coluna, ela quebra como letra. Há algum caso em que o desenho quer manter a rolagem lateral fora da Tab?
   **Proposta do brief**: não — só a Tab rola.

## 9. O que o desenho entrega

- **Um `telas.html` único, que abre offline** — as molduras, as amostras e as listas —, no molde do congelado do N4
  (`DESIGN-N4/telas.html`).
- **As molduras normativas**, cada uma com um **ID literal no começo da legenda** e a dimensão: `QL-<faixa>-<superfície>-
  <estado>-<tema>` (por exemplo `QL-B-S3-letra-escuro`, `QL-A-V-cifra-escuro`). Os canvas: **C 1138 × 627**, **B 711 ×
  1054**, **A 411 × 874**.
  - **o palco** (S3), em C, B e A, nos **dois temas**: a Letra (§5.1), a Cifra (§5.2), a Tab (§5.3, rolando), as notas
    (§5.4: abertas, recolhidas, a longa) e **o zoom 40 em B** (as 26 colunas);
  - **V**, em C, B e A, **escuro**: a Letra, a Cifra e a Tab;
  - **a âncora**: o antes e o depois de um giro e de um passo de zoom, no palco;
  - **o palco deitado no zoom 22 com a Letra real** (77 colunas): a moldura que mostra que **nada muda**.
- **As medidas com a origem** de cada uma (medida, derivada de token, estimada), como a seção *medidas por origem* das
  folhas anteriores.
- **As propostas numa seção própria**: tokens novos, frases novas, ícones novos — cada uma com o porquê. Nada disso
  desenhado nas molduras antes do aval.
- **As respostas às perguntas do §8**, como proposta; o dono do app decide; depois vem o congelamento, com sha.

## 10. Divergências desta PR

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1194** | D | O `QL-PRECHECK.md` §A9 e §10.5 (d) item 7 dão como "antes" em imagem de B `N4-PR9-anexos/dumps-g-inv/N4P9F-S3-S3a-letra-1a-*-ret.*`: aquela pasta **só tem dumps XML**, nenhum PNG. As imagens do palco de hoje em B, com a mesma Letra de 110 colunas, são as do brief do N4 (`N4-BRIEF-anexos/capturas/N4BR-S3-com-setlist-tab-ret.png`) | §7: os arquivos a anexar usam as `N4BR-S3-com-setlist-*` |

**Contagem** `[medido: a coluna]`: **1 — D 1**. A próxima livre é a **1195**.

---

**A próxima PR desta lista** (QL-D19): depois do desenho e do congelamento, a **PR-1 — gates**.
