/**
 * A espécie das falhas do editor (I1-PR-11; decisão 3 do aval, o molde da decisão 6 da PR-9): o `Error` de
 * `getContentById`/`updateContent` leva o `status` (aditivo, `lib/content-service.ts`); o `TypeError` do `fetch` é
 * rede. README-design §3: *Tentar de novo* só onde repetir resolve — rede e 5xx.
 */
import type { TipoDeAviso } from "@/components/identidade/linha-de-aviso"
import { FRASES_EDIT, fraseEdit } from "@/components/editors/frases-editor"

export type EspecieDaCarga = "rede" | "auth" | "limite" | "servidor" | "nao-existe"
export type EspecieDoSalvar = "rede" | "auth" | "limite" | "recusado" | "nao-existe" | "servidor"

const statusDe = (erro: unknown) => {
  const s = (erro as { status?: unknown } | null)?.status
  return typeof s === "number" ? s : null
}

/** A carga: 400 (id malformado) e 404 → não existe (decisão 3); 401/403 → auth; 429 → limite; rede; o resto → servidor. */
export function especieDaCarga(erro: unknown): EspecieDaCarga {
  const s = statusDe(erro)
  if (s === 400 || s === 404) return "nao-existe"
  if (s === 401 || s === 403) return "auth"
  if (s === 429) return "limite"
  if (s === null && erro instanceof TypeError) return "rede"
  return "servidor"
}

/** O salvar: 400 → recusado; 404 → não existe mais; 401/403 → auth; 429 → limite; rede; o resto → servidor. */
export function especieDoSalvar(erro: unknown): EspecieDoSalvar {
  const s = statusDe(erro)
  if (s === 400) return "recusado"
  if (s === 404) return "nao-existe"
  if (s === 401 || s === 403) return "auth"
  if (s === 429) return "limite"
  if (s === null && erro instanceof TypeError) return "rede"
  return "servidor"
}

export interface LinhaDaFalha { tipo: TipoDeAviso; motivo: string; tentar: boolean }

const MOTIVO: Record<Exclude<EspecieDoSalvar, "nao-existe">, { tipo: TipoDeAviso; motivo: string; tentar: boolean }> = {
  rede: { tipo: "rede", motivo: FRASES_EDIT["motivo.rede"], tentar: true },
  auth: { tipo: "falha", motivo: FRASES_EDIT["motivo.auth"], tentar: false },
  limite: { tipo: "limite", motivo: FRASES_EDIT["motivo.limite"], tentar: false },
  recusado: { tipo: "falha", motivo: FRASES_EDIT["motivo.recusado"], tentar: false },
  servidor: { tipo: "falha", motivo: FRASES_EDIT["motivo.servidor"], tentar: true },
}

/** A linha da falha da carga (o não existe não é linha: é a tela `EDIT-404`). */
export function linhaDaCarga(especie: Exclude<EspecieDaCarga, "nao-existe">): LinhaDaFalha {
  const m = MOTIVO[especie]
  return { ...m, motivo: fraseEdit("edit.erro.carregar", { motivo: m.motivo }) }
}

/** A linha da falha do salvar: o motivo da espécie (404 → *este conteúdo não existe mais*, sem ação). */
export function linhaDoSalvar(especie: EspecieDoSalvar): LinhaDaFalha {
  const m = especie === "nao-existe" ? { tipo: "falha" as const, motivo: FRASES_EDIT["edit.nao-existe-mais"], tentar: false } : MOTIVO[especie]
  return { ...m, motivo: fraseEdit("edit.erro.salvar", { motivo: m.motivo }) }
}
