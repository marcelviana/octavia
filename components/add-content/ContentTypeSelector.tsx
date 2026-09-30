"use client"

/**
 * *tipo de conteúdo* (I1-PR-12; folha `7-upload`, `UP-como`): quatro escolhas de `touch.list` com o ícone do tipo (20,
 * do catálogo) — quatro colunas em C, 2 × 2 em B e A. Os nomes e os ícones são os da lista (I1-PR-9, `TIPOS`), na
 * ordem de antes (Letra · Cifra · Tab · Partitura). O tooltip da partitura saiu (a folha não o tem).
 */
import { ContentType } from "@/types/content"
import { Icone } from "@/components/identidade/icone"
import { Escolha, Grupo } from "@/components/upload/pecas"
import { FRASES_UP } from "@/components/upload/frases-upload"
import { tipoDe } from "@/components/library/frases-lista"

interface ContentTypeSelectorProps {
  selectedType: ContentType
  onTypeChange: (type: ContentType) => void
}

const ORDEM: readonly ContentType[] = [ContentType.LYRICS, ContentType.CHORDS, ContentType.TAB, ContentType.SHEET]

export function ContentTypeSelector({ selectedType, onTypeChange }: ContentTypeSelectorProps) {
  return (
    <Grupo id="up-tipo" rotulo={FRASES_UP["up.tipo"]}>
      <div className="grid grid-cols-2 c:grid-cols-4 gap-espaco-lg">
        {ORDEM.map((tipo) => {
          const t = tipoDe(tipo)
          return (
            <Escolha key={tipo} marcada={selectedType === tipo} onEscolher={() => onTypeChange(tipo)} className="h-toque-list flex items-center gap-espaco-md px-espaco-lg text-tam-body-small">
              <Icone nome={t.icone} tamanho={20} />
              {t.rotulo}
            </Escolha>
          )
        })}
      </div>
    </Grupo>
  )
}
