"use client"

/**
 * O editor de cifra (I1-PR-11; folha 6, `EDIT-cifra`): Informações · Acordes rápidos · Seções · Prévia. O ESTADO e o
 * que cada mudança devolve são os de antes, linha a linha (o `onChange({ ...content, ...newData })` que leva a linha
 * inteira ao `content_data` é a poluição do Bloco D — `docs/ux/I1-PR11-anexos/README.md` §1.2 —, não tocada: o corpo
 * do `PUT` é gate byte a byte, `tests/gates/i1-editor-put.test.tsx`). Só o desenho mudou.
 */
import { useState } from "react"
import { Informacoes } from "@/components/editors/informacoes"
import { AcordesRapidos, PreviaDaCifra, Secoes, type Secao } from "@/components/editors/partes-da-cifra"

interface ChordEditorProps {
  content: any
  onChange: (content: any) => void
}

export function ChordEditor({ content, onChange }: ChordEditorProps) {
  const [chordData, setChordData] = useState(() => {
    // Priority 1: Use sections if available (structured format)
    if (content.sections && Array.isArray(content.sections) && content.sections.length > 0) {
      return { title: content.title || "", artist: content.artist || "", key: content.key || "", capo: content.capo || "", bpm: content.bpm || "", sections: content.sections }
    }
    // Priority 2: Convert chords string to sections (legacy format) — o nome "Content" é VALOR gravado (div. 784)
    if (content.chords && typeof content.chords === 'string' && content.chords.trim()) {
      return {
        title: content.title || "", artist: content.artist || "", key: content.key || "", capo: content.capo || "", bpm: content.bpm || "",
        sections: [{ id: Date.now(), name: "Content", chords: "", lyrics: content.chords }],
      }
    }
    // Priority 3: Empty editor for new content — o nome "Verse 1" é VALOR gravado (div. 784)
    return {
      title: content.title || "", artist: content.artist || "", key: content.key || "", capo: content.capo || "", bpm: content.bpm || "",
      sections: [{ id: Date.now(), name: "Verse 1", chords: "", lyrics: "" }],
    }
  })

  const updateChordData = (newData: any) => {
    setChordData(newData)
    onChange({ ...content, ...newData })
  }

  const addSection = () => {
    const newSection = { id: Date.now(), name: "", chords: "", lyrics: "" }
    updateChordData({ ...chordData, sections: [...chordData.sections, newSection] })
  }

  const removeSection = (sectionId: number) => {
    updateChordData({ ...chordData, sections: chordData.sections.filter((section: any) => section.id !== sectionId) })
  }

  const updateSection = (sectionId: number, field: string, value: string) => {
    updateChordData({
      ...chordData,
      sections: chordData.sections.map((section: any) => (section.id === sectionId ? { ...section, [field]: value } : section)),
    })
  }

  const [focusedSection, setFocusedSection] = useState<number | null>(null)

  const addChordToSection = (chord: string) => {
    if (focusedSection !== null) {
      const section = chordData.sections.find((s: any) => s.id === focusedSection)
      if (section) {
        const existingChords = section.chords || ""
        const newChords = existingChords ? `${existingChords} ${chord}` : chord
        updateSection(focusedSection, "chords", newChords)
      }
    }
  }

  return (
    <div className="flex flex-col gap-espaco-xl min-w-0">
      <Informacoes dados={chordData} onMudar={(campo, valor) => updateChordData({ ...chordData, [campo]: valor })} />
      <AcordesRapidos ativo={!!focusedSection} onAcorde={addChordToSection} />
      <Secoes
        secoes={chordData.sections as Secao[]}
        onAdicionar={addSection}
        onRemover={removeSection}
        onMudar={updateSection}
        onFoco={setFocusedSection}
      />
      <PreviaDaCifra dados={chordData} />
    </div>
  )
}
