import { memo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { Database } from "@/types/supabase"

type SetlistWithSongs = Database["public"]["Tables"]["setlists"]["Row"] & {
  setlist_songs: Array<{
    id: string
    position: number
    notes: string | null
    content: any
  }>
}

interface SetlistFormData {
  name: string
  description: string
  performance_date: string
  venue: string
  notes: string
}

interface SetlistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SetlistFormData) => Promise<void>
  editingSetlist?: SetlistWithSongs | null
  loading?: boolean
}

const initialFormData: SetlistFormData = {
  name: "",
  description: "",
  performance_date: "",
  venue: "",
  notes: "",
}

export const SetlistDialog = memo(function SetlistDialog({
  open,
  onOpenChange,
  onSubmit,
  editingSetlist,
  loading = false,
}: SetlistDialogProps) {
  const [formData, setFormData] = useState<SetlistFormData>(initialFormData)
  const [submitLoading, setSubmitLoading] = useState(false)
  
  const isEditing = !!editingSetlist

  // Reset form when dialog opens/closes or editing setlist changes
  useEffect(() => {
    if (open) {
      if (editingSetlist) {
        setFormData({
          name: editingSetlist.name || "",
          description: editingSetlist.description || "",
          performance_date: editingSetlist.performance_date || "",
          venue: editingSetlist.venue || "",
          notes: editingSetlist.notes || "",
        })
      } else {
        setFormData(initialFormData)
      }
    }
  }, [open, editingSetlist])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      return
    }

    setSubmitLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
      setFormData(initialFormData)
    } catch (error) {
      console.error('Failed to save setlist:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const updateFormData = (field: keyof SetlistFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const canSubmit = formData.name.trim().length > 0 && !submitLoading && !loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-[#1A1F36]">
              {isEditing ? "Edit Setlist" : "Create New Setlist"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update your setlist information."
                : "Create a new setlist to organize your songs for performances."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#1A1F36] font-medium">
                Setlist Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Coffee Shop Acoustic Set"
                className="border-[#E8E3DA] focus:border-[#2E7CE4]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#1A1F36] font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Brief description of this setlist..."
                className="border-[#E8E3DA] focus:border-[#2E7CE4] resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="performance_date" className="text-[#1A1F36] font-medium">
                  Performance Date
                </Label>
                <Input
                  id="performance_date"
                  type="date"
                  value={formData.performance_date}
                  onChange={(e) => updateFormData("performance_date", e.target.value)}
                  className="border-[#E8E3DA] focus:border-[#2E7CE4]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue" className="text-[#1A1F36] font-medium">
                  Venue
                </Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => updateFormData("venue", e.target.value)}
                  placeholder="e.g., The Blue Note"
                  className="border-[#E8E3DA] focus:border-[#2E7CE4]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[#1A1F36] font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Any additional notes about this setlist..."
                className="border-[#E8E3DA] focus:border-[#2E7CE4] resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitLoading}
              className="border-[#E8E3DA] text-[#1A1F36] hover:bg-[#F8F9FA]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white disabled:opacity-50"
            >
              {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update Setlist" : "Create Setlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})