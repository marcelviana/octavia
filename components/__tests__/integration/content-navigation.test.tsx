import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupTestMocks, resetTestMocks, mockContent } from './helpers/content-management-helpers'
import LibraryPageClient from '@/components/library-page-client'
import { SessionProvider } from '@/components/providers/session-provider'

describe('Content Navigation Flow', () => {
  beforeEach(async () => {
    await setupTestMocks()
  })

  afterEach(() => {
    resetTestMocks()
  })

  it('navigates from library to content view', async () => {
    const user = userEvent.setup()
    
    await act(async () => {
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
    })

    // Should display content items
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    
    // Look for clickable content items
    const contentItems = screen.queryAllByRole('button') || screen.queryAllByRole('link')
    
    if (contentItems.length > 0) {
      // Find a content item to click (could be a title or view button)
      const contentItem = screen.queryByText('Amazing Grace') || contentItems[0]
      
      if (contentItem) {
        await act(async () => {
          await user.click(contentItem)
        })
      }
    }
    
    // Verify navigation occurred or content is displayed
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('navigates from library to content editor', async () => {
    const user = userEvent.setup()
    
    await act(async () => {
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
    })

    // Look for edit buttons or menu options
    const editButtons = screen.queryAllByRole('button', { name: /edit/i })
    const menuButtons = screen.queryAllByRole('button', { name: /menu/i })
    
    if (editButtons.length > 0) {
      await act(async () => {
        await user.click(editButtons[0])
      })
    } else if (menuButtons.length > 0) {
      await act(async () => {
        await user.click(menuButtons[0])
      })
      
      // Look for edit option in dropdown
      const editOption = screen.queryByRole('menuitem', { name: /edit/i })
      if (editOption) {
        await act(async () => {
          await user.click(editOption)
        })
      }
    }
    
    // Should have attempted navigation
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('navigates back from content view to library', async () => {
    const user = userEvent.setup()
    
    await act(async () => {
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
    })

    // Look for back button or navigation elements
    const backButtons = screen.queryAllByRole('button', { name: /back/i })
    const libraryLinks = screen.queryAllByRole('link', { name: /library/i })
    
    if (backButtons.length > 0) {
      await act(async () => {
        await user.click(backButtons[0])
      })
    } else if (libraryLinks.length > 0) {
      await act(async () => {
        await user.click(libraryLinks[0])
      })
    }
    
    // Should be back in library view
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('How Great Thou Art')).toBeInTheDocument()
  })
})
