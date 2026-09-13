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

---

## 10 · Proveniência

**Fase 1 — iconografia.** 32 ícones, dois temas, quatro estados, três tamanhos. Seis correções na revisão: sol e lua com massa e caixa iguais (17,70 × 17,70, centro 12,00 · 12,00); o path da lua era inválido (pedia r 7 para uma corda de 14,637 e o renderer devolvia um semicírculo); a tab declarada por tamanho; os trastes com o vão medido na forma e não no comando (`linecap` avança 0,875); os quatro tokens com valor nos dois temas; zoom − e zoom + distinguíveis quando inertes por afinamento de traço.

**Fase 2 — as telas.** 22 molduras. Seis correções na revisão: o canvas passou de 651 para 627 (faltava a barra de status de 24 dp, e as pilhas internas foram recompostas); `lineInfo` saiu de todo texto ativo, inclusive do próprio documento, que cometia o erro enquanto o proibia; os chevrons das bordas e cinco desabilitados novos saíram das molduras para as propostas, porque desabilitar um controle clicável é mudança de comportamento; a frase sobre a altura dos itens inválidos foi retirada, porque o pre-check mediu recorte de viewport, não esmagamento; e o S0, que eu havia desenhado a partir do inventário de código ignorando a captura, foi refeito com a marca real.

**Por que a tab tem seis cordas em 28 e quatro em 20:** §6.3.

**Por que o logo é PNG e não SVG:** §8.4 — o retângulo que motivava o vetor já tinha sido resolvido em 08b84d6, com o par transparente que está empacotado hoje.

**Fechado na V1-PR1, depois do congelamento da Fase 2:** a divergência 22 (§8.4) e a altura dos itens inválidos do S2 (§5.4). As duas estavam listadas como pendência na primeira escrita deste documento e foram atualizadas antes da V1-PR2.

**Transcrito antes do congelamento:** `font.*`, `size.*`, `touch.*`, `bar.*`, `space`, `radius`, `tracking`, `zoomSteps` e `lineHeight`, verbatim do `theme.ts` (§4.1, §4.2, §5.2, §5.3). A transcrição derrubou o achado das fontes — E1 da §9.

**Aberto no congelamento:** as duas datas da §2 e o par zoom − / zoom + da §6.5. Mais nada.
