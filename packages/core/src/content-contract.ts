/**
 * Contrato de LEITURA de `content_data` por tipo (PRD §4 / T1-R7, pós-errata
 * N1-PR1; aceite A6). O contrato de ESCRITA equivalente vive no web
 * (`lib/content-data-contract.ts`, `docs/api/CONTENT-DATA.md`) e é
 * **duplicado de propósito** aqui (N1-D13): o core não depende do web.
 * Mudança de um lado é errata declarada nos dois documentos.
 *
 * Regras do PRD §4:
 * (a) chaves desconhecidas são ignoradas (`annotations`, `sections`, `file`,
 *     e a poluição do editor do web — `content_data` dentro de `content_data`);
 * (b) sem corpo E sem arquivo = estado inválido → placeholder, nunca vazio;
 * (c) chave esperada ausente (ou não-string) com `content_data` objeto = (b);
 * (d) `content_type` fora do enum = "tipo desconhecido" (o cliente não confia).
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

function isContentType(type: string): type is ContentType {
  return type === 'Lyrics' || type === 'Chords' || type === 'Tab' || type === 'Sheet'
}

function hasFile(fileUrl: string | null): boolean {
  return typeof fileUrl === 'string' && fileUrl.length > 0
}

/**
 * O item renderiza? E como — texto ou arquivo?
 *
 * Estados declarados (medidos em `N1-PRECHECK.md` §0/A3):
 * - `Chords` com `content_data` objeto SEM `chords` é `no-key` mesmo que tenha
 *   `file_url` (regra (c) é literal); são os 2 registros do anexo D5, ambos
 *   fora da conta principal.
 * - `Lyrics`/`Tab` com `content_data null` são `no-body` mesmo com `file_url`:
 *   a tabela do §4 só lhes dá corpo de texto. Estado inexistente nos dados
 *   (`file_url` null em 147/147 Lyrics e 15/15 Tab — anexo D5 query 2).
 */
export function isValidContent(
  type: string,
  data: Record<string, unknown> | null,
  fileUrl: string | null,
): ContentValidity {
  if (!isContentType(type)) return { ok: false, reason: 'unknown-type' } // (d)

  const key = CONTENT_DATA_KEY[type]

  // Sheet (D5b): sem chave de corpo — renderiza o arquivo ou nada.
  if (key === null) {
    return hasFile(fileUrl) ? { ok: true, body: 'file' } : { ok: false, reason: 'no-body' }
  }

  if (data === null) {
    // Chords com content_data null = cifra escaneada (arquivo), se houver.
    if (type === 'Chords' && hasFile(fileUrl)) return { ok: true, body: 'file' }
    return { ok: false, reason: 'no-body' } // (b)
  }

  if (!(key in data)) return { ok: false, reason: 'no-key' } // (c)
  if (typeof data[key] !== 'string') return { ok: false, reason: 'not-string' } // (c)
  return { ok: true, body: 'text' } // (a): as demais chaves não são olhadas
}

/** A string de corpo do tipo, ou `null` (Sheet, ausente ou não-string). */
export function bodyOf(type: string, data: Record<string, unknown> | null): string | null {
  if (!isContentType(type)) return null
  const key = CONTENT_DATA_KEY[type]
  if (key === null || data === null) return null
  const value = data[key]
  return typeof value === 'string' ? value : null
}
