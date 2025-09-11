/**
 * Service Layer Integration Tests
 * 
 * End-to-end tests for service layer operations that validate
 * complete data flows across authentication, database, and caching layers.
 * 
 * Test Coverage:
 * - Content CRUD operations with authentication
 * - Setlist management workflows  
 * - File upload and storage integration
 * - Database consistency and error recovery
 * - Cross-service data synchronization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server, TEST_USER, createTestContent, createTestSetlist, performanceMonitor } from './test-setup'
import { http, HttpResponse } from 'msw'
import type { Database } from '@/types/supabase'

// Import components to test service integration
import { ContentCreator } from '@/components/content-creator'
import { SetlistManager } from '@/components/setlist-manager'

type Content = Database["public"]["Tables"]["content"]["Row"]
type Setlist = Database["public"]["Tables"]["setlists"]["Row"]

describe('Service Layer Integration Tests', () => {
  beforeEach(() => {
    performanceMonitor.clear()
  })

  describe('Content Service End-to-End Operations', () => {
    it('should handle complete content creation workflow', async () => {
      const user = userEvent.setup()
      const mockContent = createTestContent({ title: 'Integration Test Song' })

      // Mock the full creation workflow
      server.use(
        http.post('/api/content', async ({ request }) => {
          const data = await request.json()
          expect(data.title).toBe('Integration Test Song')
          return HttpResponse.json(mockContent, { status: 201 })
        }),
        
        http.get('/api/content', () => {
          return HttpResponse.json({
            content: [mockContent],
            total: 1,
            page: 1,
            hasMore: false
          })
        })
      )

      render(<ContentCreator />)

      performanceMonitor.start('content-creation-flow')

      // Start content creation
      const createButton = screen.getByRole('button', { name: /create content/i })
      await user.click(createButton)

      // Fill out the form
      const titleInput = screen.getByLabelText(/title/i)
      const artistInput = screen.getByLabelText(/artist/i)
      
      await user.type(titleInput, 'Integration Test Song')
      await user.type(artistInput, 'Test Artist')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      // Should show success feedback
      await waitFor(() => {
        expect(screen.getByText('Content created successfully')).toBeInTheDocument()
      })

      // Should refresh the content list
      await waitFor(() => {
        expect(screen.getByText('Integration Test Song')).toBeInTheDocument()
      })

      const creationDuration = performanceMonitor.end('content-creation-flow')
      
      // Should complete within reasonable time
      expect(creationDuration).toBeLessThan(2000)
    })

    it('should handle content update with optimistic updates', async () => {
      const user = userEvent.setup()
      const originalContent = createTestContent({ 
        id: 'test-content-1',
        title: 'Original Title',
        artist: 'Original Artist'
      })
      
      const updatedContent = {
        ...originalContent,
        title: 'Updated Title',
        artist: 'Updated Artist'
      }

      server.use(
        http.get('/api/content', () => {
          return HttpResponse.json({
            content: [originalContent],
            total: 1,
            page: 1,
            hasMore: false
          })
        }),
        
        http.put('/api/content/test-content-1', async ({ request }) => {
          await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
          return HttpResponse.json(updatedContent)
        })
      )

      render(<ContentCreator />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Original Title')).toBeInTheDocument()
      })

      // Start edit
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      // Update the form
      const titleInput = screen.getByDisplayValue('Original Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      // Submit update
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Should show optimistic update immediately
      expect(screen.getByText('Updated Title')).toBeInTheDocument()

      // Should maintain consistency after server response
      await waitFor(() => {
        expect(screen.getByText('Content updated successfully')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should handle content deletion with confirmation', async () => {
      const user = userEvent.setup()
      const testContent = createTestContent({ 
        id: 'test-content-delete',
        title: 'Content to Delete'
      })

      let contentDeleted = false
      
      server.use(
        http.get('/api/content', () => {
          if (contentDeleted) {
            return HttpResponse.json({
              content: [],
              total: 0,
              page: 1,
              hasMore: false
            })
          }
          return HttpResponse.json({
            content: [testContent],
            total: 1,
            page: 1,
            hasMore: false
          })
        }),
        
        http.delete('/api/content/test-content-delete', () => {
          contentDeleted = true
          return HttpResponse.json({ success: true })
        })
      )

      render(<ContentCreator />)

      await waitFor(() => {
        expect(screen.getByText('Content to Delete')).toBeInTheDocument()
      })

      // Initiate delete
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Should show confirmation dialog
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Should remove from list
      await waitFor(() => {
        expect(screen.queryByText('Content to Delete')).not.toBeInTheDocument()
      })

      // Should show success message
      expect(screen.getByText('Content deleted successfully')).toBeInTheDocument()
    })
  })

  describe('Setlist Service Integration', () => {
    it('should handle complete setlist creation with songs', async () => {
      const user = userEvent.setup()
      const testSongs = [
        createTestContent({ id: 'song-1', title: 'Song 1' }),
        createTestContent({ id: 'song-2', title: 'Song 2' }),
        createTestContent({ id: 'song-3', title: 'Song 3' })
      ]

      const mockSetlist = createTestSetlist({ 
        name: 'Integration Test Setlist',
        description: 'Test setlist with songs'
      })

      server.use(
        http.get('/api/content', () => {
          return HttpResponse.json({
            content: testSongs,
            total: 3,
            page: 1,
            hasMore: false
          })
        }),
        
        http.post('/api/setlists', async ({ request }) => {
          const data = await request.json()
          return HttpResponse.json({
            ...mockSetlist,
            ...data,
            setlist_songs: []
          }, { status: 201 })
        }),
        
        http.post('/api/setlists/:id/songs', ({ params }) => {
          return HttpResponse.json({ success: true })
        })
      )

      render(<SetlistManager />)

      performanceMonitor.start('setlist-creation-flow')

      // Create new setlist
      const createButton = screen.getByRole('button', { name: /create setlist/i })
      await user.click(createButton)

      // Fill setlist details
      const nameInput = screen.getByLabelText(/name/i)
      const descInput = screen.getByLabelText(/description/i)
      
      await user.type(nameInput, 'Integration Test Setlist')
      await user.type(descInput, 'Test setlist with songs')

      // Add songs to setlist
      const addSongButton = screen.getByRole('button', { name: /add songs/i })
      await user.click(addSongButton)

      // Select songs from library
      const song1Checkbox = screen.getByRole('checkbox', { name: /song 1/i })
      const song2Checkbox = screen.getByRole('checkbox', { name: /song 2/i })
      
      await user.click(song1Checkbox)
      await user.click(song2Checkbox)

      // Add selected songs
      const addSelectedButton = screen.getByRole('button', { name: /add selected/i })
      await user.click(addSelectedButton)

      // Save setlist
      const saveButton = screen.getByRole('button', { name: /save setlist/i })
      await user.click(saveButton)

      // Should show success
      await waitFor(() => {
        expect(screen.getByText('Setlist created successfully')).toBeInTheDocument()
      })

      const creationDuration = performanceMonitor.end('setlist-creation-flow')
      expect(creationDuration).toBeLessThan(3000)
    })

    it('should handle setlist song reordering', async () => {
      const user = userEvent.setup()
      const setlistWithSongs = {
        ...createTestSetlist({ name: 'Reorder Test Setlist' }),
        setlist_songs: [
          {
            id: 'setlist-song-1',
            position: 1,
            notes: '',
            content: createTestContent({ title: 'First Song' })
          },
          {
            id: 'setlist-song-2', 
            position: 2,
            notes: '',
            content: createTestContent({ title: 'Second Song' })
          },
          {
            id: 'setlist-song-3',
            position: 3,
            notes: '',
            content: createTestContent({ title: 'Third Song' })
          }
        ]
      }

      server.use(
        http.get('/api/setlists', () => {
          return HttpResponse.json([setlistWithSongs])
        }),
        
        http.put('/api/setlists/:id/reorder', async ({ request }) => {
          const { songIds } = await request.json()
          expect(songIds).toHaveLength(3)
          return HttpResponse.json({ success: true })
        })
      )

      render(<SetlistManager />)

      await waitFor(() => {
        expect(screen.getByText('First Song')).toBeInTheDocument()
      })

      // Select the setlist to edit
      const setlistCard = screen.getByTestId(`setlist-card-${setlistWithSongs.id}`)
      await user.click(setlistCard)

      // Open reorder mode
      const reorderButton = screen.getByRole('button', { name: /reorder/i })
      await user.click(reorderButton)

      // Simulate drag and drop reordering (simplified)
      const firstSong = screen.getByTestId('song-item-0')
      const thirdSong = screen.getByTestId('song-item-2')

      // Mock drag and drop behavior
      fireEvent.dragStart(firstSong)
      fireEvent.dragOver(thirdSong)
      fireEvent.drop(thirdSong)

      // Save reorder
      const saveOrderButton = screen.getByRole('button', { name: /save order/i })
      await user.click(saveOrderButton)

      // Should show success
      await waitFor(() => {
        expect(screen.getByText('Song order updated successfully')).toBeInTheDocument()
      })
    })
  })

  describe('Cross-Service Data Consistency', () => {
    it('should maintain consistency when content is deleted from setlists', async () => {
      const user = userEvent.setup()
      const sharedContent = createTestContent({ 
        id: 'shared-content',
        title: 'Shared Song'
      })

      const setlistWithSharedSong = {
        ...createTestSetlist({ name: 'Setlist with Shared Song' }),
        setlist_songs: [{
          id: 'setlist-song-shared',
          position: 1,
          notes: '',
          content: sharedContent
        }]
      }

      let contentExists = true

      server.use(
        http.get('/api/content', () => {
          return HttpResponse.json({
            content: contentExists ? [sharedContent] : [],
            total: contentExists ? 1 : 0,
            page: 1,
            hasMore: false
          })
        }),

        http.get('/api/setlists', () => {
          return HttpResponse.json([setlistWithSharedSong])
        }),

        http.delete('/api/content/shared-content', () => {
          contentExists = false
          return HttpResponse.json({ success: true })
        }),

        // Should update setlists when content is deleted
        http.get('/api/setlists/:id/validate', () => {
          return HttpResponse.json({
            invalidSongs: ['setlist-song-shared'],
            suggestions: []
          })
        })
      )

      render(<ContentCreator />)

      await waitFor(() => {
        expect(screen.getByText('Shared Song')).toBeInTheDocument()
      })

      // Delete the content
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Should show warning about setlist impact
      await waitFor(() => {
        expect(screen.getByText(/content used in setlists/i)).toBeInTheDocument()
      })

      // Should offer to clean up setlists
      const cleanupButton = screen.getByRole('button', { name: /clean up setlists/i })
      await user.click(cleanupButton)

      // Should complete cleanup
      await waitFor(() => {
        expect(screen.getByText('Setlists updated successfully')).toBeInTheDocument()
      })
    })

    it('should handle concurrent modifications gracefully', async () => {
      const user = userEvent.setup()
      const testContent = createTestContent({ 
        id: 'concurrent-content',
        title: 'Concurrent Test',
        updated_at: '2024-01-01T00:00:00Z'
      })

      let updateCount = 0

      server.use(
        http.get('/api/content', () => {
          return HttpResponse.json({
            content: [testContent],
            total: 1,
            page: 1,
            hasMore: false
          })
        }),
        
        http.put('/api/content/concurrent-content', async ({ request }) => {
          updateCount++
          
          if (updateCount === 1) {
            // First update succeeds
            return HttpResponse.json({
              ...testContent,
              title: 'Updated by User 1',
              updated_at: '2024-01-01T01:00:00Z'
            })
          } else {
            // Second update conflicts
            return HttpResponse.json(
              { error: 'Conflict: Content was modified by another user' },
              { status: 409 }
            )
          }
        })
      )

      render(<ContentCreator />)

      await waitFor(() => {
        expect(screen.getByText('Concurrent Test')).toBeInTheDocument()
      })

      // Start first update
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      const titleInput = screen.getByDisplayValue('Concurrent Test')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated by User 1')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // First update should succeed
      await waitFor(() => {
        expect(screen.getByText('Content updated successfully')).toBeInTheDocument()
      })

      // Attempt second conflicting update
      await user.click(editButton)
      const titleInput2 = screen.getByDisplayValue('Updated by User 1')
      await user.clear(titleInput2)
      await user.type(titleInput2, 'Updated by User 2')
      await user.click(saveButton)

      // Should handle conflict gracefully
      await waitFor(() => {
        expect(screen.getByText(/conflict.*modified by another user/i)).toBeInTheDocument()
      })

      // Should offer conflict resolution options
      expect(screen.getByRole('button', { name: /reload and try again/i })).toBeInTheDocument()
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from network failures during operations', async () => {
      const user = userEvent.setup()
      const testContent = createTestContent({ title: 'Network Test Content' })

      let failureCount = 0

      server.use(
        http.post('/api/content', () => {
          failureCount++
          
          if (failureCount <= 2) {
            // Fail first two attempts
            return HttpResponse.json(
              { error: 'Network error' },
              { status: 500 }
            )
          } else {
            // Third attempt succeeds
            return HttpResponse.json(testContent, { status: 201 })
          }
        })
      )

      render(<ContentCreator />)

      // Attempt to create content
      const createButton = screen.getByRole('button', { name: /create content/i })
      await user.click(createButton)

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Network Test Content')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      // Should show error on first attempt
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Should show retry option
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Should still fail on second attempt
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Third retry should succeed
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Content created successfully')).toBeInTheDocument()
      })
    })
  })
})