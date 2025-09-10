/**
 * StatusBadge Component - Reusable Status Display Pattern
 * 
 * A consistent way to display status information across the application
 * with semantic colors and clear visual hierarchy.
 */

import { memo, ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = 
  | "success" 
  | "warning" 
  | "error" 
  | "info" 
  | "neutral"
  | "pending"
  | "active"
  | "inactive"

export interface StatusBadgeProps {
  status: StatusType
  label: string
  icon?: ReactNode
  size?: "sm" | "md" | "lg"
  className?: string
}

const statusConfig: Record<StatusType, {
  className: string
  bgColor: string
  textColor: string
  borderColor: string
}> = {
  success: {
    className: "bg-green-50 text-green-700 border-green-200",
    bgColor: "bg-green-50",
    textColor: "text-green-700", 
    borderColor: "border-green-200",
  },
  warning: {
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
  },
  error: {
    className: "bg-red-50 text-red-700 border-red-200",
    bgColor: "bg-red-50", 
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
  info: {
    className: "bg-blue-50 text-blue-700 border-blue-200",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200", 
  },
  neutral: {
    className: "bg-gray-50 text-gray-700 border-gray-200",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
  },
  pending: {
    className: "bg-orange-50 text-orange-700 border-orange-200",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700", 
    borderColor: "border-orange-200",
  },
  active: {
    className: "bg-green-50 text-green-700 border-green-200",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  inactive: {
    className: "bg-gray-50 text-gray-500 border-gray-200",
    bgColor: "bg-gray-50", 
    textColor: "text-gray-500",
    borderColor: "border-gray-200",
  },
}

const sizeClasses = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-2.5 py-1.5", 
  lg: "text-base px-3 py-2",
}

export const StatusBadge = memo(function StatusBadge({
  status,
  label,
  icon,
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        sizeClasses[size],
        "inline-flex items-center gap-1.5 font-medium border",
        className
      )}
    >
      {icon}
      {label}
    </Badge>
  )
})

// Convenience components for common status types
export const SuccessBadge = memo(function SuccessBadge({ 
  label, 
  icon, 
  size, 
  className 
}: Omit<StatusBadgeProps, "status">) {
  return (
    <StatusBadge 
      status="success" 
      label={label} 
      icon={icon} 
      size={size} 
      className={className} 
    />
  )
})

export const ErrorBadge = memo(function ErrorBadge({ 
  label, 
  icon, 
  size, 
  className 
}: Omit<StatusBadgeProps, "status">) {
  return (
    <StatusBadge 
      status="error" 
      label={label} 
      icon={icon} 
      size={size} 
      className={className} 
    />
  )
})

export const PendingBadge = memo(function PendingBadge({ 
  label, 
  icon, 
  size, 
  className 
}: Omit<StatusBadgeProps, "status">) {
  return (
    <StatusBadge 
      status="pending" 
      label={label} 
      icon={icon} 
      size={size} 
      className={className} 
    />
  )
})