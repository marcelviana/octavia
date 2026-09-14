/**
 * Duplo de `expo-file-system` — o instrumento dos testes do W1.
 *
 * Vive **fora de `src/`** de propósito: o `g2g3.sh` varre `apps/native/src`
 * atrás de `testID=` e de linhas `log(`, e um arquivo de teste que cita
 * qualquer um dos dois falsearia o G2 e o G3. Aqui ele não é visto por
 * nenhum dos dois gates, e o Metro nunca o alcança (ninguém em `src/` o
 * importa).
 *
 * **Fidelidade que importa** — o duplo reproduz três comportamentos medidos
 * da biblioteca real, porque é contra eles que a PR existe:
 *
 * 1. **O alvo é criado e truncado ANTES do primeiro byte do corpo, e cresce
 *    em disco** (div. 113: `FileOutputStream(destination)` em
 *    `FileSystemDownload.kt:97`). Um download em voo já "existe".
 * 2. **`File.downloadFileAsync` ignora `signal` e `onProgress`** (div. 116:
 *    o progresso depende de um `downloadUUID` que o estático não passa).
 *    Só `File.createDownloadTask(...).downloadAsync()` os honra.
 * 3. **Um download que falha depois de começar deixa o parcial no destino**
 *    — é a doc da própria biblioteca (`File.ts:45-48`).
 *
 * O que ele NÃO é: um filesystem de verdade. Não há permissão, não há
 * concorrência de escrita, e `delete()` de um caminho ausente é no-op.
 */

// ------------------------------------------------------------------ disco

const arquivos = new Map<string, Uint8Array>()
const diretorios = new Set<string>()

function chave(uri: string): string {
  return uri.replace(/\/+$/, '')
}

function paiDe(uri: string): string {
  const k = chave(uri)
  return k.slice(0, k.lastIndexOf('/'))
}

function textoEmBytes(conteudo: string | Uint8Array): Uint8Array {
  if (typeof conteudo !== 'string') return Uint8Array.from(conteudo)
  const out = new Uint8Array(conteudo.length)
  for (let i = 0; i < conteudo.length; i++) out[i] = conteudo.charCodeAt(i) & 0xff
  return out
}

function bytesEmTexto(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return s
}

// ------------------------------------------------------------------- API

export class Directory {
  uri: string

  constructor(...partes: (string | File | Directory)[]) {
    this.uri = chave(
      partes
        .map((p) => (typeof p === 'string' ? p : p.uri))
        .join('/')
        .replace(/([^:])\/\/+/g, '$1/'),
    )
  }

  get exists(): boolean {
    return diretorios.has(this.uri)
  }

  get name(): string {
    return this.uri.slice(this.uri.lastIndexOf('/') + 1)
  }

  create(opcoes?: { intermediates?: boolean }): void {
    if (opcoes?.intermediates === true) {
      const partes = this.uri.split('/')
      for (let i = 4; i <= partes.length; i++) diretorios.add(partes.slice(0, i).join('/'))
      return
    }
    diretorios.add(this.uri)
  }

  delete(): void {
    for (const k of [...diretorios]) if (k === this.uri || k.startsWith(this.uri + '/')) diretorios.delete(k)
    for (const k of [...arquivos.keys()]) if (k.startsWith(this.uri + '/')) arquivos.delete(k)
  }

  list(): (Directory | File)[] {
    const out: (Directory | File)[] = []
    for (const k of arquivos.keys()) if (paiDe(k) === this.uri) out.push(new File(k))
    for (const k of diretorios) if (paiDe(k) === this.uri) out.push(new Directory(k))
    return out
  }
}

export const FileMode = {
  Read: 'r',
  ReadWrite: 'rw',
  Append: 'wa',
  Truncate: 'wt',
} as const

class FileHandle {
  offset = 0

  constructor(private readonly uri: string) {}

  get size(): number {
    return arquivos.get(this.uri)?.length ?? 0
  }

  readBytes(length: number): Uint8Array {
    const todos = arquivos.get(this.uri) ?? new Uint8Array(0)
    const pedaco = todos.slice(this.offset, this.offset + length)
    this.offset += pedaco.length
    return pedaco
  }

  close(): void {
    /* no-op */
  }
}

export class File {
  uri: string

  constructor(...partes: (string | File | Directory)[]) {
    this.uri = chave(
      partes
        .map((p) => (typeof p === 'string' ? p : p.uri))
        .join('/')
        .replace(/([^:])\/\/+/g, '$1/'),
    )
  }

  get exists(): boolean {
    return arquivos.has(this.uri)
  }

  get size(): number {
    return arquivos.get(this.uri)?.length ?? 0
  }

  get name(): string {
    return this.uri.slice(this.uri.lastIndexOf('/') + 1)
  }

  create(): void {
    if (!diretorios.has(paiDe(this.uri))) throw new Error(`fake: diretório ausente ${paiDe(this.uri)}`)
    arquivos.set(this.uri, new Uint8Array(0))
  }

  write(conteudo: string | Uint8Array): void {
    arquivos.set(this.uri, textoEmBytes(conteudo))
  }

  textSync(): string {
    const b = arquivos.get(this.uri)
    if (b === undefined) throw new Error(`fake: arquivo ausente ${this.uri}`)
    return bytesEmTexto(b)
  }

  bytesSync(): Uint8Array {
    const b = arquivos.get(this.uri)
    if (b === undefined) throw new Error(`fake: arquivo ausente ${this.uri}`)
    return b.slice()
  }

  open(): FileHandle {
    if (!arquivos.has(this.uri)) throw new Error(`fake: arquivo ausente ${this.uri}`)
    return new FileHandle(this.uri)
  }

  delete(): void {
    arquivos.delete(this.uri)
  }

  moveSync(destino: File | Directory): void {
    if (movesQuebrados.has(this.name)) throw new Error(`fake: move recusado para ${this.name}`)
    const alvo = destino instanceof Directory ? chave(`${destino.uri}/${this.name}`) : destino.uri
    const b = arquivos.get(this.uri)
    if (b === undefined) throw new Error(`fake: arquivo ausente ${this.uri}`)
    arquivos.delete(this.uri)
    arquivos.set(alvo, b)
    this.uri = alvo
  }

  static downloadFileAsync = async (
    url: string,
    destino: File | Directory,
    _opcoes?: { idempotent?: boolean; onProgress?: unknown; signal?: unknown },
  ): Promise<File> => {
    // div. 116: o estático IGNORA `signal` e `onProgress`. É por isso que o
    // teto de inatividade obriga a trocar para o `DownloadTask`.
    return baixar(url, destino, {})
  }

  static createDownloadTask(
    url: string,
    destino: File | Directory,
    opcoes?: TarefaOpcoes,
  ): { downloadAsync: () => Promise<File | null> } {
    return { downloadAsync: () => baixar(url, destino, opcoes ?? {}) }
  }
}

export const Paths = {
  document: new Directory('file:///doc'),
  cache: new Directory('file:///cache'),
}

// -------------------------------------------------------------- download

interface TarefaOpcoes {
  onProgress?: (p: { bytesWritten: number; totalBytes: number }) => void
  signal?: AbortSignal
}

/** O que o "servidor" deste teste responde para uma URL. */
export interface Resposta {
  /** Os bytes que ele REALMENTE entrega. */
  corpo: Uint8Array | string
  /** O `Content-Length` declarado. Ausente = o tamanho do corpo; `-1` = servidor calado. */
  total?: number
  /** Em quantos pedaços entrega (default 1). */
  pedacos?: number
  /** Pausa entre pedaços, em ms de relógio (fake timers avançam isto). */
  atrasoMs?: number
  /** Depois do último pedaço, o soquete fica de pé e nada mais chega. */
  morre?: boolean
  /** Não-2xx: rejeita antes de criar o arquivo, como o Kotlin (`:77`). */
  status?: number
}

const respostas = new Map<string, Resposta>()
const movesQuebrados = new Set<string>()
let emVoo = 0
let picoEmVoo = 0
let iniciados: string[] = []

export function __responder(url: string, r: Resposta): void {
  respostas.set(url, r)
}

/**
 * Faz o `moveSync` deste nome falhar — o `EXDEV`/permissão que o filesystem
 * real pode devolver, e que a N1-PR5 já viu na forma assíncrona. É o que
 * expõe a div. 115: um laço de promoção sem guarda derruba o sync inteiro.
 */
export function __quebrarMove(nome: string): void {
  movesQuebrados.add(nome)
}

export function __reset(): void {
  arquivos.clear()
  diretorios.clear()
  respostas.clear()
  movesQuebrados.clear()
  emVoo = 0
  picoEmVoo = 0
  iniciados = []
}

/** Planta bytes no disco sem passar pelo app — o `run-as` dos testes. */
export function __plantar(uri: string, conteudo: string | Uint8Array): void {
  const partes = chave(uri).split('/')
  for (let i = 4; i < partes.length; i++) diretorios.add(partes.slice(0, i).join('/'))
  arquivos.set(chave(uri), textoEmBytes(conteudo))
}

export function __existe(uri: string): boolean {
  return arquivos.has(chave(uri))
}

export function __tamanho(uri: string): number {
  return arquivos.get(chave(uri))?.length ?? 0
}

/** Todo caminho de arquivo que existe agora, ordenado. */
export function __inventario(): string[] {
  return [...arquivos.keys()].sort()
}

/** Máximo de downloads simultâneos desde o `__reset` — o invariante do T1-R13. */
export function __picoDeConcorrencia(): number {
  return picoEmVoo
}

/** Ordem em que os downloads COMEÇARAM. */
export function __iniciados(): string[] {
  return iniciados
}

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  // Sem atraso declarado não há timer: assim um download "instantâneo" assenta
  // no microtask, e o teste que não mexe no relógio não precisa mexer.
  if (ms <= 0) {
    return signal?.aborted === true ? Promise.reject(abortado()) : Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) return reject(abortado())
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', aoAbortar)
      resolve()
    }, ms)
    function aoAbortar(): void {
      clearTimeout(t)
      reject(abortado())
    }
    signal?.addEventListener('abort', aoAbortar, { once: true })
  })
}

function paraSempre(signal?: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    if (signal?.aborted === true) return reject(abortado())
    signal?.addEventListener('abort', () => reject(abortado()), { once: true })
  })
}

function abortado(): Error {
  const e = new Error('Aborted')
  e.name = 'AbortError'
  return e
}

function nomeDaUrl(url: string): string {
  const seg = url.split('/').pop()
  return seg === undefined || seg.length === 0 ? 'file' : seg
}

async function baixar(url: string, destino: File | Directory, opcoes: TarefaOpcoes): Promise<File> {
  const r = respostas.get(url) ?? { corpo: '' }
  const alvo = destino instanceof Directory ? new File(destino, nomeDaUrl(url)) : destino
  if (r.status !== undefined && r.status >= 400) {
    throw new Error(`Unable to download file from ${url}. Response status: ${r.status}`)
  }
  emVoo++
  picoEmVoo = Math.max(picoEmVoo, emVoo)
  iniciados.push(nomeDaUrl(url))
  try {
    const corpo = textoEmBytes(r.corpo)
    const total = r.total ?? corpo.length
    // div. 113 — o alvo nasce (vazio) ANTES do primeiro byte do corpo.
    arquivos.set(chave(alvo.uri), new Uint8Array(0))
    const n = Math.max(1, r.pedacos ?? 1)
    const passo = Math.ceil(corpo.length / n)
    for (let i = 0; i < corpo.length || i === 0; i += passo) {
      await esperar(r.atrasoMs ?? 0, opcoes.signal)
      const ate = Math.min(corpo.length, i + passo)
      arquivos.set(chave(alvo.uri), corpo.slice(0, ate))
      opcoes.onProgress?.({ bytesWritten: ate, totalBytes: total })
      if (ate >= corpo.length) break
    }
    if (r.morre === true) await paraSempre(opcoes.signal)
    return new File(alvo.uri)
  } finally {
    emVoo--
  }
}
