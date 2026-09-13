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
