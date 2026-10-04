/**
 * O favoritar no tablet — **sem uma linha de tela** (N4-PR5; `N4-REQUISITOS.md` N4-R7, N4-R8, N4-R9).
 *
 * Fino, como o `escrita.ts` do N2: quem DECIDE é o core (`pedidoFavoritar`, `classificarFavoritar`,
 * `classificarFavoritarBarrado`); aqui só se barra, se envia, se loga e se grava. A tela da PR-7 (a linha de L) e a
 * da PR-8 (V) chamam **só** o que este módulo expõe.
 *
 * ## O que é diferente do molde do N2 (`escrita.ts`)
 *
 * - **Sem releitura** (N4-D35): o 200 traz a linha inteira, e é ela que entra no cache — o `content.json` com a linha
 *   trocada (`saveContent`, a mesma linha `cache write kind=content`), e a raiz avisada pelo `aoGravar`. Nenhum
 *   `GET`, nenhum sync. **Sem otimismo**: até a resposta, nada muda — nem o cache, nem o que a raiz mostra.
 * - **A trava é por MÚSICA** (N4-R7): enquanto uma música está em voo, só ELA é barrada (`busy`); as outras estrelas
 *   seguem ativas, e duas músicas podem voar ao mesmo tempo. A família do limite (`content-mutate`) é compartilhada:
 *   um 429 fecha o favoritar de todas, por um gate próprio (não o das setlists).
 * - **O estado em voo vive aqui, e não na tela**: é estado de MÓDULO, lido por `estadoDoFavoritar(id)` e assinado
 *   por `assinarFavoritar`. A tela que sai (V → L) só deixa de assinar; o pedido continua, e o estado final aparece
 *   onde a estrela estiver — sem aviso na volta (N4-R7, N4-D63).
 *
 * ## As linhas de log (N4-D89, `[Marcel, 2026-10-04]`)
 *
 *   write op=favorite|unfavorite content=<id8> status=<s|net> code=<CODE|net|-> ms=<ms>
 *   write blocked op=favorite|unfavorite reason=offline|ratelimit|busy
 *
 * e as que já existem: `api status=… path=/api/content …` (do `mutate`), `ratelimit … family=content-mutate` e
 * `cache write kind=content n=<n> invalidated=1`.
 */
import {
  FAMILIA_DO_FAVORITAR,
  PRAZO_DE_REDE_MS,
  classificarFavoritar,
  classificarFavoritarBarrado,
  pedidoFavoritar,
  rateLimitGate,
  type ContentDTO,
  type MotivoBarradoDoFavoritar,
  type OpDoFavoritar,
  type ResultadoDoFavoritar,
} from '@octavia/core'
import { mutate } from './api'
import { log } from './log'
import { estaOnline } from './net'
import { saveContent } from './store'

export type { ResultadoDoFavoritar } from '@octavia/core'

/**
 * De onde o favoritar lê o cache e a quem avisa que gravou. Quem liga é a raiz (`App.tsx`), uma vez por sessão:
 * `lerContent` lê o conjunto de AGORA (não uma foto do toque — outra música pode ter sido favoritada no meio), e
 * `aoGravar` recebe o conjunto novo para a raiz mostrá-lo (regra 15: a tela vence o log).
 */
export interface CacheDoFavoritar {
  uid: string
  lerContent: () => ContentDTO[]
  aoGravar: (content: ContentDTO[]) => void
}

let cache: CacheDoFavoritar | null = null

/** Liga (ou desliga, com `null`) o cache da sessão. */
export function ligarCacheDoFavoritar(c: CacheDoFavoritar | null): void {
  cache = c
}

/** O estado da estrela de uma música em voo: pondo (P-F5 *favoritando…*) ou tirando (*tirando … das favoritas…*). */
export type EstadoDoFavoritar = 'favoritando' | 'tirando'

/** `id` → o valor PEDIDO. Estado de módulo, de propósito: sobrevive à tela que o disparou. */
const emVoo = new Map<string, boolean>()

/**
 * N4-D91 — `id` → a última linha que o servidor devolveu a um favoritar nesta sessão. O sync a consulta antes de gravar
 * (`naoRegredir` do core): um sync que leu antes do `PUT` não desfaz a estrela. Não se poda: uma entrada velha nunca
 * vence (o servidor já tem `updated_at` igual ou maior), e o mapa tem no máximo uma linha por música favoritada.
 */
const confirmadas = new Map<string, ContentDTO>()

/** As linhas confirmadas pelo favoritar nesta sessão (cópia). Quem lê é o `sync.ts`. */
export function linhasConfirmadas(): ReadonlyMap<string, ContentDTO> {
  return new Map(confirmadas)
}
const ouvintes = new Set<() => void>()
let gate = rateLimitGate()

function avisar(): void {
  for (const f of [...ouvintes]) f()
}

export function estadoDoFavoritar(id: string): EstadoDoFavoritar | null {
  const valor = emVoo.get(id)
  if (valor === undefined) return null
  return valor ? 'favoritando' : 'tirando'
}

/** A tela assina para redesenhar a estrela; devolve a função que desassina (sair da tela não cancela o pedido). */
export function assinarFavoritar(f: () => void): () => void {
  ouvintes.add(f)
  return () => {
    ouvintes.delete(f)
  }
}

/** Instrumento de teste: solta o "em voo", troca o gate por um novo e esquece os ouvintes. Nenhuma UI chama. */
export function limparFavoritar(): void {
  emVoo.clear()
  ouvintes.clear()
  confirmadas.clear()
  gate = rateLimitGate()
}

function barrado(op: OpDoFavoritar, motivo: MotivoBarradoDoFavoritar, restanteS: number | null): ResultadoDoFavoritar {
  log(`write blocked op=${op} reason=${motivo}`)
  return classificarFavoritarBarrado(motivo, restanteS)
}

/**
 * Pôr (`valor = true`) ou tirar (`false`) uma música das favoritas. **Um request, sem retry** (N2-D2): "tentar de
 * novo" é a estrela tocada de novo (N4-R8).
 *
 * `prazoMs` existe para o teste medir o prazo de rede sem esperar os 20 s do de verdade; nenhuma tela o passa.
 */
export async function favoritar(
  id: string,
  valor: boolean,
  opcoes?: { prazoMs?: number },
): Promise<ResultadoDoFavoritar> {
  const pedido = pedidoFavoritar(id, valor)

  // 1. barrar — a trava desta música é conquistada ANTES do primeiro `await` (a lição do T2-R11 no `escrita.ts`:
  //    dois toques no mesmo frame não podem passar os dois).
  if (emVoo.has(id)) return barrado(pedido.op, 'busy', null)
  const agora = Date.now()
  if (!gate.canRequest(FAMILIA_DO_FAVORITAR, agora)) {
    const ate = gate.nextAllowedAt(FAMILIA_DO_FAVORITAR)
    return barrado(pedido.op, 'ratelimit', ate === null ? null : Math.max(1, Math.ceil((ate - agora) / 1000)))
  }
  if (cache === null) throw new Error('favoritar: sem cache — ligarCacheDoFavoritar não foi chamado')

  emVoo.set(id, valor)
  avisar()
  try {
    // 2. só online (N4-D23): sem rede, nenhuma request.
    if (!(await estaOnline())) return barrado(pedido.op, 'offline', null)

    // 3. enviar — um request.
    const t0 = Date.now()
    const resposta = await mutate(
      pedido.method,
      pedido.path,
      pedido.body,
      opcoes?.prazoMs ?? PRAZO_DE_REDE_MS,
      FAMILIA_DO_FAVORITAR,
    )
    const ms = Date.now() - t0
    const resultado = classificarFavoritar(id, resposta)

    // 4. logar — sempre, 2xx ou não. Uma linha de fonte só (o G3 coleta a linha de fonte que contém a chamada).
    const status = resposta.status === null ? 'net' : String(resposta.status)
    const code = resposta.status === null ? 'net' : (resultado.code ?? '-')
    log(`write op=${pedido.op} content=${pedido.content} status=${status} code=${code} ms=${ms}`)

    if (resultado.especie === 'limite') {
      gate.block(FAMILIA_DO_FAVORITAR, Date.now() + (resultado.retryAfter ?? 1) * 1000)
    }

    // 5. a linha devolvida vai ao cache — e só ela (N4-D35). A música que um sync tirou do cache enquanto o pedido
    //    voava não volta por aqui: o conjunto é o do servidor, e o próximo sync o confirma.
    if (resultado.especie === 'ok' && resultado.linha !== null && cache !== null) {
      const linha = resultado.linha
      confirmadas.set(id, linha)
      const atual = cache.lerContent()
      let trocou = 0
      const novo = atual.map((c) => {
        if (c.id !== id) return c
        trocou++
        return linha
      })
      if (trocou > 0) {
        saveContent(cache.uid, { content: novo }, { content: trocou })
        cache.aoGravar(novo)
      }
    }
    return resultado
  } finally {
    emVoo.delete(id)
    avisar()
  }
}
