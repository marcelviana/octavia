"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Copy } from "lucide-react"

interface TabEditorProps {
  content: any
  onChange: (content: any) => void
}

export function TabEditor({ content, onChange }: TabEditorProps) {
  const [tabData, setTabData] = useState({
    title: content.title || "",
    artist: content.artist || "",
    tuning: content.tuning || "Standard (EADGBE)",
    capo: content.capo || "",
    bpm: content.bpm || "",
    measures: content.measures || [
      {
        id: 1,
        strings: [
          "E|--0--3--0--2--0--|",
          "B|--1--1--1--1--1--|",
          "G|--0--0--0--0--0--|",
          "D|--2--2--2--2--2--|",
          "A|--3-------------|",
          "E|----------------|",
        ],
      },
    ],
  })

  const stringNames = ["E", "B", "G", "D", "A", "E"]

  const updateTabData = (newData: any) => {
    setTabData(newData)
    onChange({ ...content, ...newData })
  }

  const addMeasure = () => {
    const newMeasure = {
      id: Date.now(),
      strings: stringNames.map((name) => `${name}|----------------|`),
    }
    updateTabData({
      ...tabData,
      measures: [...tabData.measures, newMeasure],
    })
  }

  const removeMeasure = (measureId: number) => {
    updateTabData({
      ...tabData,
      measures: tabData.measures.filter((measure: any) => measure.id !== measureId),
    })
  }

  const updateMeasureString = (measureId: number, stringIndex: number, value: string) => {
    updateTabData({
      ...tabData,
      measures: tabData.measures.map((measure: any) =>
        measure.id === measureId
          ? {
              ...measure,
              strings: measure.strings.map((str: string, idx: number) => (idx === stringIndex ? value : str)),
            }
          : measure,
      ),
    })
  }

  const duplicateMeasure = (measureId: number) => {
    const measureToDuplicate = tabData.measures.find((m: any) => m.id === measureId)
    if (measureToDuplicate) {
      const newMeasure = {
        ...measureToDuplicate,
        id: Date.now(),
      }
      const measureIndex = tabData.measures.findIndex((m: any) => m.id === measureId)
      const newMeasures = [...tabData.measures]
      newMeasures.splice(measureIndex + 1, 0, newMeasure)
      updateTabData({
        ...tabData,
        measures: newMeasures,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tab Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={tabData.title}
                onChange={(e) => updateTabData({ ...tabData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                value={tabData.artist}
                onChange={(e) => updateTabData({ ...tabData, artist: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tuning">Tuning</Label>
              <Select value={tabData.tuning} onValueChange={(value) => updateTabData({ ...tabData, tuning: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard (EADGBE)">Standard (EADGBE)</SelectItem>
                  <SelectItem value="Drop D (DADGBE)">Drop D (DADGBE)</SelectItem>
                  <SelectItem value="Open G (DGDGBD)">Open G (DGDGBD)</SelectItem>
                  <SelectItem value="DADGAD">DADGAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="capo">Capo</Label>
              <Input
                id="capo"
                value={tabData.capo}
                onChange={(e) => updateTabData({ ...tabData, capo: e.target.value })}
                placeholder="Fret"
              />
            </div>
            <div>
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={tabData.bpm}
                onChange={(e) => updateTabData({ ...tabData, bpm: e.target.value })}
                placeholder="120"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tablature</CardTitle>
            <Button onClick={addMeasure}>
              <Plus className="w-4 h-4 mr-2" />
              Add Measure
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {tabData.measures.map((measure: any, measureIndex: number) => (
            <Card key={measure.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Measure {measureIndex + 1}</h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => duplicateMeasure(measure.id)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    {tabData.measures.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeMeasure(measure.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {measure.strings.map((string: string, stringIndex: number) => (
                    <Input
                      key={stringIndex}
                      value={string}
                      onChange={(e) => updateMeasureString(measure.id, stringIndex, e.target.value)}
                      className="font-mono text-sm"
                      placeholder={`${stringNames[stringIndex]}|`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Tab Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tablature Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Notation</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Numbers = fret positions</li>
                <li>• Dashes (-) = empty beats</li>
                <li>• Vertical alignment = simultaneous notes</li>
                <li>• | = measure separators</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Techniques</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• h = hammer-on</li>
                <li>• p = pull-off</li>
                <li>• b = bend</li>
                <li>• ~ = vibrato</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-[#F2EDE5] p-6 border rounded-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{tabData.title || "Untitled"}</h2>
              <p className="text-lg text-gray-600">{tabData.artist || "Unknown Artist"}</p>
              <div className="flex justify-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Tuning: {tabData.tuning}</span>
                {tabData.capo && <span>Capo: {tabData.capo}</span>}
                {tabData.bpm && <span>BPM: {tabData.bpm}</span>}
              </div>
            </div>

            <div className="space-y-6">
              {tabData.measures.map((measure: any, index: number) => (
                <div key={measure.id} className="font-mono text-sm">
                  <p className="text-xs text-gray-500 mb-1">Measure {index + 1}</p>
                  {measure.strings.map((string: string, stringIndex: number) => (
                    <div key={stringIndex}>{string}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
