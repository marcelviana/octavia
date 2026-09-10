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

/** Tamanhos de UI do design: rótulos 12–14, corpo 15–16, títulos 20–28 dp. */
export const size = {
  label: 14,
  labelSmall: 12,
  body: 16,
  bodySmall: 15,
  input: 18,
  button: 17,
  title: 22,
  titleLarge: 28,
} as const

/** Passos de zoom do conteúdo (T1-R31): 18 · 22 (padrão) · 26 · 32 · 40 dp. */
export const zoomSteps = [18, 22, 26, 32, 40] as const
export const zoomDefault = 22

/** Entrelinha do conteúdo: 1,55 no texto e 1,45 na tablatura. */
export const lineHeight = { text: 1.55, tab: 1.45 } as const

/** Tracking do display (Raleway) — o design usa .14–.22em. */
export const tracking = { display: 0.14, displayWide: 0.22, label: 0.08 } as const
