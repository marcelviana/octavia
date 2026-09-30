/**
 * A espécie das falhas do upload (I1-PR-12; decisão 11 do aval, o molde da I1-PR-9/PR-11): o `Error` de
 * `uploadToStorage` leva `status` e `details`, o de `createContent` leva `status` (aditivos); o `TypeError` do `fetch`
 * é rede. README-design §3: *Tentar de novo* só onde repetir resolve — rede e 5xx.
 *
 * O limite (N8): quem cobra é o servidor — 400 com um `details` de `field: "size"` (`lib/api-schemas.ts`,
 * `storageSchemas.upload.size`) ou o 413 da plataforma, que vem sem JSON. O outro 400 do envio (tipo, MIME, os bytes
 * que não são o que o MIME diz) é *o servidor recusou os dados*.
 */
import type { FalhaDaTela } from "@/components/identidade/linha-da-tela"
import type { TipoDeAviso } from "@/components/identidade/linha-de-aviso"
import { FRASES_UP, LIMITE_MIB, fraseUp, type ChaveUp } from "@/components/upload/frases-upload"

export type EspecieDaEscrita = "rede" | "auth" | "limite" | "recusado" | "servidor"
export type EspecieDoEnvio = EspecieDaEscrita | "tamanho"

const statusDe = (erro: unknown) => {
  const s = (erro as { status?: unknown } | null)?.status
  return typeof s === "number" ? s : null
}
const passouDoLimite = (erro: unknown) => {
  const d = (erro as { details?: unknown } | null)?.details
  return Array.isArray(d) && d.some((x) => (x as { field?: unknown } | null)?.field === "size")
}

/** O salvar e o lote (`POST /api/content`): 400 → recusado; 401/403 → auth; 429 → limite; rede; o resto → servidor. */
export function especieDaEscrita(erro: unknown): EspecieDaEscrita {
  const s = statusDe(erro)
  if (s === 400) return "recusado"
  if (s === 401 || s === 403) return "auth"
  if (s === 429) return "limite"
  if (s === null && erro instanceof TypeError) return "rede"
  return "servidor"
}

/** O envio (`POST /api/storage/upload`): o 413 e o 400 de `field: "size"` são o limite de tamanho; o resto, como a escrita. */
export function especieDoEnvio(erro: unknown): EspecieDoEnvio {
  const s = statusDe(erro)
  if (s === 413 || (s === 400 && passouDoLimite(erro))) return "tamanho"
  return especieDaEscrita(erro)
}

const MOTIVO: Record<EspecieDaEscrita, { tipo: TipoDeAviso; motivo: string; tentar: boolean }> = {
  rede: { tipo: "rede", motivo: FRASES_UP["motivo.rede"], tentar: true },
  auth: { tipo: "falha", motivo: FRASES_UP["motivo.auth"], tentar: false },
  limite: { tipo: "limite", motivo: FRASES_UP["motivo.limite"], tentar: false },
  recusado: { tipo: "falha", motivo: FRASES_UP["motivo.recusado"], tentar: false },
  servidor: { tipo: "falha", motivo: FRASES_UP["motivo.servidor"], tentar: true },
}

/** A linha da falha de uma escrita: *não foi possível … — {motivo}*; `onTentar` só entra onde repetir resolve. */
export function linhaDaEscrita(chave: ChaveUp, erro: unknown, onTentar: () => void, detalhe?: string): FalhaDaTela {
  const m = MOTIVO[especieDaEscrita(erro)]
  return { tipo: m.tipo, motivo: fraseUp(chave, { motivo: m.motivo }), detalhe, onTentar: m.tentar ? onTentar : undefined }
}

/** A linha da falha do envio: o limite (N8, sem ação) ou *o arquivo não foi enviado — {motivo}*. */
export function linhaDoEnvio(erro: unknown, onTentar: () => void): FalhaDaTela {
  if (especieDoEnvio(erro) === "tamanho") return { tipo: "falha", motivo: fraseUp("up.limite", { n: LIMITE_MIB }) }
  return linhaDaEscrita("up.erro.envio", erro, onTentar)
}
