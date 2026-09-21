# DESIGN-V1 — iconografia e telas

Congelado em **V1-PR2**. Molde: `docs/native/DESIGN-TELA-1/README.md`.

Conteúdo desta pasta:

| arquivo | o que é |
| --- | --- |
| `README.md` | este documento — a fonte durante o intervalo (§2) |
| `telas.html` | as 22 molduras, arquivo único offline (`Octavia V1 - As telas (offline).html`) |
| `telas.pdf` | impressão do mesmo arquivo |
| `icones.html` | a folha da Fase 1 — catálogo, grade, tamanhos, tokens |

---

## 1 · O que este design é

O V1 dá ícones ao app inteiro, redesenha visualmente **S1** (setlists) e **S2** (índice), dá acabamento a **S0**, **S4** e **S5**, e no **S3** (palco) mexe **só na barra inferior**, que passa a ser só de ícones.

O que ele **não** é:

- Não mexe no layout do palco. Área de conteúdo, zonas de toque das bordas, comportamento de virada de página e de zoom ficam como estão.
- Não muda comportamento em lugar nenhum. Todo controle que hoje aceita toque continua aceitando; o que propõe o contrário está na §8.
- Não muda dado, ordenação, navegação nem texto de erro. As mensagens são as que o código já tem.
- Não é implementação. Nenhuma linha de `theme.ts` ou de tela foi escrita — isso é a V1-PR3.

---

## 2 · Quem é a fonte, durante o intervalo

No N1 a relação era: o design congelava, o código copiava, e `apps/native/src/theme.ts` se declarava *verbatim do README*. O `theme.ts` era o espelho; o README, o original.

**Agora a relação se inverte, temporariamente.** O DESIGN-V1 traz quatro tokens que o `theme.ts` ainda não tem — `accentInk`, `errorInk`, `offlineInk`, `lineInfo` (§3) — e traz uma geometria de canvas que o app ainda não respeita.

| período | fonte da verdade | o espelho |
| --- | --- | --- |
| até V1-PR2 (congelamento) | `theme.ts` | — |
| **entre V1-PR2 e V1-PR3** | **este README** | `theme.ts` (incompleto: faltam os quatro) |
| depois de V1-PR3 | `theme.ts` | este README |

Datas: V1-PR2 **em aberto**, V1-PR3 **em aberto**. Quem fecha: o dono do app.

Enquanto o intervalo durar, os sete tokens existentes (§3, primeira tabela) continuam sendo verbatim do `theme.ts` — este documento os transcreve, não os define. Os quatro novos (§3, segunda tabela) são definidos aqui e em nenhum outro lugar. Se os dois discordarem durante o intervalo, o README vence apenas nos quatro novos; nos sete antigos, vence o `theme.ts` e a divergência vira errata (§9).

---

## 3 · Tokens

### 3.1 Os sete existentes — verbatim de `apps/native/src/theme.ts`

Verbatim de `apps/native/src/theme.ts` (`dark` e `light`, sete chaves cada). Razões medidas em `contraste-v1.mjs` (WCAG 2.1, luminância relativa), reproduzindo V1-A4 ao centésimo.

| token | escuro | razão esc. | claro | razão claro | papel |
| --- | --- | --- | --- | --- | --- |
| `bg` | `#100F16` | — | `#F6F1EA` | — | fundo da tela |
| `text` | `#F9F5F1` | 17,57 | `#100F16` | 16,96 | corpo, títulos, rótulo de botão |
| `muted` | `#A9A5B5` | 7,93 | `#5E5A6A` | 5,94 | apoio, chips, *n de N*, sub-rótulos |
| `accent` | `#777CE8` | 5,29 | `#777CE8` | 3,20 | número de posição, destaque, borda ativa |
| `error` | `#E5686F` | 5,94 | `#E5686F` | 2,86 | mensagem de erro, borda de banner |
| `offline` | `#C9923B` | 6,95 | `#C9923B` | 2,44 | chip offline, indicador, ponto do palco |
| `line` | `#2A2836` | 1,32 | `#D6CFC3` | 1,38 | hairline e borda — **decorativa** |

Três reprovações já existentes, herdadas e **não corrigidas pelo V1** (elas são a razão de existirem os tokens novos): `accent`, `error` e `offline` no tema claro. `line` reprova 3:1 nos dois temas e isso é aceito: ela não carrega informação.

Ressalva medida em V1-A4, que continua valendo: `cor.offline` tem **0 usos**. O ponto do palco é `backgroundColor: dark.offline` **estático**, então no tema claro o par real é `#C9923B` sobre `#F6F1EA` = **2,44:1**.

### 3.2 Os quatro novos — definidos aqui

`ThemeColors` sai das chaves de `dark` e `colors: Record<ThemeName, ThemeColors>` obriga as duas paletas às mesmas chaves: cada token novo precisa dos dois valores. Nos três primeiros, o valor escuro **é o token que já existe** — nenhum pixel muda no escuro; o nome novo nasceu porque o claro precisava de outra tinta.

| token | escuro | razão esc. | claro | razão claro | papel |
| --- | --- | --- | --- | --- | --- |
| `accentInk` | `#777CE8` | 5,29 | `#4A4FC0` | 5,90 | acento como **texto** |
| `errorInk` | `#E5686F` | 5,94 | `#A32A31` | 6,37 | texto de erro e borda de banner |
| `offlineInk` | `#C9923B` | 6,95 | `#7A5410` | 6,02 | chip offline, arco parcial, dado incompleto |
| `lineInfo` | `#6E6A80` | 3,66 | `#8E8779` | 3,17 | borda e desenho **que carregam informação** |

São quatro tokens, não cinco: `lineInfo` é um só, com dois valores.

### 3.3 Regra de uso do `lineInfo`

`lineInfo` serve a 3:1, e 3:1 cobre exatamente três coisas:

1. **ícone** — desenho sem texto, em qualquer tamanho do sistema;
2. **contorno** que carrega informação (trilha do arco, moldura de controle);
3. **elemento desabilitado** — a norma isenta o que está inativo.

`lineInfo` **não serve para texto ativo**. O limite de 3:1 para texto vale de **24 px** para cima, ou **18,7 px em negrito**; abaixo disso são **4,5:1**. Texto pequeno é o pior caso, não o mais tolerante. Todo texto ativo abaixo de 24 px vai em `muted` — inclusive régua de seção, contagem, número de posição e microrrótulo.

Consequência declarada: **item inválido não é item desabilitado.** No S2, as músicas sem corpo e sem tipo são navegáveis — é por elas que se chega ao placeholder do palco —, então o número de posição delas fica em `muted`, igual ao dos válidos. O que muda é o ícone e a sublinha, não a legibilidade.

O erro que originou esta regra está registrado na errata como precedente: a primeira versão da folha usava `lineInfo` como terceiro nível de texto **enquanto proibia exatamente isso**.

### 3.4 Alfa e composição

Onde houver opacidade sobre fundo, a composição para efeito de contraste é feita em **sRGB**, não em espaço linear. Compor em linear produz números otimistas (foi assim que um par apurou 1,67:1 quando o valor correto era 1,92:1). `contraste-v1.mjs` não compõe alfa: os oito pares que ele calcula são cores opacas.

---

## 4 · Tipografia

### 4.1 Famílias — verbatim de `theme.ts`

Seis arquivos `.ttf`, seis tokens. O nome do valor é o nome do arquivo embarcado pelo config plugin do `expo-font` (N1-D6): a fonte está disponível quando o app abre, sem carga em runtime.

| token | valor |
| --- | --- |
| `font.display` | `Raleway_600SemiBold` |
| `font.displayMedium` | `Raleway_500Medium` |
| `font.ui` | `Manrope_400Regular` |
| `font.uiBold` | `Manrope_600SemiBold` |
| `font.mono` | `IBMPlexMono_400Regular` |
| `font.monoBold` | `IBMPlexMono_600SemiBold` |

Raleway entrou pela **errata E1 do DESIGN-TELA-1**, e está tokenizado nos dois pesos. Ver E1 da §9 deste documento: eu havia registrado o contrário.

### 4.2 Tamanhos — verbatim de `theme.ts`

| token | dp | token | dp |
| --- | --- | --- | --- |
| `size.labelSmall` | 12 | `size.button` | 17 |
| `size.label` | 14 | `size.input` | 18 |
| `size.bodySmall` | 15 | `size.title` | 22 |
| `size.body` | 16 | `size.titleLarge` | 28 |

Tracking, aplicado como `tamanho × tracking`: `tracking.label` **0,08** · `tracking.display` **0,14** · `tracking.displayWide` **0,22**.

Conteúdo do palco, que não usa `size`: `zoomSteps` **18 · 22 · 26 · 32 · 40**, padrão **22**; `lineHeight.text` **1,55** e `lineHeight.tab` **1,45**.

**A escala para em 28.** O display do S5 (44 literal) e o do S1 (24 literal) estão fora dela por falta de degrau, não por escolha — ver §4.4.

### 4.3 Os 18 literais fora da escala

V1-PRECHECK §5.1c: o app tem **18 `fontSize` literais** fora de `size`. São eles, verbatim de V1-A2(c):

- 44 — display do S5 (`EndScreen.tsx:102`)
- 24 — display do S1 (`SetlistsScreen.tsx:326`)
- 20 — `numero`, `titulo` e `glifo` do S2/S4, `titulo` do S3 (`IndexScreen:202,204` · `SearchScreen:301,304` · `SetlistsScreen:340` · `StageScreen:717`)
- 13 — sublinhas e status (`IndexScreen:185` · `SearchScreen:277` · `SetlistsScreen:308,343` · `EndScreen:93` · `StageScreen:713`)
- 12 — rótulo de botão secundário e do controle do palco (`IndexScreen:218` · `SearchScreen:318` · `StageScreen:773`)
- 10 — motivo do controle do palco (`StageScreen:774`)

**Baseline para a V1-PR3: 16, não 18.** Os dois degraus da §4.4 absorvem um literal cada — o 44 do `EndScreen.tsx:102` vira `size.display`, o 24 do `SetlistsScreen.tsx:326` vira `size.titleSmall`. Sobram 16.

Observação, não decisão: os três literais **12** (`IndexScreen:218` · `SearchScreen:318` · `StageScreen:773`) já têm degrau — `size.labelSmall` = 12 — e cairiam sem escala nova, levando a 13. Os literais 20, 13 e 10 continuariam sem degrau. Se a V1-PR3 quiser zerar, faltam três nomes; se não, **16** é o número que ela herda.

### 4.4 A escala que o desenho fixou, contra a do app

Coluna **meu**: do desenho das 22 molduras. Coluna **token**: o degrau de `size` correspondente, ou o literal que o app usa hoje. Onde as duas batem, a V1-PR3 só troca o literal pelo token; onde não batem, a diferença é decisão de desenho e está na última coluna.

| papel | meu | token / app | onde |
| --- | --- | --- | --- |
| display | 52 | literal 44 | S5 — o único momento em que a tela pode ocupar espaço |
| título de tela | 26 | literal 24 | cabeçalho do S1 |
| título de item | 20 | literal 20 | item do S2, resultado do S4 — bate |
| corpo do palco | 21 | `zoomSteps` | letra e cifra em mono; **18 na cifra**, que é o caso de mais linhas — os dois são degraus de zoom existentes (18 e 22 ≈ 21) |
| corpo de UI | 15 | `size.bodySmall` 15 | rótulo de botão, placeholder — bate |
| apoio | 14 | `size.label` 14 | metadado de cartão, nota — bate |
| chip / status | 13 | literal 13 | chip de rede, tipo da música |
| régua / mono de seção | 12 | `size.labelSmall` 12 | contagem, rótulo de grupo — bate |
| microrrótulo do palco | 10 | literal 10 | só na variante com rótulo, que é proposta |

Quatro dos nove já são degraus da escala. Dos cinco restantes, três são literais que o app já tem (13, 10, e o título de item em 20, que é `size.title` 22 menos dois) e dois são novos: **52** e **26**.

**Os dois novos entram na escala como degraus.** Decidido: `size.display` = **52** e `size.titleSmall` = **26**. A escala passa de oito para **dez degraus** e cobre o que o app de fato usa em texto grande.

Razão: os dois lugares vão ser tocados na V1-PR3 de qualquer jeito, porque o desenho mudou os dois números. A pergunta não era mexer ou não, era se ao mexer o número fica com nome ou sem. Puxar o título do S1 para os 28 existentes e deixar o 52 como literal trocaria o literal 44 pelo literal 52 sem ganho de disciplina, e ainda perderia o momento do S5 — o único lugar do app tratado como cerimônia.

A escala completa, com os dois novos:

| token | dp | token | dp |
| --- | --- | --- | --- |
| `size.labelSmall` | 12 | `size.input` | 18 |
| `size.label` | 14 | `size.title` | 22 |
| `size.bodySmall` | 15 | `size.titleSmall` | **26** |
| `size.body` | 16 | `size.titleLarge` | 28 |
| `size.button` | 17 | `size.display` | **52** |

`titleSmall` fica acima de `title` e abaixo de `titleLarge`: o nome vem da relação com `titleLarge`, não da posição na lista.

---

## 5 · Geometria

### 5.1 Canvas

**1138 × 627 dp.** Origem do número: 711,1 dp de altura útil no AVD, menos a **barra de status (24)** e a **barra de tarefas (60)**. 627 é o pior caso medido; o Tab S6 dá 639,1. Desenhar em 627 garante que nada é cortado nos dois aparelhos.

### 5.2 Alvos de toque

Verbatim de `theme.ts`:

| token | dp | papel |
| --- | --- | --- |
| `touch.min` | 48 | mínimo absoluto |
| `touch.list` | 56 | botão de lista, barra superior |
| `touch.stage` | 64 | controle do palco |

Confirmam os derivados citados em V1-A2(b): `touch.list + 2` = 58 (botão secundário), `touch.list + 4` = 60 (campo do login), `touch.stage + 2` = 66 (controle do palco, antes do redesenho).

Espaço e raio, também verbatim, que o desenho respeita: `space` **4 · 8 · 12 · 16 · 24 · 32 · 48**; `radius` **chip 6 · control 12 · pill 20**.

### 5.3 Barras

| barra | dp | token |
| --- | --- | --- |
| do palco (topo) | 64 | `bar.top` |
| superior (S2, S4) | 88 | **minha** — `bar.top` + 24 |
| superior (S1) | 120 | **minha** |
| inferior do palco | 96 | `bar.stage` |
| hairline | 1 | `bar.hairline` |

`bar.top` = 64 e `bar.stage` = 96 são verbatim; as duas barras superiores de lista são minhas, e nenhuma delas existe como token hoje.

### 5.4 Cartão e item (meus)

| elemento | dp | antes |
| --- | --- | --- |
| cartão do S1 | 132 | 138 no app (`minHeight`) |
| cartão do S1e (com banner) | 112 | — |
| item do S2 | 116 | 120 no app (`minHeight`) |
| item do S2, inválido | 116 | idêntico ao válido — ver abaixo |
| resultado do S4 | 80 | — |
| controle do palco | 64 × 64 | 106 × 66 |

Os dois primeiros vêm de `minHeight: 138` (`SetlistsScreen.tsx:311`) e `minHeight: 120` (`IndexScreen.tsx:190`). Baixaram porque o que não cabia em 627 era **o conjunto**, não o item: três cartões de 138 mais o cabeçalho de 120 e os paddings passavam da janela, e cinco linhas de 120 no índice também. Tirar 6 dp do cartão e 4 do item foi a correção de menor dano — é `minHeight`, então o item cresce se o conteúdo exigir. Ambos seguem acima do mínimo de 48 e acima do `touch.list` de 56.

**O item inválido tem a mesma altura do válido, 116, e isso é deliberado.** A V1-PR1 (M1) mediu `song-9` com a lista rolada: **540,9 × 120,0 dp**, igual a qualquer outro item — a divergência 21 era recorte de viewport, não esmagamento. Independentemente disso, item navegável não pode parecer menor do que é: é por ele que se chega ao placeholder do palco, e altura menor leria como desabilitado (§3.3).

Ganho lateral da barra do palco: a fileira de sete controles passa de **814,2 dp** (x 54…1886 px medidos) para **592 dp** numa janela de 1138 — devolve 222 dp.

### 5.5 Ícones

| tamanho | traço | onde |
| --- | --- | --- |
| 20 dp | 1,5 | ícone dentro de texto: tipo da música, metadado, chip de rede |
| 24 dp | 1,75 | ação em lista e barra superior: voltar, fechar, baixar, buscar |
| 28 dp | 2,0 | os sete do palco, indicadores de garantia, placeholders |

O traço é propriedade do componente, não do zoom: o conjunto é desenhado em três tamanhos, não escalado a partir de um.

---

## 6 · O sistema de ícones

### 6.1 Regras da família

- **Grade** — 24 × 24, caixa óptica de 20 × 20, 2 dp de folga por lado. Junções e pontas arredondadas em tudo, sem exceção.
- **Preenchimento** — traço vazado é o padrão. Preenchimento a **35%** existe em dois lugares, e só neles a segunda camada significa algo: a área do arco do *n de m* e a ponta da seta do auto-scroll ligado. Pontos, noteheads e trastes são preenchidos a **100%** porque são a própria forma.
- **O marcador** — vem da geometria do logo: um disco cheio, fora do traço, **r 1,3 em 20 dp** e **r 2,4 em 28**. Está nos dots do índice, no traste da tab, no notehead da partitura, no ponto do wifi e no ponto da interrogação.
- **Alinhamento** — ícone com rótulo alinha pelo **centro óptico** da caixa de 20, nunca pela linha de base do texto. O ícone não escala com a fonte do sistema.
- **Toque** — ícone sem rótulo tem 48 dp de área com desenho de 24; 64 dp no palco.
- **Arcos** — todo arco tem `2r ≥ corda`. Varredura dos 32: 15 arcos, o mais apertado é a nuvem do *arquivo não baixado* (corda 7,98 · 2r 8,00); `map-pin` fica na igualdade exata, que é o semicírculo pretendido.
- **Traço interrompido** — com `stroke-linecap="round"` o cap avança **0,875** além do fim do segmento. O vão se mede na **forma**, não no comando: para vão real de 0,4 de cada lado, o corte é ∓ 0,4 ∓ 0,875.
- **Tracejado** significa uma coisa só: **ausente**. Desabilitado é traço cheio em `lineInfo` mais o desenho amputado.
- **Âmbar** significa "não está pronta": parcial e nunca sincronizada em `offlineInk`; garantida em tinta neutra; baixando no acento, porque é ação em curso. Neutro significa "pode ir".

### 6.2 Os quatro estados

`normal` · `ativo` · `desabilitado` · `inerte com motivo`. Nenhum estado depende só de cor: ativo muda contorno, fundo a 12% e preenchimento da ponta; desabilitado muda tinta e amputa o desenho.

Caso especial declarado — **zoom − e zoom +** inertes ao mesmo tempo (S3d, S3 sem conteúdo, S3e): as molduras são idênticas e o sinal é o único portador da distinção, então ele **afina** em vez de sumir: traço **1,25** contra 2,0, mesma tinta `lineInfo`, **sem opacidade**, em **3,66:1**. Opacidade não serve: o sinal carrega informação e deve os 3:1.

### 6.3 Exceção declarada — a tab por tamanho

**Em 20 dp a tab tem quatro cordas** (entrelinha 4,4, traço 1,5, dois trastes, vão 2,9 = 5,44 px). **Em 28 dp tem seis** (entrelinha 3,6, vão 1,6 = 4,2 px).

Motivo: seis cordas em 20 dp dão vão de 1,85 (3,5 px no painel), no limite do aliasing — e o chip de tipo do S2 e do S4 vive justamente em 20. A contagem de cordas não é o que distingue a tab; o que distingue é **o traste enfiado na corda**, que nenhum outro ícone tem, e isso sobrevive em quatro. A partitura **não** muda em nenhum tamanho, porque as cinco linhas são a definição de pauta.

Consequência de escala: a tab é a mais alta das quatro (19,75 contra 15,25–15,75). O alinhamento segue pelo **centro 12,00**, não pela caixa.

**Hoje a tab de seis cordas não renderiza em lugar nenhum do app** — os três lugares onde o tipo aparece (chip do S2, chip do S4a, barra do S3) são todos 20 dp. A de seis é a placa da família.

### 6.4 Tabela dos 32

Colunas: **origem** (lucide com o nome, ou próprio) · **função · telas e estados** · **rótulo** (ícone+rótulo ou só ícone) · **nome acessível em pt-BR** · **tam · traço · n.º de estados · n.º de cores**.

| ícone | origem | função · telas e estados | rótulo | nome acessível (pt-BR) | tam · traço · est. · cores |
| --- | --- | --- | --- | --- | --- |
| auto-scroll | próprio | rolar a cifra sozinha · S3 texto, claro, avulsa, PDF (inerte), sem conteúdo (inerte) | só ícone | "Rolagem automática, desligada" / "…, ligada" / "…, indisponível: só em texto" | 28 · 2,0 · 4 · 1 (2 no ativo) |
| zoom − | próprio | diminuir o corpo do texto · S3 · inerte em PDF | só ícone | "Diminuir o texto" / "…, indisponível: pinça para zoom" | 28 · 2,0 · 3 · 1 |
| zoom + | próprio | aumentar o corpo do texto · S3 · inerte em PDF | só ícone | "Aumentar o texto" / "…, indisponível: pinça para zoom" | 28 · 2,0 · 3 · 1 |
| claro | lucide · sun | ir para o tema claro · S3 escuro | só ícone | "Mudar para o tema claro" | 28 · 2,0 · 2 · 1 |
| escuro | lucide · moon | ir para o tema escuro · S3 claro | só ícone | "Mudar para o tema escuro" | 28 · 2,0 · 2 · 1 |
| índice | próprio | abrir o índice da setlist · S3 → S2 | só ícone | "Abrir o índice da setlist" | 28 · 2,0 · 3 · 1 |
| busca | lucide · search | abrir a busca · S3 → S4 | só ícone | "Buscar na biblioteca" | 28 · 2,0 · 3 · 1 |
| sair | lucide · log-out | sair do palco para a setlist · S3 em setlist | só ícone | "Sair do palco" | 28 · 2,0 · 2 · 1 |
| voltar (avulsa) | lucide · arrow-left | voltar de uma música fora da setlist · S3 avulsa | só ícone | "Voltar para a busca" | 28 · 2,0 · 2 · 1 |
| letra | próprio | tipo do conteúdo · S2, S4a, barra do S3 | ícone + rótulo | o rótulo "Letra" é o nome | 20 · 1,5 · 1 · 1 |
| cifra | próprio | tipo do conteúdo · S2, S4a, barra do S3 | ícone + rótulo | o rótulo "Cifra" é o nome | 20 · 1,5 · 1 · 1 |
| tab | próprio | tipo do conteúdo · S2, S4a, barra do S3 | ícone + rótulo | o rótulo "Tab" é o nome | 20 · 1,5 · 1 · 1 |
| partitura | próprio | tipo do conteúdo · S2, S4a, barra do S3 | ícone + rótulo | o rótulo "Partitura" é o nome | 20 · 1,5 · 1 · 1 |
| garantida | próprio | todos os arquivos no aparelho · S1b, S1c, S1e | ícone + rótulo | "garantida offline" (rótulo existente) | 28 · 2,0 · 1 · 1 |
| parcial | próprio | arco proporcional a n/m · S1b, S1c, S1e | ícone + rótulo | "parcial · n de m arquivos neste aparelho" | 28 · 2,0 · 1 · 2 (trilha + arco) |
| nunca sincronizada | próprio | nenhum arquivo no aparelho · S1b, S1c, S1e | ícone + rótulo | "nunca sincronizada" | 28 · 2,0 · 1 · 1 |
| baixando | próprio | download em curso · S1b | ícone + rótulo | "Baixando…" | 28 · 2,0 · 1 · 2 |
| sem conexão | lucide · wifi-off | chip de rede · S1c, S1d, S4 | ícone + rótulo | "sem conexão" (rótulo existente) | 20 · 1,5 · 1 · 1 |
| última sincronização | lucide · history | quando sincronizou · S1b, S1c | ícone + rótulo | o rótulo de tempo é o nome | 20 · 1,5 · 1 · 1 |
| falha | lucide · alert-triangle | banner de falha · S1e | ícone + rótulo | o texto do banner é o nome | 24 · 1,75 · 1 · 1 |
| tentar novamente | lucide · rotate-cw | retentar o sync · S1d, S1e | ícone + rótulo | "Tentar novamente" (rótulo existente) | 24 · 1,75 · 3 · 1 |
| voltar | lucide · arrow-left | voltar · S2 (48 dp), S4 | só ícone | "Voltar para as setlists" / "Voltar para o palco" | 24 · 1,75 · 3 · 1 |
| fechar | lucide · x | fechar a busca · S4 (48 dp) | só ícone | "Fechar a busca" | 24 · 1,75 · 3 · 1 |
| apagar | lucide · x-circle | limpar o campo · S4a (48 dp) | só ícone | "Apagar o que foi digitado" | 24 · 1,75 · 3 · 1 |
| buscar música | próprio (search + nota) | entrar na busca a partir da lista · S1 (todos), S2 | ícone + rótulo | "Buscar música" (rótulo existente) | 24 · 1,75 · 3 · 1 |
| baixar setlist | lucide · download | baixar tudo da setlist · S1b, S1c, S1e | ícone + rótulo | "Baixar esta setlist" (rótulo existente) | 24 · 1,75 · 4 · 1 |
| baixando… (ação) | próprio (haste partida) | estado do botão de baixar · S1b | ícone + rótulo | "Baixando…" | 24 · 1,75 · 1 · 1 |
| voltar ao início | lucide · skip-back | voltar à música 1 · S5 | ícone + rótulo | "Voltar ao início" (rótulo existente) | 24 · 1,75 · 3 · 1 |
| data | lucide · calendar | metadado da setlist · S1 (todos com lista) | ícone + rótulo | a data é o nome | 20 · 1,5 · 1 · 1 |
| local | lucide · map-pin | metadado da setlist · S1 | ícone + rótulo | o local é o nome | 20 · 1,5 · 1 · 1 |
| n.º de músicas | próprio | metadado da setlist · S1, S2 | ícone + rótulo | "n músicas" é o nome | 20 · 1,5 · 1 · 1 |
| sem conteúdo | próprio | placeholder · S3 sem corpo, linha do S2 com inválidos | ícone + rótulo | "este item não tem conteúdo" (texto existente) | 28 · 2,0 · 1 · 1 |
| tipo desconhecido | próprio | placeholder · S3 | ícone + rótulo | o texto do placeholder é o nome | 28 · 2,0 · 1 · 1 |
| arquivo não baixado | próprio | placeholder · S3e | ícone + rótulo | "arquivo não baixado" (texto existente) | 28 · 2,0 · 1 · 1 |

Fora do catálogo, dois desenhos:

- **log-in** (S0) — é o `log-out` em rotação de 180°: mesma geometria, mesma caixa, mesma espessura. Único desenho novo da Fase 2.
- **o laço do oito** — não é ícone, é a marca. Vive fora do catálogo e não obedece à grade de 24. Ver §8.

### 6.5 Onde o reconhecimento segue frágil

- **sair × voltar** — os dois são uma seta para fora; a diferença é a moldura da porta. Nunca aparecem juntos (mesmo slot alternando), então o risco é confundir o significado, não errar o alvo. Aceito e declarado.
- **zoom − × zoom +** — molduras idênticas, um traço de 8 contra uma cruz de 8, vizinhos nos slots 2 e 3. É a convenção que o app já usava em texto. Se o teste de palco falhar, a saída é alargar a cruz do + em 1 dp. **Em aberto** até o teste.

---

## 7 · As 22 molduras

Cada ID aparece **literal, no começo da legenda da moldura** em `telas.html` — procurar pelo ID acha o frame.

O ID é nomenclatura, não mecanismo. O aceite da V1-PR7 não procura ID em HTML nenhum: ele roda no device — alcança o estado, dumpa, mede, compara com o frame. O ID serve para duas coisas: **nomear a evidência** (`V1-estado-<ID>.png`) e **localizar o frame** na folha. É por ele que se verifica que nenhum estado sumiu, porque é o nome comum entre a captura, o frame e esta tabela.

| ID | o que mostra |
| --- | --- |
| `S0` | login: marca à esquerda, formulário à direita, campo de senha com erro |
| `S1a` | sincronizando sem cache — tela vazia com o ícone *baixando* |
| `S1b` | normal, online — três cartões, sync recente |
| `S1c` | offline com cache — chip *sem conexão* e a hora da última sincronização |
| `S1d` | offline sem cache — bloco vazio com *tentar novamente* |
| `S1e` | falha com cache — banner de erro acima da lista |
| `S1f` | vazia após sync — vazio por sucesso, com a marca |
| `S1-proposta-data` | **proposta**: S1 agrupado por data do show (dado ilustrativo) |
| `S2` | índice — 8 músicas em duas colunas, chip de tipo por item |
| `S2-invalidos` | índice com as músicas 9 e 10 sem corpo e sem tipo |
| `S3-letra` | palco, letra, auto-scroll ligado |
| `S3-claro` | palco no tema claro, auto-scroll desligado |
| `S3-avulsa` | palco, cifra, música fora de setlist (selo *avulsa*) |
| `S3d` | palco, PDF de 12 páginas, auto-scroll e zoom inertes |
| `S3-nobody` | palco, placeholder *este item não tem conteúdo* |
| `S3e` | palco, placeholder *arquivo não baixado*, offline |
| `S4a-vazio` | busca com o campo vazio |
| `S4a-resultados` | busca com termo e 2 resultados |
| `S4b` | busca sem resultados |
| `S5` | fim da setlist, 8 músicas |
| `S5-n-grande` | fim da setlist, 60 músicas — a regra de N grande |
| `PROP-data-hoje` | **proposta**: S1 por data com o dado que existe hoje |

Vinte estados do app e **duas molduras de proposta** (`S1-proposta-data`, `PROP-data-hoje`), que não existem no app e não entram no aceite.

### 7.1 Regra de N grande (S5)

A fileira de marcas tem 900 dp úteis. A marca encolhe de 34 dp para o que couber, com folga fixa de 5 e **piso de 6 dp** por marca:

- 8 músicas → 34 dp cada
- 60 músicas → 10 dp cada
- 128 é o último N em que a marca ainda é uma marca

Acima de 128, a fileira vira uma barra sólida de 900 × 3 e a contagem abaixo carrega o número sozinha. Nenhuma setlist da conta chega perto disso; a regra existe para não quebrar.

---

## 8 · Propostas — fora do escopo, decisão do dono do app

Nada nesta seção está nas telas do app, e nada foi aplicado sem estar aqui. Critério comum aos desabilitados: **o motivo tem que ser legível sem toque**, na própria tela — é o que os três controles inertes do palco já cumprem, e é por isso que eles ficaram nas molduras.

### 8.1 Chevrons das zonas de toque (S3)

As zonas de 171 dp em cada borda são invisíveis, e é assim que se vira a página sem tocar na barra. Um chevron de 24 em `lineInfo` resolveria, mas o brief proíbe elemento gráfico na área de conteúdo do palco. **Alternativa sem gráfico permanente:** revelar os chevrons por 1,2 s na primeira abertura de cada sessão, e nunca mais. **Custo:** um estado de sessão no palco.

### 8.2 Os cinco desabilitados

| onde | causa | custo / alternativa |
| --- | --- | --- |
| `S1c` · Baixar esta setlist | offline não há o que baixar; hoje aceita o toque e falha em silêncio | o mais forte dos cinco |
| `S3e` · Baixar | mesma decisão, mesma causa, uma tela adiante | — |
| `S1a` · Buscar música | sem dado local não há biblioteca | dura ~6 s no caminho feliz; pode não valer |
| `S3 avulsa` · índice | não há setlist para indexar | alternativa: manter ativo e abrir o índice da última setlist |
| `S2` · contagem "2 sem conteúdo" | não desabilita nada | exige um campo que a lista hoje não calcula |

### 8.3 Ordenação por data (S1)

Hoje a API ordena por `created_at desc` (`route.ts:38`, e `docs/api/SETLISTS.md:57`) e a tela não reordena — `data={setlists}`, sem `sort`. Para quem toca, a pergunta é *qual é o próximo show*.

A proposta agrupa por `performance_date` ascendente sob o rótulo *a seguir*, com dia e mês numa coluna fixa de 88 e o local no lugar do calendário redundante. Muda ordenação e layout do cartão; não muda dado nem sync.

**Com o dado de hoje ela quase desaparece** (`PROP-data-hoje`): as três setlists da conta de auditoria não têm data e a única datada da conta principal está 422 dias no passado — *a seguir* fica vazio. A proposta só compensa se as setlists passarem a ter `performance_date` preenchido. Sem isso, o cartão atual ordenado por criação é honesto.

### 8.4 A marca

- **Em `S1f`**: aplicada na moldura. É o item 10 do brief (um lugar para a marca) e a promessa da Fase 1 (*o laço entra em S0, S1f e S5*). Visual apenas, sem mudança de comportamento. Se recusada, o ícone *sem conteúdo* de 28 volta no lugar.
- **PNG → SVG**: a **divergência 22 está resolvida**, em 08b84d6 (#285) e verificada na V1-PR1 (M2). O fundo `#100E16` era do `logo-octavia.png`, apagado naquele commit — o mesmo que criou o par `logo-octavia-dark.png` / `logo-octavia-light.png` (952 × 614, sha256 registrado na V1-PR1). Os dois binários em `apps/native/assets/` são **92,2% transparentes**, mais 1,3% de borda suavizada. A captura do #284 tem o retângulo; a do #289 tem zero. Sem retângulo a resolver, o SVG é economia, não urgência: um arquivo em vez de dois, tinta por token em vez de por variante, nitidez em qualquer escala. O `accessibilityLabel="Octavia"` (`LoginScreen.tsx:71`) viaja igual nos dois caminhos e continua sendo o único do app.

---

## 9 · Erratas

Convenção: **E1, E2, …**, em ordem de descoberta, cada uma com o que estava errado, o que passa a valer e onde. Correções encontradas durante a implementação (V1-PR3) entram aqui, não no corpo do documento.

**E1 — a §4.1 registrava um achado que não existe.**
Estava escrito: seis `.ttf` empacotados contra quatro tokens de família, com os dois pesos de Raleway usados sem token, e a V1-PR3 encarregada de tokenizá-los.
Passa a valer: `font` tem **seis** chaves, e Raleway está tokenizado como `font.display` (600) e `font.displayMedium` (500) desde a errata E1 do DESIGN-TELA-1. Não há nada a tokenizar.
Onde: §4.1, reescrita com a transcrição verbatim.
Causa: eu inferi o conteúdo do `theme.ts` a partir dos tokens que os inventários **citavam**, e os inventários só citam o que as telas usam — nenhuma tela da auditoria aplica `font.display`. Ausência de uso não é ausência de token. Descoberta ao transcrever o arquivo.

**E2 — a moldura do controle do palco não podia ficar em `line`.**
Estava escrito: a §5.4 dá ao controle do palco 64 × 64 e a §6 desenha a moldura de 66, sem nomear a tinta; o app usa `cor.line` (`StageScreen.tsx`, `borderColor`), e o documento não pediu outra coisa.
Passa a valer: a moldura do controle do palco vai em **`lineInfo`**. Ela é o único delimitador de um controle **sem rótulo**, logo carrega informação e deve os 3:1 do 1.4.11 — que é exatamente o papel que a §3.3 já dá a este token ("contorno que carrega informação (trilha do arco, **moldura de controle**)").
Onde: §5.4 e §6.1, na descrição do controle do palco.
Causa: `line` mede **1,32:1** no escuro e **1,38:1** no claro (V1-A4, reproduzido no V1-PR3-PRECHECK §8.1 do anexo G). Enquanto o controle tinha rótulo textual a moldura era decorativa e a reprovação era aceita; com a barra só-ícone ela deixa de ser decorativa no mesmo movimento. O V1-PRECHECK §5.4 previu isto por escrito — "se a borda do `Controle` passar a ser o único delimitador de um ícone sem rótulo, ela entra no 1.4.11 e `#2A2836` não serve" — e a folha congelou sem aplicar. `lineInfo` mede **3,66** / **3,17**.

**E3 — a §6.2 proíbe opacidade e não disse que o app a usa.**
Estava escrito: "Nenhum estado depende só de cor: … desabilitado muda tinta e amputa o desenho", e, no caso dos dois zooms inertes, "**sem opacidade**: o sinal carrega informação e deve os 3:1". A regra está certa e o documento a enuncia como se já valesse.
Passa a valer: a regra é uma **mudança**, não uma descrição. O app de hoje desenha o inerte com `styles.controleInativo = { opacity: 0.4 }` (`StageScreen.tsx`), aplicada ao controle inteiro — moldura, rótulo e futuro ícone. Aplicar a §6.2 significa **remover essa opacidade** e trocá-la por tinta `lineInfo` mais o desenho amputado, e isso é trabalho da V1-PR3, não consequência automática do desenho.
Onde: §6.2, e a §1 ("não muda comportamento em lugar nenhum"), que segue verdadeira — opacidade é pintura, não comportamento.
Causa: escrevi a regra olhando as molduras, sem conferir como o app pinta o inerte hoje. O mesmo erro da E1 em outra direção: lá inferi o `theme.ts` pelo que os inventários citavam; aqui enunciei um estado sem ler o estilo que o produz.

**E4 — a coluna "origem · lucide · <nome>" descreve a inspiração, não o arquivo.**
Estava escrito: a tabela da §6.4 atribui 16 das 34 linhas a "lucide · sun", "lucide · search", "lucide · arrow-left" e assim por diante, o que se lê como procedência do desenho.
Passa a valer: **nenhum** dos 15 desenhos distintos assim atribuídos é o desenho do Lucide. Comparados a `lucide-static@1.45.0` (o mesmo pacote que o `lucide-react-native@1.45.0` publica), normalizando `d`/`circle`/`rect`: **0 de 15 batem**. `search` tem `r=8` em (11,11) no Lucide e `r=6,5` em (10,5 · 10,5) aqui; `sun` tem raios em `M12 2v2` contra `M12 3.15v2.3`; `map-pin` é uma gota de curvas `c` contra um arco `a7 7 0 1 0-14 0`. Todos foram redesenhados para a caixa óptica de 20 em 24 da §6.1 — que é o que a §6.1 manda. A coluna, portanto, diz **de onde veio a ideia**, não de onde veio o path.
Onde: §6.4, cabeçalho das colunas.
Causa: escrevi "origem" pensando em vocabulário visual e o leitor lê procedência de arquivo. A diferença só aparece quando alguém tenta instalar a biblioteca para economizar trabalho — e aí ela renderiza outro desenho. Medido no V1-PR3-PRECHECK §5 e no anexo E.
Consequência registrada: dois dos nomes citados (`alert-triangle`, `x-circle`) também não são os canônicos do Lucide 1.45.0, que os publica como `triangle-alert` e `circle-x`; os antigos seguem resolvendo como alias.

**E5 — o `accentInk` claro mede 5,89:1, não 5,90.**
Estava escrito: a tabela da §3.2 dá razão de contraste **5,90** para `#4A4FC0` sobre `#F6F1EA`.
Passa a valer: **5,89** (5,8942…). O valor de cor não muda; muda o número que o descreve.
Onde: §3.2, linha do `accentInk`, coluna "razão claro".
Causa: arredondamento de um centésimo. Medido no V1-PR3-PRECHECK (div. 39, anexo G) e reproduzido na V1-PR3 pelo mesmo script do V1-A4 (luminância relativa em sRGB, cores opacas): os outros nove pares reproduzem a folha ao centésimo. Passa nos dois usos (ícone ≥ 3:1, texto ≥ 4,5:1) com a mesma folga de antes.

**E6 — o controle do palco tem raio 14 no desenho e o token é 12.**
Estava escrito: a §5.2 diz que o desenho respeita `radius` **6 · 12 · 20**, verbatim do `theme.ts`; as 42 caixas de 64 do `telas.html` e a folha "Os quatro estados" desenham o controle do palco com **`border-radius: 14`**.
Passa a valer: o app usa **`radius.control` = 12** (V1-PR3, commit 4). Se 14 for a intenção, é um degrau novo da escala de raio — decisão de design, não da V1-PR3 (decisão do Marcel, 2026-09-13).
Onde: §5.2 (a frase "que o desenho respeita" vale para `space`; para `radius`, o desenho diverge no controle do palco).
Causa: o raio de 14 foi desenhado sem conferir a escala declarada. Medido no V1-PR3 (div. 47): 42 caixas em 14, 0 em 12.

**E7 — o quarto estado do controle chama-se "pressionado", não "inerte com motivo".**
Estava escrito: a §6.2 nomeia os quatro estados `normal · ativo · desabilitado · inerte com motivo`; a folha "Os quatro estados" do `icones.html` nomeia **padrão · ativo · desabilitado · pressionado** (moldura `muted`, fundo da tinta a 8 %, só com o dedo encostado).
Passa a valer: os quatro nomes da **folha**. "Inerte com motivo" não é um estado à parte: é o desabilitado com o motivo revelado ao toque (errata do A15, V1-PR3-PRECHECK §14.1). O pressionado entra no app na V1-PR3 (commit 4) — feedback de toque num controle sem rótulo vale mais do que num controle com.
Onde: §6.2, primeira frase.
Causa: nomenclatura — o README foi escrito antes de a folha fixar o quarto estado. Div. 46 da V1-PR3.

**E8 — o `log-in` do S0 não é o `log-out` "em rotação de 180°".**
Estava escrito: na §6.4, "log-in (S0) — é o `log-out` em rotação de 180°: mesma geometria, mesma caixa, mesma espessura".
Passa a valer: o desenho do S0 no `telas.html` — `M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l4 4-4 4M15 12H4` — é a **porta espelhada** (x → 24 − x) com a **seta mantendo o sentido**, entrando na porta, e a haste de 15 a 4. A rotação de 180° do `log-out` daria a seta saindo da porta pela esquerda, um desenho que não existe em lugar nenhum do congelamento. O `dados.ts` transcreve o frame, não a frase.
Onde: §6.4, o parágrafo "Fora do catálogo".
Causa: a frase descreveu a operação de cabeça; o frame foi desenhado à mão. Div. 45 da V1-PR3.

**E9 — o catálogo renderiza os nove do palco a 24 dp, não aos 28 da tabela.**
Estava escrito: a §6.4 dá **28 · 2,0** aos nove ícones do palco e **20 · 1,5** a `letra`, `cifra`, `tab`, `partitura`, `sem conexão` e `última sincronização`; o catálogo escuro do `icones.html` renderiza esses quinze a **24 · 1,75**. Por tamanho, o catálogo tem 7 · 24 · 3 (28 · 24 · 20), não os 16 · 9 · 9 que a tabela soma.
Passa a valer: **a tabela**. O tamanho é propriedade do componente (`<Icone tamanho>`), o traço deriva dele (§5.5), e o `d` é o mesmo nos três tamanhos — o catálogo é uma folha de desenhos, não de tamanhos. Nada muda no app.
Onde: cabeçalho do catálogo escuro do `icones.html` (que a §6 apresenta como "os 32 nos dois temas").
Causa: o catálogo foi montado num tamanho de exibição só. Div. 44 da V1-PR3.

**E10 — as molduras usam dezessete números fora das escalas que a §5.2 diz que o desenho respeita.**
Estava escrito: na §5.2, "Espaço e raio, também verbatim, que o desenho respeita: `space` 4 · 8 · 12 · 16 · 24 · 32 · 48; `radius` chip 6 · control 12 · pill 20".
Passa a valer: **a escala declarada vence o número desenhado** — a regra que a E6 já aplicou ao raio 14 do palco vale para todo número das molduras. Onde a moldura usa um número que não é degrau, o código usa o degrau mais próximo; onde não há escala (barra do S1 120, cartão 132/112, banner 66, indicador 230, corpo 13), o literal fica e é declarado no arquivo. Decisão do Marcel, 2026-09-13 (V1-PR4): o código fica como está e a regra entra aqui para a PR5 e a PR6 não decidirem de novo.
Onde: §5.2, a frase "que o desenho respeita" — vale para o app, não para as molduras. A tabela completa é o anexo D2 da V1-PR4 (`docs/native/V1-PR4-anexos/V1-PR4-D-moldura-para-token.txt`); os dezessete, com o que o código usa entre parênteses:

| elemento | moldura | código |
| --- | --- | --- |
| gap chip de status ↔ botão Buscar (S1) | 26 | `space.xl` (24) |
| gap nome ↔ metadados do cartão (S1b/S1c) | 14 | `space.md` (12) — no S1e a moldura já é 12 |
| gap entre metadados do cartão | 22 | `space.xl` (24) |
| gap botão Baixar ↔ indicador | 28 | `space.xl` (24) |
| gap ícone ↔ texto do indicador | 14 | `space.md` (12) |
| gap rótulo ↔ sublinha do indicador | 2 | `space.xs` (4) |
| gap ícone ↔ rótulo nos botões | 10 | `space.md` (12) |
| padding horizontal dos botões Buscar / Baixar | 18 | `space.lg` (16) |
| padding horizontal do banner | 22 | `space.xl` (24) |
| padding horizontal do botão do banner | 14 | `space.lg` (16) |
| gap do bloco S1a | 22 | `space.xl` (24) |
| gap dos blocos S1d / S1f | 18 | `space.lg` (16) |
| raio dos botões | 10 | `radius.control` (12) — o precedente da E6 |
| raio do botão do banner | 8 | `radius.control` (12) |
| tracking do nome do cartão | .09em | `tracking.label` (.08) |
| corpo do texto do banner | 14,5 | `size.bodySmall` (15) |
| altura do banner | 66 | literal 66 (sem escala) |

Causa: as molduras foram compostas a olho, em pixel, sem conferir cada número contra as escalas transcritas — o mesmo erro da E6, agora medido inteiro. Div. 61 da V1-PR4.

**Acréscimo da V1-PR5 (S2), pela instrução que a própria E10 carrega — números novos entram aqui, não numa errata nova.** Onze linhas, do `S2` e do `S2-invalidos`; tabela completa no anexo D da V1-PR5 (`docs/native/V1-PR5-anexos/V1-PR5-D-moldura-para-token.txt`):

| elemento | moldura | código |
| --- | --- | --- |
| gap da barra superior (S2) | 22 | `space.xl` (24) |
| gap do item (número ↔ texto ↔ tipo) | 18 | `space.lg` (16) |
| padding horizontal do item | 22 | `space.xl` (24) |
| padding vertical da lista | 20 | `space.xl` (24) — empate 16/24, fica o que o app já tinha |
| gap nome ↔ subtítulo do cabeçalho | 5 | `space.xs` (4) |
| corpo do nome da setlist no cabeçalho | 21 | `size.title` (22) — empate 20/22, fica o que o app já tinha |
| corpo do título de item (só na `S2-invalidos`) | 19 | literal 20 — a moldura `S2` desenha 20 para o MESMO item; vale a §4.4 ("título de item 20 · bate") |
| tracking do nome da setlist | .12em | `tracking.display` (.14) |

Os três já cobertos pela tabela do S1 e reaplicados aqui sem decisão nova: gap ícone ↔ rótulo 10 → `space.md`, padding horizontal do botão 18 → `space.lg`, raio 10 → `radius.control` (o precedente da E6). Literais declarados novos, sem degrau: a altura de item **116** (§5.4), o corpo **13** da sublinha e do rótulo de tipo (§4.4 "chip / status"), e os `minWidth` **32** e **56** do número e da coluna de rótulo — o 56 é o que alinha os quatro rótulos no mesmo x, que é o pedido explícito da nota da moldura.

**Acréscimo da V1-PR6 (S0, S4, S5), pela mesma instrução.** As seis molduras desta PR fecham a série: `S0`, `S4a-vazio`, `S4a-resultados`, `S4b`, `S5` e `S5-n-grande`. A tabela completa, número a número, é o anexo D da V1-PR6 (`docs/native/V1-PR6-anexos/V1-PR6-D-moldura-para-token.txt`, seções D1 a D3), e as linhas novas são estas:

| elemento | moldura | código |
| --- | --- | --- |
| gap da coluna do formulário (S0) | 30 | `space.xxl` (32) |
| tracking do rótulo "ENTRAR" (S0) | .3em | `tracking.displayWide` (.22) |
| padding-left do rótulo "ENTRAR" (S0) | .3em | `space.xs` (4) |
| corpo do texto do erro (S0) | 13,5 | `size.label` (14) |
| raio do `apagar` (S4) | 8 | `radius.chip` (6) |
| padding esquerdo do campo de busca (S4) | 18 | `space.lg` (16) |
| padding direito do campo com termo (S4) | 10 | `space.md` (12) |
| gap da lista e da régua (S4) | 10 | `space.md` (12) |
| tracking do título do S4b | .1em | `tracking.label` (.08) |
| gap interno do bloco central (S5) | 26 | `space.xl` (24) |
| tracking do título do S5 | .2em | `tracking.displayWide` (.22) |

Empates, em que fica **o que o app já tinha** (o critério que a V1-PR5 fixou): gap título ↔ sublinha do resultado 6 → `space.xs` (4); gap da barra do S5 20 → `space.lg` (16); gap bloco ↔ botões do S5 40 → `space.lg` + `space.xl`; padding do botão primário do S5 28 → `space.xxl` (32).

Literais declarados novos, sem degrau nem escala: a folga marca ↔ formulário **140**, a marca **340 × 219** e a coluna do formulário **420** (S0); a altura da régua **38**, a do resultado **80** e a largura do apoio **560** (S4); e os seis números da §7.1 — fileira **900**, marca **34** e **6**, altura **3**, raio **2**, folga **5** (S5). Reaplicados sem decisão nova: raio 10 → `radius.control`, gap 18 → `space.lg`, gap ícone ↔ rótulo 10 → `space.md`, padding horizontal do item 22 → `space.xl`, corpo 13 de chip e sublinha.

**E11 — o `accessibilityLabel="Octavia"` não é mais "o único do app".**
Estava escrito: na §8.4, "O `accessibilityLabel="Octavia"` (`LoginScreen.tsx:71`) viaja igual nos dois caminhos e continua sendo o único do app".
Passa a valer: a marca do S1f (§8.4, a proposta aplicada) leva o mesmo `accessibilityLabel="Octavia"` — são **dois**, S0 e S1f, o mesmo rótulo para o mesmo desenho. Decisão do Marcel, 2026-09-13 (V1-PR4): com o rótulo, não decorativa. A frase da §8.4 descrevia o estado de antes da V1-PR4; a V1-PR7 vai ler os dois no dump.
Onde: §8.4, último parágrafo.
Causa: a frase foi escrita antes de a marca ter a segunda casa. Div. 67 da V1-PR4.

**E12 — a moldura S1b pinta `garantida` em accentInk; a §6.1 manda tinta neutra, e a §6.1 vence.**
Estava escrito: na moldura `S1b` do `telas.html` (e nas `S1c` e `S1e`, que repetem o cartão), o ícone *garantida* de 28 e o rótulo "garantida offline" em `#777CE8`, e a legenda da S1b: "vira o ícone *garantida* de 28 em accentInk — mesma cor de antes".
Passa a valer: **a §6.1** — "garantida em tinta neutra". No app, o ícone vai em **`text`** e o rótulo em **`muted`**; `parcial` e `nunca sincronizada` seguem em `offlineInk`, `baixando` no acento. Decisão do Marcel, 2026-09-13 (V1-PR4): o acento fica com um significado só — ativo, atual, foco (§3.1) — e a semântica da §6.1 fecha: neutro é "pode ir", âmbar é "não está pronta". Quem varre o S1 procurando o que falta baixar tem o âmbar chamando e o resto em silêncio.
Onde: as molduras `S1b`, `S1c`, `S1e` e a legenda da `S1b` no `telas.html` (o arquivo congelado não é reeditado; esta errata prevalece sobre ele). A §6.1 fica como está.
Causa: a moldura herdou a cor do glifo `✓` do app anterior ("mesma cor de antes") sem passar a regra que a própria folha tinha acabado de escrever. Div. 60 da V1-PR4.

**E13 — no S2, três coisas em que a moldura discorda da regra declarada, e em que a regra vence.** *(Decisão do Marcel, 2026-09-13, V1-PR5: as três.)*

**E13.a — o ícone do botão Buscar.** Estava desenhado: as molduras `S2` e `S2-invalidos` põem no botão da barra o ícone **`busca`** (a lupa pura, o mesmo do palco). Passa a valer: **`buscar música`** (lupa + nota), que é o que a §6.4 lhe dá em letra — "entrar na busca a partir da lista · S1 (todos), **S2**". É o mesmo botão que a V1-PR4 pôs no S1, e o critério da E12 (a regra vence a moldura) já estava fixado. O texto "Buscar na biblioteca" **não muda**: a §1 não mexe em texto.

**E13.b — o tamanho dos placeholders de inválido.** Estava desenhado: os dois ícones do item inválido em **20 dp**, e a legenda da `S2-invalidos` repete "recebem ícone de 20". Passa a valer: **28**, que é o que a §6.4 dá aos dois — e ela nomeia esta casa explicitamente, "`sem conteúdo` … placeholder · S3 sem corpo, **linha do S2 com inválidos**". Critério da E9 ("o tamanho é propriedade do componente … **a tabela** vence"). Efeito colateral medido e aceito: o rótulo do item inválido começa 8 dp à direita do rótulo do válido, porque o ícone é 8 dp mais largo; os quatro rótulos de tipo **válido** seguem alinhados no mesmo x, que é o que a nota da moldura pede. **Vai ao aceite visual da V1-PR7 no Tab S6**: 8 dp de desequilíbrio na mesma coluna é coisa de olho, não de medida.

**E13.c — qual ícone leva qual inválido.** Estava desenhado: a moldura dá `sem-conteudo` ao item 9 (`no-body`) e **`tipo-desconhecido` ao item 10**, que é o `[FIXTURE] Objeto sem a chave (no-key)`. Passa a valer: **o `reason` do contrato de leitura do core** (`packages/core/src/content-contract.ts`, PRD §4), que classifica `no-key` pela regra **(c)**, falta de corpo — só a regra **(d)**, `content_type` fora do enum, produz `unknown-type`. No app o item 10 leva `sem-conteudo` e o 11 (`Piano`) leva `tipo-desconhecido`.
Esta é de outra natureza que as duas primeiras, e a causa importa: **o desenho foi feito a partir de uma captura, e a captura mostra dois inválidos lado a lado sem dizer por quê.** A fixture do A6 põe os três em ordem — `no-body`, `no-key`, `unknown-type` — e o desenho leu a **ordem** como se fosse o motivo. Nem a moldura nem a §6.4 tinham como saber: só o contrato sabe. É o mesmo padrão de "instrumento com escopo menor do que parece" (V1-PR3-PRECHECK §9.1), aqui aplicado a uma captura de tela: ela mede *o que aparece*, e foi lida como se medisse *por quê*.

Onde: as molduras `S2` e `S2-invalidos` e a legenda da `S2-invalidos` no `telas.html` (o arquivo congelado não é reeditado; esta errata prevalece sobre ele). A §6.4 fica como está.
Causa das duas primeiras: a moldura composta antes de a tabela fechar — o mesmo da E12. Divs. 72, 73 e 76 da V1-PR5.

**E14 — no S0, no S4 e no S5, seis lugares em que a moldura (ou o silêncio do documento) discorda de uma regra declarada, e em que a regra vence.** *(Decisão do Marcel, 2026-09-13, V1-PR6: as seis.)*

**E14.a — "Fora do catálogo" tem cinco habitantes, não dois.** Estava escrito: a §6.4 fecha com "Fora do catálogo, dois desenhos", o `log-in` e o laço do oito. Passa a valer: são **cinco**. As molduras `S0` e `S4b` trazem mais três que nenhuma linha da §6.4 nomeia — `email` e `senha` (os ícones dos dois campos do login) e `nada-encontrado` (a lupa com o X dentro, que a legenda da `S4b` descreve como "composto com as mesmas peças de *busca* e *fechar* — nada de glifo novo"). Os três estão no `dados.ts` desde a V1-PR6, e o `gate:icones` ganhou uma regra (a 5) que cobra a categoria inteira contra o `telas.html` **por forma**: o conjunto de elementos do `normal` de cada um tem de ser exatamente o de um `<svg>` do arquivo congelado, e de um só. Medido: 4/4 (o `log-in` incluído), entre 36 assinaturas distintas nos 131 `<svg>` do arquivo. Onde: §6.4, o parágrafo "Fora do catálogo". Causa: a folha de ícones foi fechada na Fase 1 e as telas do S0 e do S4b foram compostas na Fase 2, com desenhos que a Fase 1 não tinha. Div. 81 da V1-PR6.

**E14.b — a altura do campo do S0 é 60, não os 52 da moldura.** Estava desenhado: os dois campos do `S0` com `height: 52`. Passa a valer: **`touch.list + 4` = 60**, que é o que o app já tinha — e que a **§5.2 nomeia por escrito**, na frase "Confirmam os derivados citados em V1-A2(b): `touch.list + 2` = 58 (botão secundário), **`touch.list + 4` = 60 (campo do login)**". 52 é empate exato entre `touch.min` e `touch.list`, então a regra da E10 não desempata; quem desempata é a §5.2, que fala deste elemento e de mais nenhum. Onde: a moldura `S0`. Div. 84.

**E14.c — o `falha` do S0 é de 20 dp, não dos 24 da §6.4.** Estava escrito: a tabela da §6.4 dá ao `falha` "24 · 1,75" e nomeia a casa dele, "banner de falha · S1e"; a moldura `S0` o desenha em **20 · 1,5** ao lado do texto de erro. Passa a valer: **20**. O critério da E13.b — a tabela vence a moldura no tamanho — valia lá porque a §6.4 **nomeava a casa em disputa** ("linha do S2 com inválidos"); aqui a casa é nova, a §6.4 não fala dela, e a §5.5 põe em 20 dp o "ícone dentro de texto", que é o papel do `falha` no S0. Onde: §6.4, linha do `falha`. **Decisão do Marcel**: “20. É o que a moldura desenha e o que a §5.5 dá a ‘ícone dentro de texto’; a §6.4 nomeia o S1e, não o S0.” Div. 85.

**E14.d — o título do S4b não recebe o `text-transform: uppercase` da moldura.** Estava desenhado: `nada encontrado para "xablau"` com `text-transform: uppercase`, como os títulos centrais do S1f e do S5. Passa a valer: **sem uppercase**. Nos outros dois o uppercase cai sobre string fixa; aqui a string carrega **o termo que o usuário acabou de digitar**, entre aspas curvas — e o `textTransform` do React Native no Android transforma o texto de verdade (aparece maiúsculo até no atributo `text` do dump). O usuário leria de volta em maiúsculas o que digitou em minúsculas, e a §1 diz que o V1 não muda texto. Onde: a moldura `S4b`. **Decisão do Marcel**: “Sem uppercase. A string carrega o termo digitado, e o `textTransform` do Android transforma o texto de verdade — aparecer maiúsculo no dump é o sintoma.” Div. 88.

**E14.e — a barra superior do S5 fica como está, em 64 e Raleway.** Estava desenhado: as molduras `S5` e `S5-n-grande` põem a barra superior em **88 dp** e o "n de N" em **IBM Plex Mono 600, 20, .06em** — exatamente como as seis molduras do `S3`. O app tem as duas barras em **64 dp** e `font.display` / `size.title` / `tracking.display`, também iguais **entre si**. Passa a valer: **a §1**, que congela a barra superior do S3 ("no **S3** mexe **só** na barra inferior"). Mudar só a do S5 abriria 24 dp de altura e uma troca de família entre duas telas que o músico atravessa deslizando — que é o mesmo salto que a nota da própria moldura `S5` diz querer evitar quando explica por que manteve a barra inferior vazia ("para que a altura do conteúdo não salte em relação ao S3"). As duas mudam juntas, na PR que tocar o S3, ou não mudam. Onde: as molduras `S5`, `S5-n-grande` e as seis do `S3`. **Decisão do Marcel**: “Manter 64 e Raleway. S3 e S5 se atravessam deslizando; abrir 24 dp e trocar de família entre elas é o salto que a nota da moldura quer evitar. As duas juntas é PR pós-V1.” Div. 91.

**E14.f — a regra de N grande da §7.1 tem dois trechos, e o texto só descreve o primeiro.** Estava escrito: "A marca encolhe de 34 dp para o que couber, com **folga fixa de 5** e **piso de 6 dp** por marca: 8 músicas → 34 dp cada; 60 → 10 dp; **128 é o último N em que a marca ainda é uma marca**." Passa a valer: os dois primeiros números saem da folga fixa, e o terceiro **não**. Com folga fixa em 5, a marca bate no piso de 6 em **N = 82** (6,04 dp) e em 83 já não cabe — a regra pararia em 82. O 128 exige um **segundo trecho**: abaixo do piso a marca fica em 6 e quem encolhe é a **folga**, de 4,90 em N=83 até **1,04** em N=128; em 129 daria 0,98, e é aí que a fileira vira a barra sólida de 900 × 3. A curva é contínua nos dois trechos. A conta inteira está no anexo D5 da V1-PR6; a função está no `EndScreen.tsx` e, idêntica, no `V1-PR6-anexos/instrumentos/marcas.mjs`, para reproduzir os três números sem abrir o app. Medido no device: fileira de 306,7 dp para n=8 (307,0 previstos) e 895,1 para n=60 (895,0 previstos). Onde: §7.1. Causa: a regra foi escrita a partir dos três casos desenhados, não da fórmula — e o caso de 128 nunca foi desenhado. Div. 93.

**E15 — duas coisas que o congelado não cobre, decididas na V1-PR6.** *(Decisão do Marcel, 2026-09-13.)* Ao contrário da E14, nenhuma das duas é discordância entre moldura e regra: são lugares em que o documento cala.

**E15.a — a E12 não proíbe o acento nas marcas do S5.** A E12 fixou que "o acento fica com um significado só — ativo, atual, foco (§3.1)", e as marcas de música percorrida do `S5` não são nenhum dos três ao pé da letra. Passa a valer: **as marcas ficam em `accentInk`**, como as molduras `S5` e `S5-n-grande` as pintam. Três razões, e a terceira é a que decide: a §3.1 dá o acento ao "número de posição", e as marcas **são** as posições percorridas em forma gráfica; o S5 não tem nenhum outro acento, então o "um dono só" continua valendo; e a moldura **argumenta** a escolha na própria legenda ("é o mesmo vocabulário do arco de garantia — proporção, não medalha"), ao contrário da `S1b` que originou a E12, cuja legenda dizia só "mesma cor de antes" — herdou a cor sem passar a regra, e foi essa a causa registrada lá. A distinção que a E15.a estabelece, e que vale para as próximas: **moldura que argumenta não é moldura que herda.** Vai ao aceite visual da V1-PR7 no Tab S6 como item **AV-6**. Div. 92 da V1-PR6.

**E15.b — quando existe o ícone de tipo, e quando não existe.** O congelado nunca disse o que fazer quando o tipo não é um dos quatro, nem quando o `content` não está no cache: a §6.4 dá um desenho a cada um dos quatro tipos e mais nada. A V1-PR5 deixou a pergunta em aberto (div. 74), e a V1-PR6 a fecha com um **critério**, não com um caso — *o ícone de tipo existe quando o app sabe o tipo*:

1. **sabe e é um dos quatro** → o desenho do tipo, 20 dp, com o rótulo em pt-BR;
2. **sabe e não é um dos quatro** (`unknown-type`, regra (d) do contrato do core) → `tipo-desconhecido`. No S2 o rótulo é "?", porque a sublinha de lá carrega o motivo por extenso; no S4 é o `content_type` cru, porque a sublinha de lá é artista e álbum e a §1 não deixa apagar dado que já aparecia;
3. **não sabe**, porque o `content` não está no cache (`loading` / `unavailable`) → **nenhum ícone e "—"**. Tracejado significa *ausente* (§6.1) e o item não é ausente, é desconhecido; inventar desenho aqui seria afirmar mais do que se mede.

O caso 3 **não existe no S4 por construção** — o índice de busca é feito de `contents`, então todo resultado tem o seu DTO —, e é isso que torna o critério verificável em vez de retórico: o "—" do S2 segue sendo o único do app.

E o que o S4 **não** faz, por decisão: não diz "vazia" para um item sem corpo. O chip do S4 responde *que tipo é*; quem responde *se está íntegro* é o índice da setlist, que é onde o músico confere antes do show. Acrescentar o `sem-conteudo` ao S4 duplicaria o sinal no lugar errado. Onde: §6.4. Div. 94 da V1-PR6.

**E16 — a barra inferior do palco passa a ter dois grupos, e as seis molduras do S3 deixam de descrever o app.** *(Decisão do Marcel, 2026-09-14, executada na W2; errata SEM redesenhar moldura, decisão 3 do aval da W2, 2026-09-15.)*

O que o congelado diz sobre a barra inferior do palco é **só a altura**: a §5.3 lhe dá 96 dp (`bar.stage`) e nenhuma linha sobre distribuição horizontal. As seis molduras do S3 (`S3-letra`, `S3-claro`, `S3-avulsa`, `S3d`, `S3-nobody`, `S3e`) mostram a fileira contígua que o app desenhava, e a §8 (Propostas) não tem nenhum item sobre a barra. **O documento não resolvia a questão — ele a desenhava.**

O que passa a valer no app (div. 109, Proposta A):

| | antes | depois |
| --- | --- | --- |
| comportamento (`auto-scroll`, `zoom −`, `zoom +`, `tema`) | x1 24,0 · 106,2 · 188,0 · 270,2 dp | **iguais, não se mexem** |
| navegação (`indice`, `busca`, `sair`) | x1 352,0 · 434,2 · 516,0 dp | **884,0 · 965,8 · 1048,0 dp** |
| vão entre os grupos | 16,0 dp | **548,0 dp** |
| margem direita | 555,6 dp vazios (49 % da barra) | **24,0 dp — a mesma da esquerda** |

Medido no AVD `octavia_tab32` (2560 × 1600 @ 360 = 1137,8 dp), **nas seis variantes do S3 e nos dois temas**, antes e depois: `W2-anexos/W2-C-barra-e-arvore.txt`. A implementação é um `<View style={{ flex: 1 }} />` — não há número cravado, e por isso vale em qualquer largura.

**Por que errata e não moldura nova**, e o precedente que o Marcel nomeia: *"o DESIGN-TELA-1 ficou intocado quando o V1 o substituiu. Documento congelado se anota por cima, não se reescreve."* O `telas.html` é fonte congelada de **desenho de ícone** — é o que o `gate:icones` cobra dele —, e nenhum gate quebra com a mudança; regravar seis PNGs para mover três caixas custa mais do que a errata resolve. As seis molduras do S3 continuam válidas para tudo menos a posição horizontal dos três de navegação, e **esta errata é o que diz isso**.

**E a E3 deixa de ser falsa.** A E3 afirma que o inativo é "tinta e, na árvore, `enabled=false`"; até a W2 isso era verdade para o botão `entrar` do S0 e **falso** para os três controles do palco, que saíam `enabled=true clickable=true` (div. 118, e a errata do A15 no `PRD-TELA-1.md`). Com o `accessibilityState={{ disabled: … }}` da W2, o palco passa a cumprir a E3 — medido no S3d: os três inertes `enabled=false`, os quatro restantes `true`, `clickable=true` em todos (o `onPress` do inerte é o que revela o motivo, A15). **A E3 não precisa de errata; ela passou a descrever o app.** Onde: §5.3 e §7 (as seis molduras do S3). Div. 109 e 118 da W2.

**E17 — a tela 2 existe, e é ela que anota este documento por cima.** *(Decisão do Marcel, 2026-09-21, no aval do desenho do N2; errata SEM redesenhar moldura, pelo precedente da E16.)*

**O desenho da tela 2 vive em [`docs/native/DESIGN-N2/`](../DESIGN-N2/)** — 18 molduras no mesmo canvas de 1138 × 627 dp, congeladas com `telas.html`, `telas.pdf` e `SHA256SUMS` próprios. As doze decisões que o sustentam são as **N2-D23…D34**, na §2 do `DESIGN-N2/README.md`. Nada do V1 é reescrito: como na E16, **documento congelado se anota por cima**. O que muda, ponto a ponto:

| onde | o que o V1 diz | o que passa a valer |
| --- | --- | --- |
| §5.3 · barra de S1 (120 dp) | a barra tem o título e `Buscar música` | ganha **`Nova setlist`** (ícone + rótulo, 190 × 57,8 dp) à esquerda de `Buscar música`, com vão de 24. A caixa do título cai de 709,8 para **495,8 dp**. A barra continua terminando em y 144 e o primeiro cartão continua começando em 176: **nada cobre cartão**. O cartão de S1 **não ganha nada** — renomear, datar e apagar moram em S2 |
| §7 · `S1f` | o estado vazio traz a frase que manda criar "na versão web" | a frase sai e entra **`Criar a primeira setlist`**, o mesmo ato, aqui. É o **único lugar das duas folhas com borda em `accentInk`**, porque é o único controle da tela. A marca fica, como na §8.4 |
| §7 · `S2` | uma S2 só | **duas entradas.** *S2 com edição* (vinda de S1 ou da criação) ganha uma **faixa de 64 dp abaixo da barra de 88**, com quatro controles de escrita, e um `remover` por linha; a lista cai de 551,1 para 487,1 dp (N2-D26). *S2 vinda do palco* **não muda** — é o frame de controle `N2-S2p`, a `S2` do V1 sem uma vírgula de diferença (T2-R19, N2-D19) |
| §5.3 e §7 · S1 e S2 | não há linha de aviso | a **linha de aviso de 48 dp** passa a ser **componente de S1 e S2**: ícone de 20, motivo sempre escrito, um aviso por vez, e o que bloqueia mais vence. Quando existe, a lista perde 48 dp e nada mais muda de lugar |
| §6.4 · catálogo | 34 linhas na tabela, 4 desenhos fora do catálogo (E14.a) | **39 linhas**: entram `nova setlist`, `alça`, `renomear`, `apagar setlist` e o par `adicionar / remover`. A fonte dos cinco é o **anexo D do `DESIGN-N2/telas.html`**, e é contra ele que o `gate:icones` mede (N2-D33). A categoria "fora do catálogo" **continua em 4**. O parêntese da folha do N2 que soma 38 está registrado na div. 222 |
| §8.3 · ordenar S1 por data | proposta em aberto, "só compensa se as setlists passarem a ter `performance_date` preenchido" | **decidida: não** (N2-D24). `created_at desc` continua. O gatilho para reabrir é **medido, não uma data**: quando **metade ou mais** das setlists da conta tiverem data futura. As duas molduras (`S1-proposta-data`, `PROP-data-hoje`) voltam ao debate **sem redesenho** |
| §8 · o critério dos desabilitados (`:374`) | "o motivo tem que ser legível **sem toque**" — critério da seção de propostas | **confirmado como regra da tela 2 inteira** (N2-D23), com uma consequência: o **A15 do palco** (revelar o motivo **ao toque**) vira a **exceção**, e é só do palco. Na tela 2, *desabilitado* e *inerte com motivo* colapsam num estado só, porque aqui todo inativo tem motivo escrito |
| §6.1 e §6.2 · inativo | "desabilitado muda tinta e amputa o desenho" | ganha um **limite**: amputa-se **só o que continua reconhecível amputado**. **O visto não é amputável** — sem a haste longa sobram 4 dp de traço, que se leem como caractere perdido. Nesses casos o inativo é o desenho **inteiro** em `lineInfo` com traço 1,25, como o par `zoom −` / `zoom +` da §6.2 já fazia. Exceção **R2·2**, no anexo D do N2 |

**O `SHA256SUMS` do V1 não muda com esta errata**, e os três congelados seguem conferindo. O `telas.html` do V1 fica **intacto**: ele é fonte congelada de desenho de ícone, é isso que o `gate:icones` cobra dele, e nenhum gate quebra com a tela 2. O hash do `README.md` registrado ali já estava velho antes desta errata — **div. 223**, com a decisão pendente do Marcel.

Onde: §5.3, §6.1, §6.2, §6.4, §7, §8 e §8.3. Divs. 221–225 do `DESIGN-N2/README.md` §9.

---

## 10 · Proveniência

**Fase 1 — iconografia.** 32 ícones, dois temas, quatro estados, três tamanhos. Seis correções na revisão: sol e lua com massa e caixa iguais (17,70 × 17,70, centro 12,00 · 12,00); o path da lua era inválido (pedia r 7 para uma corda de 14,637 e o renderer devolvia um semicírculo); a tab declarada por tamanho; os trastes com o vão medido na forma e não no comando (`linecap` avança 0,875); os quatro tokens com valor nos dois temas; zoom − e zoom + distinguíveis quando inertes por afinamento de traço.

**Fase 2 — as telas.** 22 molduras. Seis correções na revisão: o canvas passou de 651 para 627 (faltava a barra de status de 24 dp, e as pilhas internas foram recompostas); `lineInfo` saiu de todo texto ativo, inclusive do próprio documento, que cometia o erro enquanto o proibia; os chevrons das bordas e cinco desabilitados novos saíram das molduras para as propostas, porque desabilitar um controle clicável é mudança de comportamento; a frase sobre a altura dos itens inválidos foi retirada, porque o pre-check mediu recorte de viewport, não esmagamento; e o S0, que eu havia desenhado a partir do inventário de código ignorando a captura, foi refeito com a marca real.

**Por que a tab tem seis cordas em 28 e quatro em 20:** §6.3.

**Por que o logo é PNG e não SVG:** §8.4 — o retângulo que motivava o vetor já tinha sido resolvido em 08b84d6, com o par transparente que está empacotado hoje.

**Fechado na V1-PR1, depois do congelamento da Fase 2:** a divergência 22 (§8.4) e a altura dos itens inválidos do S2 (§5.4). As duas estavam listadas como pendência na primeira escrita deste documento e foram atualizadas antes da V1-PR2.

**Transcrito antes do congelamento:** `font.*`, `size.*`, `touch.*`, `bar.*`, `space`, `radius`, `tracking`, `zoomSteps` e `lineHeight`, verbatim do `theme.ts` (§4.1, §4.2, §5.2, §5.3). A transcrição derrubou o achado das fontes — E1 da §9.

**Aberto no congelamento:** as duas datas da §2 e o par zoom − / zoom + da §6.5. Mais nada.
