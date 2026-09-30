/**
 * O servidor falso dos testes de tela das setlists (I1-PR-13): um `fetch` que responde às rotas que `/setlists` usa
 * e GUARDA cada escrita (método · caminho · corpo). Nada sai do jsdom. Os dados são os exemplos da folha
 * `8-setlists` (obra do projeto — a regra "anexo não carrega texto de música" não os alcança).
 */
import { vi } from 'vitest'

const T = '2026-09-10T15:00:00Z'
const conteudo = (id: string, title: string, artist: string | null, content_type: string) => ({
  id, user_id: 'cn-user', title, artist, album: null, genre: null, content_type, key: null, bpm: null, time_signature: null,
  difficulty: null, tags: null, notes: null, capo: null, tuning: null, file_url: null, thumbnail_url: null, content_data: null,
  is_favorite: false, is_public: false, created_at: T, updated_at: T,
})

export const CONTEUDOS = {
  garota: conteudo('c-garota', 'Garota de Ipanema', 'Tom Jobim', 'Chords'),
  construcao: conteudo('c-construcao', 'Construção', 'Chico Buarque', 'Lyrics'),
  trenzinho: conteudo('c-trenzinho', 'Trenzinho do caipira', 'Villa-Lobos', 'Tab'),
  anunciacao: conteudo('c-anunciacao', 'Anunciação', 'Alceu Valença', 'Lyrics'),
  partitura: conteudo('c-partitura', 'Partitura de 12 páginas', 'Compositor anônimo', 'Sheet'),
  asa: conteudo('c-asa', 'Asa branca', 'Luiz Gonzaga', 'Lyrics'),
  batch2: conteudo('c-batch2', 'Batch dois', null, 'Lyrics'),
  batch3: conteudo('c-batch3', 'Batch três', null, 'Chords'),
}
type Conteudo = ReturnType<typeof conteudo>
export interface Linha { id: string; position: number; notes: string | null; content: Conteudo }
export interface SetlistFalsa {
  id: string; user_id: string; name: string; description: string | null; performance_date: string | null
  venue: string | null; notes: string | null; created_at: string; updated_at: string; setlist_songs: Linha[]
}

export const setlist = (id: string, name: string, linhas: [string, Conteudo][], extra: Partial<SetlistFalsa> = {}): SetlistFalsa => ({
  id, user_id: 'cn-user', name, description: null, performance_date: null, venue: null, notes: null, created_at: T, updated_at: T,
  setlist_songs: linhas.map(([lid, c], i) => ({ id: lid, position: i + 1, notes: null, content: c })),
  ...extra,
})

/** As três da folha: *Estresse* (vazia aqui), *Show padrão* (as cinco linhas da folha), *Solo* (uma). */
export const SETLISTS_DA_FOLHA = (): SetlistFalsa[] => [
  setlist('set-estresse', 'Estresse', []),
  setlist('set-show', 'Show padrão', [
    ['linha-1', CONTEUDOS.garota], ['linha-2', CONTEUDOS.construcao], ['linha-3', CONTEUDOS.trenzinho],
    ['linha-4', CONTEUDOS.anunciacao], ['linha-5', CONTEUDOS.partitura],
  ], { description: 'show completo com bloco acústico e bloco elétrico' }),
  setlist('set-solo', 'Solo', [['linha-solo-1', CONTEUDOS.garota]]),
]

export type Resp = { status: number; corpo: unknown } | 'rede'
export interface Roteiro {
  /** o que cada `GET /api/setlists` devolve, em sequência (o último se repete): a lista, uma falha, ou nunca responde */
  listas: (SetlistFalsa[] | Resp | 'segurar')[]
  /** `GET /api/content`: as músicas (padrão: todas), o `total` (padrão: quantas vieram) ou uma falha */
  biblioteca?: { data?: Conteudo[]; total?: number; falha?: Resp }
  /** por escrita: a resposta (o padrão é o sucesso do contrato) */
  respostas?: Partial<Record<'criar' | 'salvar' | 'apagar' | 'adicionar' | 'remover', Resp[]>>
}

const json = (r: { status: number; corpo: unknown }) => new Response(JSON.stringify(r.corpo), { status: r.status, headers: { 'content-type': 'application/json' } })

/** Liga o `fetch` falso; devolve as escritas (`MÉTODO caminho corpo`) e as leituras de `/api/setlists`. */
export function servir(roteiro: Roteiro) {
  const escritas: string[] = []
  const leituras = { setlists: 0 }
  const filas = Object.fromEntries(Object.entries(roteiro.respostas ?? {}).map(([k, v]) => [k, [...(v ?? [])]])) as Record<string, Resp[]>
  let linhasCriadas = 0
  const proxima = (qual: string, padrao: { status: number; corpo: unknown }) => {
    const r = filas[qual]?.shift()
    if (r === 'rede') throw new TypeError('Failed to fetch')
    return json(r ?? padrao)
  }
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const caminho = String(url)
    const metodo = init?.method ?? 'GET'
    if (metodo !== 'GET') escritas.push(`${metodo} ${caminho}${init?.body ? ` ${String(init.body)}` : ''}`)
    if (caminho === '/api/setlists' && metodo === 'GET') {
      const l = roteiro.listas[Math.min(leituras.setlists++, roteiro.listas.length - 1)]
      if (l === 'segurar') return new Promise<Response>(() => undefined)
      if (l === 'rede') throw new TypeError('Failed to fetch')
      return json(Array.isArray(l) ? { status: 200, corpo: l } : (l as { status: number; corpo: unknown }))
    }
    if (caminho.startsWith('/api/content?') && metodo === 'GET') {
      const b = roteiro.biblioteca ?? {}
      if (b.falha === 'rede') throw new TypeError('Failed to fetch')
      if (b.falha) return json(b.falha)
      const data = b.data ?? Object.values(CONTEUDOS)
      return json({ status: 200, corpo: { data, total: b.total ?? data.length, page: 1, pageSize: 100, hasMore: false, totalPages: 1 } })
    }
    if (caminho === '/api/setlists' && metodo === 'POST') {
      const corpo = JSON.parse(String(init?.body)) as Record<string, unknown>
      return proxima('criar', { status: 201, corpo: { id: 'set-nova', user_id: 'cn-user', created_at: T, updated_at: T, ...corpo } })
    }
    const songs = /^\/api\/setlists\/([^/]+)\/songs$/.exec(caminho)
    if (songs && metodo === 'POST') {
      const corpo = JSON.parse(String(init?.body)) as { content_id: string }
      linhasCriadas++
      // o que a rota devolve (`app/api/setlists/[id]/songs/route.ts`): a linha inserida, com o id e a posição DO SERVIDOR
      return proxima('adicionar', { status: 201, corpo: { id: `linha-do-servidor-${linhasCriadas}`, setlist_id: songs[1], content_id: corpo.content_id, position: 40 + linhasCriadas, notes: null, created_at: T } })
    }
    if (/^\/api\/setlists\/songs\/[^/]+$/.test(caminho) && metodo === 'DELETE') return proxima('remover', { status: 200, corpo: { success: true } })
    const uma = /^\/api\/setlists\/([^/]+)$/.exec(caminho)
    if (uma && metodo === 'PUT') {
      const corpo = JSON.parse(String(init?.body)) as Record<string, unknown>
      return proxima('salvar', { status: 200, corpo: { id: uma[1], user_id: 'cn-user', created_at: T, updated_at: T, ...corpo } })
    }
    if (uma && metodo === 'DELETE') return proxima('apagar', { status: 200, corpo: { success: true } })
    return json({ status: 404, corpo: {} })
  }))
  return { escritas, leituras }
}

export const NAO_ENCONTRADA = { status: 404, corpo: { error: 'Setlist not found', code: 'NOT_FOUND' } }
export const erro = (status: number): Resp => ({ status, corpo: { error: 'x', code: 'X' } })
