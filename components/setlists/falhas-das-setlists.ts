/**
 * A espécie das falhas das setlists (I1-PR-13; o molde da I1-PR-9/PR-11/PR-12): os `Error` de `lib/setlist-service.ts`
 * levam o `status` (aditivo); o `TypeError` do `fetch` e o "sem rede" do hook são rede. README-design §3: *Tentar de
 * novo* só onde repetir resolve — rede e 5xx; 401/403, 429 e o 400 não têm ação. O 404 não é frase daqui: a tela
 * fecha o que estava aberto e relê a lista (decisão 3 do aval; `SET-ja-apagada`).
 */
import type { FalhaDaTela } from "@/components/identidade/linha-da-tela"
import type { TipoDeAviso } from "@/components/identidade/linha-de-aviso"
import { FRASES_SET, fraseSet, type ChaveSet } from "@/components/setlists/frases-setlists"

export type Especie = "rede" | "auth" | "limite" | "recusado" | "servidor"

export const statusDe = (erro: unknown): number | null => {
  const s = (erro as { status?: unknown } | null)?.status
  return typeof s === "number" ? s : null
}
export const naoExiste = (erro: unknown) => statusDe(erro) === 404

export function especie(erro: unknown): Especie {
  const s = statusDe(erro)
  if (s === 400) return "recusado"
  if (s === 401 || s === 403) return "auth"
  if (s === 429) return "limite"
  if (s === null && (erro instanceof TypeError || (erro as { rede?: boolean } | null)?.rede)) return "rede"
  return "servidor"
}

const MOTIVO: Record<Especie, { tipo: TipoDeAviso; motivo: string; tentar: boolean }> = {
  rede: { tipo: "rede", motivo: FRASES_SET["motivo.rede"], tentar: true },
  auth: { tipo: "falha", motivo: FRASES_SET["motivo.auth"], tentar: false },
  limite: { tipo: "limite", motivo: FRASES_SET["motivo.limite"], tentar: false },
  recusado: { tipo: "falha", motivo: FRASES_SET["motivo.recusado"], tentar: false },
  servidor: { tipo: "falha", motivo: FRASES_SET["motivo.servidor"], tentar: true },
}

interface Opcoes { dados?: Record<string, string>; onTentar?: () => void; detalhe?: string }

/** A linha de uma falha: *não foi possível … — {motivo}*; `onTentar` só entra onde repetir resolve (e se foi dado). */
export function linhaDaFalha(chave: ChaveSet, erro: unknown, { dados = {}, onTentar, detalhe }: Opcoes = {}): FalhaDaTela {
  const m = MOTIVO[especie(erro)]
  return { tipo: m.tipo, motivo: fraseSet(chave, { ...dados, motivo: m.motivo }), detalhe, onTentar: m.tentar ? onTentar : undefined }
}
