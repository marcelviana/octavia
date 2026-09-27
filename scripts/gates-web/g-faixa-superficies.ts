/**
 * G-faixa — as superfícies e os estados medidos (I1-PR5).
 *
 * Na I1-PR5 só há o estado `base` das superfícies vivas do web velho: é o CN
 * da `main` (I1-D13 — "o web velho tem de reprovar; se passar, o instrumento
 * não mede"). Cada PR de superfície acrescenta os estados dela (com o
 * `preparar` que leva a tela ao estado), liga `implementada` e aponta a seção
 * da folha de cada estado — aí entra a comparação de 4 px contra a moldura
 * (errata candidata).
 *
 * `publica`: a superfície não mostra conteúdo do usuário, então o texto dos nós
 * vai em claro no JSON (`rotulo`). Nas outras, só o hash — a regra "anexo não
 * carrega texto de música" (CLAUDE.md, div. 204 do N2).
 */
import type { Page } from '@playwright/test'

export interface Estado {
  /** leva a tela, já carregada na rota, ao estado; sem ele, é o estado em que a rota abre */
  preparar?: (page: Page) => Promise<void>
  /** a seção da folha (`<section data-estado>`), quando a superfície estiver implementada */
  secao?: string
}

export interface Superficie {
  id: string
  /** a rota; `resolver` a troca por uma URL concreta (ex.: o id de um content) */
  rota: string
  resolver?: (page: Page) => Promise<string | null>
  sessao: boolean
  publica: boolean
  /** a pasta da folha em docs/ux/DESIGN-I1 */
  folha?: string
  implementada: boolean
  estados: Record<string, Estado>
}

/** o primeiro `/content/<id>` da biblioteca (sem discovery.json: a conta é a de quem logou no perfil) */
async function primeiroContent(page: Page): Promise<string | null> {
  const href = await page.evaluate(() => {
    const a = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/content/"]')].find((x) => /^\/content\/[^/?#]+$/.test(x.getAttribute('href') ?? ''))
    return a?.getAttribute('href') ?? null
  })
  return href
}

export const SUPERFICIES: Superficie[] = [
  { id: 'login', rota: '/login', sessao: false, publica: true, folha: '1-auth', implementada: false, estados: { base: {} } },
  // as duas públicas da I1-D19 (fora da lista do CN do prompt; entram porque são superfícies do I1 e não pedem sessão)
  { id: 'landing', rota: '/', sessao: false, publica: true, folha: '2-landing', implementada: false, estados: { base: {} } },
  { id: 'privacy-policy', rota: '/privacy-policy', sessao: false, publica: true, folha: '3-privacy-policy', implementada: false, estados: { base: {} } },
  { id: 'dashboard', rota: '/dashboard', sessao: true, publica: false, folha: '4-content-lista', implementada: false, estados: { base: {} } },
  { id: 'library', rota: '/library', sessao: true, publica: false, folha: '4-content-lista', implementada: false, estados: { base: {} } },
  { id: 'setlists', rota: '/setlists', sessao: true, publica: false, folha: '8-setlists', implementada: false, estados: { base: {} } },
  {
    id: 'content',
    rota: '/content/[id]',
    resolver: primeiroContent,
    sessao: true,
    publica: false,
    folha: '5-content-visualizacao',
    implementada: false,
    estados: { base: {} },
  },
]

/** `G_FAIXA_SUPERFICIES=login,dashboard` restringe a rodada. */
export function selecionadas(): Superficie[] {
  const f = process.env.G_FAIXA_SUPERFICIES?.split(',').map((s) => s.trim()).filter(Boolean)
  return f?.length ? SUPERFICIES.filter((s) => f.includes(s.id)) : SUPERFICIES
}
