"use client"

interface ChordDisplayProps {
  content: any
}

export function ChordDisplay({ content }: ChordDisplayProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Chord Chart</h3>

      {/* Chord diagrams */}
      {Array.isArray(content.content_data?.chords) ? (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
          {content.content_data.chords.map(
            (chord: any, index: number) => (
              <div
                key={index}
                className="text-center p-4 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl shadow"
              >
                <div className="text-xl font-bold mb-3">
                  {chord.name || chord}
                </div>
                {Array.isArray(chord.diagram) ? (
                  <div className="text-xs font-mono space-y-1">
                    {chord.diagram.map(
                      (line: string, lineIndex: number) => (
                        <div key={lineIndex}>
                          {line}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-mono space-y-1">
                    <div>●○○○○○</div>
                    <div>●●●●●●</div>
                    <div>○●○○●○</div>
                    <div>○○●●○○</div>
                  </div>
                )}
                {chord.fingering && (
                  <div className="text-xs mt-2 text-gray-600">
                    {chord.fingering}
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      ) : typeof content.content_data?.chords === "string" ? (
        <div className="font-mono text-sm bg-gray-50 p-4 rounded-lg">
          {content.content_data.chords}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
          {["Am", "F", "C", "G"].map((chord) => (
            <div
              key={chord}
              className="text-center p-4 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl shadow"
            >
              <div className="text-xl font-bold mb-3">
                {chord}
              </div>
              <div className="text-xs font-mono space-y-1">
                <div>●○○○○○</div>
                <div>●●●●●●</div>
                <div>○●○○●○</div>
                <div>○○●●○○</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Song structure */}
      {content.content_data?.progression && (
        <div className="space-y-3 p-4 bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl shadow">
          <h4 className="font-semibold">Song Structure</h4>
          <div className="space-y-2 text-sm">
            {Object.entries(content.content_data.progression).map(
              ([section, chords]: [string, any]) => (
                <div key={section} className="flex">
                  <span className="font-medium w-20">
                    {section}:
                  </span>
                  <span className="font-mono">
                    {Array.isArray(chords)
                      ? chords.join(" - ")
                      : chords}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}