/**
 * ActionCard Component - Reusable Composition Pattern
 * 
 * A flexible card component with consistent styling and action patterns.
 * Used across content, setlists, and other entity displays.
 */

import { memo, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface ActionCardAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
}

export interface ActionCardProps {
  title: string
  subtitle?: string
  description?: string
  badges?: Array<{
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
    className?: string
  }>
  primaryAction?: {
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    disabled?: boolean
  }
  actions?: ActionCardAction[]
  isSelected?: boolean
  onClick?: () => void
  className?: string
  children?: ReactNode
  testId?: string
}

export const ActionCard = memo(function ActionCard({
  title,
  subtitle,
  description,
  badges = [],
  primaryAction,
  actions = [],
  isSelected = false,
  onClick,
  className,
  children,
  testId = "action-card",
}: ActionCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md border",
        isSelected
          ? "border-blue-500 shadow-md bg-gradient-to-br from-blue-50 to-transparent"
          : "border-gray-200 hover:border-blue-300",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      data-testid={testId}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1 truncate">{subtitle}</p>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{description}</p>
            )}
          </div>
          
          {actions.length > 0 && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick()
                      }}
                      disabled={action.disabled}
                      className={cn(
                        action.variant === "destructive" && "text-red-600 focus:text-red-600"
                      )}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <Badge 
                  key={index}
                  variant={badge.variant || "secondary"}
                  className={cn("text-xs", badge.className)}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Custom content */}
          {children}

          {/* Primary action */}
          {primaryAction && (
            <div className="pt-2">
              <Button
                variant={primaryAction.variant || "default"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  primaryAction.onClick()
                }}
                disabled={primaryAction.disabled}
                className="w-full sm:w-auto"
              >
                {primaryAction.icon && (
                  <span className="mr-2">{primaryAction.icon}</span>
                )}
                {primaryAction.label}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})