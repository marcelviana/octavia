/**
 * Tokens da identidade — a fonte única de web e nativo (I1-D3, I1-PR-4).
 *
 * Migrados do `apps/native/src/theme.ts` sem mudar um valor: a prova é o
 * `test/igualdade.test.ts`, contra a linha de base congelada da `main`
 * (`d18b7c4`). A origem de cada valor continua a do `theme.ts` de antes —
 * `docs/native/DESIGN-TELA-1/README.md` (+ E1), DESIGN-V1 §3.2/§4.4,
 * DESIGN-N3 — e quem muda um token aqui muda o design dos DOIS lados: é
 * errata declarada, não decisão de código.
 *
 * Unidades: dp no nativo, px CSS no web — **1 dp = 1 px** (I1-D3), sem
 * conversão. TS puro: nenhum import de React, React Native ou DOM.
 */

/** Tema escuro: o padrão do palco, da tela 1 e das folhas do web. */
export const dark = {
  bg: '#100F16',
  text: '#F9F5F1',
  accent: '#777CE8',
  muted: '#A9A5B5',
  line: '#2A2836',
  error: '#E5686F',
  offline: '#C9923B',
  // Os quatro do DESIGN-V1 §3.2 (V1-PR3). No escuro, três deles SÃO o token
  // que já existia — nenhum pixel muda; o nome nasceu porque o claro precisava
  // de outra tinta. `lineInfo` serve a 3:1 e só a três coisas (§3.3): ícone,
  // contorno que carrega informação, elemento desabilitado. Nunca texto ativo.
  accentInk: '#777CE8',
  errorInk: '#E5686F',
  offlineInk: '#C9923B',
  lineInfo: '#6E6A80',
} as const

/**
 * Tema claro ("dark sheet" invertido, T1-R32): fundo marfim quente; os
 * derivados (texto, linha, secundário) vêm do bloco de tokens do README. No
 * web, só o papel do PDF o usa (DESIGN-I1, `README-design.md`, "Cores").
 */
export const light = {
  bg: '#F6F1EA',
  text: '#100F16',
  accent: '#777CE8',
  muted: '#5E5A6A',
  line: '#D6CFC3',
  error: '#E5686F',
  offline: '#C9923B',
  // Sobre #F6F1EA: 5,89 · 6,37 · 6,02 · 3,17 (V1-PR3, script de contraste do
  // V1-A4; o 5,89 do `accentInk` é a errata E5 do DESIGN-V1 — o README dizia 5,90).
  accentInk: '#4A4FC0',
  errorInk: '#A32A31',
  offlineInk: '#7A5410',
  lineInfo: '#8E8779',
} as const

/** As duas paletas têm as mesmas chaves; os valores é que mudam. */
export type ThemeColors = { readonly [K in keyof typeof dark]: string }
export type ThemeName = 'dark' | 'light'

export const colors: Record<ThemeName, ThemeColors> = { dark, light }

/** Escala de espaço do design: 4 · 8 · 12 · 16 · 24 · 32 · 48. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const

/** Raio: 6 (chips) · 12 (botões, cartões, campos) · 20 (pílulas). */
export const radius = { chip: 6, control: 12, pill: 20 } as const

/** Alvos de toque: mínimo 48 · botão de lista 56 · controle do palco 64. */
export const touch = { min: 48, list: 56, stage: 64 } as const

/** Barras: superior 64 · barra do palco 96 · linha de 1 dp. */
export const bar = { top: 64, stage: 96, hairline: 1 } as const

/** Uma fonte é FAMÍLIA + PESO (I1-D31) — o que o CSS entende. */
export interface Fonte {
  readonly familia: 'Raleway' | 'Manrope' | 'IBM Plex Mono'
  readonly peso: 400 | 500 | 600
}

/**
 * Famílias (I1-D31, div. 485). O nativo guardava aqui o NOME DO ARQUIVO `.ttf`
 * do `expo-font` (`'Raleway_600SemiBold'`), que não é família de CSS; o pacote
 * guarda família + peso, e o nativo traduz pelo mapa de
 * `apps/native/src/fontes.ts`, com teste de cobertura.
 */
export const font = {
  display: { familia: 'Raleway', peso: 600 },
  displayMedium: { familia: 'Raleway', peso: 500 },
  ui: { familia: 'Manrope', peso: 400 },
  uiBold: { familia: 'Manrope', peso: 600 },
  mono: { familia: 'IBM Plex Mono', peso: 400 },
  monoBold: { familia: 'IBM Plex Mono', peso: 600 },
} as const satisfies Record<string, Fonte>

export type NomeFonte = keyof typeof font

/**
 * Tamanhos de UI do design: rótulos 12–14, corpo 15–16, títulos 20–28 dp —
 * mais os dois degraus que o DESIGN-V1 §4.4 fixou: `titleSmall` 26 (título
 * de tela do S1) e `display` 52 (o "FIM DA SETLIST" do S5).
 */
export const size = {
  label: 14,
  labelSmall: 12,
  body: 16,
  bodySmall: 15,
  input: 18,
  button: 17,
  title: 22,
  titleSmall: 26,
  titleLarge: 28,
  display: 52,
} as const

/** Passos de zoom do conteúdo (T1-R31): 18 · 22 (padrão) · 26 · 32 · 40 dp. */
export const zoomSteps = [18, 22, 26, 32, 40] as const
export const zoomDefault = 22

/** Entrelinha do conteúdo: 1,55 no texto e 1,45 na tablatura. */
export const lineHeight = { text: 1.55, tab: 1.45 } as const

/** Tracking do display (Raleway) — o design usa .14–.22em. */
export const tracking = { display: 0.14, displayWide: 0.22, label: 0.08 } as const

/**
 * T3-R1 — A FAIXA, NUM PONTO SÓ (N3-D1, N3-D8, N3-D12, N3-D24; I1-D30).
 *
 * A composição se escolhe pela **largura útil da janela** em dp (px no web) —
 * não pela orientação, não pelo aparelho:
 *
 *   A  < 700      celular em pé (411,4)
 *   B  700 – 960  tablet em pé (711,1); o celular deitado (914,3) cai aqui
 *   C  > 960      tablet deitado (1137,8)
 *
 * O limite A | B é 700 e não os 600 do cabeçalho da folha: N3-D12, errata
 * N3-E1. **Este é o único arquivo que conhece os dois números**: o nativo os
 * lê por `faixaDe` (o `apps/native/test/faixa.test.ts` reprova se o app os
 * escrever) e o web pelo CSS gerado daqui (`scripts/gerar-css.mjs`).
 */
export type Faixa = 'A' | 'B' | 'C'

export const limiares = { ab: 700, bc: 960 } as const

export function faixaDe(largura: number): Faixa {
  if (largura < limiares.ab) return 'A'
  if (largura <= limiares.bc) return 'B'
  return 'C'
}

/**
 * **TOKENS POR FAIXA** (N3-D28; no web, I1-D7 item 5). O que muda de uma faixa
 * de largura para outra é **valor**, e mora aqui: nenhuma tela faz aritmética
 * de largura. A fonte dos valores é o `docs/native/DESIGN-N3/README.md` (e a
 * folha congelada que ele aponta), com as erratas da §9 prevalecendo; o bloco
 * `web` é o `docs/ux/DESIGN-I1/README.md` §3.
 *
 *  - **C** são os valores do congelado V1/N2, que não muda (N3-D3).
 *  - **B** é a faixa desenhada para 711 × 1054.
 *  - **A** usa os valores de B — declarado, por referência (N3-D0; no web,
 *    I1-D11 e DESIGN-I1 §1).
 */
/**
 * **N4-D64 — a medida que a faixa NÃO TEM, por desenho.** Onde a folha decide que
 * uma medida não existe numa faixa (não é "sem valor ainda", é "não há"), o
 * token é esta palavra, e o tipo a diz — como o `'empilha'` do bloco `web`. Era
 * um `undefined` solto (`number | undefined`), que o tipo não distinguia de um
 * valor esquecido. As três de hoje são as da N4-D17: a altura mínima da folha
 * criar/editar em B e A e o mínimo do artista no reordenar em C. Quem lê
 * compara com `INEXISTENTE`; o gerador de CSS não emite propriedade para ela.
 */
export const INEXISTENTE = 'inexistente' as const
export type Inexistente = typeof INEXISTENTE

export interface TokensDaFaixa {
  s1: {
    /** Altura da barra superior: 120 em C (§5.3 do V1); 144 em B (N3-B-S1: 20 + título 36 + 16 + botões 58 + 14). */
    barra: number
    /** Respiro acima e abaixo do conteúdo da barra: 0 em C (uma linha centrada); 20 e 14 em B. */
    barraTopo: number
    barraBase: number
    /** Vão entre os itens da barra: 24 em C; 16 em B, entre título e linha 2 e dentro da linha 2. */
    vaoDaBarra: number
    /**
     * A composição de B — "quando não cabe, a composição empilha": o título
     * ganha linha própria acima de chip e botões; o chip sem rede empilha as
     * duas partes da frase (N3-D21); o cartão vira três andares (nome ·
     * metadados · `Baixar` + estado). Em C, tudo numa linha, como hoje.
     */
    empilha: boolean
    /** Altura mínima do cartão: 132 em C; 184 em B (N3-B-S1, ritmo de lista). */
    cartao: number
    /** O cartão do S1e, com o banner em cima: 112 em C (§5.4 do V1); em B o cartão não encolhe. */
    cartaoCompacto: number
  }
  s2: {
    /**
     * Colunas da lista de músicas: 2 em C (a grade do V1, linha 536,9 × 116);
     * 1 em B (N3-B-S2e/S2p: *"duas colunas em 663 dariam 323,5 por linha e
     * deixariam 63 dp para o título"*). A linha continua com 116 e com os
     * mesmos elementos — número, título/artista, tipo, `remover` — na mesma
     * ordem; só a coluna muda.
     */
    colunas: 1 | 2
    /**
     * N3-D17: em B a faixa de edição mostra os rótulos curtos `Adicionar` e
     * `Apagar` (frases existentes: o botão do picker e o do diálogo), e o nome
     * acessível continua o longo. Em C, os rótulos de sempre.
     */
    rotulosCurtos: boolean
  }
  reordenar: {
    /**
     * A barra do modo: 88 em C (uma linha — título, `Cancelar`, motivo e
     * `Salvar a ordem` lado a lado); 144 em B (N3-B-reordenar: *"20 + título
     * 31 + 6 + subtítulo 19 + 14 + ações 48 + 6"*) — o título ganha a
     * primeira linha inteira e as ações descem para a segunda.
     */
    barra: number
    /** A composição de duas linhas (B); em C, uma linha, como hoje. */
    empilha: boolean
    /** Respiro acima do título e abaixo das ações: 20 e 6 em B. */
    barraTopo: number
    barraBase: number
    /**
     * O vão entre título e apoio: 8 em C; 0 em B. A caixa do título de 26 dp
     * mede 36 no aparelho (a folha conta *"título 31 + 6"*): o respiro já
     * está dentro dela.
     */
    vaoDoTitulo: number
    /** Entre o título/apoio e a linha de ações, em B: 14. */
    vaoDasAcoes: number
    /**
     * *"título e · artista numa linha (o artista cede primeiro, mínimo 60
     * dp)"*. Em C os dois encolhem por igual (peso 1, sem mínimo), como hoje;
     * em B o artista encolhe com peso maior até os 60, e só então o título.
     */
    artistaCede: number
    /** 60 em B; em C **inexistente por desenho** (N4-D64): os dois encolhem por igual. */
    artistaMin: number | Inexistente
  }
  folha: {
    /**
     * A folha criar/editar: 720 × 420 a 100 do topo em C (N2 §2); em B
     * *"a largura da tela menos a margem da faixa (663 em B)"*, altura de
     * conteúdo, topo 96 — com as duas validações abertas o fundo fica em
     * ≈ 582 e o teclado de 300 começa em 754.
     */
    largura: number
    topo: number
    /** 420 em C; em B e A **inexistente por desenho** (N4-D64): a altura é a do conteúdo. */
    alturaMin: number | Inexistente
  }
  picker: {
    /**
     * **N3-E18** (decisão do Marcel, 2026-09-25; div. 445): a linha do picker
     * na fase `falhou` — a falha e o limite. Em C a frase e o `Tentar de novo`
     * ficam na fileira de 80, ao lado do título, como hoje. Em B eles não
     * cabem (o título ia a largura zero e o botão passava da janela): descem
     * para um SEGUNDO ANDAR, abaixo do título, com recuo alinhado a ele — o
     * molde dos dois andares de A. Os estados adicionar, adicionando…,
     * adicionada e relendo… não mudam em faixa nenhuma.
     */
    empilhaFalha: boolean
    /**
     * A altura mínima da linha na fase `falhou`: 80 em C (a de sempre); em B
     * 138,7 — a linha empilhada com o `Tentar de novo`, MEDIDA no dump do Tab
     * (`N3-PR6-anexos/`: 24,0 → 687,1 × 170,2 → 308,9). O limite, sem botão,
     * mede 131,1 sozinho; o mínimo o iguala, e a linha não cresce quando o
     * botão aparece depois da releitura.
     */
    linhaFalha: number
  }
  palco: {
    /**
     * A barra superior do palco: 64 em C (uma linha — posição, setlist e
     * título · artista · tipo lado a lado, o título elidido em ≈ 405); 88 em
     * B (N3-B-S3, N3-D13: *"o número 88 é o de bar.top + 24 que S2 e S4 já
     * usam"*). O corpo perde os 24 e fica com 870; a base, o corpo e as zonas
     * de 15 % são os de C — nada mais do palco é token. A S5 lê o mesmo
     * token para a barra superior dela (N3-E17): a altura não salta de S3 a S5.
     */
    barra: number
    /**
     * A composição de B: *"posição + setlist na primeira linha, título ·
     * artista · tipo na segunda, com os 663 dp inteiros"*. Em C, uma linha.
     */
    empilha: boolean
  }
  /**
   * **A biblioteca (L) do tablet — N4-PR7** (P-T1, P-T2; N4-R3, N4-R20, N4-D67). A composição de L é a da folha
   * (`DESIGN-N4/telas.html`, `N4-*-L-base`): barra de 88 (a da S4), a faixa de filtros, a régua fixa e a lista.
   */
  lib: {
    /**
     * P-T1 — a altura da faixa de filtros: os cinco chips de 48 (`touch.min`) numa linha, com 8 acima e abaixo — 64 em
     * C e B; em A os chips não cabem em 363 dp e vão a **duas linhas** (3 + 2): 8 + 48 + 8 + 48 + 8 = 120. A tela
     * deixa os chips quebrarem (`flexWrap`) e lê a altura daqui; nenhuma conta de largura.
     */
    filtros: number
    /**
     * P-T2 — a altura MÍNIMA da linha da lista: 80, a do resultado da S4 (m7), nas três faixas. Em C e B o título
     * tem uma linha e a linha fica nos 80; em A o título vai a duas linhas e a linha cresce (≈ 106, e4 — N5).
     */
    linha: number
  }
  /**
   * **A visualização (V) do tablet — N4-PR8** (P-T3; N4-R13, N4-R20, N4-D65, N4-D67; e a grade, N4-D99). A composição
   * de V é a da folha (`DESIGN-N4/telas.html`, `N4-*-V-*`): o cabeçalho de 88, e o corpo — em C duas colunas (detalhes
   * à esquerda, o leitor do palco à direita), em B e A uma coluna só (os detalhes sobre o corpo, uma rolagem).
   */
  view: {
    /**
     * P-T3 — a largura da coluna de detalhes à esquerda do leitor: **340 em C**. Em B e A **inexistente por desenho**
     * (N4-D64, a forma da N4-PR4; div. 1020): a coluna não existe, os detalhes vão sobre o corpo. A tela lê se a coluna
     * existe comparando com `INEXISTENTE` — nenhuma conta de largura. O gerador de CSS não leva este bloco.
     */
    coluna: number | Inexistente
    /**
     * N4-D99 `[Marcel, 2026-10-06]` — as colunas da grade de *Detalhes* (álbum, tom, andamento…): **2 em C** (dentro
     * dos 340), **3 em B**, **2 em A** (N4-R13: *"grade de 3 em B, de 2 em A"*). A tela monta linhas de N células
     * iguais (`flex: 1`); nenhuma conta de largura. Extra declarado: não é uma P-T da folha.
     */
    grade: number
  }
  s5: {
    /**
     * A largura da fileira de marcas de música percorrida (a regra de N
     * grande, §7.1 do DESIGN-V1: a marca vai de 34 a um piso de 6, com folga
     * fixa de 5, e acima do último N em que ainda é marca vira uma barra
     * sólida da largura inteira). 900 em C, como sempre; **663 em B** — a
     * largura útil da faixa (711,1 − 2 × 24), a mesma da folha. Com 900 em B a
     * fileira passava da janela a partir de N = 19 (com 60: 48 de 60 marcas
     * no dump, as das pontas cortadas — div. 461, a H-N3-3 do pre-check).
     */
    fileira: number
  }
  /**
   * **O bloco do web** — `docs/ux/DESIGN-I1/README.md` §3, exatamente (nome ·
   * C · B; A segue B). Onde a folha diz "—" (sem máximo em B) o valor é `null`;
   * onde diz "empilha", é a palavra — a coluna não existe naquela faixa.
   */
  web: {
    /** Largura da moldura de C e máximo do conteúdo; em B, sem máximo. */
    conteiner: number | null
    /** Margem interna do contêiner: `space.xxl` em C, `space.xl` em B. */
    margem: number
    /** Coluna de detalhes/metadados (5, 6) e limiar das linhas flexíveis; em B, empilha. */
    colunaLateral: number | 'empilha'
    /** Lista de setlists | setlist aberta (8): 2 : 3 em C; em B, empilha. */
    razaoListaDetalhe: readonly [number, number] | 'empilha'
    /** Altura mínima da zona de arquivo (7). */
    zonaArquivo: number
    /** Linha da biblioteca (4) e os blocos de carregando da folha 8. */
    linhaLista: number
    /** Linha de música da setlist aberta (8). */
    linhaMusica: number
    /** Casca em duas linhas, coluna lateral desce, ações do cabeçalho descem, marca sobe. */
    empilha: boolean
    /**
     * As medidas fixas das folhas 0 e 1 (I1-PR-6, decisão 2 do aval): os
     * literais com origem do `README-design.md` §2.3, com nome. Do S0 (V1 E10,
     * V1 §5.2): a marca 340 × 219, a coluna do formulário 420, o vão marca |
     * formulário 140 em C (em B a marca sobe e o vão é `space.xxxl`), o campo
     * `touch.list + 4` e o botão secundário `touch.list + 2`. Do N3: o botão de
     * ação da `LinhaDeAviso` 36 e a entrelinha dela, 20 (T3-R7, I1-E5).
     */
    marca: { readonly largura: number; readonly altura: number }
    colunaAuth: number
    vaoAuth: number
    campoAuth: number
    botaoAuth: number
    botaoAviso: number
    entrelinhaAviso: number
    /**
     * O limiar de quebra do bloco de texto da `LinhaDeAviso` — *"flex com base
     * web.colunaLateral"* em C **e em B** (README-design §2.4: "igual"). Em B a
     * `colunaLateral` é `'empilha'` e não gera propriedade (div. 605), então o
     * limiar tem nome próprio, com o mesmo 320 nas duas faixas (div. 657).
     */
    limiarAviso: number
    /**
     * A folha 4 (I1-PR-9, aval do commit 2: opção 2 — só adição, como a decisão
     * 2 da I1-PR-6). `metadado`: o tamanho do metadado de linha (tipo na lista do
     * painel, data na linha da biblioteca), 13 — literal V1 §4.4 (README-design
     * §2.3). `alfaMarcado`: o fundo do item marcado — `accent` a 12 % (navegação
     * ativa, aba ativa, *Favorita*, página atual). `alfaDialogo`: o fundo atrás do
     * diálogo — `bg` a 82 % (README-design, "Cores"). As duas alfas viram
     * `color-mix` no gerador; o nativo não as lê.
     */
    metadado: number
    alfaMarcado: number
    alfaDialogo: number
  }
}

const faixaC: TokensDaFaixa = {
  s1: { barra: 120, barraTopo: 0, barraBase: 0, vaoDaBarra: space.xl, empilha: false, cartao: 132, cartaoCompacto: 112 },
  s2: { colunas: 2, rotulosCurtos: false },
  reordenar: {
    barra: bar.top + space.xl, empilha: false, barraTopo: 0, barraBase: 0, vaoDoTitulo: space.sm, vaoDasAcoes: 0,
    artistaCede: 1, artistaMin: INEXISTENTE,
  },
  folha: { largura: 720, topo: 100, alturaMin: 420 },
  picker: { empilhaFalha: false, linhaFalha: 80 },
  palco: { barra: bar.top, empilha: false },
  lib: { filtros: space.sm + touch.min + space.sm, linha: 80 },
  view: { coluna: 340, grade: 2 },
  s5: { fileira: 900 },
  web: {
    conteiner: 1138, margem: space.xxl, colunaLateral: 320, razaoListaDetalhe: [2, 3],
    zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: false,
    marca: { largura: 340, altura: 219 }, colunaAuth: 420, vaoAuth: 140,
    campoAuth: touch.list + 4, botaoAuth: touch.list + 2, botaoAviso: 36, entrelinhaAviso: 20, limiarAviso: 320,
    metadado: 13, alfaMarcado: 0.12, alfaDialogo: 0.82,
  },
}

const faixaB: TokensDaFaixa = {
  s1: { barra: 144, barraTopo: 20, barraBase: 14, vaoDaBarra: space.lg, empilha: true, cartao: 184, cartaoCompacto: 184 },
  s2: { colunas: 1, rotulosCurtos: true },
  reordenar: {
    barra: 144, empilha: true, barraTopo: 20, barraBase: 6, vaoDoTitulo: 0, vaoDasAcoes: 14,
    artistaCede: 100, artistaMin: 60,
  },
  folha: { largura: 663, topo: 96, alturaMin: INEXISTENTE },
  picker: { empilhaFalha: true, linhaFalha: 138.7 },
  palco: { barra: bar.top + space.xl, empilha: true },
  lib: { filtros: space.sm + touch.min + space.sm, linha: 80 },
  view: { coluna: INEXISTENTE, grade: 3 },
  s5: { fileira: 663 },
  web: {
    conteiner: null, margem: space.xl, colunaLateral: 'empilha', razaoListaDetalhe: 'empilha',
    zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: true,
    marca: { largura: 340, altura: 219 }, colunaAuth: 420, vaoAuth: space.xxxl,
    campoAuth: touch.list + 4, botaoAuth: touch.list + 2, botaoAviso: 36, entrelinhaAviso: 20, limiarAviso: 320,
    metadado: 13, alfaMarcado: 0.12, alfaDialogo: 0.82,
  },
}

/**
 * A faixa A é a B (N3-D0) **menos a faixa de filtros da biblioteca**, que em A tem duas linhas (P-T1, N4-PR7): é a
 * primeira medida em que A tem valor próprio. **N4-PR8**: e menos a grade de *Detalhes* de V, que em A tem 2 colunas
 * (N4-D99). O resto é o objeto de B, chave a chave.
 */
const faixaA: TokensDaFaixa = {
  ...faixaB,
  lib: { filtros: space.sm + touch.min + space.sm + touch.min + space.sm, linha: 80 },
  view: { coluna: INEXISTENTE, grade: 2 },
}

export const faixas: Readonly<Record<Faixa, TokensDaFaixa>> = { A: faixaA, B: faixaB, C: faixaC }
