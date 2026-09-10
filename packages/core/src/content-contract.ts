/**
 * Contrato de LEITURA de `content_data` por tipo (PRD §4 / T1-R7, pós-errata
 * N1-PR1; aceite A6). O contrato de ESCRITA equivalente vive no web
 * (`lib/content-data-contract.ts`, `docs/api/CONTENT-DATA.md`) e é
 * **duplicado de propósito** aqui (N1-D13): o core não depende do web.
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */
import type { ContentType } from './types'

/**
 * Chave que carrega o corpo de texto, por tipo. `Sheet` não tem chave
 * obrigatória (D5b do B7): o corpo dele é sempre o arquivo.
 */
export const CONTENT_DATA_KEY: Record<ContentType, string | null> = {
  Lyrics: 'lyrics',
  Chords: 'chords',
  Tab: 'tablature',
  Sheet: null,
}

export type ContentValidity =
  | { ok: true; body: 'text' | 'file' }
  | { ok: false; reason: 'no-body' | 'no-key' | 'not-string' | 'unknown-type' }

export function isValidContent(
  _type: string,
  _data: Record<string, unknown> | null,
  _fileUrl: string | null,
): ContentValidity {
  throw new Error('not implemented')
}

export function bodyOf(_type: string, _data: Record<string, unknown> | null): string | null {
  throw new Error('not implemented')
}
