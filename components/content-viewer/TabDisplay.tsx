"use client"

interface TabDisplayProps {
  content: any
  getOrdinalSuffix: (num: number) => string
}

export function TabDisplay({ content, getOrdinalSuffix }: TabDisplayProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Tablature</h3>

      {Array.isArray(content.content_data?.tablature) ? (
        <div className="font-mono text-sm space-y-1 bg-gray-50 p-4 rounded-lg overflow-x-auto">
          {content.content_data.tablature.map(
            (line: string, index: number) => (
              <div
                key={index}
                className="whitespace-nowrap"
              >
                {line}
              </div>
            ),
          )}
        </div>
      ) : typeof content.content_data?.tablature === "string" ? (
        <div className="font-mono text-sm bg-gray-50 p-4 rounded-lg">
          {content.content_data.tablature}
        </div>
      ) : (
        <div className="font-mono text-sm space-y-1 bg-gray-50 p-4 rounded-lg">
          <div>
            E|--0----3----0----2----0---------0----3----0----2----0---------|
          </div>
          <div>
            B|----1----1----1----1----1---------1----1----1----1----1-------|
          </div>
          <div>
            G|------0----0----0----0----0---------0----0----0----0----0-----|
          </div>
          <div>
            D|--------2----2----2----2----2---------2----2----2----2----2---|
          </div>
          <div>
            A|--3---------------------------3------------------------------|
          </div>
          <div>
            E|--------------------------------------------------------------|
          </div>
        </div>
      )}

      {/* Guitar-specific info */}
      <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow">
        <div>
          <strong>Capo:</strong>{" "}
          {content.capo
            ? `${content.capo}${getOrdinalSuffix(Number(content.capo))} fret`
            : "None"}
        </div>
        <div>
          <strong>Tuning:</strong>{" "}
          {content.tuning || "Standard (EADGBE)"}
        </div>
      </div>

      {/* Chord progression if available */}
      {content.content_data?.chords && (
        <div className="space-y-3">
          <h4 className="font-semibold">
            Chord Progression
          </h4>
          <div className="flex flex-wrap gap-2">
            {content.content_data.chords.map(
              (chord: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-200 rounded-md font-mono"
                >
                  {chord}
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}