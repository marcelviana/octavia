/**
 * FormDialog Component - Reusable Composition Pattern
 * 
 * A flexible dialog component for forms with consistent patterns
 * for validation, loading states, and error handling.
 */

import { memo, ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertCircle } from "lucide-react"

export interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  error?: string | null
  disabled?: boolean
  onSubmit: () => void | Promise<void>
  children: ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  testId?: string
}

export const FormDialog = memo(function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  error = null,
  disabled = false,
  onSubmit,
  children,
  size = "md",
  testId = "form-dialog",
}: FormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (disabled || loading || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit()
    } catch (error) {
      // Error should be handled by the parent component
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
  }

  const isProcessing = loading || isSubmitting
  const canSubmit = !disabled && !isProcessing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]} data-testid={testId}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content */}
          <div className="py-4">
            {children}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})