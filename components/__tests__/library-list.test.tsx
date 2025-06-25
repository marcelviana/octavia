import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LibraryList } from '../library-list'

describe('LibraryList', () => {
  it('renders items', () => {
    render(
      <LibraryList
        content={[{ id: '1', title: 'Song', artist: 'A', album: 'B', content_type: 'tab' }]}
        loading={false}
        onSelect={() => {}}
        onEdit={() => {}}
        onDownload={() => {}}
        onDelete={() => {}}
        getContentIcon={() => null}
        formatDate={() => 'today'}
      />
    )
    expect(screen.getByText('Song')).toBeTruthy()
  })
})
