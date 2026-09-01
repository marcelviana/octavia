/**
 * B6 PR-3b — ponto ÚNICO de tradução de erro de RPC → envelope do
 * contrato (docs/ux/B6-DESENHO.md §2.2; tabela por rota).
 *
 * A tradução lê EXCLUSIVAMENTE `error.code` (SQLSTATE custom OB6xx que
 * o PostgREST propaga e o PostgrestError expõe); `error.message` vai
 * SÓ para o log — mensagem de dependência não navega ao envelope
 * (regra D6 do B3). Code fora do mapa da rota → 500 genérico: OB6xx
 * "alheio" à rota significa invariante interno quebrado, não erro do
 * cliente.
 *
 * As quatro colunas do §2.2 vivem aqui (reorder/removeSong/addSong/
 * deleteContent — a de content entrou na PR-3c); code novo = editar
 * AQUI, nunca inline na rota.
 */
import logger from './logger'
import { internalError, notFound, validationError } from './api-errors'

export type RpcRoute = 'reorder' | 'removeSong' | 'addSong' | 'deleteContent'

const MAP: Record<RpcRoute, Record<string, () => Response>> = {
  reorder: {
    // erro do cliente: array ≠ conjunto exato (falta/sobra/alheio/corrida)
    OB601: () =>
      validationError([
        {
          code: 'custom',
          path: ['order'],
          message: 'order must contain exactly the songs of the setlist',
        } as never,
      ]),
    OB602: () => notFound('Setlist not found'),
  },
  removeSong: {
    // OB602 = setlist sumiu no intervalo gate→rpc (cascade levou a song):
    // mesmo 404 de song, sem oráculo
    OB602: () => notFound('Song not found'),
    OB603: () => notFound('Song not found'),
  },
  addSong: {
    OB602: () => notFound('Setlist not found'),
  },
  deleteContent: {
    // OB604 = content sumiu no intervalo gate→rpc: mesmo 404 do gate,
    // sem oráculo (B6-D11, PR-3c)
    OB604: () => notFound('Content not found'),
  },
}

export function rpcErrorResponse(
  route: RpcRoute,
  error: { code?: string | null; message?: string | null } | null
): Response {
  // message SÓ aqui (log) — nunca no envelope
  logger.error(`RPC error (${route}):`, { code: error?.code, message: error?.message })
  // hasOwnProperty (endurecimento do checkpoint B): lookup direto
  // herdaria o prototype — um code anômalo tipo "toString" devolveria
  // FUNÇÃO herdada em vez de handler e quebraria o contrato de retorno
  const handlers = MAP[route]
  const make =
    error?.code && Object.prototype.hasOwnProperty.call(handlers, error.code)
      ? handlers[error.code]
      : undefined
  return make ? make() : internalError()
}
