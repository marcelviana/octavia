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
 * Coluna da rota de content (OB604) entra na PR-3c, adicionando a
 * chave aqui — nunca inline na rota.
 */
import logger from './logger'
import { internalError, notFound, validationError } from './api-errors'

export type RpcRoute = 'reorder' | 'removeSong' | 'addSong'

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
}

export function rpcErrorResponse(
  route: RpcRoute,
  error: { code?: string | null; message?: string | null } | null
): Response {
  // message SÓ aqui (log) — nunca no envelope
  logger.error(`RPC error (${route}):`, { code: error?.code, message: error?.message })
  const make = error?.code ? MAP[route][error.code] : undefined
  return make ? make() : internalError()
}
