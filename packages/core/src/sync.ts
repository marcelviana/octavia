/**
 * Sync de metadados: substituição sem merge, dedupe entre páginas e
 * versionamento por `updated_at` (PRD T1-R9, T1-R9b, T1-R10; aceites A7, A21,
 * A22).
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */
import type { ContentDTO, SetlistDTO } from './types'

/** Uma página de `GET /api/content` já resolvida por quem chamou. */
export interface ContentPage {
  items: ContentDTO[]
  /** `true` = a página não voltou 2xx (ou nem chegou a responder). */
  failed: boolean
}

export function mergePages(_pages: ContentDTO[][]): { items: ContentDTO[]; duplicates: number } {
  throw new Error('not implemented')
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

export function planSync(_input: SyncInput): SyncPlan {
  throw new Error('not implemented')
}

export function diffByUpdatedAt(
  _prev: ContentDTO[],
  _next: ContentDTO[],
): { changed: string[]; added: string[]; removed: string[] } {
  throw new Error('not implemented')
}
