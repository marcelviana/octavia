/**
 * SY-PR1 — o ARNÊS dos gates do sync (i), (ii), (iv) e (v): uma raiz de mentira para o executor (`sincronizador.ts`),
 * o registro das linhas `OCTAVIA:` com o relógio, e a resposta segurada do mock. Nada aqui decide: o que roda é o
 * `rodarSync` do app, o `sincronizar` do app, a camada `api.ts` do app, contra o `aceite.py` (ou, no gate (v), contra
 * um servidor com a página de 100 do handler real).
 *
 * **A raiz** faz o que o `App.tsx` faz com o executor: guarda o que o `setDados` entrega (e quando, e com que sessão),
 * o `setSync`, o `dadosRef` que o executor atualiza à mão; o `prefetchEArrumar` é inerte (os downloads ficam à parte,
 * SY-D30 — os gates contam as linhas `api`). A sessão é a do teste (`sessaoAtual`, o contrato inerte da SY-D17).
 *
 * **O último sync que saiu à rede** (`ultimoSyncNaRede`, o contrato dos gatilhos) sai das LINHAS do app: o que emitiu
 * `sync start` e terminou em `sync ok` ou `sync fail` (`SY-PRECHECK.md` A2.4), com a falha de rede quando a linha diz
 * `code=network`. É a definição da A2.4 lida no instrumento que os aceites leem — o log.
 */
import { vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { Dados, RaizDoSync } from '../src/sincronizador'
import type { SyncNaRede } from '../src/gatilhos'
import type { SyncState } from '../src/screens/SetlistsScreen'

export const T0 = '2026-09-01T00:00:00.000+00:00'

export const SEM_DADOS: Dados = { setlists: [], content: [], contentById: new Map(), temCache: false, syncedAtMs: null }

/** Uma música da fixture — texto do projeto (regra 10). */
export function musica(i: number, extra: Partial<ContentDTO> = {}): ContentDTO {
  return {
    id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    title: `SY música ${i}`,
    artist: null,
    album: null,
    content_type: 'Lyrics',
    content_data: { lyrics: `texto do projeto SY, música ${i}\nsegunda linha da música ${i}` },
    file_url: null,
    updated_at: T0,
    is_favorite: false,
    ...extra,
  }
}

export function setlistCom(id: string, nome: string, ids: string[], updated_at = T0): SetlistDTO {
  return {
    id,
    name: nome,
    performance_date: null,
    venue: null,
    updated_at,
    setlist_songs: ids.map((cid, k) => ({
      id: `${id.slice(0, 8)}-0000-4000-8000-${String(k + 1).padStart(12, '0')}`,
      setlist_id: id,
      content_id: cid,
      position: k + 1,
      notes: null,
      content: null,
    })),
  }
}

export interface Linha {
  t: number
  l: string
}

export interface Aplicacao {
  t: number
  sessao: string | null
  dados: Dados
}

export class Arnes {
  linhas: Linha[] = []
  aplicacoes: Aplicacao[] = []
  syncs: SyncState[] = []
  sessao: string | null
  readonly dadosRef: { current: Dados } = { current: SEM_DADOS }
  readonly raiz: RaizDoSync & { sessaoAtual: () => string | null }

  constructor(readonly uid: string) {
    this.sessao = uid
    this.raiz = {
      setSync: (s) => {
        this.syncs.push(s)
      },
      // o `setDados` do React aceita o valor ou a função sobre o de agora (SY-PR2: o sync que perdeu as setlists aplica
      // pela função) — a raiz de mentira resolve a função sobre o que ela mostra AGORA, como o React faz
      setDados: (d) => {
        const dados = typeof d === 'function' ? d(this.dados) : d
        this.aplicacoes.push({ t: Date.now(), sessao: this.sessao, dados })
      },
      dadosRef: this.dadosRef,
      prefetchEArrumar: async () => undefined,
      sessaoAtual: () => this.sessao,
    }
  }

  /** O que a raiz mostra agora: a última aplicação (ou o que o teste pôs). */
  get dados(): Dados {
    return this.aplicacoes.length > 0 ? this.aplicacoes[this.aplicacoes.length - 1]!.dados : this.dadosRef.current
  }

  /** O que o `App.tsx` faz ao entrar com cache: a raiz e o `dadosRef` com estes dados. */
  comecarCom(d: Dados): void {
    this.dadosRef.current = d
    this.aplicacoes.push({ t: Date.now(), sessao: this.sessao, dados: d })
  }

  /** O que o `onAuth(null)` do `App.tsx` faz: sessão fora, a raiz vazia. */
  sair(): void {
    this.sessao = null
    this.aplicacoes.push({ t: Date.now(), sessao: null, dados: SEM_DADOS })
  }

  registrar(): void {
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      const l = a.map(String).join(' ')
      if (l.startsWith('OCTAVIA: ')) this.linhas.push({ t: Date.now(), l: l.slice('OCTAVIA: '.length) })
    })
  }

  marca(): number {
    return this.linhas.length
  }

  desde(i: number, prefixo: string): string[] {
    return this.linhas.slice(i).map((x) => x.l).filter((l) => l.startsWith(prefixo))
  }

  starts(i = 0): number {
    return this.desde(i, 'sync start').length
  }

  /** Quantos syncs estão em voo: `sync start` sem o `sync ok`/`sync fail` correspondente. */
  emVoo(): number {
    let n = 0
    for (const { l } of this.linhas) {
      if (l === 'sync start') n++
      else if (l.startsWith('sync ok') || l.startsWith('sync fail')) n--
    }
    return n
  }

  /** O máximo de syncs em voo ao mesmo tempo, a partir da linha `i`. */
  maxEmVoo(i = 0): number {
    let n = 0
    let max = 0
    for (const { l } of this.linhas.slice(i)) {
      if (l === 'sync start') max = Math.max(max, ++n)
      else if (l.startsWith('sync ok') || l.startsWith('sync fail')) n--
    }
    return max
  }

  /** A definição da A2.4, lida nas linhas: o último `sync start`, o fim dele e se a falha foi de rede. */
  ultimoSyncNaRede(): SyncNaRede | null {
    let ultimo: SyncNaRede | null = null
    for (const { t, l } of this.linhas) {
      if (l === 'sync start') ultimo = { inicioMs: t, fimMs: null, falhaDeRede: false }
      else if (ultimo !== null && ultimo.fimMs === null && (l.startsWith('sync ok') || l.startsWith('sync fail'))) {
        const inicioMs: number = ultimo.inicioMs
        ultimo = { inicioMs, fimMs: t, falhaDeRede: l.startsWith('sync fail') && l.includes('code=network') }
      }
    }
    return ultimo
  }

  /** Espera nenhum sync em voo e mais `ms` de silêncio (relógio de verdade: só o `Date` é falso nos gates). */
  async quieto(ms = 40, limite = 10_000): Promise<void> {
    const ate = performance.now() + limite
    for (;;) {
      await new Promise((r) => setTimeout(r, ms))
      if (this.emVoo() === 0) {
        const n = this.linhas.length
        await new Promise((r) => setTimeout(r, ms))
        if (this.emVoo() === 0 && this.linhas.length === n) return
      }
      if (performance.now() > ate) throw new Error(`arnês: ${this.emVoo()} sync(s) ainda em voo depois de ${limite} ms`)
    }
  }
}

/**
 * Segura a PRÓXIMA resposta de `GET /api/content` já LIDA do servidor (a foto é de agora) até `soltar()` — o que uma
 * rede lenta faz com a resposta de um servidor que leu na hora (o instrumento do `favoritar-sync.test.ts`, N4-D91).
 */
export function segurarConteudo(): { lido: Promise<void>; soltar: () => void } {
  const real = globalThis.fetch
  let marcarLido: () => void = () => undefined
  const lido = new Promise<void>((r) => (marcarLido = r))
  let soltar: () => void = () => undefined
  const entregue = new Promise<void>((r) => (soltar = r))
  let segurar = true
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const r = await real(url, init)
    if (segurar && String(url).includes('/api/content?')) {
      segurar = false
      const corpo = await r.text()
      marcarLido()
      await entregue
      return new Response(corpo, { status: r.status, headers: r.headers })
    }
    return r
  })
  return { lido, soltar }
}

/** Espera `p`, ou lança com `motivo` depois de `ms` — um caso cuja montagem não acontece vira reprovação, não espera. */
export function comPrazo<T>(p: Promise<T>, ms: number, motivo: string): Promise<T> {
  return Promise.race([p, new Promise<T>((_, erro) => setTimeout(() => erro(new Error(`${motivo} (${ms} ms)`)), ms))])
}
