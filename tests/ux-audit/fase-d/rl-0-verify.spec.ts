import { test, expect, type Page } from '@playwright/test'
import { getBearer, settle } from './recorder'

/**
 * PR-0 (fila A #0, RATE-01) — regressão QUANTITATIVA do paliativo:
 * /api/auth/verify fora do limiter antigo.
 *
 * Baseline da Fase D: limiter strict por IP (20/60s) compartilhado entre
 * verify, auth/user e storage/delete; sob navegação normal o verify
 * respondia 429 → getServerSideUser devolvia null → server component
 * executava redirect('/login') → rebote ao /dashboard (FASE-D-01, "BOUNCE";
 * 63% de 429 em 371 POSTs de sessão na fase).
 *
 * Uma verificação, na mesma moeda da medição original (parte C removida
 * na B1.0; parte A removida na B1.2b — ver notas abaixo):
 *
 *  B. Navegação: 12 navegações sequenciais por rotas autenticadas →
 *     **zero aterrissagens em /login** e **zero 429 em /api/*** (asserts).
 *     (Os POSTs internos do verify não são visíveis ao browser — o
 *     observável do mecanismo FASE-D-01 é exatamente o redirect.)
 *     G3 (B1.3): /api/auth/session ENTROU no assert — a exceção
 *     documentada morreu com o limiter único (session por uid,
 *     120/15min; a antiga janela de 5/15min por chave instável era o
 *     63%-de-429 da Fase D). A antiga exceção acumulou o dossiê de SEIS
 *     medições (9, 9, 7, 10, 9, 11 de 12 navegações com 429) que
 *     dimensionou a janela nova — e que é o CONTROLE NEGATIVO deste
 *     assert: contra o código pré-B1.3, este spec FALHA com esse padrão.
 *     PROCEDIMENTO EM CASO DE FALHA NA PARTE B: identificar a rota de
 *     origem no relatório (o assert lista método + path) ANTES de
 *     concluir regressão — um 429 novo aponta a janela da rota listada.
 *
 * PARTE A REMOVIDA NA B1.2b: o probe direto media a rota /api/auth/verify
 * sem limiter — a rota foi REMOVIDA (middleware otimista + verificação por
 * chamada direta desde a B1.1: zero consumidores). O objeto do assert
 * deixou de existir; a classe de regressão (rate limit voltando ao caminho
 * de verificação) é coberta por G1 (g1-no-self-fetch: sem hop HTTP não há
 * rota a limitar), pela parte B abaixo (429 visível em navegação) e pelo
 * G-rotas (enforcement nas páginas). Ver docs/ux/PLANO-TRANSICAO.md, B1.2b.
 *
 * PARTE C REMOVIDA NA B1.0: o controle negativo do limiter antigo usava
 * /api/auth/user (withRateLimit(handler, 2, true)), rota removida na PR
 * B1.0 (redução de superfície — era gestão de usuários Firebase sem claim
 * de admin). O limiter antigo segue vivo em outras rotas mas sem controle
 * negativo aqui; o substituto vem no B1.3 junto com o limiter único
 * (controle negativo do sistema novo, docs/ux/PLANO-TRANSICAO.md).
 * (Verificação adicional, à parte: scripts/ux-audit/probe-auth-limit.ts —
 * limite 5/15min do /api/auth/session, módulo novo, intacto.)
 *
 * RODAR COM --retries=0 (o config já define retries: 0; o flag explícito
 * blinda contra override). Este spec usa page.goto cru de propósito — NÃO
 * usa o gotoRoute do recorder, cujo retry defensivo de 75 s mascararia o
 * 429 intermitente que os asserts existem para pegar.
 *
 * Não consome orçamento do /api/auth/session: a sessão vem do storageState.
 */

const ROTAS_AUTENTICADAS = ['/dashboard', '/setlists', '/library'] as const
const NAVEGACOES = 12

test('PR-0: zero expulsões e zero 429 na navegação autenticada', async ({
  page,
}) => {
  test.setTimeout(10 * 60 * 1000)

  // ---- Preparação: sessão viva confirmada (o cookie do storageState
  // carrega idToken de 1h possivelmente vencido — AUTH-02) ----
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await settle(page, 1500)
  const token = await getBearer(page)
  expect(token, 'accessToken fresco disponível no IndexedDB').toBeTruthy()

  // (Parte A removida na B1.2b — ver cabeçalho; a rota verify não existe.)

  // ---- B. Navegação autenticada: zero /login, zero 429 visíveis ----
  // /api/auth/session fora do assert (exceção documentada no cabeçalho):
  // limiter novo, 429 pré-B1 esperado a cada page load. Logado à parte.
  // G3 (B1.3): session DENTRO do assert — sem exceções
  const api429: string[] = []
  page.on('response', (res) => {
    if (res.status() !== 429 || !res.url().includes('/api/')) return
    const path = new URL(res.url()).pathname
    api429.push(`${res.request().method()} ${path}`)
  })

  const aterrissagens: string[] = []
  for (let i = 0; i < NAVEGACOES; i++) {
    const rota = ROTAS_AUTENTICADAS[i % ROTAS_AUTENTICADAS.length] ?? '/dashboard'
    await page.goto(rota, { waitUntil: 'domcontentloaded' })
    await settle(page, 800)
    aterrissagens.push(new URL(page.url()).pathname)
  }
  console.log(`[PR-0] navegação: ${aterrissagens.join(' → ')}`)
  console.log(`[PR-0] 429 em /api/* (session INCLUSO — G3): ${api429.length ? api429.join('; ') : 'nenhum'}`)

  const expulsoes = aterrissagens.filter((p) => p.startsWith('/login'))
  expect(
    expulsoes.length,
    `zero aterrissagens em /login em ${NAVEGACOES} navegações (mecanismo FASE-D-01)`
  ).toBe(0)
  expect(
    api429.length,
    'G3: zero 429 de /api/* com session INCLUSO — se falhar, identificar a rota listada antes de concluir regressão'
  ).toBe(0)

  // (Parte C removida na B1.0; o controle negativo do sistema é o G2 —
  //  g2-limiter-unico.spec.ts, estouro deliberado com guarda anti-prod.)
})
