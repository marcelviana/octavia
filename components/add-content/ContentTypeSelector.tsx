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
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {contentTypes.map((type) => {
          const IconComponent = getContentTypeIcon(type.name)
          const colors = getContentTypeColors(type.name)
          const isSelected = selectedType === type.name

          return (
            <Tooltip key={type.id}>
              <TooltipTrigger asChild>
                <Card
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    isSelected
                      ? `ring-2 ring-offset-2 ring-${colors.ring} bg-${colors.bg} border-${colors.border}`
                      : "hover:shadow-md border-gray-200"
                  }`}
                  onClick={() => onTypeChange(type.name)}
                >
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                        isSelected ? colors.iconBg : "bg-gray-100"
                      }`}
                    >
                      <IconComponent
                        className={`w-6 h-6 ${
                          isSelected ? colors.iconColor : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        isSelected ? colors.textColor : "text-gray-700"
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
  )
}