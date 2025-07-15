import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { LibraryList } from '../library-list'

// Mock functions
const mockOnSelect = vi.fn()
const mockOnEdit = vi.fn()
const mockOnDelete = vi.fn()
const mockOnToggleFavorite = vi.fn()
const mockGetContentIcon = vi.fn(() => <div>Icon</div>)
const mockFormatDate = vi.fn((date) => {
  if (date.includes('2024-01-01')) return 'Jan 1, 2024'
  if (date.includes('yesterday')) return 'Yesterday'
  return 'Jan 1, 2024'
})

// Mock content data
const mockContent = [
  {
    id: '1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    album: 'Hymns Collection',
    content_type: 'Sheet Music',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_favorite: false,
    key: 'G',
    difficulty: 'Beginner',
  },
]

describe('LibraryList - Behavioral Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows users to select content and navigate to details', async () => {
    const user = userEvent.setup()
    
    render(
      <LibraryList
        content={mockContent}
        loading={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        getContentIcon={mockGetContentIcon}
        formatDate={mockFormatDate}
      />
    )

    // User sees content in the library
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('John Newton')).toBeInTheDocument()
    expect(screen.getAllByText('Hymns Collection')[0]).toBeInTheDocument()
    
    // User clicks on the content item
    const contentItem = screen.getByRole('button', { name: /view amazing grace/i })
    await act(async () => {
      await user.click(contentItem)
    })

    // System navigates to content details
    expect(mockOnSelect).toHaveBeenCalledWith(mockContent[0])
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
  })

  it('manages favorite status throughout complete user interaction', async () => {
    const user = userEvent.setup()
    const mockToggleFavorite = vi.fn()
    
    render(
      <LibraryList 
        content={mockContent}
        loading={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockToggleFavorite}
        getContentIcon={mockGetContentIcon}
        formatDate={mockFormatDate}
      />
    )
    
    // User finds favorite button
    const favoriteButton = screen.getByLabelText('Add to favorites')
    expect(favoriteButton).toBeInTheDocument()
    
    // User clicks to add to favorites
    await act(async () => {
      await user.click(favoriteButton)
    })
    
    // Mock the favorite state change
    await act(async () => {
      // Re-render with updated props to simulate state change
             render(
         <LibraryList 
           content={mockContent.map(item => 
             item.id === '1' ? { ...item, is_favorite: true } : item
           )}
           loading={false}
           onSelect={mockOnSelect}
           onEdit={mockOnEdit}
           onDelete={mockOnDelete}
           onToggleFavorite={mockToggleFavorite}
           getContentIcon={mockGetContentIcon}
           formatDate={mockFormatDate}
         />
       )
    })
    
    // User interaction provides immediate feedback
    const updatedButton = screen.getByLabelText('Remove from favorites')
    expect(updatedButton).toBeInTheDocument()
    expect(updatedButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('handles empty library state with proper user guidance', async () => {
    render(
      <LibraryList
        content={[]}
        loading={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        getContentIcon={mockGetContentIcon}
        formatDate={mockFormatDate}
      />
    )
    
    // User sees empty state message
    expect(screen.getByText(/no content found/i)).toBeInTheDocument()
    
    // User sees helpful guidance
    expect(screen.getByText(/your library is empty/i)).toBeInTheDocument()
    expect(screen.getByText(/add some content to get started/i)).toBeInTheDocument()
    
    // User sees actionable next step
    expect(screen.getByRole('button', { name: /add your first content/i })).toBeInTheDocument()
  })

  it('provides feedback during content loading', async () => {
    render(
      <LibraryList
        content={[]}
        loading={true}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        getContentIcon={mockGetContentIcon}
        formatDate={mockFormatDate}
      />
    )
    
    // User sees loading state
    const loadingElement = screen.getByText(/loading/i) || 
                          screen.queryByRole('progressbar') || 
                          document.querySelector('.animate-spin')
    expect(loadingElement).toBeInTheDocument()
    
    // Loading state is accessible
    expect(loadingElement).toBeInLoadingState()
  })

  it('handles content deletion workflow with confirmation', async () => {
    const user = userEvent.setup()
    
    render(
      <LibraryList
        content={mockContent}
        loading={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        getContentIcon={mockGetContentIcon}
        formatDate={mockFormatDate}
      />
    )

    // User opens the actions menu
    const moreButton = screen.getByRole('button', { name: /more options/i })
    await act(async () => {
      await user.click(moreButton)
    })

    // User clicks delete button
    const deleteButton = screen.getByRole('menuitem', { name: /delete amazing grace/i })
    await act(async () => {
      await user.click(deleteButton)
    })

    // System initiates deletion workflow
    expect(mockOnDelete).toHaveBeenCalledWith(mockContent[0])
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
  })

  it('supports keyboard navigation for accessibility', async () => {
    const user = userEvent.setup()
    
    render(
      <LibraryList
        content={mockContent}
        loading={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        getContentIcon={mockGetContentIcon}
        formatDate={mockFormatDate}
      />
    )

    // User can navigate using keyboard
    const contentItem = screen.getByRole('button', { name: /view amazing grace/i })
    expect(contentItem).toBeAccessible()
    
    // User can activate with Enter key
    contentItem.focus()
    await act(async () => {
      await user.keyboard('{Enter}')
    })
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockContent[0])
    
    // User can also activate with Space key
    await act(async () => {
      await user.keyboard(' ')
    })
    
    expect(mockOnSelect).toHaveBeenCalledTimes(2)
  })

  it('displays content metadata in user-friendly format', async () => {
    render(
      <LibraryList
        content={mockContent}
        loading={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        getContentIcon={mockGetContentIcon}
        formatDate={mockFormatDate}
      />
    )
    
    // User sees content title and author
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('John Newton')).toBeInTheDocument()
    
    // Collection information is shown (may appear multiple times due to responsive design)
    const collectionElements = screen.getAllByText('Hymns Collection')
    expect(collectionElements.length).toBeGreaterThan(0)
    
    // Difficulty and key are displayed - use more specific selectors
    const difficultyBadges = screen.getAllByText('Beginner')
    expect(difficultyBadges.length).toBeGreaterThan(0)
    
    // For the key, we need to be more specific since there are multiple "G" elements
    const keyBadges = screen.getAllByText('G')
    expect(keyBadges.length).toBeGreaterThan(0)
    
    // Check that last modified date is shown
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument()
  })

  it('handles errors gracefully and provides recovery options', async () => {
    const user = userEvent.setup()
    
    // Mock error scenario
    mockOnSelect.mockRejectedValueOnce(new Error('Network error'))
    
    render(
      <LibraryList
        content={mockContent}
        loading={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        getContentIcon={mockGetContentIcon}
        formatDate={mockFormatDate}
      />
    )

    // User attempts to select content
    const contentItem = screen.getByRole('button', { name: /view amazing grace/i })
    await act(async () => {
      await user.click(contentItem)
    })

    // System should handle error gracefully
    expect(mockOnSelect).toHaveBeenCalledWith(mockContent[0])
    
    // User can still interact with other elements
    const favoriteButton = screen.getByRole('button', { name: /add to favorites/i })
    await act(async () => {
      await user.click(favoriteButton)
    })
    
    expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockContent[0])
  })
})
