import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, MessageSquare } from "lucide-react"

interface ContentViewerSidebarProps {
  content: any
}

export function ContentViewerSidebar({ content }: ContentViewerSidebarProps) {
  return (
    <div className="w-full md:w-80 space-y-4">
      {/* Song Details */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Song Details
          </h3>
          <div className="space-y-4">
            {/* Album - Prominent First */}
            {content.album && (
              <div>
                <label className="text-xs font-medium text-gray-500 block">
                  Album
                </label>
                <p className="text-sm font-medium text-blue-800 mt-0">{content.album}</p>
              </div>
            )}

            {/* Line 1: Difficulty | Genre */}
            {(content.difficulty || content.genre) && (
              <div className="grid grid-cols-2 gap-4">
                {content.difficulty && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block">
                      Difficulty
                    </label>
                    <p className="text-sm font-medium text-blue-800 mt-0">{content.difficulty}</p>
                  </div>
                )}
                {content.genre && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block">
                      Genre
                    </label>
                    <p className="text-sm font-medium text-blue-800 mt-0">{content.genre}</p>
                  </div>
                )}
              </div>
            )}

            {/* Line 2: Key | Time Signature | Tempo */}
            {(content.key || content.time_signature || content.bpm) && (
              <div className="grid grid-cols-3 gap-4">
                {content.key && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block">
                      Key
                    </label>
                    <p className="text-sm font-medium text-blue-800 mt-0">
                      {content.key}
                    </p>
                  </div>
                )}
                {content.time_signature && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block">
                      Time Signature
                    </label>
                    <p className="text-sm font-medium text-blue-800 mt-0">
                      {content.time_signature}
                    </p>
                  </div>
                )}
                {content.bpm && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block">
                      Tempo
                    </label>
                    <p className="text-sm font-medium text-blue-800 mt-0">
                      {content.bpm} BPM
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {content.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Created/Modified dates */}
            <div className="pt-2 mt-4 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Created {new Date(content.created_at).toLocaleDateString()}</span>
                <span>Modified {new Date(content.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Notes */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-green-200">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Performance Notes
          </h3>
          {content.notes ? (
            <div className="text-center py-6 bg-green-50/50 backdrop-blur-sm border border-green-200 rounded-lg">
              <p className="p-2 text-green-800 text-sm text-left">
                {content.notes}
              </p>
            </div>
          ) : (
            <div className="text-center py-6 bg-green-50/50 backdrop-blur-sm border border-green-200 rounded-lg">
              <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                No performance notes available
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Click Edit to add notes and performance tips
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}