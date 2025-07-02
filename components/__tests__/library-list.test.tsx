import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LibraryList } from '../library-list'

describe('LibraryList', () => {
  it('renders items', () => {
    render(
      <LibraryList
        content={[{ id: '1', title: 'Song', artist: 'A', album: 'B', content_type: 'tab' }]}
        loading={false}
        onSelect={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleFavorite={() => {}}
        getContentIcon={() => null}
        formatDate={() => 'today'}
      />
    )
    expect(screen.getByText('Song')).toBeTruthy()
  })

  it('calls onToggleFavorite when star button is clicked', () => {
    const mockToggleFavorite = vi.fn()
    const content = { 
      id: '1', 
      title: 'Song', 
      artist: 'A', 
      album: 'B', 
      content_type: 'tab', 
      is_favorite: false 
    }

    render(
      <LibraryList
        content={[content]}
        loading={false}
        onSelect={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleFavorite={mockToggleFavorite}
        getContentIcon={() => null}
        formatDate={() => 'today'}
      />
    )

    // Find the star button (there should be both mobile and desktop versions)
    const starButtons = screen.getAllByRole('button')
    const favoriteButton = starButtons.find(button => 
      button.querySelector('.lucide-star')
    )
    
    expect(favoriteButton).toBeTruthy()
    
    // Click the favorite button
    fireEvent.click(favoriteButton!)
    
    // Verify the callback was called with the correct content
    expect(mockToggleFavorite).toHaveBeenCalledWith(content)
  })

  it('renders favorite star as filled when item is favorited', () => {
    const content = { 
      id: '1', 
      title: 'Song', 
      artist: 'A', 
      album: 'B', 
      content_type: 'tab', 
      is_favorite: true 
    }

    render(
      <LibraryList
        content={[content]}
        loading={false}
        onSelect={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleFavorite={() => {}}
        getContentIcon={() => null}
        formatDate={() => 'today'}
      />
    )

    // Find the star icons
    const starIcons = document.querySelectorAll('.lucide-star')
    expect(starIcons.length).toBeGreaterThan(0)
    
    // Check if at least one star has the filled classes
    const hasFilledStar = Array.from(starIcons).some(star => 
      star.classList.contains('text-amber-500') && 
      star.classList.contains('fill-amber-500')
    )
    expect(hasFilledStar).toBe(true)
  })
})
