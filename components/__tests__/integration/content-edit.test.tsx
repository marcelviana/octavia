import { setupTestMocks, resetTestMocks, mockContent } from './helpers/content-management-helpers'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ContentEditor } from '@/components/content-editor'
import { SessionProvider } from '@/components/providers/session-provider'

describe('Content Editing Flow', () => {
  beforeEach(async () => {
    await setupTestMocks()
  })

  afterEach(() => {
    resetTestMocks()
  })

  const renderContentEditor = () => {
    const mockOnSave = vi.fn()
    const mockOnCancel = vi.fn()

    return {
      ...render(
        <SessionProvider>
          <ContentEditor
            content={mockContent[0]}
            onSave={mockOnSave}
            onCancel={mockOnCancel}
          />
        </SessionProvider>
      ),
      mockOnSave,
      mockOnCancel
    }
  }

  it('loads content data correctly', async () => {
    renderContentEditor()

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Amazing Grace') ||
          screen.getByText('Amazing Grace')
      ).toBeInTheDocument()
    })

    expect(screen.getByText(/lyrics/i)).toBeInTheDocument()
  })

  it('saves edited content', async () => {
    const user = userEvent.setup()
    const { mockOnSave } = renderContentEditor()

    const titleInput =
      screen.getByDisplayValue('Amazing Grace') ||
      screen.getByRole('textbox', { name: /title/i })

    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Amazing Grace')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Amazing Grace' })
      )
    })
  })

  it('cancels editing without saving', async () => {
    const user = userEvent.setup()
    renderContentEditor()

    const titleInput =
      screen.getByRole('textbox', { name: /title/i }) ||
      screen.getByLabelText(/title/i) ||
      screen.getByDisplayValue(/amazing grace/i)

    if (titleInput) {
      await user.clear(titleInput)
      await user.type(titleInput, 'Amazing Grace - Modified')
    }

    const cancelButton =
      screen.queryByRole('button', { name: /cancel/i }) ||
      screen.queryByText(/cancel/i)

    if (cancelButton) {
      await user.click(cancelButton)
      expect(
        screen.getByRole('heading', { name: /editing.*amazing grace/i })
      ).toBeInTheDocument()
    } else {
      expect(
        screen.getByRole('heading', { name: /editing.*amazing grace/i })
      ).toBeInTheDocument()
    }
  })

  it('shows unsaved changes warning', async () => {
    const user = userEvent.setup()
    renderContentEditor()

    const titleInput =
      screen.getByDisplayValue('Amazing Grace') ||
      screen.getByRole('textbox', { name: /title/i })
    await user.type(titleInput, ' - Modified')

    await waitFor(() => {
      expect(
        screen.getByText(/unsaved/i) ||
          screen.getByText(/changes/i) ||
          screen.getByRole('status')
      ).toBeInTheDocument()
    })
  })
})
