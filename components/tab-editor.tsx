"use client"

/**
 * O editor de tab (I1-PR-11; folha 6, `EDIT-tab`; D-0): Informações (com a Afinação) · Tablatura · Prévia. A
 * TABLATURA é texto (D0-D6, D0-D17): um painel só, aberto com a `tablature` do content (a lista, linhas juntas por
 * `"\n"`, como o leitor do site; sem ela, vazio) e gravando a `tablature` — a chave que o site, o palco e a busca leem.
 * O editor de compassos e o compasso de exemplo saíram (D0-D7): o exemplo era GRAVADO na primeira mudança e nenhum
 * leitor lia `measures`. O `measures` já gravado não se lê nem se toca (D0-D8): viaja intacto no `content` que cada
 * mudança devolve. O que cada mudança devolve é o de antes (`{ ...content, ...tabData }` — a poluição do
 * `content_data` é Bloco D), com a `tablature` no lugar dos compassos. As *Tablature Tips* saíram (nota da folha).
 */
import { useState, useEffect } from "react"
import { Informacoes } from "@/components/editors/informacoes"
import { PreviaDaTab, TablaturaDaTab } from "@/components/editors/partes-da-tab"
import { textoDaTab } from "@/components/content/corpo-de-texto"

interface TabEditorProps {
  content: any
  onChange: (content: any) => void
}

const dadosDaTab = (content: any) => ({
  title: content.title || "",
  artist: content.artist || "",
  tuning: content.tuning || "Standard (EADGBE)",
  capo: content.capo || "",
  bpm: content.bpm || "",
})

export function TabEditor({ content, onChange }: TabEditorProps) {
  const [tabData, setTabData] = useState(() => dadosDaTab(content))

  // Update state when content props change
  useEffect(() => {
    setTabData(dadosDaTab(content))
  }, [content])

  const updateTabData = (newData: any) => {
    setTabData(newData)
    onChange({ ...content, ...newData })
  }

  return (
    <div className="flex flex-col gap-espaco-xl min-w-0">
      <Informacoes dados={tabData} onMudar={(campo, valor) => updateTabData({ ...tabData, [campo]: valor })} />
      <TablaturaDaTab
        texto={textoDaTab({ tablature: content.tablature }) ?? ""}
        onMudar={(tablature) => updateTabData({ ...tabData, tablature })}
      />
      <PreviaDaTab dados={tabData} />
    </div>
  )
}
