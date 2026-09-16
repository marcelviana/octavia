/**
 * Sync de metadados: substituição sem merge, dedupe entre páginas e
 * versionamento por `updated_at` (PRD T1-R9, T1-R9b, T1-R10; aceites A7, A21,
 * A22). Puro: nenhuma request acontece aqui — quem chama traz as páginas já
 * respondidas (ou marcadas como falhas) e o conjunto anterior.
 */
import type { ContentDTO, SetlistDTO } from './types'

/** Uma página de `GET /api/content` já resolvida por quem chamou. */
export interface ContentPage {
  items: ContentDTO[]
  /** `true` = a página não voltou 2xx (ou nem chegou a responder). */
  failed: boolean
}

/**
 * Junta as páginas em um conjunto único, com dedupe por `id` — a primeira
 * ocorrência vence e a ordem de chegada é preservada (T1-R9b: uma criação no
 * web entre a página 1 e a 2 desloca a janela e pode repetir um item).
 */
export function mergePages(pages: ContentDTO[][]): { items: ContentDTO[]; duplicates: number } {
  const seen = new Set<string>()
  const items: ContentDTO[] = []
  let duplicates = 0
  for (const page of pages) {
    for (const item of page) {
      if (seen.has(item.id)) {
        duplicates++
        continue
      }
      seen.add(item.id)
      items.push(item)
    }
  }
  return { items, duplicates }
}

export interface SyncInput {
  pages: ContentPage[]
  /** 200 de `GET /api/setlists`, ou `null` se a chamada falhou. */
  setlists: SetlistDTO[] | null
  previous: { content: ContentDTO[]; setlists: SetlistDTO[] } | null
}

export interface SyncPlan {
  action: 'apply' | 'keep-previous'
  content: ContentDTO[]
  setlists: SetlistDTO[]
  /** Chave estável do motivo (não é texto de UI). */
  reason: 'ok' | 'content-page-failed' | 'setlists-missing'
}

/**
 * T1-R9: o conjunto de `content` só é substituído quando **todas** as páginas
 * chegaram; qualquer falha mantém o cache anterior **inteiro** (nunca um
 * conjunto parcial, nunca merge). Sem cache anterior, o "manter" devolve
 * conjuntos vazios — a UI mostra erro acionável (T1-R18), não empty state.
 * Em `keep-previous` os arrays devolvidos são as MESMAS referências do
 * anterior: nada é copiado, nada é reordenado (A21 "byte a byte inalterado").
 */
export function planSync(input: SyncInput): SyncPlan {
  const { pages, setlists, previous } = input
  const failed = pages.some((page) => page.failed)

  if (failed || setlists === null) {
    return {
      action: 'keep-previous',
      content: previous?.content ?? [],
      setlists: previous?.setlists ?? [],
      reason: failed ? 'content-page-failed' : 'setlists-missing',
    }
  }

  return {
    action: 'apply',
    content: mergePages(pages.map((page) => page.items)).items,
    setlists,
    reason: 'ok',
  }
}

/** O que o T1-R10 compara: content e setlist têm os dois campos. */
export interface Versioned {
  id: string
  updated_at: string
}

/**
 * T1-R10: o que mudou entre dois conjuntos. `changed` só quando o
 * `updated_at` difere — dois syncs sem mudança no servidor produzem as três
 * listas vazias (zero invalidação de índice de busca e de layout).
 */
export function diffByUpdatedAt(
  prev: Versioned[],
  next: Versioned[],
): { changed: string[]; added: string[]; removed: string[] } {
  const before = new Map(prev.map((item) => [item.id, item.updated_at]))
  const changed: string[] = []
  const added: string[] = []
  const seen = new Set<string>()

  for (const item of next) {
    seen.add(item.id)
    const previousUpdatedAt = before.get(item.id)
    if (previousUpdatedAt === undefined) added.push(item.id)
    else if (previousUpdatedAt !== item.updated_at) changed.push(item.id)
  }

  const removed = prev.filter((item) => !seen.has(item.id)).map((item) => item.id)
  return { changed, added, removed }
}

/**
 * T1-R10 no caminho do sync (N2-D8, div. 157). `invalidated` conta os itens
 * cujo derivado muda — alterados, novos e removidos; é o número da linha
 * `cache write kind=… invalidated=<n>`, que até a N2-PR1 era um `0` literal.
 *
 * Os derivados do app (índice de busca, status offline, layout) são
 * memoizados por REFERÊNCIA do conjunto. Por isso, quando nada mudou
 * (`invalidated === 0`) **e** a ordem é a mesma, `items` é o próprio `prev`:
 * "igual → não re-renderiza". Em qualquer outro caso é o `next` inteiro — a
 * substituição do T1-R9, sem merge item a item.
 *
 * O limite é o do próprio T1-R10: uma edição que não bumpa `updated_at`
 * (console/SQL) não é vista, e o conjunto anterior continua valendo.
 */
export function reconcileByUpdatedAt<T extends Versioned>(
  prev: T[],
  next: T[],
): { items: T[]; invalidated: number } {
  const { changed, added, removed } = diffByUpdatedAt(prev, next)
  const invalidated = changed.length + added.length + removed.length
  const mesmaOrdem = prev.length === next.length && prev.every((item, i) => item.id === next[i]?.id)
  return { items: invalidated === 0 && mesmaOrdem ? prev : next, invalidated }
}
