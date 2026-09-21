/**
 * As seis escritas de setlist: o PEDIDO e a CLASSIFICAÇÃO (N2-PR2; PRD
 * `T2-R1…R15`; contrato em `docs/api/SETLISTS.md`).
 *
 * Puro, como todo o core: **nenhuma request acontece aqui**. Este módulo
 * decide *o que* enviar e *o que significa* o que voltou; quem envia é o
 * `apps/native/src/escrita.ts`, sobre o `api.ts`.
 *
 * ## As três decisões que moram aqui
 *
 * **1. Um request por operação, e SEM RETRY de nenhum tipo** (N2-D2, N2-D18,
 * C10). Nenhuma das seis rotas é idempotente e nenhuma tem pré-condição de
 * versão: repetir um `POST` cria outra setlist ou outro bis. A única
 * repetição do app é a do T1-R3 — renovar o token uma vez e refazer uma vez —,
 * e ela é do `authFetch`, não daqui; ela é segura porque nas seis rotas o 401
 * sai **antes** de qualquer comando no banco (pre-check §7.1).
 *
 * **2. O conjunto de espécies é FECHADO em sete.** Não há "outro": um status
 * que o contrato não prevê vira `servidor` com `code: null`, e a frase é a
 * genérica (cláusula 1 do `CONTRATO-DE-ERRO.md`: código desconhecido é erro
 * genérico). Um conjunto aberto obrigaria cada tela a inventar o seu ramo.
 *
 * **3. Nenhuma escrita altera o cache** (T2-R9, N2-D13). O corpo do 2xx não é
 * aplicado — nem o do `PUT`, que pode vir com `setlist_songs: []` depois de
 * gravar (div. 178), nem os quatro que não trazem o `updated_at` novo da
 * setlist. Quem muda o cache é a releitura, e é por isso que a espécie de um
 * 2xx depende dela: `ok` quando ela voltou, `ok-nao-relido` quando não
 * (N2-D22 — nunca "salvo" limpo, nunca "falhou").
 */
import { errorFrom } from './errors'
import { frase, type ChaveDeFrase } from './frases'
import type { CamposSetlist } from './validacao'

export type Op = 'create' | 'update' | 'delete' | 'add' | 'remove' | 'reorder'

/** Um request pronto, sem a base da URL. */
export interface Pedido {
  op: Op
  method: 'POST' | 'PUT' | 'DELETE'
  path: string
  /** JSON já serializado, ou `null` nas duas rotas sem corpo. */
  body: string | null
  /** `<id8>` da setlist para o log; `-` no `create`, antes do 201 (T2-R16). */
  setlist: string
  /** Tamanho do `order` no reorder; `-` nas outras cinco (T2-R16). */
  items: string
}

/**
 * Os 8 primeiros caracteres de um uuid — regra 3 do `LOGS-OCTAVIA.md`.
 * **Nunca** o uuid inteiro: log deste projeto se cola em anexo commitado.
 */
export function id8(uuid: string | null): string {
  return uuid === null ? '-' : uuid.slice(0, 8)
}

/**
 * T2-R1/N2-D20 — criar leva **só** `name` e, quando há, `performance_date`.
 *
 * Sem `songs[]`: as músicas entram pelo picker, um request cada. Sem
 * `description`, `venue` e `notes`: ausente grava `null` (`route.ts:127-131`)
 * e o nativo não os exibe, então mandá-los seria escrever por cima do que o
 * web pôs lá.
 */
export function pedidoCriar(campos: CamposSetlist): Pedido {
  const corpo: Record<string, unknown> = { name: campos.name }
  if (campos.performance_date !== null) corpo.performance_date = campos.performance_date
  return {
    op: 'create',
    method: 'POST',
    path: '/api/setlists',
    body: JSON.stringify(corpo),
    setlist: '-',
    items: '-',
  }
}

/**
 * T2-R4 — editar leva **só os campos que mudaram** (ausente = não mexe;
 * `null` = limpa, e só a data pode ser limpa, C4). Quem decide o que mudou é
 * o `validarAtualizacao` do `validacao.ts`.
 */
export function pedidoAtualizar(setlistId: string, campos: Partial<CamposSetlist>): Pedido {
  return {
    op: 'update',
    method: 'PUT',
    path: `/api/setlists/${setlistId}`,
    body: JSON.stringify(campos),
    setlist: id8(setlistId),
    items: '-',
  }
}

/** T2-R5 — apagar não tem corpo. Já apagada em outro aparelho → 404 (N2-D12). */
export function pedidoApagar(setlistId: string): Pedido {
  return {
    op: 'delete',
    method: 'DELETE',
    path: `/api/setlists/${setlistId}`,
    body: null,
    setlist: id8(setlistId),
    items: '-',
  }
}

/**
 * T2-R6 — adicionar leva **só** `{content_id}`. A `position` não é enviada:
 * o servidor a aceita por compatibilidade e SEMPRE a recalcula para max+1
 * (B6-D3, C7), então mandá-la seria escrever um número que não vale.
 */
export function pedidoAdicionar(setlistId: string, contentId: string): Pedido {
  return {
    op: 'add',
    method: 'POST',
    path: `/api/setlists/${setlistId}/songs`,
    body: JSON.stringify({ content_id: contentId }),
    setlist: id8(setlistId),
    items: '-',
  }
}

/**
 * T2-R7 — remover é pelo **`setlist_songs.id`**, nunca pelo `content_id`.
 *
 * O que não copiar do web (div. 156): o `setlist-manager.tsx` procura por
 * `s.content.id` (`:207`) e filtra TODAS as ocorrências no estado local
 * (`:214`) — numa setlist com bis isso apaga as duas posições. No nativo todo
 * id enviado vem de uma leitura do servidor (T2-R9), nunca de um id montado
 * no cliente.
 *
 * O `setlistId` entra só para o `setlist=<id8>` do log: a rota não o leva.
 */
export function pedidoRemover(setlistId: string, songId: string): Pedido {
  return {
    op: 'remove',
    method: 'DELETE',
    path: `/api/setlists/songs/${songId}`,
    body: null,
    setlist: id8(setlistId),
    items: '-',
  }
}

/**
 * T2-R8 — **um** `PUT …/songs/order` quando o gesto termina, com a permutação
 * completa. Nunca um request por passo do arrasto.
 */
export function pedidoReordenar(setlistId: string, ordem: readonly string[]): Pedido {
  return {
    op: 'reorder',
    method: 'PUT',
    path: `/api/setlists/${setlistId}/songs/order`,
    body: JSON.stringify({ order: [...ordem] }),
    setlist: id8(setlistId),
    items: String(ordem.length),
  }
}

// ---------------------------------------------------------- classificação

/** O conjunto FECHADO. Acrescentar uma espécie é errata declarada. */
export type Especie =
  /** 2xx e a releitura do T2-R9 voltou. */
  | 'ok'
  /** 2xx e a releitura falhou — N2-D22, estado próprio. */
  | 'ok-nao-relido'
  /** 404 — T2-R10: relê e, se a setlist sumiu, sai da tela. */
  | 'sumiu'
  /** 401 — **não desloga** (N2-D9). */
  | 'auth'
  /** 429 da família `setlist-mutate`, compartilhada pelas seis rotas. */
  | 'limite'
  /** 400 e 5xx, com o `code` do contrato. */
  | 'servidor'
  /** Falha de transporte — a request não teve resposta. */
  | 'rede'

/**
 * O que voltou do transporte. Uma das duas: `status` ou `networkError`.
 * `status: null` é a forma que a camada de rede usa para "não houve
 * resposta" — aceita aqui para que quem chama não precise converter.
 */
export interface Resposta {
  status?: number | null
  bodyText?: string | null
  networkError?: string | null
  /** Só `Retry-After` é lido. */
  headers?: Record<string, string>
}

/** `null` = não houve releitura (a escrita não passou de 2xx nem de 404). */
export type Releitura = 'ok' | 'falhou' | null

/**
 * De que a frase de 404 fala. O contrato não distingue "setlist não existe"
 * de "música não existe" pelo `code` (os dois são `NOT_FOUND`) e o campo
 * `error` **não pode** ser lido (T1-R36: é inglês e dado de UI). Quem sabe é
 * a releitura: se a setlist voltou no conjunto novo, quem sumiu foi a música.
 * O default vem da operação.
 */
export type Contexto = 'setlist' | 'musica'

export interface Resultado {
  especie: Especie
  /** `null` quando foi rede. */
  status: number | null
  /** `code` do envelope, ou `null`. */
  code: string | null
  /** Segundos até a família liberar; só em `limite`, e `null` se não veio. */
  retryAfter: number | null
  /**
   * N2-D18 — a operação PODE já ter sido gravada, e a tela tem de dizer isso
   * antes de oferecer "tentar de novo".
   */
  podeTerGravado: boolean
  chave: ChaveDeFrase
  frase: string
}

/** Só `create` e `add` duplicam quando repetidos (C10, moldura N2-X-falhou). */
function duplicaSeRepetir(op: Op): boolean {
  return op === 'create' || op === 'add'
}

function chaveDaFalha(op: Op, especie: Especie, code: string | null, contexto: Contexto, prazo: number | null): ChaveDeFrase {
  switch (especie) {
    case 'rede':
      return 'rede'
    case 'auth':
      return 'auth'
    case 'limite':
      return prazo === null ? 'limite-sem-prazo' : 'limite-com-prazo'
    case 'sumiu':
      return contexto === 'musica' ? 'sumiu-musica' : 'sumiu-setlist'
    case 'servidor':
      if (code === 'INTERNAL_ERROR') return 'servidor'
      if (code === 'VALIDATION_ERROR') {
        // Três leituras do mesmo 400, e a operação é que as separa.
        if (op === 'reorder') return 'ordem-mudou' // a setlist mudou (C8; não existe 409, div. 177)
        if (op === 'create' || op === 'update') return 'nome-recusado' // o filtro de texto (div. 181)
        return 'dados-recusados'
      }
      return 'generica'
    default:
      return 'generica'
  }
}

/**
 * O que a resposta significa. **Uma função, um conjunto fechado.**
 *
 * A taxonomia de erro não é reescrita aqui: ela vem do `errorFrom` do
 * `errors.ts`, que já conhece o envelope, a cláusula não-JSON e as duas
 * fontes do prazo do 429 (header autoritativo, corpo como fallback). O que
 * este módulo acrescenta é o que é da ESCRITA — a releitura, o "pode ter
 * gravado" e a frase por operação.
 */
export function classificar(
  op: Op,
  resposta: Resposta,
  releitura: Releitura,
  contexto?: Contexto,
): Resultado {
  const { status = null, bodyText = null, networkError = null, headers = {} } = resposta
  const erro = errorFrom({ status: status ?? undefined, bodyText, networkError, headers })
  const httpOk = typeof status === 'number' && status >= 200 && status < 300

  if (networkError === null && httpOk) {
    const especie: Especie = releitura === 'falhou' ? 'ok-nao-relido' : 'ok'
    const chave: ChaveDeFrase = especie === 'ok' ? 'relendo' : 'salvo-nao-relido-s2'
    return {
      especie,
      status,
      code: null,
      retryAfter: null,
      // 2xx: o servidor CONFIRMOU. Não há dúvida a declarar.
      podeTerGravado: false,
      chave,
      frase: frase(chave),
    }
  }

  const especie: Especie =
    erro.kind === 'network'
      ? 'rede'
      : erro.kind === 'auth'
        ? 'auth'
        : erro.kind === 'rate-limited'
          ? 'limite'
          : erro.kind === 'not-found'
            ? 'sumiu'
            : 'servidor'

  const alvo: Contexto = contexto ?? (op === 'remove' ? 'musica' : 'setlist')
  const chave = chaveDaFalha(op, especie, erro.code, alvo, erro.retryAfter)
  return {
    especie,
    status: erro.kind === 'network' ? null : status,
    code: erro.code,
    retryAfter: erro.retryAfter,
    // Só a rede deixa dúvida: nos cinco não-2xx o servidor recusou antes de
    // tocar o banco (pre-check §7.1), então nada foi gravado.
    podeTerGravado: especie === 'rede' && duplicaSeRepetir(op),
    chave,
    frase: erro.retryAfter !== null && chave === 'limite-com-prazo' ? frase(chave, erro.retryAfter) : frase(chave),
  }
}
