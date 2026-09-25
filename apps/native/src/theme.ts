/**
 * Tokens do design congelado da tela 1 — verbatim do
 * `docs/native/DESIGN-TELA-1/README.md` (+ errata E1: Raleway 500 e 600).
 * Sem lógica: só valores. Quem muda um token aqui muda o design, e isso é
 * errata declarada no README, não decisão de código.
 *
 * Unidades: dp (o RN já trabalha em dp). O canvas do design é 1280×800 dp;
 * o Tab S6 e o AVD `octavia_tab32` medem **1138×711 dp** (E1) — por isso os
 * layouts são fluidos e nenhuma medida abaixo é posição absoluta.
 */
import type { Faixa } from './faixa'

/** Tema escuro: o padrão do palco e de toda a tela 1. */
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
 * derivados (texto, linha, secundário) vêm do bloco de tokens do README.
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

/**
 * Famílias: o nome é o do arquivo .ttf embarcado pelo config plugin do
 * `expo-font` (N1-D6) — com o plugin, a fonte já está disponível quando o app
 * abre, sem carga em runtime.
 */
export const font = {
  display: 'Raleway_600SemiBold',
  displayMedium: 'Raleway_500Medium',
  ui: 'Manrope_400Regular',
  uiBold: 'Manrope_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoBold: 'IBMPlexMono_600SemiBold',
} as const

/**
 * Tamanhos de UI do design: rótulos 12–14, corpo 15–16, títulos 20–28 dp —
 * mais os dois degraus que o DESIGN-V1 §4.4 fixou: `titleSmall` 26 (título
 * de tela do S1) e `display` 52 (o "FIM DA SETLIST" do S5). Quem os aplica
 * são as PRs de tela (V1-PR4/6); aqui só existem.
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
 * **TOKENS POR FAIXA** (N3-D28, a P2 do DESIGN-N3 adotada). O que muda de uma
 * faixa de largura para outra é **valor**, e mora aqui: nenhuma tela faz
 * aritmética de largura nem compara largura (quem decide a faixa é só o
 * `faixa.ts`, T3-R1); a tela pede `faixas[useFaixa()]` e desenha com o que
 * vier. A fonte dos valores é o `docs/native/DESIGN-N3/README.md` (e a folha
 * congelada que ele aponta), com as erratas da §9 prevalecendo.
 *
 *  - **C** são os valores de hoje — o congelado V1/N2, que não muda (N3-D3;
 *    a invariante T3-R2 é gate de toda PR). Onde um token de C já existia
 *    (`space.xl`), ele entra por referência, não por cópia.
 *  - **B** é a faixa desenhada para 711 × 1054.
 *  - **A** é o N5 (N3-D0). Até lá, **A usa os valores de B** — declarado, por
 *    referência, e o aceite de A no N3 é o mínimo: sem crash, sem controle de
 *    escrita inalcançável (T3-R3).
 *
 * Cada superfície entra aqui na PR que a implementa: S1 na N3-PR2, S2 na
 * N3-PR3, o reordenar e a folha na N3-PR4 (o diálogo de apagar "em B passa":
 * 620 em 711, sem token), a barra superior do palco na N3-PR5 (picker, S0, S4
 * e S5 "em B passam", sem token). Na N3-PR6 a S5 passa a ler o token da barra
 * do palco (N3-E17, div. 442): sem salto de 24 dp ao chegar ao fim em B. E
 * o picker ganha o token da linha que falha (N3-E18, div. 445): o aceite
 * completo mediu que "picker, B: passa" só valia no estado base.
 */
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
    artistaMin: number | undefined
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
    alturaMin: number | undefined
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
}

const faixaC: TokensDaFaixa = {
  s1: { barra: 120, barraTopo: 0, barraBase: 0, vaoDaBarra: space.xl, empilha: false, cartao: 132, cartaoCompacto: 112 },
  s2: { colunas: 2, rotulosCurtos: false },
  reordenar: {
    barra: bar.top + space.xl, empilha: false, barraTopo: 0, barraBase: 0, vaoDoTitulo: space.sm, vaoDasAcoes: 0,
    artistaCede: 1, artistaMin: undefined,
  },
  folha: { largura: 720, topo: 100, alturaMin: 420 },
  picker: { empilhaFalha: false, linhaFalha: 80 },
  palco: { barra: bar.top, empilha: false },
}

const faixaB: TokensDaFaixa = {
  s1: { barra: 144, barraTopo: 20, barraBase: 14, vaoDaBarra: space.lg, empilha: true, cartao: 184, cartaoCompacto: 184 },
  s2: { colunas: 1, rotulosCurtos: true },
  reordenar: {
    barra: 144, empilha: true, barraTopo: 20, barraBase: 6, vaoDoTitulo: 0, vaoDasAcoes: 14,
    artistaCede: 100, artistaMin: 60,
  },
  folha: { largura: 663, topo: 96, alturaMin: undefined },
  picker: { empilhaFalha: true, linhaFalha: 138.7 },
  palco: { barra: bar.top + space.xl, empilha: true },
}

export const faixas: Readonly<Record<Faixa, TokensDaFaixa>> = { A: faixaB, B: faixaB, C: faixaC }
