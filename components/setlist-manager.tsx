"use client"

import React, { useState, useCallback } from "react"
import { useFirebaseAuth } from "@/contexts/firebase-auth-context"
import { useSetlistData } from "@/hooks/use-setlist-data"
import { saveSetlists, removeCachedSetlist } from "@/lib/offline-setlist-cache"
import { toast } from "@/hooks/use-toast"
import {
  createSetlist,
  deleteSetlist,
  addSongToSetlist,
  removeSongFromSetlist,
  updateSongPosition,
  updateSetlist,
} from "@/lib/setlist-service"
import {
  SetlistList,
  SetlistDetails,
  SetlistDialog,
  SongSelectionDialog,
  type SetlistWithSongs,
  type SetlistFormData,
} from "./setlist"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SetlistManagerProps {
  onEnterPerformance: (setlist: SetlistWithSongs, startingSongIndex?: number) => void
}

export function SetlistManager({ onEnterPerformance }: SetlistManagerProps) {
  const { user, isLoading: authLoading } = useFirebaseAuth()
  const isInitialized = !authLoading
  
  const {
    setlists,
    setSetlists,
    content: availableContent,
    loading,
    error,
    reload,
  } = useSetlistData(user, isInitialized)

  // State management
  const [selectedSetlist, setSelectedSetlist] = useState<SetlistWithSongs | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddSongsDialogOpen, setIsAddSongsDialogOpen] = useState(false)
  const [editingSetlist, setEditingSetlist] = useState<SetlistWithSongs | null>(null)
  const [selectedSongsToAdd, setSelectedSongsToAdd] = useState<string[]>([])
  const [deleteDialogSetlist, setDeleteDialogSetlist] = useState<SetlistWithSongs | null>(null)

  // Handlers
  const handleSelectSetlist = useCallback((setlist: SetlistWithSongs) => {
    setSelectedSetlist(setlist)
  }, [])

  const handleCreateSetlist = useCallback(() => {
    setEditingSetlist(null)
    setIsCreateDialogOpen(true)
  }, [])

  const handleEditSetlist = useCallback((setlist: SetlistWithSongs) => {
    setEditingSetlist(setlist)
    setIsEditDialogOpen(true)
  }, [])

  const handleSubmitSetlist = useCallback(async (data: SetlistFormData) => {
    if (!user?.uid) return

    try {
      if (editingSetlist) {
        // Update existing setlist
        const updatedSetlist = await updateSetlist(editingSetlist.id, {
          name: data.name,
          description: data.description || null,
          performance_date: data.performance_date || null,
          venue: data.venue || null,
          notes: data.notes || null,
        })

        if (updatedSetlist) {
          setSetlists(prev => prev.map(s => s.id === editingSetlist.id 
            ? { ...s, ...updatedSetlist } 
            : s
          ))
          
          if (selectedSetlist?.id === editingSetlist.id) {
            setSelectedSetlist(prev => prev ? { ...prev, ...updatedSetlist } : null)
          }

          await saveSetlists(setlists)
          toast({ title: "Setlist updated successfully" })
        }
      } else {
        // Create new setlist
        const newSetlist = await createSetlist({
          name: data.name,
          description: data.description || null,
          performance_date: data.performance_date || null,
          venue: data.venue || null,
          notes: data.notes || null,
        })

        if (newSetlist) {
          const setlistWithSongs: SetlistWithSongs = {
            ...newSetlist,
            setlist_songs: []
          }
          
          setSetlists(prev => [setlistWithSongs, ...prev])
          await saveSetlists([setlistWithSongs, ...setlists])
          toast({ title: "Setlist created successfully" })
        }
      }
    } catch (error) {
      console.error('Failed to save setlist:', error)
      toast({
        title: "Failed to save setlist",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }, [user?.uid, editingSetlist, selectedSetlist, setlists, setSetlists])

  const handleDeleteSetlist = useCallback((setlist: SetlistWithSongs) => {
    setDeleteDialogSetlist(setlist)
  }, [])

  const confirmDeleteSetlist = useCallback(async () => {
    if (!user?.uid || !deleteDialogSetlist) return

    try {
      await deleteSetlist(deleteDialogSetlist.id)
      setSetlists(prev => prev.filter(s => s.id !== deleteDialogSetlist.id))
      await removeCachedSetlist(deleteDialogSetlist.id)
      
      if (selectedSetlist?.id === deleteDialogSetlist.id) {
        setSelectedSetlist(null)
      }
      
      setDeleteDialogSetlist(null)
      toast({ title: "Setlist deleted successfully" })
    } catch (error) {
      console.error('Failed to delete setlist:', error)
      toast({
        title: "Failed to delete setlist",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }, [user?.uid, deleteDialogSetlist, selectedSetlist, setSetlists])

  const handleAddSongsToSetlist = useCallback(async (songIds: string[]) => {
    if (!selectedSetlist || !user?.uid || songIds.length === 0) return

    try {
      const updatedSetlist = { ...selectedSetlist }
      const existingSongs = updatedSetlist.setlist_songs || []
      const nextPosition = existingSongs.length > 0 
        ? Math.max(...existingSongs.map(s => s.position)) + 1 
        : 1

      for (let i = 0; i < songIds.length; i++) {
        const songId = songIds[i]
        const content = availableContent.find(c => c.id === songId)
        if (!content) continue

        await addSongToSetlist(selectedSetlist.id, songId, nextPosition + i)
        
        updatedSetlist.setlist_songs.push({
          id: `${selectedSetlist.id}-${songId}`,
          position: nextPosition + i,
          notes: null,
          content,
        })
      }

      setSelectedSetlist(updatedSetlist)
      setSetlists(prev => prev.map(s => s.id === selectedSetlist.id ? updatedSetlist : s))
      await saveSetlists(setlists.map(s => s.id === selectedSetlist.id ? updatedSetlist : s))
      
      toast({ 
        title: `Added ${songIds.length} song${songIds.length !== 1 ? 's' : ''} to setlist` 
      })
    } catch (error) {
      console.error('Failed to add songs:', error)
      toast({
        title: "Failed to add songs",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }, [selectedSetlist, user?.uid, availableContent, setlists, setSetlists])

  const handleRemoveSongFromSetlist = useCallback(async (songId: string) => {
    if (!selectedSetlist || !user?.uid) return

    try {
      const songToRemove = selectedSetlist.setlist_songs.find(s => s.content.id === songId)
      if (!songToRemove) return

      await removeSongFromSetlist(songToRemove.id)
      
      const updatedSetlist = {
        ...selectedSetlist,
        setlist_songs: selectedSetlist.setlist_songs.filter(s => s.content.id !== songId)
      }
      
      setSelectedSetlist(updatedSetlist)
      setSetlists(prev => prev.map(s => s.id === selectedSetlist.id ? updatedSetlist : s))
      await saveSetlists(setlists.map(s => s.id === selectedSetlist.id ? updatedSetlist : s))
      
      toast({ title: "Song removed from setlist" })
    } catch (error) {
      console.error('Failed to remove song:', error)
      toast({
        title: "Failed to remove song",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }, [selectedSetlist, user?.uid, setlists, setSetlists])

  // Don't render anything while loading auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
        {/* Setlist List */}
        <div className="space-y-4">
          <SetlistList
            setlists={setlists}
            selectedSetlist={selectedSetlist}
            loading={loading}
            error={error}
            onSelectSetlist={handleSelectSetlist}
            onCreateSetlist={handleCreateSetlist}
            onEditSetlist={handleEditSetlist}
            onDeleteSetlist={handleDeleteSetlist}
            onEnterPerformance={onEnterPerformance}
          />
        </div>

        {/* Setlist Details */}
        <div className="space-y-4">
          {selectedSetlist ? (
            <SetlistDetails
              setlist={selectedSetlist}
              onAddSongs={() => setIsAddSongsDialogOpen(true)}
              onEditSetlist={() => handleEditSetlist(selectedSetlist)}
              onEnterPerformance={(startingSongIndex) => 
                onEnterPerformance(selectedSetlist, startingSongIndex)
              }
              onRemoveSong={handleRemoveSongFromSetlist}
              onReorderSongs={(songId, newPosition) => {
                // TODO: Implement song reordering
                console.log('Reorder song', songId, 'to position', newPosition)
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-[#F8F9FA] rounded-lg border border-[#E8E3DA]">
              <p className="text-[#6B7280] text-lg">
                Select a setlist to view its details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SetlistDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleSubmitSetlist}
      />

      <SetlistDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleSubmitSetlist}
        editingSetlist={editingSetlist}
      />

      <SongSelectionDialog
        open={isAddSongsDialogOpen}
        onOpenChange={setIsAddSongsDialogOpen}
        availableContent={availableContent}
        selectedSongs={selectedSongsToAdd}
        onSelectedSongsChange={setSelectedSongsToAdd}
        onAddSongs={handleAddSongsToSetlist}
        excludeSongIds={selectedSetlist?.setlist_songs?.map(s => s.content.id) || []}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialogSetlist} onOpenChange={() => setDeleteDialogSetlist(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Setlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialogSetlist?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogSetlist(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSetlist}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}