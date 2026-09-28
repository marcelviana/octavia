/**
 * Os contadores do painel (I1-PR-9; folha 4, `DASH`, README-design §2.4
 * "contador"): 4 colunas em C, 2 em B/A; `radius.control`; número em
 * `font.display` · `size.titleLarge`; rótulo `size.label` · `muted`. Na falha dos
 * números o contador é "—" (desconhecido, o critério da E15.b; `DASH-erro`) — 0
 * só quando o servidor respondeu 0 (`DASH-vazio`).
 */
import type { UserStats } from "@/components/dashboard"
import { FRASES_LISTA, type ChaveLista } from "@/components/library/frases-lista"

const CONTADORES: readonly { campo: keyof UserStats; rotulo: ChaveLista }[] = [
  { campo: "totalContent", rotulo: "dash.cont.conteudos" },
  { campo: "totalSetlists", rotulo: "dash.cont.setlists" },
  { campo: "favoriteContent", rotulo: "dash.cont.favoritas" },
  { campo: "recentlyViewed", rotulo: "dash.cont.vistas" },
]

export function ContadoresDoPainel({ stats }: { stats: UserStats | null }) {
  return (
    <div className="grid grid-cols-2 c:grid-cols-4 gap-espaco-lg">
      {CONTADORES.map((c) => (
        <div key={c.campo} className="border-hairline border-cor-line rounded-raio-control py-espaco-lg px-espaco-xl flex flex-col gap-espaco-xs">
          <span className="font-fam-display font-peso-display text-tam-title-large text-cor-text">
            {stats ? String(stats[c.campo]) : FRASES_LISTA["dash.cont.desconhecido"]}
          </span>
          <span className="text-tam-label text-cor-muted">{FRASES_LISTA[c.rotulo]}</span>
        </div>
      ))}
    </div>
  )
}
