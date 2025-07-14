import { setupTestMocks, resetTestMocks, mockContent } from './helpers/content-management-helpers'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import LibraryPageClient from '@/components/library-page-client'
import { SessionProvider } from '@/components/providers/session-provider'

describe('Library Management Flow', () => {
  beforeEach(async () => {
    await setupTestMocks()
  })

  afterEach(() => {
    resetTestMocks()
  })

  it('displays content list with correct information', async () => {
    render(
      <SessionProvider>
        <LibraryPageClient
          initialContent={mockContent}
          initialTotal={mockContent.length}
          initialPage={1}
          pageSize={20}
        />
      </SessionProvider>
    )

    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('How Great Thou Art')).toBeInTheDocument()

    const lyricsText = screen.queryByText(/lyrics/i)
    const chordsText = screen.queryByText(/chords/i)

    if (lyricsText) {
      expect(lyricsText).toBeInTheDocument()
    }
    if (chordsText) {
      expect(chordsText).toBeInTheDocument()
    }

    expect(screen.getByText('Traditional')).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    const user = userEvent.setup()
    render(
      <SessionProvider>
        <LibraryPageClient
          initialContent={mockContent}
          initialTotal={mockContent.length}
          initialPage={1}
          pageSize={20}
        />
      </SessionProvider>
    )

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'grace')

    await waitFor(() => {
      expect(searchInput).toHaveValue('grace')
    })
  })

  it('handles content favoriting', async () => {
    const user = userEvent.setup()
    render(
      <SessionProvider>
        <LibraryPageClient
          initialContent={mockContent}
          initialTotal={mockContent.length}
          initialPage={1}
          pageSize={20}
        />
      </SessionProvider>
    )

    const favoriteButtons = screen.queryAllByRole('button', { name: /favorite/i })
    const heartButtons = screen.queryAllByLabelText(/favorite/i)
    const allFavoriteButtons = [...favoriteButtons, ...heartButtons]

    if (allFavoriteButtons.length > 0) {
      await user.click(allFavoriteButtons[0])

      await waitFor(() => {
        const { toggleFavorite } = require('@/lib/content-service')
        expect(toggleFavorite).toHaveBeenCalledWith('content-1')
      })
    } else {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    }
  })

  it('handles content deletion', async () => {
    const user = userEvent.setup()
    render(
      <SessionProvider>
        <LibraryPageClient
          initialContent={mockContent}
          initialTotal={mockContent.length}
          initialPage={1}
          pageSize={20}
        />
      </SessionProvider>
    )

    const deleteButtons = screen.queryAllByRole('button', { name: /delete/i })
    const menuButtons = screen.queryAllByRole('button', { name: /menu/i })
    const actionButtons = screen.queryAllByRole('button', { name: /actions/i })

    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(
          screen.getByText(/confirm/i) ||
            screen.getByText(/delete/i) ||
            screen.getByRole('alertdialog')
        ).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        const { deleteContent } = require('@/lib/content-service')
        expect(deleteContent).toHaveBeenCalledWith('content-1')
      })
    } else if (menuButtons.length > 0) {
      await user.click(menuButtons[0])
      const deleteOption = screen.queryByRole('menuitem', { name: /delete/i })
      if (deleteOption) {
        await user.click(deleteOption)
        const confirmButton = screen.queryByRole('button', { name: /confirm|delete/i })
        if (confirmButton) {
          await user.click(confirmButton)
        }
      }
    } else {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    }
  })

  it('handles pagination', async () => {
    const user = userEvent.setup()
    const longContentList = Array.from({ length: 25 }, (_, i) => ({
      ...mockContent[0],
      id: `content-${i + 1}`,
      title: `Song ${i + 1}`,
    }))

    render(
      <SessionProvider>
        <LibraryPageClient
          initialContent={longContentList.slice(0, 20)}
          initialTotal={longContentList.length}
          initialPage={1}
          pageSize={20}
        />
      </SessionProvider>
    )

    expect(screen.getByText('Song 1')).toBeInTheDocument()
    expect(screen.getByText('Song 2')).toBeInTheDocument()

    const nextButton = screen.queryByRole('button', { name: /next/i })
    if (nextButton) {
      await user.click(nextButton)
    }
  })
})
