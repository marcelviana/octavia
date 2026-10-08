# QL — requisitos e aceites: a quebra de linha no palco e em V

> **Bloco QL · PR de desenho** (só docs). Data: 2026-10-08. Base: `origin/main` = `c655e03` (merge da #371, o brief).
> **O QL não tem PRD separado; este documento faz esse papel**, no molde do [`N4-REQUISITOS.md`](N4-REQUISITOS.md) — todo
> requisito `QL-Rn` cita a fonte e tem *Aceite* verificável.
> **Fontes**: [`QL-PRECHECK.md`](QL-PRECHECK.md) (QL-D1…D27, a Fase A, a Fase B), [`QL-BRIEF.md`](QL-BRIEF.md) e
> [`DESIGN-QL/README.md`](DESIGN-QL/README.md) (QL-D28…D38, a folha congelada, a errata QL-E1, as medidas a conferir).
> **Regra de leitura**: `[lido]` = do documento citado; `[derivado]` = consequência de decisões, com a conta à vista.
> **Moldura** = `QL-{C,B,A}-<superfície>-<estado>-<tema>` da folha; `*` = as três faixas.
> **Divergências**: as desta PR estão no `DESIGN-QL/README.md` §11 (**1195 a 1198**).

---

## 0. As faixas e o que o QL faz em cada uma

| faixa | largura útil | no QL | colunas no zoom 22 | onde se mede |
| --- | --- | --- | --- | --- |
| **C** | > 960 dp | implementada; **o palco deitado no zoom 22 não muda para nenhuma música de até 80 colunas** | palco 80 · V 55 | Tab S6 e AVD `octavia_tab32` deitados |
| **B** | 700–960 dp | implementada | 48 | Tab S6 e AVD em pé |
| **A** | < 700 dp | **desenhada**; a função da quebra se prova em 26 colunas (gate); as telas são do N5 | 26 | o gate (i); `octavia_phone` só se o N5 pedir |

Fontes: QL-D2, QL-D6, QL-D25; `QL-PRECHECK.md` A1.3.

---

## 1. Requisitos

### 1.1 A função da quebra

**QL-R1 — A quebra é só de exibição** `[QL-D2; QL-D13]`. O texto da música não muda: o `bodyOf` do core devolve o mesmo
texto de hoje, e a **busca** segue indexando o texto lógico (`packages/core/src/search.ts:42`). A função da quebra **não
entra no `bodyOf`**. *Aceite*: A-QL-2.

**QL-R2 — Uma função pura no `packages/core`, por número de colunas** `[QL-D13; QL-D7 (i)]`. Recebe o texto, o tipo e as
colunas; devolve as linhas visuais, cada uma com a linha lógica de onde veio e se é continuação. O app mede a largura da
coluna e a de um caractere no zoom corrente, e divide (`QL-PRECHECK.md` A2). *Aceite*: A-QL-1, A-QL-6.

**QL-R3 — R1, a Letra** `[QL-D28; folha §1]`. Corta no último espaço que cabe; o espaço do corte não aparece em nenhum dos
pedaços; só parte uma palavra se ela sozinha for maior que a coluna, e aí na última coluna. *Aceite*: A-QL-1.

**QL-R4 — R2, o par da Cifra** `[QL-D28; QL-D14; QL-E1]`. A linha de acordes e a linha de letra logo abaixo cortam **na
mesma coluna**; o corte recua até o primeiro ponto que não parte nem um acorde nem uma palavra, nas duas linhas; **se esse
ponto não existe, a palavra pode partir, mas o acorde nunca** (o corte vai para a última coluna fora de acorde). O par de
50 do §5.2 do brief recua, em 26 colunas, para a **18** (QL-E1); em 14 colunas, a palavra parte (*hi|stória*). *Aceite*:
A-QL-1.

**QL-R5 — R3, a continuação** `[QL-D29; folha §1]`. Cada pedaço depois do primeiro começa com **2 colunas de recuo**, sem
glifo; a coluna útil da continuação é colunas − 2. No par, as duas continuações têm o mesmo recuo, e os espaços que sobram
no começo do resto saem na mesma quantidade das duas linhas, para o acorde continuar sobre a mesma sílaba. Um pedaço de
acordes vazio não ocupa linha. *Aceite*: A-QL-1, A-QL-10.

**QL-R6 — R4, fora do par; a reserva por linha** `[QL-D23; QL-D22; folha §1]`. A linha que a heurística não reconhece com
certeza como de acordes (a **quase acorde**, *"Intro: Am  E"*) **não forma par** e quebra como letra, se precisar. A
**progressão de uma seção** (*"Am  F  C  G"*) faz par com a linha de letra de baixo. *Aceite*: A-QL-1.

**QL-R7 — O par só na Cifra** `[QL-D22]`. A Letra quebra **sempre** como letra, mesmo com um acorde digitado. *Aceite*:
A-QL-1.

**QL-R8 — A Tab não quebra** `[QL-D2; QL-D37]`. Rola para o lado, como hoje, com as 6 linhas e as colunas intactas, em toda
faixa e zoom. **Só a Tab rola para o lado.** *Aceite*: A-QL-1, A-QL-11.

**QL-R9 — Tabulação, `\r` e acento combinante** `[QL-D24]`. A função **mede** sem normalizar o texto: o `\t` conta até a
próxima coluna múltipla de 8; o `\r` do fim da linha conta 0; o acento combinante conta 0. A invariância (QL-R1) segue
exata. *Aceite*: A-QL-3.

### 1.2 O leitor — o palco e V

**QL-R10 — O corpo quebra no palco e em V, em C e B** `[QL-D2; QL-D6; QL-D19; molduras QL-{C,B}-S3-*, QL-{C,B}-V-*]`. O
leitor compartilhado (`Leitor.tsx`) desenha as linhas visuais da função; a Letra e a Cifra deixam de rolar para o lado. O
corpo segue as molduras da folha, com os valores do `DESIGN-QL/README.md` §4 (> 4 dp = errata). *Aceite*: A-QL-10,
A-QL-12…A-QL-15.

**QL-R11 — No palco deitado, no zoom 22, nada muda para música de até 80 colunas** `[QL-D25; moldura
QL-C-S3-letra-z22-77col-escuro]`. A base do G-inv **B5 fica byte a byte** (34 de 34); na **B3**, só os **6 dumps de Letra**
(a linha de 110 colunas da fixture) mudam, por **errata em par** com o `g-inv-par` (regra 33); os outros 12 ficam
idênticos. *Aceite*: A-QL-8, A-QL-16.

**QL-R12 — O escuro e o claro do palco** `[QL-D37]`. Só as tintas trocam: o par em `text`; nas notas, o texto em `text`, o
rótulo e a divisa em `muted`, o fio em `line`. V segue só escura. *Aceite*: A-QL-10.

**QL-R13 — A âncora** `[QL-D18; QL-D37; molduras QL-*-S3-ancora-*]`. A cada mudança de colunas — o giro (C ↔ B) e o
zoom —, o **começo da linha lógica** que estava no topo volta ao topo, **a 32 da barra**, sem sinal de rearranjo.
*Aceite*: A-QL-12.

### 1.3 As notas da música no palco

**QL-R14 — As notas no topo do corpo** `[QL-D4; QL-D26; QL-D30; QL-D32; molduras QL-*-S3-notas-*]`. No topo do corpo,
**rolando com a letra**, em **Manrope 16 × zoom ÷ 22**, entrelinha 1,55, sob a régua *notas da música* (mono 12) e fechadas
por um fio `line`; 8 entre parágrafos, 24 antes da letra. Quebram pela mesma função (R1). **Música sem nota não mostra
nada, nem a régua.** A nota **da posição** continua na barra de cima. *Aceite*: A-QL-17.

**QL-R15 — Recolher e abrir** `[QL-D30; QL-D31]`. **Abertas por padrão**; um toque na régua (**48 de altura**) recolhe ou
abre. A **divisa** de 20 em `muted`, na ponta direita da régua, mostra o estado (aberta para cima, recolhida para baixo). O
nome acessível é *notas da música*, com o estado expandido do sistema; **nenhuma frase nova**. *Aceite*: A-QL-17, A-QL-18.

**QL-R16 — O estado lembrado** `[QL-D33; QL-D39; div. 1198]`. O estado recolhido das notas **vale para todas as músicas
e é lembrado de verdade**: gravado no aparelho, volta como estava ao reabrir o app ou o palco. **O zoom e o tema seguem
como hoje** — estado do palco, que recomeça a cada palco aberto (T1-R31 e T1-R32 intactos). É a **primeira preferência do
app gravada no aparelho fora do Firebase**: a PR-4 declara a chave, prova com teste (gravar, reabrir, ler) e declara a
mudança nos gates que a contam. *Aceite*: A-QL-18.

**QL-R17 — A divisa no catálogo** `[QL-D31]`. Um registro com dois estados (o mesmo traço espelhado), no catálogo de
ícones: **41 → 42**, cobrado pelo `gate:icones`. *Aceite*: A-QL-19.

### 1.4 Os gates, os instrumentos e o PRD

**QL-R18 — Os gates entram reprovados** `[QL-D7; QL-D19; regra 30]`: o gate (i) da função, com os casos de R1–R4 em 80, 55,
48, 26 e 14 colunas, a progressão, a quase acorde e os de QL-R9; e (ii) a invariância. *Aceite*: A-QL-1…A-QL-3.

**QL-R19 — Os três instrumentos comparam o texto lógico** `[QL-D16; divs. 1185]`. O G-par de V, o (e) do G-N3 e o
comprimento com `sha12` do `corpo` passam a comparar as linhas visuais juntadas sem as continuações; cada um prova com
controle negativo que reprova uma quebra que muda o texto; o duplo do `native-tela` recebe colunas. *Aceite*: A-QL-5.

**QL-R20 — A errata do PRD da tela 1** `[QL-D15; QL-D23; div. 1186]`. O T1-R31 (*"zoom sem re-quebra"*) e o T1-R25
(*"`pre`"*) ganham errata: a Letra e a Cifra quebram; a Tab não. A razão: o par da Cifra resolve o PERF-10. O aceite novo:
*"a Cifra de 120 colunas quebrada com o acorde sobre a sílaba"*. A errata registra R2 e a **reserva por linha**. *Aceite*:
A-QL-4.

**QL-R21 — A largura do caractere em cada zoom** `[QL-D34]`. Medida no aparelho nos cinco zooms (18, 22, 26, 32, 40); ela
decide qual das duas contas de colunas do `DESIGN-QL/README.md` §4 vale. *Aceite*: A-QL-6.

**QL-R22 — O congelado no CI** `[QL-D38]`. O `DESIGN-QL` entra no `shasum -c` dos congelados (`gates.yml`), como o
`DESIGN-N4` entrou na N4-PR3. *Aceite*: A-QL-7.

**QL-R23 — Nenhum token novo** `[QL-D2; folha: "0 tokens ou frases novos"]`. O ícone novo é só a divisa (QL-R17).
*Aceite*: A-QL-19.

---

## 2. Aceites do QL

O QL está pronto quando todos abaixo passam, no **Tab S6 e no AVD `octavia_tab32`**, com o **mock** e a fixture do projeto,
salvo onde o critério diz outra coisa. **Quem mede é o executor** (N4-D54): tudo que um instrumento compara é medido e
colado; **ao Marcel cabe o que só o olho e a mão julgam** — coluna *Marcel*. Todo aceite no aparelho **conta as quedas
nativas** (regra 36), e o Tab repousa com o release e volta a ele no fim de todo aceite com mock (N4-D55).

| # | critério | evidência (executor) | Marcel | rastreio |
| --- | --- | --- | --- | --- |
| A-QL-1 | o gate (i): R1–R4 nos casos do brief §5 em 80, 55, 48, 26 e 14 colunas — a Letra de 77 em 26 (4 pedaços), o par de 50 em 26 recuando para a 18, o par sem saída em 14 (*hi\|stória*), a progressão em par, a quase acorde fora do par, a Tab intacta — **reprova na PR-1, passa na PR-2** | Vitest no core | — | QL-R2…R8, R18 |
| A-QL-2 | a invariância (ii): para todo caso, as linhas visuais juntadas sem as continuações devolvem o texto; o `bodyOf` e a busca iguais aos de hoje | Vitest no core; o G-par do core verde | — | QL-R1 |
| A-QL-3 | `\t`, `\r` e acento combinante: os três casos que só medem | Vitest no core | — | QL-R9 |
| A-QL-4 | a errata do T1-R31 e do T1-R25 no `PRD-TELA-1.md`, com R2, a reserva por linha e o aceite novo | o diff da PR-1 | — | QL-R20 |
| A-QL-5 | os três instrumentos comparam o texto lógico; cada um com CN que reprova uma quebra que muda o texto; o duplo do `native-tela` com colunas (o G-par de V **vê** a quebra) | os CN, colados | — | QL-R19 |
| A-QL-6 | a largura do caractere nos cinco zooms, no AVD e no Tab (a régua por zoom); qual conta de colunas vale | a régua e o dump | — | QL-R21 |
| A-QL-7 | o `DESIGN-QL` no `shasum -c` do CI | o job verde; o CN (um byte trocado reprova) | — | QL-R22 |
| A-QL-8 | **G-inv**: a B5 34 de 34 idênticos; a B3 12 de 18 idênticos e os **6 dumps de Letra em par** (`g-inv-par`: só o declarado mudou) | `g-inv.sh`, `g-inv-par.mjs` | — | QL-R11 |
| A-QL-9 | **G-N3** e **G-par** verdes com o texto lógico; o G-par do core sem mudança | `g-n3.mjs`; Vitest | — | QL-R19 |
| A-QL-10 | o corpo em C e B pelas molduras: colunas, recuo de 2, o par sobre a sílaba, as tintas nos dois temas (> 4 dp = errata) | dumps de C e B; capturas | — | QL-R5, R10, R12 |
| A-QL-11 | a Tab rola em toda faixa e zoom, 6 linhas intactas | dumps | — | QL-R8 |
| A-QL-12 | **a âncora**: girar o tablet no meio de uma Letra longa, e um passo de zoom, põem o começo da linha lógica do topo a 32 da barra | dumps antes/depois | **julga no Tab** (PR-3) | QL-R13 |
| A-QL-13 | **o tablet em pé, no zoom padrão** — a letra quebrada se lê no palco? | o executor escolhe as músicas **pelo comprimento das linhas, sem ler o texto**, e diz quais pelo id8 | **julga** (PR-3 e encerramento) | QL-D27 (1) |
| A-QL-14 | **o tablet deitado, no zoom 40** | idem | **julga** (PR-3 e encerramento) | QL-D27 (2) |
| A-QL-15 | **uma das 11 Letras que quebram em V em C** | idem | **julga** (PR-3 e encerramento) | QL-D27 (3) |
| A-QL-16 | **o palco deitado no zoom 22 não muda**: para as músicas do Marcel, o corpo igual ao de hoje (comprimento e `sha12` do texto lógico; nenhuma continuação) | dump no Tab | — (prova, não julgamento) | QL-R11; QL-D27 |
| A-QL-17 | as notas no palco: abertas por padrão, recolhidas, a longa (zoom 40) e **sem nota nada**, pelas molduras; a nota da posição na barra | dumps; capturas | — | QL-R14, R15 |
| A-QL-18 | recolher e abrir pela régua de 48; o estado vale para todas as músicas; **recolher as notas, matar o app (`force-stop`), reabrir e ver as notas recolhidas**, com o **zoom e o tema de volta ao padrão** (22, escuro), como hoje (QL-D39); o teste da preferência (gravar, reabrir, ler) e a chave declarada | dumps antes/depois da reabertura; o teste; a chave | — | QL-R15, R16 |
| A-QL-19 | a divisa no catálogo (41 → 42) e no `gate:icones` (0 acusações); nenhum token novo | `gate:icones`; `gate:a20` | **o traço no Tab, em 20 dp** (PR-4) | QL-R17, R23 |
| A-QL-20 | **a primeira nota de verdade**: o Marcel a escreve no site, numa música dele, e a vê no palco | o sync e o dump (comprimento, sem o texto) | **escreve e julga** (encerramento) | QL-D26 |
| A-QL-21 | **o release no Tab**: o release da `main` sem Metro; **100 + 100 aberturas frias** (AVD e Tab), **0 queda nativa** (regra 36); os julgamentos A-QL-13…15 com as músicas do Marcel | `frias-release.sh`; `quedas.py` | **julga** (encerramento) | QL-D9; QL-D27 |

---

## 3. A ordem — o fatiamento (QL-D19)

Cada PR nomeia a seguinte. Gate primeiro em toda PR de código (regra 30).

### PR-1 — gates

O gate (i) com os casos de R1 e R2 (e R3, R4); a invariância (ii); os casos de `\t`, `\r` e acento combinante (QL-D24); a
errata do T1-R31 e do T1-R25 (QL-D15), com R2 e a reserva por linha; a errata dos três instrumentos (QL-D16), com CN e o
duplo com colunas; a medida do caractere por zoom (QL-D34), com o token de régua por zoom; e o `DESIGN-QL` no `shasum -c`
do CI. *Aceites*: A-QL-1 (reprovando), A-QL-2…A-QL-7.

### PR-2 — a quebra no core

A função pura (R1–R4, o recuo, a reserva por linha, a medida dos três caracteres), fora do `bodyOf`. *Aceites*: A-QL-1
(passando), A-QL-2, A-QL-3.

### PR-3 — o leitor no palco e em V

O `Leitor.tsx` desenha as linhas visuais; as duas medidas no app; a Letra e a Cifra deixam de rolar para o lado, a Tab
continua; a **errata em par dos 6 dumps de Letra da B3**, com a **B5 byte a byte**; a **âncora** (QL-D18). O aceite no AVD
e no Tab, e os julgamentos do Marcel da QL-D27. *Aceites*: A-QL-8…A-QL-16.

### PR-4 — as notas no palco

As notas no topo do corpo (QL-D30, D32); recolher e abrir; a **divisa** no catálogo (41 → 42) e no `gate:icones`; o
**estado lembrado** (QL-D33, QL-D39: gravado no aparelho, a chave declarada, o teste de gravar-reabrir-ler e a mudança
nos gates que a contam); o julgamento do traço no Tab. *Podem entrar na PR-3* se o desenho as
puser em mono no corpo (QL-D19) — **não pôs**: elas vão em Manrope (QL-D30), então ficam na PR-4 `[derivado]`. *Aceites*:
A-QL-17…A-QL-19.

### Encerramento

O release no Tab com 100 + 100 e as quedas nativas; os julgamentos do Marcel (QL-D27); **a primeira nota de verdade**
(QL-D26); as corridas do bloco no `CI-FAIXA.md` (regra 22). *Aceites*: A-QL-20, A-QL-21.

---

## 4. Herança, com destino

| item | destino | origem |
| --- | --- | --- |
| o respiro do corpo em A (32 × os 16 do `N3-A-S3`) — confirmar | **N5** | QL-D35; O2 |
| a nota da posição em A; a barra de baixo de A saindo da tela | **N5** | QL-D36; O3, O4, P-QL6 |
| a sincronização automática — o T1-R13 passo 4, o voo único, a foto da música aberta, a janela da `naoRegredir`, a regra 38 (c)/(d) | **SY** (depois do QL, antes do resto do D) | QL-D12 |
| as corridas 124 e 146 do APK (disparo a mais) e a hipótese do lado cego do detector | **W5** | QL-D17; div. 1184 |

O par na Letra com cifra digitada **não é herança**: é o custo declarado da QL-D22 (0 casos no dado do Marcel), e se
reabre como pergunta quando houver um.
