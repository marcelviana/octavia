/**
 * Arquivos do nativo (PRD T1-R14, T1-R26; aceites A9, A13). Renasce o
 * `files.ts` do N0-PR5 com o que aquele protocolo mediu, mais as duas coisas
 * que o N0 deixou anotadas para o N1 (`N0-H16.md` §4 e "Notas para o N1"):
 *
 * 1. **Dois armazenamentos, por durabilidade** — arquivos *garantidos* (das
 *    setlists dos próximos 7 dias, T1-R15) vivem em `Paths.document`, que o
 *    sistema **não** purga; todo o resto vive em `Paths.cache`, purgável. O
 *    N0 provou o fluxo inteiro no `Paths.cache` e registrou a dívida.
 * 2. **Diretório por `uid`** — mesmo namespace do `store.ts` (PRD §5): trocar
 *    de conta no device não mistura arquivos.
 *
 * Nome do arquivo = último segmento da URL (`<timestamp>-<nome>.pdf`, único
 * por construção do upload B6-D5′ — nota do N0). A chave é a URL inteira.
 *
 * `lastUsedMs` não existe na API do `expo-file-system` 57 (`File` expõe
 * `exists`/`size`, não mtime — medido nos `.d.ts`), então o LRU precisa de um
 * índice próprio: `files-index.json`, no diretório do usuário em
 * `Paths.document`, gravado atomicamente como o `store.ts` grava o cache. O
 * `guaranteed` **não** entra no índice: é derivado de onde o arquivo está, e
 * assim não há dois lugares para o mesmo fato divergirem.
 *
 * Sem retry: uma falha aparece (T1-R37), não é reescrita em silêncio.
 */
import { Directory, File, Paths } from 'expo-file-system'
import { log } from './log'

/** Último segmento da URL — o único pedaço que pode entrar em log (N1-D5). */
export function fileNameFromUrl(url: string): string {
  const seg = url.split('/').pop()
  return seg === undefined || seg.length === 0 ? 'file' : seg
}

/**
 * O `uid` da sessão. É estado de módulo, e não parâmetro de cada chamada,
 * porque as telas chamam `ensureFile` de dentro de efeitos que não conhecem
 * a sessão; quem sabe o `uid` é a raiz do app, e ela o define uma vez.
 */
let uidAtual: string | null = null

export function setFilesUser(uid: string | null): void {
  uidAtual = uid
}

function uid(): string {
  // Sem sessão não há diretório de usuário: chamar isto é defeito de fiação,
  // não estado esperado — falha alto em vez de gravar num namespace errado.
  if (uidAtual === null) throw new Error('files: sem uid — setFilesUser não foi chamado')
  return uidAtual
}

function dirGarantido(): Directory {
  return new Directory(Paths.document, `octavia-${uid()}`, 'files')
}

function dirDemanda(): Directory {
  return new Directory(Paths.cache, `octavia-${uid()}`, 'files')
}

function dirIndice(): Directory {
  return new Directory(Paths.document, `octavia-${uid()}`)
}

// ---------------------------------------------------------------- índice

/**
 * `url` → último uso e tamanho conhecido. O `guaranteed` **não** entra: é
 * derivado da pasta. O `bytes` entra porque o S3e precisa dizer o tamanho de
 * um arquivo que NÃO está no disco ("partitura (1,2 MB) não está neste
 * aparelho"), e nesse momento não há o que medir — só o que lembrar.
 */
type Indice = Record<string, { name: string; bytes: number; lastUsedMs: number }>

let indice: Indice | null = null
let indiceDe: string | null = null

function carregarIndice(): Indice {
  const u = uid()
  if (indice !== null && indiceDe === u) return indice
  const f = new File(dirIndice(), 'files-index.json')
  let lido: Indice = {}
  if (f.exists) {
    try {
      lido = JSON.parse(f.textSync()) as Indice
    } catch {
      // Índice corrompido = LRU sem histórico, nunca arquivo perdido: o
      // `listFiles` reconstrói as entradas a partir do disco.
      lido = {}
    }
  }
  indice = lido
  indiceDe = u
  return lido
}

/**
 * Gravação atômica do índice: `.tmp` e rename por cima.
 *
 * **`moveSync`, não `move`**: no expo-file-system 57 o `move` devolve
 * `Promise<void>`. Com três downloads concorrentes (o prefetch usa lote de 3)
 * os três `touch()` disparavam três renames assíncronos que se atropelavam —
 * um apagava o `.tmp` do outro — e a promise rejeitada aparecia na tela como
 * `Uncaught (in promise): "Call to function 'FileSystemFile.move' has been
 * rejected"` (medido no device, N1-PR5). O `moveSync` fecha a janela: a
 * função inteira roda sem ceder o event loop.
 */
function gravarIndice(): void {
  const dir = dirIndice()
  if (!dir.exists) dir.create({ intermediates: true })
  const tmp = new File(dir, 'files-index.json.tmp')
  if (tmp.exists) tmp.delete()
  tmp.create()
  tmp.write(JSON.stringify(carregarIndice()))
  const alvo = new File(dir, 'files-index.json')
  if (alvo.exists) alvo.delete()
  tmp.moveSync(alvo)
}

// ---------------------------------------------------------------- disco

function arquivoEm(dir: Directory, url: string): File {
  return new File(dir, fileNameFromUrl(url))
}

/** Onde o arquivo está agora — `null` se não está em lugar nenhum. */
function localizar(url: string): { file: File; guaranteed: boolean } | null {
  const g = arquivoEm(dirGarantido(), url)
  if (g.exists) return { file: g, guaranteed: true }
  const d = arquivoEm(dirDemanda(), url)
  if (d.exists) return { file: d, guaranteed: false }
  return null
}

export function hasFile(url: string): boolean {
  return uidAtual !== null && localizar(url) !== null
}

export interface EnsuredFile {
  uri: string
  src: 'disk' | 'download'
  bytes: number
}

/**
 * Downloads em voo, por URL. O palco pede o arquivo da música atual no mesmo
 * instante em que o prefetch sob demanda (T1-R16) pede a lista que começa
 * por ela: sem esta tabela seriam **dois** downloads do mesmo objeto — o
 * orçamento do bucket conta cada um. Com ela, uma requisição e uma linha
 * `file src=download`.
 */
const emVoo = new Map<string, Promise<EnsuredFile>>()

/**
 * Garante o arquivo no disco e devolve por onde ele veio (A9: a 2ª abertura
 * é `src=disk`, sem request). `guaranteed` decide a pasta; um arquivo que já
 * está no cache e vira garantido é **movido**, nunca rebaixado de novo.
 */
export function ensureFile(
  url: string,
  opcoes: { guaranteed: boolean } = { guaranteed: false },
): Promise<EnsuredFile> {
  const jaVoando = emVoo.get(url)
  if (jaVoando !== undefined) return jaVoando
  const voo = ensureFileUma(url, opcoes).finally(() => emVoo.delete(url))
  emVoo.set(url, voo)
  return voo
}

async function ensureFileUma(
  url: string,
  opcoes: { guaranteed: boolean },
): Promise<EnsuredFile> {
  const name = fileNameFromUrl(url)
  const alvoDir = opcoes.guaranteed ? dirGarantido() : dirDemanda()
  const atual = localizar(url)

  if (atual !== null) {
    // Promoção a garantido: move do cache purgável para o não-purgável.
    if (opcoes.guaranteed && !atual.guaranteed) {
      if (!alvoDir.exists) alvoDir.create({ intermediates: true })
      const destino = new File(alvoDir, name)
      if (destino.exists) destino.delete()
      atual.file.moveSync(destino)
    }
    const achado = localizar(url)
    const bytes = achado?.file.size ?? 0
    touch(url)
    log(`file src=disk name=${name} bytes=${bytes}`)
    return { uri: achado?.file.uri ?? '', src: 'disk', bytes }
  }

  if (!alvoDir.exists) alvoDir.create({ intermediates: true })
  // `idempotent` porque o destino pode existir meio escrito de um download
  // interrompido — no Android o corpo é gravado direto no alvo (doc do SDK).
  const out = await File.downloadFileAsync(url, new File(alvoDir, name), { idempotent: true })
  const bytes = out.size ?? 0
  touch(url)
  log(`file src=download name=${name} bytes=${bytes}`)
  return { uri: out.uri, src: 'download', bytes }
}

export interface ListedFile {
  url: string
  bytes: number
  lastUsedMs: number
  guaranteed: boolean
}

/** Só o que existe no disco AGORA — o índice é histórico, não verdade. */
export function listFiles(): ListedFile[] {
  if (uidAtual === null) return []
  const idx = carregarIndice()
  const out: ListedFile[] = []
  for (const [url, entrada] of Object.entries(idx)) {
    const achado = localizar(url)
    if (achado === null) continue
    out.push({
      url,
      bytes: achado.file.size ?? 0,
      lastUsedMs: entrada.lastUsedMs,
      guaranteed: achado.guaranteed,
    })
  }
  return out
}

/** URLs presentes — a forma que o `offlineStatus` e o `selectPrefetch` pedem. */
export function presentUrls(): Set<string> {
  return new Set(listFiles().map((f) => f.url))
}

/** Marca uso agora (entra no índice se ainda não estava). */
export function touch(url: string): void {
  if (uidAtual === null) return
  const idx = carregarIndice()
  const bytes = localizar(url)?.file.size ?? idx[url]?.bytes ?? 0
  idx[url] = { name: fileNameFromUrl(url), bytes, lastUsedMs: Date.now() }
  gravarIndice()
}

/**
 * Tamanho que este aparelho já viu para esta URL, mesmo que o arquivo tenha
 * sido despejado depois — `null` se nunca foi baixado aqui. É o "(1,2 MB)"
 * do S3e, e é a razão de o `remove` do LRU **não** apagar a entrada.
 */
export function knownBytes(url: string): number | null {
  if (uidAtual === null) return null
  const bytes = carregarIndice()[url]?.bytes
  return bytes === undefined || bytes === 0 ? null : bytes
}

/**
 * Apaga estes arquivos do DISCO (vítimas do LRU, T1-R14) e devolve quantos
 * bytes saíram. A entrada de índice fica: `listFiles` já ignora o que não
 * está no disco, e o tamanho lembrado é o que o S3e mostra depois.
 */
export function remove(urls: string[]): number {
  if (uidAtual === null || urls.length === 0) return 0
  let bytes = 0
  for (const url of urls) {
    const achado = localizar(url)
    if (achado === null) continue
    bytes += achado.file.size ?? 0
    achado.file.delete()
  }
  return bytes
}

/** Apaga TODOS os arquivos deste usuário — instrumento de prova (A13). */
export function clearFiles(): void {
  if (uidAtual === null) return
  const g = dirGarantido()
  if (g.exists) g.delete()
  const d = dirDemanda()
  if (d.exists) d.delete()
  indice = {}
  indiceDe = uidAtual
  gravarIndice()
  log('files-cleared')
}

/** Caminhos das duas pastas — usados pelos protocolos de device (`run-as`). */
export function filesDirs(): { guaranteed: string; demand: string } {
  return { guaranteed: dirGarantido().uri, demand: dirDemanda().uri }
}
