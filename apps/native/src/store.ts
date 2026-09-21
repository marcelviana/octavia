/**
 * Cache local da tela 1 (N1-D2: JSON em `Paths.document`, sem SQLite).
 *
 * Um diretório por usuário — `Paths.document/octavia-<uid>/` (PRD §5,
 * "namespace por usuário": trocar de conta no device não mistura dados) — com
 * dois arquivos: `setlists.json` e `content.json`. `Paths.document` é o
 * armazenamento **não purgável** pelo sistema (N0-H16 §4), ao contrário do
 * `Paths.cache` que a prova do N0 usou.
 *
 * **Gravação atômica**: escreve num `.tmp` e só então renomeia sobre o
 * definitivo (`File.move`, existe no expo-file-system 57 — verificado por
 * type-check). Assim uma interrupção no meio da escrita nunca deixa um JSON
 * truncado no lugar do cache bom — é o que sustenta o A21 ("cache byte a byte
 * inalterado" quando o sync falha).
 *
 * Este módulo **não decide nada**: quem decide aplicar ou manter é o
 * `planSync` do core. Aqui só se lê e grava.
 */
import { Directory, File, Paths } from 'expo-file-system'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { log } from './log'

export interface CacheSnapshot {
  setlists: SetlistDTO[]
  content: ContentDTO[]
  /** `Date.now()` do último sync bem-sucedido; `null` se nunca sincronizou. */
  syncedAtMs: number | null
}

export interface LoadedCache extends CacheSnapshot {
  /** `true` quando os dois arquivos existiam e parsearam. */
  present: boolean
  /** Índice por `content.id`, montado uma vez no load (T1-R8). */
  contentById: Map<string, ContentDTO>
}

const VAZIO: CacheSnapshot = { setlists: [], content: [], syncedAtMs: null }

function dirDe(uid: string): Directory {
  return new Directory(Paths.document, `octavia-${uid}`)
}

/**
 * Escreve `.tmp` e renomeia por cima — nunca deixa o arquivo bom pela metade.
 *
 * `moveSync` e não `move`: no expo-file-system 57 o `move` é assíncrono
 * (`Promise<void>`), então esta função retornava ANTES de o rename acontecer
 * e a promise ficava sem dono — uma falha viraria
 * `Uncaught (in promise)` em vez de erro tratado (a forma exata do defeito foi
 * medida no `files.ts` da N1-PR5, com três gravações concorrentes).
 */
function gravarAtomico(dir: Directory, nome: string, texto: string): void {
  const tmp = new File(dir, `${nome}.tmp`)
  if (tmp.exists) tmp.delete()
  tmp.create()
  tmp.write(texto)
  const alvo = new File(dir, nome)
  if (alvo.exists) alvo.delete()
  tmp.moveSync(alvo)
}

function lerJson<T>(dir: Directory, nome: string): T | null {
  const f = new File(dir, nome)
  if (!f.exists) return null
  try {
    return JSON.parse(f.textSync()) as T
  } catch {
    // JSON corrompido conta como cache ausente: o sync seguinte reescreve.
    return null
  }
}

interface ArquivoSetlists {
  setlists: SetlistDTO[]
  syncedAtMs: number | null
}

/**
 * T1-R8 / PRD §5: a entidade local `song` guarda `content_id`, `position` e
 * `notes` — **e só**. O objeto `content` embutido na resposta de setlists é
 * descartado antes de gravar: ele é uma segunda cópia com relógio próprio
 * (editar um content não bumpa `setlists.updated_at`) e custa ~35 KB por
 * sync na conta de audit `[medido: N1-PRECHECK A3]`.
 */
function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return setlists.map((s) => ({
    ...s,
    setlist_songs: s.setlist_songs.map((song) => ({ ...song, content: null })),
  }))
}

export function load(uid: string): LoadedCache {
  const dir = dirDe(uid)
  if (!dir.exists) {
    return { ...VAZIO, present: false, contentById: new Map() }
  }
  const s = lerJson<ArquivoSetlists>(dir, 'setlists.json')
  const c = lerJson<ContentDTO[]>(dir, 'content.json')
  if (s === null || c === null) {
    return { ...VAZIO, present: false, contentById: new Map() }
  }
  const contentById = new Map(c.map((item) => [item.id, item]))
  log(`cache hit kind=setlists n=${s.setlists.length}`)
  log(`cache hit kind=content n=${c.length}`)
  return {
    setlists: s.setlists,
    content: c,
    syncedAtMs: s.syncedAtMs,
    present: true,
    contentById,
  }
}

/**
 * Quantos itens de cada conjunto tiveram o derivado invalidado nesta gravação
 * (T1-R10) — quem calcula é o sync, pelo `reconcileByUpdatedAt` do core; aqui
 * só se loga. Até a N2-PR1 as duas linhas saíam com `0` literal (div. 157).
 */
export interface Invalidated {
  setlists: number
  content: number
}

/**
 * A metade `setlists.json` da gravação — uma implementação só, usada pelos
 * dois caminhos.
 *
 * A linha de log é **byte a byte a mesma** de antes (mesmos nomes de
 * parâmetro, mesmo template): ela mudou de função e não de texto, e por isso
 * o G3 não precisa de errata. Isso é de propósito — uma segunda cópia da
 * linha seria a div. 137 outra vez, com um contrato de observabilidade tendo
 * duas implementações que podem divergir em silêncio.
 */
function gravarSetlists(dir: Directory, snapshot: CacheSnapshot, invalidated: Invalidated): void {
  const arquivoSetlists: ArquivoSetlists = {
    setlists: semEmbutido(snapshot.setlists),
    syncedAtMs: snapshot.syncedAtMs,
  }
  gravarAtomico(dir, 'setlists.json', JSON.stringify(arquivoSetlists))
  log(`cache write kind=setlists n=${snapshot.setlists.length} invalidated=${invalidated.setlists}`)
}

export function save(uid: string, snapshot: CacheSnapshot, invalidated: Invalidated): void {
  const dir = dirDe(uid)
  if (!dir.exists) dir.create({ intermediates: true })
  gravarSetlists(dir, snapshot, invalidated)
  gravarAtomico(dir, 'content.json', JSON.stringify(snapshot.content))
  log(`cache write kind=content n=${snapshot.content.length} invalidated=${invalidated.content}`)
}

/**
 * N2-D13 — a releitura da escrita grava **só o `setlists.json`**.
 *
 * O `save()` acima grava os dois arquivos juntos, e era esse o custo de
 * implementação que a opção (b) declarou (`PRD-TELA-2.md` §4.2, medido no
 * pre-check §7.2). Regravar o `content.json` inalterado a cada escrita seria
 * uma gravação atômica inteira — `.tmp`, `delete`, `moveSync` — de ~200 KB
 * por música adicionada, e o T2-R6 adiciona dez seguidas.
 *
 * O `content` do snapshot **não é lido** aqui, e o `invalidated.content`
 * tampouco: a escrita não mexe em content (N2-D1), então uma linha
 * `cache write kind=content` nesta passagem diria zero sobre uma coisa que
 * não aconteceu — e o A21 lê essas linhas.
 */
export function saveSetlists(uid: string, snapshot: CacheSnapshot, invalidated: Invalidated): void {
  const dir = dirDe(uid)
  if (!dir.exists) dir.create({ intermediates: true })
  gravarSetlists(dir, snapshot, invalidated)
}

/** Apaga o cache deste usuário (instrumento de prova; nenhuma UI chama). */
export function clear(uid: string): void {
  const dir = dirDe(uid)
  if (dir.exists) dir.delete()
}

/** Caminho do diretório — usado pelos protocolos de device (`run-as`). */
export function cacheDir(uid: string): string {
  return dirDe(uid).uri
}
