"use client"

/**
 * O editor de letra (I1-PR-11; folha 6, `EDIT-letra`): o bloco *Letra* com um campo de `5 × touch.min` em mono; as
 * *"Formatting tips"* de antes viram só o placeholder (`edit.letra.placeholder`, nota da folha). O estado e o que a
 * mudança devolve são os de antes (a herança D do §1.2 dos anexos, não tocada).
 */
import { useState } from "react"
import { Bloco, Campo, ENTRADA_ALTA } from "@/components/editors/campos"
import { FRASES_EDIT } from "@/components/editors/frases-editor"

interface LyricsEditorProps {
  content: any
  onChange: (content: any) => void
}

export function LyricsEditor({ content, onChange }: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState(content.lyrics || "")

  const updateLyrics = (newLyrics: string) => {
    setLyrics(newLyrics)
    onChange({ ...content, lyrics: newLyrics })
  }

  return (
    <Bloco titulo={FRASES_EDIT["edit.letra"]}>
      <Campo rotulo={FRASES_EDIT["edit.letra"]} id="letra">
        <textarea
          id="letra"
          data-testid="campo-letra"
          value={lyrics}
          onChange={(e) => updateLyrics(e.target.value)}
          placeholder={FRASES_EDIT["edit.letra.placeholder"]}
          className={`${ENTRADA_ALTA} min-h-campo-letra font-fam-mono font-peso-mono`}
        />
      </Campo>
    </Bloco>
  )
}
