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
import { ESTADOS_CONFIRM, ESTADOS_FORGOT, ESTADOS_LOGIN, ESTADOS_SIGNUP, ESTADOS_VERIFY, paraEstados } from './g-faixa-auth'
import { ESTADOS_DASH, ESTADOS_LIB } from './g-faixa-lista'
import { ESTADOS_CONTENT, ESTADOS_CONTENT_EDIT, ID_EDITOR, descobrirPorTipo } from './g-faixa-conteudo'
import { ESTADOS_UPLOAD_ANTES } from './g-faixa-upload'

export interface Estado {
  /** I1-PR6: antes de carregar a rota — rotas fabricadas, o usuário falso (`g-faixa-auth.ts`) */
  antes?: (page: Page, base: URL) => Promise<void>
  /** leva a tela, já carregada na rota, ao estado; sem ele, é o estado em que a rota abre */
  preparar?: (page: Page) => Promise<void>
  /** I1-PR6: o texto que TEM de estar na tela; sem ele o estado é gravado como NÃO ALCANÇADO (com a razão) */
  espera?: string
  /** I1-PR6: declarado inalcançável no navegador — não se mede; a razão vai para o JSON e o veredito a lista */
  inalcancavel?: string
  /** a seção da folha (`<section data-estado>`), quando a superfície estiver implementada */
  secao?: string
  /** I1-PR-10: a URL deste estado, quando muda por estado (o content de cada tipo); `null` = NÃO ALCANÇADO */
  rota?: () => string | null
  /** I1-PR-11: a folha deste estado, quando não é a da superfície (o `LIB-salvo` da folha 4, medido no fluxo do editor) */
  folha?: string
}

export interface Superficie {
  id: string
  /** a rota; `resolver` a troca por uma URL concreta (ex.: o id de um content) */
  rota: string
  resolver?: (page: Page, base: URL) => Promise<string | null>
  sessao: boolean
  publica: boolean
  /** a pasta da folha em docs/ux/DESIGN-I1 */
  folha?: string
  implementada: boolean
  estados: Record<string, Estado>
}

// (I1-PR10: o `primeiroContent` da I1-PR5 saiu — a superfície `content` descobre o primeiro de CADA tipo,
// `descobrirPorTipo` em `g-faixa-conteudo.ts`.)

export const SUPERFICIES: Superficie[] = [
  // I1-PR6: a superfície 1, auth, IMPLEMENTADA — um estado por seção da folha `1-auth`, alcançado pelo
  // mecanismo (ii) do aval (usuário falso + respostas fabricadas, `g-faixa-auth.ts`). Um contexto por
  // estado (o usuário falso fica no IndexedDB e não pode vazar). Sem sessão real: nenhuma conta.
  { id: 'login', rota: '/login', sessao: false, publica: true, folha: '1-auth', implementada: true, estados: paraEstados(ESTADOS_LOGIN) },
  { id: 'signup', rota: '/signup', sessao: false, publica: true, folha: '1-auth', implementada: true, estados: paraEstados(ESTADOS_SIGNUP) },
  { id: 'confirm-email', rota: '/signup/confirm-email', sessao: false, publica: true, folha: '1-auth', implementada: true, estados: paraEstados(ESTADOS_CONFIRM) },
  { id: 'verify-email', rota: '/verify-email', sessao: false, publica: true, folha: '1-auth', implementada: true, estados: paraEstados(ESTADOS_VERIFY) },
  { id: 'forgot-password', rota: '/forgot-password', sessao: false, publica: true, folha: '1-auth', implementada: true, estados: paraEstados(ESTADOS_FORGOT) },
  // I1-PR7: a superfície 2, landing, IMPLEMENTADA — o único estado da folha `2-landing` (div. 683: `LANDING`,
  // não `LAND-*`). Estática, sem sessão e sem Firebase: nada a fabricar.
  { id: 'landing', rota: '/', sessao: false, publica: true, folha: '2-landing', implementada: true, estados: { LANDING: { secao: 'LANDING', espera: 'Criar conta' } } },
  // I1-PR8: a superfície 3, privacy-policy, IMPLEMENTADA — o único estado da folha `3-privacy-policy`, `PRIVACY`.
  // Estática, sem sessão e sem Firebase: nada a fabricar. O texto é o de antes (I1-D17 exceção, I1-D19).
  { id: 'privacy-policy', rota: '/privacy-policy', sessao: false, publica: true, folha: '3-privacy-policy', implementada: true, estados: { PRIVACY: { secao: 'PRIVACY', espera: 'Cookies and consent / Cookies e consentimento' } } },
  // I1-PR9: a superfície 4, content lista, IMPLEMENTADA — os 15 estados da folha `4-content-lista` com a sessão
  // real do perfil e as respostas do app fabricadas no navegador (`g-faixa-lista.ts`); `LIB-salvo` nasce na PR-11,
  // `DASH-vazio`/`DASH-erro` são SSR (inalcançáveis no navegador, provados no Vitest). Zero escrita.
  { id: 'dashboard', rota: '/dashboard', sessao: true, publica: false, folha: '4-content-lista', implementada: true, estados: ESTADOS_DASH },
  { id: 'library', rota: '/library', sessao: true, publica: false, folha: '4-content-lista', implementada: true, estados: ESTADOS_LIB },
  { id: 'setlists', rota: '/setlists', sessao: true, publica: false, folha: '8-setlists', implementada: false, estados: { base: {} } },
  // I1-PR10: a superfície 5, content visualização, IMPLEMENTADA — os estados da folha `5-content-visualizacao`: o
  // content REAL de cada tipo (SSR, div. 732; decisão 1 do aval) e o ARQUIVO fabricado (`g-faixa-conteudo.ts`).
  // Os quatro vazios, o erro de formato e o de render: inalcançáveis declarados; os dois da I1-E15: sem código.
  {
    id: 'content',
    rota: '/content/[id]',
    resolver: descobrirPorTipo,
    sessao: true,
    publica: false,
    folha: '5-content-visualizacao',
    implementada: true,
    estados: ESTADOS_CONTENT,
  },
  // I1-PR11: a superfície 6, content editor, IMPLEMENTADA — os 15 estados da folha `6-content-editor` e o `LIB-salvo` da
  // folha 4 (o fluxo do salvar), TUDO fabricado (`g-faixa-conteudo.ts`): o `GET /api/content/g-faixa` com os exemplos da
  // folha, o `PUT /api/content` segurado/abortado/200 — nenhuma leitura de content real, nenhum `PUT` que saia. Mais os
  // cinco estados do 1b da PR-10 (`base-*`, `erro-pdf`), a `casca-efeito` do editor (antes × depois).
  { id: 'content-edit', rota: `/content/${ID_EDITOR}/edit`, sessao: true, publica: false, folha: '6-content-editor', implementada: true, estados: ESTADOS_CONTENT_EDIT },
  // I1-PR12 (commit 1b): a superfície 7, upload — os estados `base-*` do web velho (o "antes" da casca-efeito), TUDO
  // fabricado (`g-faixa-upload.ts`): o `POST /api/storage/upload` e o `POST /api/content` respondem no navegador, os
  // arquivos são gerados em memória, a navegação ao content criado fica segurada. Nenhum `POST` sai.
  { id: 'add-content', rota: '/add-content', sessao: true, publica: false, folha: '7-upload', implementada: false, estados: ESTADOS_UPLOAD_ANTES },
]

/** `G_FAIXA_SUPERFICIES=login,dashboard` restringe a rodada. */
export function selecionadas(): Superficie[] {
  const f = process.env.G_FAIXA_SUPERFICIES?.split(',').map((s) => s.trim()).filter(Boolean)
  return f?.length ? SUPERFICIES.filter((s) => f.includes(s.id)) : SUPERFICIES
}
