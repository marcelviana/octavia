/**
 * G-faixa — os estados da superfície 1, auth (I1-PR6), com o MECANISMO (ii) do
 * aval (decisão 8): usuário falso e respostas fabricadas por `page.route()`.
 * ZERO conta, ZERO escrita: toda resposta do `identitytoolkit`/`securetoken`
 * (Google) e as do próprio app que escreveriam (`POST /api/profile`) nascem no
 * navegador e nada sai. A resposta fabricada leva o cabeçalho `x-g-faixa:
 * fabricado`, e o log de requests do medidor a marca — o veredito não a conta
 * como escrita.
 *
 * O usuário falso é o da folha (`marcel@exemplo.com`, dado de exemplo da
 * própria folha, não uma conta): um *Entrar* fabricado no `/login` faz o SDK
 * guardá-lo no IndexedDB, com um token sem assinatura (o cliente não confere
 * assinatura) que vence em 24 h. A sessão (`POST /api/auth/session`) é fabricada
 * como 2xx e o `GET /api/profile` como 401 — o provider só registra no log.
 *
 * Cada estado diz o texto que TEM de estar na tela (`espera`); sem ele, o
 * medidor grava o estado como NÃO ALCANÇADO, com a razão, e não mede — o
 * aceite diz quais (o prompt do commit 2, §2). Pede o `.env.local` do Marcel
 * (o SDK só inicia configurado); `sem-firebase` são os que só existem sem ele.
 */
import type { Page, Route } from '@playwright/test'
import type { Estado } from './g-faixa-superficies'

export const EMAIL = 'marcel@exemplo.com' // o da folha (dado de exemplo, não uma conta)
const SENHA = 'senha-de-exemplo' // valor de teste do próprio script; nunca vai a lugar nenhum
const LOCAL_ID = 'g-faixa-usuario-falso'

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
function tokenFalso(emailVerified: boolean): string {
  const agora = Math.floor(Date.now() / 1000)
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
    iss: 'https://securetoken.google.com/g-faixa', aud: 'g-faixa', auth_time: agora, user_id: LOCAL_ID, sub: LOCAL_ID,
    iat: agora, exp: agora + 86_400, email: EMAIL, email_verified: emailVerified,
    firebase: { identities: { email: [EMAIL] }, sign_in_provider: 'password' },
  })}.sem-assinatura`
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'x-g-faixa': 'fabricado' }
type Resposta = { status?: number; corpo?: unknown; headers?: Record<string, string> } | 'segurar' | 'abortar'

/**
 * As respostas SEGURADAS de cada página: nunca respondem enquanto se mede (o "carregando" fica na tela)
 * e são abortadas por `soltar` antes de o contexto fechar — um `route` pendurado trava o `close()`.
 */
const segurados = new WeakMap<Page, Route[]>()
const segurar = (page: Page, route: Route) => { segurados.set(page, [...(segurados.get(page) ?? []), route]) }
export async function soltar(page: Page) {
  for (const r of segurados.get(page) ?? []) await r.abort().catch(() => {})
  segurados.delete(page)
}

/** Responde (ou segura, ou aborta) no navegador; o preflight CORS sempre passa. */
async function responder(route: Route, r: Resposta) {
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
  if (r === 'segurar') return segurar(route.request().frame().page(), route)
  if (r === 'abortar') return route.abort('internetdisconnected')
  return route.fulfill({ status: r.status ?? 200, headers: { ...CORS, 'content-type': 'application/json', ...r.headers }, body: JSON.stringify(r.corpo ?? {}) })
}
const erroGoogle = (message: string): Resposta => ({ status: 400, corpo: { error: { code: 400, message, errors: [{ message, domain: 'global', reason: 'invalid' }] } } })

export interface Fabricas {
  signIn?: Resposta; lookup?: Resposta; signUp?: Resposta; oob?: Resposta
  sessao?: Resposta; perfilGet?: Resposta; perfilPost?: Resposta
  janela?: 'bloqueada' | 'pendente' | 'fechada'
  rscLogin?: 'segurar'
}

/** As rotas fabricadas de um estado (antes de a página carregar). */
export async function fabricar(page: Page, f: Fabricas, emailVerified = false) {
  const tk = tokenFalso(emailVerified)
  const usuario = { localId: LOCAL_ID, email: EMAIL, emailVerified, providerUserInfo: [{ providerId: 'password', federatedId: EMAIL, email: EMAIL, rawId: EMAIL }], validSince: '0', lastLoginAt: '0', createdAt: '0' }
  const it = (fim: string, r: Resposta) => page.route(new RegExp(`identitytoolkit\\.googleapis\\.com/v1/accounts:${fim}`), (rt) => responder(rt, r))
  await it('signInWithPassword', f.signIn ?? { corpo: { kind: 'identitytoolkit#VerifyPasswordResponse', localId: LOCAL_ID, email: EMAIL, displayName: '', idToken: tk, registered: true, refreshToken: 'falso', expiresIn: '86400' } })
  await it('lookup', f.lookup ?? { corpo: { kind: 'identitytoolkit#GetAccountInfoResponse', users: [usuario] } })
  await it('signUp', f.signUp ?? { corpo: { kind: 'identitytoolkit#SignupNewUserResponse', localId: LOCAL_ID, email: EMAIL, idToken: tk, refreshToken: 'falso', expiresIn: '86400' } })
  await it('update', { corpo: { kind: 'identitytoolkit#SetAccountInfoResponse', localId: LOCAL_ID, email: EMAIL, idToken: tk, refreshToken: 'falso', expiresIn: '86400' } })
  await it('delete', { corpo: { kind: 'identitytoolkit#DeleteAccountResponse' } })
  await it('sendOobCode', f.oob ?? { corpo: { kind: 'identitytoolkit#GetOobConfirmationCodeResponse', email: EMAIL } })
  await page.route(/securetoken\.googleapis\.com\/v1\/token/, (rt) => responder(rt, { corpo: { access_token: tk, id_token: tk, refresh_token: 'falso', expires_in: '86400', token_type: 'Bearer', user_id: LOCAL_ID } }))
  await page.route(/\/api\/auth\/session$/, (rt) => rt.request().method() === 'POST' ? responder(rt, f.sessao ?? { corpo: { ok: true } }) : rt.fallback())
  await page.route(/\/api\/profile$/, (rt) => rt.request().method() === 'GET' ? responder(rt, f.perfilGet ?? { status: 401, corpo: { error: 'Unauthorized' } }) : responder(rt, f.perfilPost ?? { status: 500, corpo: { error: 'x' } }))
  if (f.janela === 'bloqueada') await page.addInitScript(() => { window.open = () => null })
  if (f.janela === 'pendente') await page.addInitScript(() => { window.open = () => ({ closed: false, close() {}, focus() {} }) as unknown as Window })
  // a janela do Google "fechada pelo usuário": o SDK a vê fechada no próximo poll e desiste com `auth/popup-closed-by-user`
  if (f.janela === 'fechada') await page.addInitScript(() => { window.open = () => ({ closed: true, close() {}, focus() {} }) as unknown as Window })
  if (f.rscLogin === 'segurar') await page.route(/\/login\?_rsc=/, (rt) => segurar(page, rt))
}

/** O *Entrar* fabricado: o SDK guarda o usuário falso no IndexedDB (ele sobrevive à próxima navegação). */
export async function entrarComUsuarioFalso(page: Page, base: URL) {
  await page.goto(new URL('/login', base).href, { waitUntil: 'load', timeout: 180_000 })
  await preencherLogin(page)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click({ timeout: 10_000 })
  // sem Firebase (servidor sem `.env`) o SDK não inicia: não há usuário a guardar — desiste já, com a razão
  const inicio = Date.now()
  while (Date.now() - inicio < 30_000) {
    if (await page.getByText('o login não está disponível neste servidor').isVisible().catch(() => false))
      throw new Error('o usuário falso não entra: Firebase não configurado neste servidor (sem .env)')
    // a verificação tem teto próprio: um `indexedDB.open` pendente não pode pendurar a rodada
    const guardado = await page.evaluate(() => new Promise<boolean>((ok) => {
      const fim = setTimeout(() => ok(false), 2_000)
      const req = indexedDB.open('firebaseLocalStorageDb')
      req.onsuccess = () => {
        try {
          const q = req.result.transaction('firebaseLocalStorage').objectStore('firebaseLocalStorage').count()
          q.onsuccess = () => { clearTimeout(fim); ok(q.result > 0) }
          q.onerror = () => { clearTimeout(fim); ok(false) }
        } catch { clearTimeout(fim); ok(false) }
      }
      req.onerror = () => { clearTimeout(fim); ok(false) }
    })).catch(() => false)
    if (guardado) return
    await page.waitForTimeout(500)
  }
  throw new Error('o usuário falso não foi guardado no IndexedDB em 30 s')
}

export async function preencherLogin(page: Page) {
  await page.locator('#email').fill(EMAIL, { timeout: 10_000 })
  await page.locator('#password').fill(SENHA, { timeout: 10_000 })
}

async function preencherSignup(page: Page, confirmar = SENHA) {
  await page.locator('#firstName').fill('Marcel')
  await page.locator('#lastName').fill('Viana')
  await page.locator('#email').fill(EMAIL)
  await page.locator('#primaryInstrument').selectOption('guitar')
  await page.locator('#password').fill(SENHA)
  await page.locator('#confirmPassword').fill(confirmar)
}

const clicar = (nome: string) => async (page: Page) => { await page.getByRole('button', { name: nome, exact: true }).click({ timeout: 10_000 }) }
/** Para a resposta que demora (o SDK leva segundos para desistir da janela fechada): espera o texto, com teto. */
const aguardar = (texto: string, ms = 30_000) => async (page: Page) => { await page.getByText(texto, { exact: false }).first().waitFor({ timeout: ms }).catch(() => {}) }
const em = (acoes: ((p: Page) => Promise<void>)[]) => async (page: Page) => { for (const a of acoes) await a(page) }

/** Um estado de auth: a seção da folha, as fábricas, se precisa do usuário falso, o que fazer e o que tem de aparecer. */
export interface EstadoAuth extends Estado {
  fabricas?: Fabricas
  usuario?: boolean
  espera?: string
  /** declarado: o estado não se alcança no navegador (a razão vai para o JSON e o veredito lista) */
  inalcancavel?: string
  /** estado sem seção na folha (medido só em (e)/(b), sem esperado) */
  semSecao?: boolean
}

const ENTRAR = clicar('Entrar')
const loginPreenchido = (f: Fabricas, espera: string, usuario = false): EstadoAuth => ({ fabricas: f, usuario, preparar: em([preencherLogin, ENTRAR]), espera })

export const ESTADOS_LOGIN: Record<string, EstadoAuth> = {
  'AUTH-login': { espera: 'Entrar com Google' },
  'AUTH-login-validacao': { preparar: ENTRAR, espera: 'Entrar com Google' },
  'AUTH-login-entrando': loginPreenchido({ signIn: 'segurar' }, 'Entrando…'),
  'AUTH-login-google': { fabricas: { janela: 'pendente' }, preparar: clicar('Google Entrar com Google'), espera: 'Carregando…' },
  'AUTH-login-redirecionando': loginPreenchido({ perfilGet: 'segurar' }, 'abrindo o painel…'),
  'AUTH-login-sem-token': { inalcancavel: 'o token do usuário falso sempre existe: "Unable to obtain authentication token" só por mock de SDK [hipótese]' },
  'AUTH-login-credencial': loginPreenchido({ signIn: erroGoogle('INVALID_LOGIN_CREDENTIALS') }, 'e-mail ou senha não conferem'),
  'AUTH-login-limite-prazo': loginPreenchido({ sessao: { status: 429, headers: { 'retry-after': '120' } } }, 'tente de novo em 2 min'),
  'AUTH-login-limite': loginPreenchido({ sessao: { status: 429 } }, 'tente de novo em instantes'),
  'AUTH-login-rede': loginPreenchido({ sessao: 'abortar' }, 'sem conexão — a sessão não foi aberta'),
  // decisão 5 do aval do commit 3 [Marcel, 2026-09-28]: a seção da folha é a do CANCELADO (uma linha) e se mede com
  // ela; o BLOQUEADO (duas linhas) é medido à parte — só (e)/(b), sem esperado da folha (`semSecao`)
  'AUTH-login-google-erro': { fabricas: { janela: 'fechada' }, preparar: em([clicar('Google Entrar com Google'), aguardar('o login com Google foi cancelado')]), espera: 'o login com Google foi cancelado' },
  'AUTH-login-google-bloqueado': { fabricas: { janela: 'bloqueada' }, preparar: clicar('Google Entrar com Google'), espera: 'o navegador bloqueou a janela do Google', semSecao: true },
  // só existe SEM Firebase (o `.env` ausente): com ele, a credencial fabricada aparece e o estado sai NÃO ALCANÇADO
  'AUTH-login-nao-configurado': { fabricas: { signIn: erroGoogle('INVALID_LOGIN_CREDENTIALS') }, preparar: em([preencherLogin, ENTRAR]), espera: 'o login não está disponível neste servidor' },
  'AUTH-login-perfil-401': loginPreenchido({}, 'o servidor não aceitou o login — entre de novo'),
  'AUTH-login-servidor': loginPreenchido({ perfilGet: { status: 500 } }, 'falha no servidor — a sessão não foi aberta'),
}

const CRIAR = clicar('Criar conta')
const signupPreenchido = (f: Fabricas, espera: string): EstadoAuth => ({ fabricas: f, preparar: em([(p) => preencherSignup(p), CRIAR]), espera })

export const ESTADOS_SIGNUP: Record<string, EstadoAuth> = {
  'AUTH-signup': { espera: 'Voltar para o login' },
  'AUTH-signup-validacao': { preparar: CRIAR, espera: 'Voltar para o login' },
  'AUTH-signup-senhas': { preparar: em([(p) => preencherSignup(p, 'outra-senha-de-exemplo'), CRIAR]), espera: 'as senhas não conferem' },
  'AUTH-signup-criando': signupPreenchido({ signUp: 'segurar' }, 'Criando a conta…'),
  'AUTH-signup-email-usado': signupPreenchido({ signUp: erroGoogle('EMAIL_EXISTS') }, 'já existe uma conta com este e-mail'),
  'AUTH-signup-senha-fraca': signupPreenchido({ signUp: erroGoogle('WEAK_PASSWORD : Password should be at least 6 characters') }, 'senha fraca'),
  'AUTH-signup-rede': signupPreenchido({ signUp: 'abortar' }, 'sem conexão — a conta não foi criada'),
  'AUTH-signup-limite': signupPreenchido({ signUp: erroGoogle('TOO_MANY_ATTEMPTS_TRY_LATER') }, 'muitas tentativas'),
  'AUTH-signup-perfil': signupPreenchido({ perfilPost: { status: 500 } }, 'o perfil não foi criado'),
  'AUTH-signup-excecao': { inalcancavel: 'o contexto não lança (todo catch devolve { error }): o catch da tela não se alcança [hipótese] (div. 640)' },
}

const REENVIAR = clicar('Reenviar o e-mail')
const comUsuario = (f: Fabricas, acao: ((p: Page) => Promise<void>) | undefined, espera: string): EstadoAuth => ({ fabricas: f, usuario: true, preparar: acao, espera })

export const ESTADOS_CONFIRM: Record<string, EstadoAuth> = {
  'AUTH-confirm': comUsuario({}, undefined, EMAIL),
  'AUTH-confirm-enviando': comUsuario({ oob: 'segurar' }, REENVIAR, 'Enviando…'),
  'AUTH-confirm-sucesso': comUsuario({}, REENVIAR, 'e-mail de confirmação enviado'),
  'AUTH-confirm-erro': comUsuario({ oob: erroGoogle('TOO_MANY_ATTEMPTS_TRY_LATER') }, REENVIAR, 'muitas tentativas'),
  'AUTH-confirm-erro-rede': comUsuario({ oob: 'abortar' }, REENVIAR, 'sem conexão — o e-mail não foi enviado'),
  'AUTH-confirm-sem-usuario': { preparar: REENVIAR, espera: 'a sessão caiu — entre de novo' },
  'AUTH-confirm-excecao': { inalcancavel: 'o contexto não lança: o catch da tela não se alcança [hipótese] (div. 640)' },
}

const JA = clicar('Já confirmei')
/**
 * O `/verify-email` recarregado SEMPRE empurra para `/login` no 1º render (o `user`
 * do provider nasce nulo e a página não espera o `isInitialized`; `verify-email/
 * page.tsx`, efeito de redirecionamento) — defeito de antes, fora do I1-D9 (div. 660).
 * Para o usuário falso chegar a ser restaurado, a navegação RSC para `/login` fica
 * segura, e a página segue na tela.
 */
const noVerify = (f: Fabricas, acao: ((p: Page) => Promise<void>) | undefined, espera: string) => comUsuario({ ...f, rscLogin: 'segurar' }, acao, espera)
export const ESTADOS_VERIFY: Record<string, EstadoAuth> = {
  'AUTH-verify-carregando': { fabricas: { rscLogin: 'segurar' }, espera: 'carregando…' },
  'AUTH-verify': noVerify({}, undefined, 'Já confirmei'),
  'AUTH-verify-checando': noVerify({}, em([async (p) => { await p.route(/accounts:lookup/, (rt) => segurar(p, rt)) }, JA]), 'Conferindo…'),
  'AUTH-verify-enviando': noVerify({ oob: 'segurar' }, REENVIAR, 'Enviando…'),
  'AUTH-verify-nao-verificado': noVerify({}, JA, 'o e-mail ainda não foi confirmado'),
  'AUTH-verify-checar-falhou': noVerify({}, em([async (p) => { await p.route(/accounts:lookup/, (rt) => rt.abort('internetdisconnected')) }, JA]), 'não foi possível conferir a confirmação'),
  'AUTH-verify-reenviar-erro': noVerify({ oob: 'abortar' }, REENVIAR, 'sem conexão — o e-mail não foi enviado'),
  'AUTH-verify-reenviar-limite': noVerify({ oob: erroGoogle('TOO_MANY_ATTEMPTS_TRY_LATER') }, REENVIAR, 'muitas tentativas'),
  'AUTH-verify-reenviar-excecao': { inalcancavel: 'o contexto não lança: o catch da tela não se alcança [hipótese] (I1-E1, div. 640)' },
  'AUTH-verify-reenviado': noVerify({}, REENVIAR, 'e-mail de confirmação enviado'),
}

const ENVIAR = clicar('Enviar o link')
const forgotPreenchido = (f: Fabricas, espera: string): EstadoAuth => ({ fabricas: f, preparar: em([async (p) => { await p.locator('#email').fill(EMAIL) }, ENVIAR]), espera })
export const ESTADOS_FORGOT: Record<string, EstadoAuth> = {
  'AUTH-forgot': { espera: 'Enviar o link' },
  'AUTH-forgot-validacao': { preparar: ENVIAR, espera: 'Enviar o link' },
  'AUTH-forgot-enviando': forgotPreenchido({ oob: 'segurar' }, 'Enviando…'),
  // só existe SEM Firebase: com ele, o envio fabricado dá sucesso e o estado sai NÃO ALCANÇADO
  'AUTH-forgot-indisponivel': forgotPreenchido({}, 'a troca de senha não está disponível'),
  'AUTH-forgot-erro': forgotPreenchido({ oob: erroGoogle('EMAIL_NOT_FOUND') }, 'não foi possível enviar o e-mail'),
  'AUTH-forgot-sucesso': forgotPreenchido({}, 'enviamos as instruções para'),
}

/**
 * `EstadoAuth` → `Estado` do medidor: cada estado mede a seção de mesmo nome na folha; o `antes` instala
 * as fábricas (SEMPRE — nenhum estado de auth deixa o SDK falar com o Google de verdade) e, se pedir,
 * entra com o usuário falso.
 */
export function paraEstados(e: Record<string, EstadoAuth>): Record<string, Estado> {
  return Object.fromEntries(Object.entries(e).map(([k, v]) => [k, {
    secao: v.semSecao ? undefined : k, preparar: v.preparar, espera: v.espera, inalcancavel: v.inalcancavel,
    antes: async (page: Page, base: URL) => {
      await fabricar(page, v.fabricas ?? {})
      if (v.usuario) await entrarComUsuarioFalso(page, base)
    },
  }]))
}
