"use client"

/**
 * *como você quer adicionar?* (I1-PR-12; folha `7-upload`, `UP-como`): dois cartões de escolha — o título em
 * `size.button` `uiBold`, o apoio em `size.label` `muted`; duas colunas em C, uma em B e A. As descrições longas de
 * antes viraram o apoio de uma linha (nota da folha).
 */
import { Escolha, Grupo } from "@/components/upload/pecas"
import { FRASES_UP, type ChaveUp } from "@/components/upload/frases-upload"

interface ModeSelectorProps {
  selectedMode: "create" | "import"
  onModeChange: (mode: "create" | "import") => void
}

const MODOS: readonly { id: "create" | "import"; titulo: ChaveUp; apoio: ChaveUp }[] = [
  { id: "create", titulo: "up.criar", apoio: "up.criar.apoio" },
  { id: "import", titulo: "up.importar", apoio: "up.importar.apoio" },
]

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <Grupo id="up-como" rotulo={FRASES_UP["up.como"]}>
      <div className="grid grid-cols-1 c:grid-cols-2 gap-espaco-lg">
        {MODOS.map((m) => (
          <Escolha key={m.id} marcada={selectedMode === m.id} onEscolher={() => onModeChange(m.id)} className="py-espaco-lg px-espaco-xl flex flex-col gap-espaco-xs">
            <span className="text-tam-button font-fam-ui-bold font-peso-ui-bold">{FRASES_UP[m.titulo]}</span>
            <span className="text-tam-label text-cor-muted">{FRASES_UP[m.apoio]}</span>
          </Escolha>
        ))}
      </div>
    </Grupo>
  )
}
