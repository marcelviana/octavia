"use client"

/**
 * O editor de tab (I1-PR-11; folha 6, `EDIT-tab`; decisão 7 do aval): Informações (com a Afinação) · Tablatura (cada
 * compasso num painel como a folha — contorno `line`, mono 22, `lineHeight.tab`, rola na horizontal — com as SEIS
 * cordas editáveis, uma por campo, como antes; *Duplicar* e *Remover compasso* ficam) · Prévia. O ESTADO e o que cada
 * mudança devolve são os de antes, linha a linha; a tab sem `measures` segue abrindo com o compasso-fixture (dado —
 * herança D, div. 776). As *Tablature Tips* saíram (nota da folha).
 */
import { useState, useEffect } from "react"
import { Informacoes } from "@/components/editors/informacoes"
import { CompassoDaTab, PreviaDaTab, TablaturaDaTab } from "@/components/editors/partes-da-tab"

interface TabEditorProps {
  content: any
  onChange: (content: any) => void
}

// o compasso-fixture de antes: VALOR gravado quando a tab não tem `measures` (div. 776, herança D)
const compassoFixture = () => [
  { id: 1, strings: ["E|--0--3--0--2--0--|", "B|--1--1--1--1--1--|", "G|--0--0--0--0--0--|", "D|--2--2--2--2--2--|", "A|--3-------------|", "E|----------------|"] },
]

export function TabEditor({ content, onChange }: TabEditorProps) {
  const [tabData, setTabData] = useState({
    title: content.title || "",
    artist: content.artist || "",
    tuning: content.tuning || "Standard (EADGBE)",
    capo: content.capo || "",
    bpm: content.bpm || "",
    measures: content.measures || compassoFixture(),
  })

  // Update state when content props change
  useEffect(() => {
    setTabData({
      title: content.title || "",
      artist: content.artist || "",
      tuning: content.tuning || "Standard (EADGBE)",
      capo: content.capo || "",
      bpm: content.bpm || "",
      measures: content.measures || compassoFixture(),
    })
  }, [content])

  const stringNames = ["E", "B", "G", "D", "A", "E"]

  const updateTabData = (newData: any) => {
    setTabData(newData)
    onChange({ ...content, ...newData })
  }

  const addMeasure = () => {
    const newMeasure = { id: Date.now(), strings: stringNames.map((name) => `${name}|----------------|`) }
    updateTabData({ ...tabData, measures: [...tabData.measures, newMeasure] })
  }

  const removeMeasure = (measureId: number) => {
    updateTabData({ ...tabData, measures: tabData.measures.filter((measure: any) => measure.id !== measureId) })
  }

  const updateMeasureString = (measureId: number, stringIndex: number, value: string) => {
    updateTabData({
      ...tabData,
      measures: tabData.measures.map((measure: any) =>
        measure.id === measureId
          ? { ...measure, strings: measure.strings.map((str: string, idx: number) => (idx === stringIndex ? value : str)) }
          : measure,
      ),
    })
  }

  const duplicateMeasure = (measureId: number) => {
    const measureToDuplicate = tabData.measures.find((m: any) => m.id === measureId)
    if (measureToDuplicate) {
      const newMeasure = { ...measureToDuplicate, id: Date.now() }
      const measureIndex = tabData.measures.findIndex((m: any) => m.id === measureId)
      const newMeasures = [...tabData.measures]
      newMeasures.splice(measureIndex + 1, 0, newMeasure)
      updateTabData({ ...tabData, measures: newMeasures })
    }
  }

  return (
    <div className="flex flex-col gap-espaco-xl min-w-0">
      <Informacoes dados={tabData} onMudar={(campo, valor) => updateTabData({ ...tabData, [campo]: valor })} />
      <TablaturaDaTab onAdicionar={addMeasure}>
        {tabData.measures.map((measure: any, i: number) => (
          <CompassoDaTab
            key={measure.id}
            numero={i + 1}
            cordas={measure.strings}
            podeRemover={tabData.measures.length > 1}
            onCorda={(idx, valor) => updateMeasureString(measure.id, idx, valor)}
            onDuplicar={() => duplicateMeasure(measure.id)}
            onRemover={() => removeMeasure(measure.id)}
          />
        ))}
      </TablaturaDaTab>
      <PreviaDaTab dados={tabData} />
    </div>
  )
}
