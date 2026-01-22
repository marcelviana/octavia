"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ContentType, getContentTypeIcon, getContentTypeColors } from "@/types/content"

interface ContentTypeSelectorProps {
  selectedType: ContentType
  onTypeChange: (type: ContentType) => void
}

const contentTypes = [
  { id: "lyrics", name: ContentType.LYRICS },
  { id: "chords", name: ContentType.CHORDS },
  { id: "tabs", name: ContentType.TAB },
  {
    id: "sheet",
    name: ContentType.SHEET,
    tooltip: "Add Sheet Music by uploading PDF or image files. Manual creation is not available for this type.",
  },
]

export function ContentTypeSelector({ selectedType, onTypeChange }: ContentTypeSelectorProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Content Type</h3>
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {contentTypes.map((type) => {
            const IconComponent = getContentTypeIcon(type.name)
            const colors = getContentTypeColors(type.name)
            const isSelected = selectedType === type.name

            return (
              <Tooltip key={type.id}>
                <TooltipTrigger asChild>
                  <Card
                    className={`cursor-pointer transition-all hover:scale-102 ${
                      isSelected
                        ? `ring-2 ring-offset-1 ring-${colors.ring} bg-${colors.bg} border-${colors.border}`
                        : "hover:shadow-sm border-gray-200"
                    }`}
                    onClick={() => onTypeChange(type.name)}
                  >
                    <CardContent className="p-3 text-center">
                      <div
                        className={`w-10 h-10 mx-auto mb-1 rounded-lg flex items-center justify-center ${
                          isSelected ? colors.bg : "bg-gray-50"
                        }`}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
                            isSelected ? colors.primary : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          isSelected ? colors.primary : "text-gray-700"
                        }`}
                      >
                        {type.name}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                {type.tooltip && (
                  <TooltipContent>
                    <p className="max-w-xs">{type.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}