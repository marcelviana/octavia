/**
 * Common Components - Reusable Composition Patterns
 * 
 * Barrel export for all common, reusable components that establish
 * consistent patterns across the Octavia application.
 */

export { DataList, type DataListProps } from "./data-list"
export { ActionCard, type ActionCardProps, type ActionCardAction } from "./action-card" 
export { FormDialog, type FormDialogProps } from "./form-dialog"
export { 
  StatusBadge, 
  SuccessBadge, 
  ErrorBadge, 
  PendingBadge,
  type StatusBadgeProps,
  type StatusType 
} from "./status-badge"

// Re-export common UI components for convenience
export { Button } from "@/components/ui/button"
export { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
export { Input } from "@/components/ui/input"
export { Label } from "@/components/ui/label"
export { Textarea } from "@/components/ui/textarea"
export { Badge } from "@/components/ui/badge"