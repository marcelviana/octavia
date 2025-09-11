import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentType, getContentTypeIcon, getContentTypeColors } from "@/types/content"

interface ContentTypeSelectorProps {
  contentType: ContentType
  onContentTypeChange: (type: ContentType) => void
}

export function ContentTypeSelector({ contentType, onContentTypeChange }: ContentTypeSelectorProps) {
  const contentTypes = [
    { id: "lyrics", name: ContentType.LYRICS },
    { id: "chords", name: ContentType.CHORDS },
    { id: "tabs", name: ContentType.TAB },
    {
      id: "sheet",
      name: ContentType.SHEET,
      tooltip:
        "Add Sheet Music by uploading PDF or image files. Manual creation is not available for this type.",
    },
  ]

  const getTypeClasses = (typeName: string, isSelected: boolean) => {
    const colors = getContentTypeColors(typeName)
    if (isSelected) {
      return `${colors.border} ring-2 ${colors.ring} ${colors.bg}`
    } else {
      return `border-gray-200 ${colors.hoverBg} ${colors.hoverBorder}`
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg text-gray-900">Select Content Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {contentTypes.map((type) => {
            const selected = contentType === type.name
            const Icon = getContentTypeIcon(type.name)
            const colors = getContentTypeColors(type.name)

            return (
              <Card
                key={type.id}
                onClick={() => onContentTypeChange(type.name)}
                title={type.tooltip}
                className={`cursor-pointer transition-all duration-200 ${getTypeClasses(type.name, selected)}`}
              >
                <CardContent className="p-2 text-center space-y-1">
                  <Icon className={`w-6 h-6 mx-auto ${colors.primary}`} />
                  <p className="text-sm">{type.name}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}