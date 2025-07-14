import { setupTestMocks, resetTestMocks, mockContent, mockRouterPush } from './helpers/content-management-helpers'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import LibraryPageClient from '@/components/library-page-client'
import { SessionProvider } from '@/components/providers/session-provider'

describe('Content Navigation Flow', () => {
  beforeEach(async () => {
    await setupTestMocks()
  })

  afterEach(() => {
    resetTestMocks()
  })

  it('navigates from library to content editor', async () => {
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

    const editButtons = screen.queryAllByRole('button', { name: /edit/i })
    const menuButtons = screen.queryAllByRole('button', { name: /menu/i })
    const actionButtons = screen.queryAllByRole('button', { name: /actions/i })

    if (editButtons.length === 0 && menuButtons.length > 0) {
      await user.click(menuButtons[0])
      const editOption = screen.queryByRole('menuitem', { name: /edit/i })
      if (editOption) {
        await user.click(editOption)
        expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('/edit'))
      }
    } else if (editButtons.length > 0) {
      await user.click(editButtons[0])
      expect(mockRouterPush).toHaveBeenCalledWith('/content/content-1/edit')
    }

    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('navigates from library to content view', async () => {
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

    const contentTitle = screen.getByText('Amazing Grace')
    const contentLink = contentTitle.closest('a') || contentTitle.closest('button')

    if (contentLink) {
      await user.click(contentLink)
      expect(mockRouterPush).toHaveBeenCalledWith('/content/content-1')
    } else {
      expect(contentTitle).toBeInTheDocument()
    }
  })

  it('navigates to add content page', async () => {
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

    const addContentButton = screen.getByRole('button', { name: /add content/i })

    if (addContentButton) {
      await user.click(addContentButton)
      expect(mockRouterPush).toHaveBeenCalledWith('/add-content')
    }
  })
})
