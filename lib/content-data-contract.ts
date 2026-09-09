/**
 * Contrato de ESCRITA de `content.content_data` por `content_type` (B7-PR5;
 * decisão B7-D5, forma (b) "tipado-passthrough"; docs/api/CONTENT-DATA.md).
 *
 * TS puro, sem Next e sem Zod: é chamado pelo superRefine dos schemas
 * (lib/api-schemas.ts) e pelo PUT de /api/content quando o payload traz
 * content_data sem content_type (o tipo vem da linha).
 *
 * Regras (medidas na conta principal em 2026-09-08 — docs/ux/B7-anexos/
 * D5-content_data-chaves.md):
 *  - D5c: `null`/`undefined` passa para TODO tipo ("criado sem corpo ainda").
 *  - D5b: `Sheet` não tem chave obrigatória (arquivo vive em file_url; file_url
 *    NÃO é cruzada aqui).
 *  - Objeto: a chave do tipo é obrigatória e string; chaves extras passam
 *    (o editor do web polui; o nativo ignora — PRD §4 T1-R7 (a)).
 *  - Nunca altera: passa ou falha nomeando `content_data.<chave>`.
 */
import { ContentType } from '@/types/content'

export type ContentDataKey = 'lyrics' | 'chords' | 'tablature'

export const CONTENT_DATA_KEY: Record<ContentType, ContentDataKey | null> = {
  [ContentType.LYRICS]: 'lyrics',
  [ContentType.CHORDS]: 'chords',
  [ContentType.TAB]: 'tablature',
  [ContentType.SHEET]: null,
}

export type ContentDataCheck =
  | { ok: true }
  | { ok: false; field: string; message: string }

export function checkContentData(type: ContentType, data: unknown): ContentDataCheck {
  if (data === null || data === undefined) return { ok: true } // D5c
  if (typeof data !== 'object' || Array.isArray(data)) {
    // Topo não-objeto é recusado ANTES, pelo z.record do schema (D5 do B2);
    // aqui só por robustez do chamador direto (PUT sem content_type).
    return { ok: false, field: 'content_data', message: 'deve ser objeto ou null' }
  }
  const key = CONTENT_DATA_KEY[type]
  if (key === null) return { ok: true } // D5b (Sheet)
  const value = (data as Record<string, unknown>)[key]
  if (value === undefined) {
    return { ok: false, field: `content_data.${key}`, message: `obrigatória para ${type}` }
  }
  if (typeof value !== 'string') {
    return { ok: false, field: `content_data.${key}`, message: 'deve ser string' }
  }
  return { ok: true }
}
