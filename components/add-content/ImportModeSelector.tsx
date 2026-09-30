"use client"

/**
 * *importar* (I1-PR-12; folha `7-upload`, `UP-como`): *Um arquivo* · *Várias músicas num arquivo*, escolhas de
 * `touch.min`. A partitura só aceita um arquivo, como antes. Os subtítulos de antes saíram (a folha não os tem).
 */
import { ContentType } from "@/types/content"
import { Escolha, Grupo } from "@/components/upload/pecas"
import { FRASES_UP, type ChaveUp } from "@/components/upload/frases-upload"

interface ImportModeSelectorProps {
  selectedImportMode: "single" | "batch"
  contentType: ContentType
  onImportModeChange: (mode: "single" | "batch") => void
}

const MODOS: readonly { id: "single" | "batch"; rotulo: ChaveUp }[] = [
  { id: "single", rotulo: "up.importar.um" },
  { id: "batch", rotulo: "up.importar.varias" },
]

export function ImportModeSelector({ selectedImportMode, contentType, onImportModeChange }: ImportModeSelectorProps) {
  const modos = contentType === ContentType.SHEET ? MODOS.filter((m) => m.id === "single") : MODOS
  return (
    <Grupo id="up-importar" rotulo={FRASES_UP["up.importar.tipo"]}>
      <div className="flex flex-wrap gap-espaco-lg">
        {modos.map((m) => (
          <Escolha key={m.id} marcada={selectedImportMode === m.id} onEscolher={() => onImportModeChange(m.id)} className="h-toque-min flex items-center px-espaco-lg text-tam-body-small">
            {FRASES_UP[m.rotulo]}
          </Escolha>
        ))}
      </div>
    </Grupo>
  )
}
