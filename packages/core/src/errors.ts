/**
 * Normalização de falha da camada de rede única (PRD T1-R37; aceites A19/A3).
 * Regra do produto: **toda não-2xx aparece por default**; silenciar é opt-in
 * de quem chama. Aqui a resposta (ou o erro de transporte) vira um `AppError`
 * com uma chave de mensagem — o texto pt-BR mora na UI (T1-R36: a mensagem
 * deriva do `code`, nunca do campo `error`, que é inglês e "dado de UI").
 *
 * Envelope e taxonomia: `docs/api/CONTRATO-DE-ERRO.md` (mapeamento code↔status
 * 1:1; `code` é append-only e código desconhecido = erro genérico; corpo que
 * não parseia como envelope — 405 vazio, 404 HTML, 413 text/plain — também é
 * genérico e **sem retry**).
 */
import { retryAfterFrom } from './rate-limit'

export type AppErrorKind =
  | 'network'
  | 'auth'
  | 'rate-limited'
  | 'not-found'
  | 'validation'
  | 'server'
  | 'unknown'

export interface AppError {
  kind: AppErrorKind
  /** `code` do envelope quando houve envelope; `null` caso contrário. */
  code: string | null
  /** Segundos até a próxima tentativa (só `rate-limited`). */
  retryAfter: number | null
  /** Chave da mensagem pt-BR (o texto é da UI — PR3). */
  messageKey: string
}

export interface ErrorInput {
  status?: number
  bodyText?: string | null
  /** Mensagem do erro de transporte, quando a request nem chegou a responder. */
  networkError?: string | null
  /** Headers da resposta (só `Retry-After` é lido). */
  headers?: Record<string, string>
}

const KIND_BY_CODE: Record<string, AppErrorKind> = {
  AUTH_REQUIRED: 'auth',
  RATE_LIMITED: 'rate-limited',
  NOT_FOUND: 'not-found',
  VALIDATION_ERROR: 'validation',
  INTERNAL_ERROR: 'server',
}

const MESSAGE_KEY: Record<AppErrorKind, string> = {
  network: 'erro.sem_conexao',
  auth: 'erro.sessao_invalida',
  'rate-limited': 'erro.servidor_ocupado',
  'not-found': 'erro.nao_encontrado',
  validation: 'erro.requisicao_invalida',
  server: 'erro.falha_do_servidor',
  unknown: 'erro.desconhecido',
}

function build(kind: AppErrorKind, code: string | null, retryAfter: number | null): AppError {
  return { kind, code, retryAfter, messageKey: MESSAGE_KEY[kind] }
}

/**
 * As duas formas medidas no N0 para a MESMA condição "sem rede"
 * (`docs/native/N0-H16.md` §4): o `fetch` do RN e o `downloadFileAsync` do
 * expo-file-system. Qualquer outra mensagem de transporte também é rede — se
 * a camada de rede lançou, a request não teve resposta.
 */
function isNetwork(networkError: string): boolean {
  return networkError.trim().length > 0
}

export function errorFrom(input: ErrorInput): AppError {
  const { status, bodyText = null, networkError = null, headers = {} } = input

  if (typeof networkError === 'string' && isNetwork(networkError)) {
    return build('network', null, null)
  }

  let envelope: { code?: unknown } | null = null
  if (typeof bodyText === 'string' && bodyText.length > 0) {
    try {
      const parsed: unknown = JSON.parse(bodyText)
      if (typeof parsed === 'object' && parsed !== null) envelope = parsed as { code?: unknown }
    } catch {
      envelope = null
    }
  }

  const code = envelope !== null && typeof envelope.code === 'string' ? envelope.code : null
  if (code !== null) {
    const kind = KIND_BY_CODE[code]
    if (kind === undefined) return build('unknown', code, null) // cláusula 1: code novo = genérico
    if (kind === 'rate-limited') return build(kind, code, retryAfterFrom(headers, bodyText))
    return build(kind, code, null)
  }

  // Sem envelope: cláusula não-JSON do contrato — genérico e sem retry, salvo
  // 5xx, que é falha do servidor mesmo sem corpo.
  if (typeof status === 'number' && status >= 500) return build('server', null, null)
  return build('unknown', null, null)
}
