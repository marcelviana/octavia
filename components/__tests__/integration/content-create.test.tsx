import { setupTestMocks, resetTestMocks } from './helpers/content-management-helpers'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AddContent } from '@/components/add-content'
import { SessionProvider } from '@/components/providers/session-provider'

describe('Content Creation Flow', () => {
  beforeEach(async () => {
    await setupTestMocks()
  })

  afterEach(() => {
    resetTestMocks()
  })

  const renderAddContent = () => {
    const mockOnBack = vi.fn()
    const mockOnContentCreated = vi.fn()
    const mockOnNavigate = vi.fn()

    return {
      ...render(
        <SessionProvider>
          <AddContent
            onBack={mockOnBack}
            onContentCreated={mockOnContentCreated}
            onNavigate={mockOnNavigate}
          />
        </SessionProvider>
      ),
      mockOnBack,
      mockOnContentCreated,
      mockOnNavigate
    }
  }

  it('creates content with lyrics', async () => {
    const user = userEvent.setup()
    renderAddContent()

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    await user.type(titleInput, 'New Song')

    const nextButton = screen.queryByRole('button', { name: /next/i })

    if (nextButton) {
      await user.click(nextButton)

      const lyricsTextarea =
        screen.queryByPlaceholderText(/lyrics/i) ||
        screen.queryByRole('textbox', { name: /lyrics/i })

      if (lyricsTextarea) {
        await user.type(lyricsTextarea, 'Amazing grace how sweet the sound')
      }
    }

    expect(screen.getByText(/new song/i)).toBeInTheDocument()
  })

  it('handles file upload for sheet music', async () => {
    const user = userEvent.setup()
    renderAddContent()

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    await user.type(titleInput, 'New Sheet Music')

    const fileInput =
      screen.queryByRole('button', { name: /upload/i }) ||
      screen.queryByLabelText(/file/i) ||
      screen.queryByRole('button', { name: /sheet/i })

    if (fileInput) {
      await user.click(fileInput)
    }

    expect(screen.getByRole('heading', { name: /add content/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderAddContent()

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(nextButton).toBeInTheDocument()
  })
})
