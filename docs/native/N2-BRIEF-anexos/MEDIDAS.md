# N2-BRIEF — medidas de S1, S2, S3 e S4 (Tab S6)

> **Fonte**: os `uiautomator dump` desta pasta (`C1.xml`, `C3.xml`, `C4.xml`,
> `C5.xml`, `C6.xml`), tirados no Tab S6 em 2026-09-16 (ver `README.md`). O
> `bounds` é **literal** do dump, em px do aparelho (2560×1600, paisagem,
> `rotation="1"`). **Nenhuma medida vem da imagem.**
>
> **Conversão**: `dp = px ÷ 2,25` (densidade 360). A janela do app é
> `[0,0][2560,1492]`; a barra de status ocupa 0–54 px (24 dp) e o app desenha
> a partir de 54. Por isso os `y` em dp contam **do topo da tela**: a área
> útil vai de y 24,0 a 663,1 dp (639,1 dp, o mesmo número do
> `N1-ENCERRAMENTO.md` §8). Abaixo de 1492 px fica a barra de tarefas da
> Samsung, fora da janela.
>
> `[medido]` = `bounds` lido do dump. `[derivado]` = conta feita sobre dois
> `bounds` `[medido]`, com a conta escrita ao lado.

## 1. Tabela de `bounds`

| captura | elemento | `bounds` (px) | dp: posição · **largura × altura** | status |
|---|---|---|---|---|
| C1 | S1 — barra superior (contêiner) | `[0,54][2560,324]` | x 0,0–1137,8 · y 24,0–144,0 · **1137,8 × 120,0** | [medido] |
| C1 | S1 — título `SETLISTS` (TextView, flex até o grupo da direita) | `[72,147][1669,228]` | x 32,0–741,8 · y 65,3–101,3 · **709,8 × 36,0** | [medido] |
| C1 | S1 — ícone de sincronização | `[1723,165][1768,210]` | x 765,8–785,8 · y 73,3–93,3 · **20,0 × 20,0** | [medido] |
| C1 | S1 — texto `sincronizado agora` | `[1786,166][2049,209]` | x 793,8–910,7 · y 73,8–92,9 · **116,9 × 19,1** | [medido] |
| C1 | S1 — botão `Buscar música` (`buscar`) | `[2103,123][2488,253]` | x 934,7–1105,8 · y 54,7–112,4 · **171,1 × 57,8** | [medido] |
| C1 | S1 — FAB do dev client (`Tools`; só no build de dev) | `[2436,119][2495,178]` | x 1082,7–1108,9 · y 52,9–79,1 · **26,2 × 26,2** | [medido] |
| C1 | S1 — lista (ScrollView) | `[0,324][2560,1492]` | x 0,0–1137,8 · y 144,0–663,1 · **1137,8 × 519,1** | [medido] |
| C1 | S1 — conteúdo da lista (2 cartões) | `[0,324][2560,1089]` | x 0,0–1137,8 · y 144,0–484,0 · **1137,8 × 340,0** | [medido] |
| C1 | S1 — cartão 1 com download (`setlist-772076b4`) | `[72,396][2488,693]` | x 32,0–1105,8 · y 176,0–308,0 · **1073,8 × 132,0** | [medido] |
| C1 | S1 — cartão 1: título | `[146,474][1370,543]` | x 64,9–608,9 · y 210,7–241,3 · **544,0 × 30,7** | [medido] |
| C1 | S1 — cartão 1: botão `Baixar esta setlist` | `[1406,479][1842,610]` | x 624,9–818,7 · y 212,9–271,1 · **193,8 × 58,2** | [medido] |
| C1 | S1 — cartão 1: ícone de estado offline | `[1897,513][1960,576]` | x 843,1–871,1 · y 228,0–256,0 · **28,0 × 28,0** | [medido] |
| C1 | S1 — cartão 1: `garantida offline` | `[1987,497][2415,542]` | x 883,1–1073,3 · y 220,9–240,9 · **190,2 × 20,0** | [medido] |
| C1 | S1 — cartão 2 sem download (`setlist-e39d57cf`) | `[72,720][2488,1017]` | x 32,0–1105,8 · y 320,0–452,0 · **1073,8 × 132,0** | [medido] |
| C1 | S1 — cartão 2: título (flex até o estado) | `[146,798][1861,867]` | x 64,9–827,1 · y 354,7–385,3 · **762,2 × 30,7** | [medido] |
| C3 | S2 — barra superior (contêiner) | `[0,54][2560,252]` | x 0,0–1137,8 · y 24,0–112,0 · **1137,8 × 88,0** | [medido] |
| C3 | S2 — `Voltar para as setlists` (`voltar`) | `[54,98][162,206]` | x 24,0–72,0 · y 43,6–91,6 · **48,0 × 48,0** | [medido] |
| C3 | S2 — título `SEASON 3` | `[216,90][1979,159]` | x 96,0–879,6 · y 40,0–70,7 · **783,6 × 30,7** | [medido] |
| C3 | S2 — meta `7 músicas` | `[279,169][415,212]` | x 124,0–184,4 · y 75,1–94,2 · **60,4 × 19,1** | [medido] |
| C3 | S2 — meta `2025-07-16` | `[514,169][673,212]` | x 228,4–299,1 · y 75,1–94,2 · **70,7 × 19,1** | [medido] |
| C3 | S2 — `Buscar na biblioteca` (`buscar`) | `[2033,87][2506,217]` | x 903,6–1113,8 · y 38,7–96,4 · **210,2 × 57,8** | [medido] |
| C3 | S2 — lista (ScrollView) | `[0,252][2560,1492]` | x 0,0–1137,8 · y 112,0–663,1 · **1137,8 × 551,1** | [medido] |
| C3 | S2 — conteúdo da lista (7 linhas) | `[0,252][2560,1458]` | x 0,0–1137,8 · y 112,0–648,0 · **1137,8 × 536,0** | [medido] |
| C3 | S2 — linha 1, coluna esquerda (`song-1`) | `[54,306][1262,567]` | x 24,0–560,9 · y 136,0–252,0 · **536,9 × 116,0** | [medido] |
| C3 | S2 — linha 1: número `1` | `[117,403][189,470]` | x 52,0–84,0 · y 179,1–208,9 · **32,0 × 29,8** | [medido] |
| C3 | S2 — linha 1: título | `[225,373][981,440]` | x 100,0–436,0 · y 165,8–195,6 · **336,0 × 29,8** | [medido] |
| C3 | S2 — linha 1: artista | `[225,458][981,501]` | x 100,0–436,0 · y 203,6–222,7 · **336,0 × 19,1** | [medido] |
| C3 | S2 — linha 1: ícone do tipo | `[1017,414][1062,459]` | x 452,0–472,0 · y 184,0–204,0 · **20,0 × 20,0** | [medido] |
| C3 | S2 — linha 1: `Letra` | `[1080,415][1206,458]` | x 480,0–536,0 · y 184,4–203,6 · **56,0 × 19,1** | [medido] |
| C3 | S2 — linha 2, coluna direita (`song-2`) | `[1298,306][2506,567]` | x 576,9–1113,8 · y 136,0–252,0 · **536,9 × 116,0** | [medido] |
| C3 | S2 — linha 3 (`song-3`, sem artista) | `[54,585][1262,846]` | x 24,0–560,9 · y 260,0–376,0 · **536,9 × 116,0** | [medido] |
| C3 | S2 — linha 7, ímpar final em largura total (`song-7`) | `[54,1143][2506,1404]` | x 24,0–1113,8 · y 508,0–624,0 · **1089,8 × 116,0** | [medido] |
| C4 | S2 do palco — `Voltar para o palco` (`voltar`) | `[54,98][162,206]` | x 24,0–72,0 · y 43,6–91,6 · **48,0 × 48,0** | [medido] |
| C4 | S2 do palco — linha atual destacada (`song-1`) | `[54,306][1262,567]` | x 24,0–560,9 · y 136,0–252,0 · **536,9 × 116,0** | [medido] |
| C5 | S4 — `Fechar a busca` | `[54,98][162,206]` | x 24,0–72,0 · y 43,6–91,6 · **48,0 × 48,0** | [medido] |
| C5 | S4 — campo (`campo-busca`) | `[317,98][2342,206]` | x 140,9–1040,9 · y 43,6–91,6 · **900,0 × 48,0** | [medido] |
| C5 | S4 — `Apagar o que foi digitado` | `[2369,98][2477,206]` | x 1052,9–1100,9 · y 43,6–91,6 · **48,0 × 48,0** | [medido] |
| C5 | S4 — cabeçalho `NESTA SETLIST · SEASON 3` | `[54,292][534,333]` | x 24,0–237,3 · y 129,8–148,0 · **213,3 × 18,2** | [medido] |
| C5 | S4 — contador `3 RESULTADOS` | `[2266,292][2506,333]` | x 1007,1–1113,8 · y 129,8–148,0 · **106,7 × 18,2** | [medido] |
| C5 | S4 — resultado na setlist (`resultado-d3d0efcf`) | `[54,383][2506,563]` | x 24,0–1113,8 · y 170,2–250,2 · **1089,8 × 80,0** | [medido] |
| C5 | S4 — resultado seguinte (`resultado-7a36ce4f`) | `[54,590][2506,770]` | x 24,0–1113,8 · y 262,2–342,2 · **1089,8 × 80,0** | [medido] |
| C5 | S4 — barra superior (contêiner) | `[0,54][2560,252]` | x 0,0–1137,8 · y 24,0–112,0 · **1137,8 × 88,0** | [medido] |
| C5 | S4 — último resultado da setlist (`resultado-4379bdb9`) | `[54,797][2506,977]` | x 24,0–1113,8 · y 354,2–434,2 · **1089,8 × 80,0** | [medido] |
| C5 | S4 — cabeçalho `BIBLIOTECA · 63 MÚSICAS` | `[54,1026][514,1067]` | x 24,0–228,4 · y 456,0–474,2 · **204,4 × 18,2** | [medido] |
| C5 | S4 — resultado da biblioteca, sem número (`resultado-f0523c5e`) | `[54,1116][2506,1296]` | x 24,0–1113,8 · y 496,0–576,0 · **1089,8 × 80,0** | [medido] |
| C6 | S3 — barra do topo (contêiner) | `[0,54][2560,198]` | x 0,0–1137,8 · y 24,0–88,0 · **1137,8 × 64,0** | [medido] |
| C6 | S3 — `1 DE 7` | `[54,90][238,159]` | x 24,0–105,8 · y 40,0–70,7 · **81,8 × 30,7** | [medido] |
| C6 | S3 — corpo (ScrollView) | `[0,198][2560,1276]` | x 0,0–1137,8 · y 88,0–567,1 · **1137,8 × 479,1** | [medido] |
| C6 | S3 — zona de toque `borda-voltar` | `[0,198][384,1276]` | x 0,0–170,7 · y 88,0–567,1 · **170,7 × 479,1** | [medido] |
| C6 | S3 — zona de toque `borda-avancar` | `[2176,198][2560,1276]` | x 967,1–1137,8 · y 88,0–567,1 · **170,7 × 479,1** | [medido] |
| C6 | S3 — barra inferior (contêiner) | `[0,1276][2560,1492]` | x 0,0–1137,8 · y 567,1–663,1 · **1137,8 × 96,0** | [medido] |
| C6 | S3 — botão `auto-scroll` | `[54,1311][203,1459]` | x 24,0–90,2 · y 582,7–648,4 · **66,2 × 65,8** | [medido] |
| C6 | S3 — botão `zoom-menos` | `[239,1311][387,1459]` | x 106,2–172,0 · y 582,7–648,4 · **65,8 × 65,8** | [medido] |
| C6 | S3 — botão `zoom-mais` | `[423,1311][572,1459]` | x 188,0–254,2 · y 582,7–648,4 · **66,2 × 65,8** | [medido] |
| C6 | S3 — botão `tema` | `[608,1311][756,1459]` | x 270,2–336,0 · y 582,7–648,4 · **65,8 × 65,8** | [medido] |
| C6 | S3 — botão `indice` | `[1989,1311][2137,1459]` | x 884,0–949,8 · y 582,7–648,4 · **65,8 × 65,8** | [medido] |
| C6 | S3 — botão `busca` | `[2173,1311][2322,1459]` | x 965,8–1032,0 · y 582,7–648,4 · **66,2 × 65,8** | [medido] |
| C6 | S3 — botão `sair` | `[2358,1311][2506,1459]` | x 1048,0–1113,8 · y 582,7–648,4 · **65,8 × 65,8** | [medido] |

## 2. O que o brief precisa: medidas derivadas

### 2.1 Barra superior de S1: onde a N2-D16 propõe o botão "criar"

| medida | conta (px) | dp | status |
|---|---|---|---|
| altura da barra | 324 − 54 = 270 | **120,0** (= `DESIGN-V1/README.md:209`) | [derivado] |
| margem lateral da barra (esq. do título, dir. de `buscar`) | 72 − 0 = 72 · 2560 − 2488 = 72 | **32,0** cada | [derivado] |
| `Buscar música`: folga acima e abaixo dentro da barra | 123 − 54 = 69 · 324 − 253 = 71 | **30,7** · **31,6** | [derivado] |
| vão entre `sincronizado agora` e `Buscar música` | 2103 − 2049 = 54 | **24,0** | [derivado] |
| vão entre o ícone de sync e o texto | 1786 − 1768 = 18 | **8,0** | [derivado] |
| grupo da direita (ícone de sync → borda dir. de `buscar`) | 2488 − 1723 = 765 | **340,0** | [derivado] |
| vão entre a caixa do título e o ícone de sync | 1723 − 1669 = 54 | **24,0** | [derivado] |
| caixa do título `SETLISTS` | 1669 − 72 = 1597 | **709,8** | [derivado] |

**Leitura para o brief (sem decidir nada):** a caixa do `TextView` do título
**estica** até o grupo da direita. Os 709,8 dp dela não são a largura do
texto "SETLISTS", que o dump não mede. Um botão novo ao lado de "buscar"
tira largura dessa caixa, não de um vão vazio. A barra termina em y 324 px e
o primeiro cartão começa em 396 px, então um botão contido nos 120 dp da
barra **não cobre cartão**.

### 2.2 Lista e cartão de S1

| medida | conta (px) | dp | status |
|---|---|---|---|
| **largura útil da lista** (borda esq. → dir. do cartão) | 2488 − 72 = 2416 | **1073,8** | [derivado] |
| cartão: altura | 693 − 396 = 297 | **132,0** | [derivado] |
| da barra ao 1º cartão | 396 − 324 = 72 | **32,0** | [derivado] |
| vão entre cartões | 720 − 693 = 27 | **12,0** | [derivado] |
| cartão: recuo interno esq. (borda → título) | 146 − 72 = 74 | **32,9** | [derivado] |
| cartão: recuo interno dir. (`garantida offline` → borda) | 2488 − 2415 = 73 | **32,4** | [derivado] |
| botão `Baixar esta setlist` → ícone de estado | 1897 − 1842 = 55 | **24,4** | [derivado] |
| altura da lista visível (ScrollView) | 1492 − 324 = 1168 | **519,1** | [derivado] |

O recuo interno passa de 32 dp em 0,4 a 0,9 dp. O dump não diz de onde vem
essa sobra (borda do cartão, arredondamento); fica registrado, sem
interpretação.

### 2.3 Barra e linha de S2 (C3; C4 tem a mesma geometria)

| medida | conta (px) | dp | status |
|---|---|---|---|
| altura da barra | 252 − 54 = 198 | **88,0** (= `README.md` §5.3) | [derivado] |
| margem lateral (voltar, `buscar`, linhas) | 54 · 2560 − 2506 = 54 | **24,0** | [derivado] |
| `voltar` → título | 216 − 162 = 54 | **24,0** | [derivado] |
| título → `buscar` | 2033 − 1979 = 54 | **24,0** | [derivado] |
| **largura útil da lista** | 2506 − 54 = 2452 | **1089,8** | [derivado] |
| linha: largura (2 colunas) · altura | 1262 − 54 = 1208 · 567 − 306 = 261 | **536,9 × 116,0** | [derivado] |
| vão entre colunas | 1298 − 1262 = 36 | **16,0** | [derivado] |
| vão entre linhas | 585 − 567 = 18 | **8,0** | [derivado] |
| da barra à 1ª linha · da última linha ao fim do conteúdo | 306 − 252 = 54 · 1458 − 1404 = 54 | **24,0** · **24,0** | [derivado] |
| linha: borda esq. → número · número → título | 117 − 54 = 63 · 225 − 189 = 36 | **28,0** · **16,0** | [derivado] |
| linha: `Letra` → borda dir. | 1262 − 1206 = 56 | **24,9** | [derivado] |
| linha ímpar final (7 de 7) | 2506 − 54 = 2452 | **1089,8** (largura total) | [derivado] |

### 2.4 S4, a busca que o picker vai reutilizar (C5)

| medida | conta (px) | dp | status |
|---|---|---|---|
| altura da barra (contêiner `[0,54][2560,252]`; a lista começa em `[0,252][2560,1492]`) | 252 − 54 = 198 | **88,0** | [derivado] |
| `fechar` → campo · campo → `apagar` | 317 − 162 = 155 · 2369 − 2342 = 27 | **68,9** · **12,0** | [derivado] |
| resultado: altura | 563 − 383 = 180 | **80,0** | [derivado] |
| vão entre resultados | 590 − 563 = 27 | **12,0** | [derivado] |
| último resultado da setlist → cabeçalho da biblioteca | 1026 − 977 = 49 | **21,8** | [derivado] |

### 2.5 Palco (C6), referência do A15

| medida | conta (px) | dp | status |
|---|---|---|---|
| barra do topo | 198 − 54 = 144 | **64,0** (`bar.top`) | [derivado] |
| barra inferior | 1492 − 1276 = 216 | **96,0** (`bar.stage`) | [derivado] |
| botão da barra | 1459 − 1311 = 148 | **65,8** | [derivado] |
| vão entre botões do mesmo grupo | 239 − 203 = 36 | **16,0** | [derivado] |
| grupo esquerdo (4) · grupo direito (3) | 756 − 54 = 702 · 2506 − 1989 = 517 | **312,0** · **229,8** | [derivado] |
| vão entre os dois grupos | 1989 − 756 = 1233 | **548,0** | [derivado] |
| botões: folga acima · abaixo, dentro da barra | 1311 − 1276 = 35 · 1492 − 1459 = 33 | **15,6** · **14,7** | [derivado] |
| zonas de toque laterais (cada) | 384 | **170,7** | [derivado] |

## 3. O que não está aqui

- **Cores, raios, espessura de borda e hairline**: o dump não traz. Os
  valores são os tokens de `DESIGN-V1/README.md` §5, não medidas desta pasta.
- **S1f (vazio)**: não capturado; a conta principal tem 2 setlists (ver `README.md`).
- **Largura do texto "SETLISTS"**: a caixa do `TextView` estica; medir o texto
  exigiria a imagem, e esta tabela não usa a imagem.
