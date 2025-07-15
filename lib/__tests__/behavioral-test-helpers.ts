import { screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { UserEvent } from '@testing-library/user-event'

/**
 * Test helpers for common behavioral patterns
 * These helpers focus on user actions and expected behaviors rather than implementation details
 */

export const testUserInteraction = {
  /**
   * Tests the complete favorite workflow for content items
   */
  async favoriteContent(contentTitle: string, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    // Find the content item
    const contentItem = screen.getByText(contentTitle).closest('[data-testid="content-item"]') ||
                       screen.getByText(contentTitle).closest('article') ||
                       screen.getByText(contentTitle).closest('div')
    
    expect(contentItem).toBeTruthy()
    
    // Find the favorite button within the content item
    const favoriteButton = within(contentItem as HTMLElement).getByRole('button', { 
      name: /favorite|star/i 
    })
    
    // Get initial state
    const initialState = favoriteButton.getAttribute('aria-pressed') === 'true'
    
    // Click the favorite button
    await act(async () => {
      await userEventInstance.click(favoriteButton)
    })
    
    return {
      button: favoriteButton,
      wasInitiallyFavorited: initialState,
      expectedNewState: !initialState
    }
  },

  /**
   * Tests content navigation workflow
   */
  async navigateToContent(contentTitle: string, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    const contentLink = screen.getByText(contentTitle)
    expect(contentLink).toBeInTheDocument()
    
    await act(async () => {
      await userEventInstance.click(contentLink)
    })
    
    return contentLink
  },

  /**
   * Tests content deletion workflow with confirmation
   */
  async deleteContent(contentTitle: string, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    // Find the content item
    const contentItem = screen.getByText(contentTitle).closest('[data-testid="content-item"]') ||
                       screen.getByText(contentTitle).closest('article')
    
    expect(contentItem).toBeTruthy()
    
    // Find and click delete button
    const deleteButton = within(contentItem as HTMLElement).getByRole('button', { 
      name: /delete|remove/i 
    })
    
    await act(async () => {
      await userEventInstance.click(deleteButton)
    })
    
    // Handle confirmation dialog if it appears
    const confirmButton = screen.queryByRole('button', { name: /confirm|yes|delete/i })
    if (confirmButton) {
      await act(async () => {
        await userEventInstance.click(confirmButton)
      })
    }
    
    return {
      deleteButton,
      hadConfirmation: !!confirmButton
    }
  },

  /**
   * Tests form submission with validation
   */
  async submitForm(formData: Record<string, string>, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    // Fill form fields
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i')) ||
                   screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') }) ||
                   screen.getByPlaceholderText(new RegExp(fieldName, 'i'))
      
      expect(field).toBeInTheDocument()
      
      await act(async () => {
        await userEventInstance.clear(field)
        await userEventInstance.type(field, value)
      })
    }
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit|save|create|sign in|login/i })
    
    await act(async () => {
      await userEventInstance.click(submitButton)
    })
    
    return {
      submitButton,
      formData
    }
  },

  /**
   * Tests search functionality
   */
  async performSearch(searchTerm: string, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    const searchInput = screen.getByRole('searchbox') ||
                       screen.getByPlaceholderText(/search/i) ||
                       screen.getByLabelText(/search/i)
    
    expect(searchInput).toBeInTheDocument()
    
    await act(async () => {
      await userEventInstance.clear(searchInput)
      await userEventInstance.type(searchInput, searchTerm)
    })
    
    // Trigger search (enter key or search button)
    const searchButton = screen.queryByRole('button', { name: /search/i })
    if (searchButton) {
      await act(async () => {
        await userEventInstance.click(searchButton)
      })
    } else {
      await act(async () => {
        await userEventInstance.keyboard('{Enter}')
      })
    }
    
    return {
      searchInput,
      searchTerm
    }
  },

  /**
   * Tests tab navigation
   */
  async switchTab(tabName: string, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    const tab = screen.getByRole('tab', { name: new RegExp(tabName, 'i') })
    expect(tab).toBeInTheDocument()
    
    await act(async () => {
      await userEventInstance.click(tab)
    })
    
    return tab
  },

  /**
   * Tests file upload workflow
   */
  async uploadFile(file: File, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    const fileInput = screen.getByLabelText(/upload|choose file/i) ||
                     screen.getByRole('button', { name: /upload/i })
    
    expect(fileInput).toBeInTheDocument()
    
    await act(async () => {
      await userEventInstance.upload(fileInput, file)
    })
    
    return fileInput
  }
}

export const testFormValidation = {
  /**
   * Tests form validation workflow
   */
  async validateRequiredFields(requiredFields: string[], user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /submit|save|create|sign in|login/i })
    
    await act(async () => {
      await userEventInstance.click(submitButton)
    })
    
    // Check for validation errors
    const errors = requiredFields.map(field => ({
      field,
      error: screen.queryByText(new RegExp(`${field}.*required`, 'i'))
    }))
    
    return errors
  },

  /**
   * Tests field format validation
   */
  async validateFieldFormat(fieldName: string, invalidValue: string, expectedError: string, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    const field = screen.getByLabelText(new RegExp(fieldName, 'i')) ||
                 screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') })
    
    await act(async () => {
      await userEventInstance.clear(field)
      await userEventInstance.type(field, invalidValue)
      await userEventInstance.tab() // Trigger validation
    })
    
    const errorMessage = screen.queryByText(new RegExp(expectedError, 'i'))
    
    return {
      field,
      errorMessage,
      hasError: !!errorMessage
    }
  }
}

export const testErrorHandling = {
  /**
   * Tests error state display and recovery
   */
  async triggerAndRecoverFromError(triggerAction: () => Promise<void>, user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    // Trigger error
    await act(async () => {
      await triggerAction()
    })
    
    // Check for error message
    const errorMessage = screen.queryByText(/error|failed|something went wrong/i)
    const retryButton = screen.queryByRole('button', { name: /retry|try again/i })
    
    // Attempt recovery if retry button exists
    if (retryButton) {
      await act(async () => {
        await userEventInstance.click(retryButton)
      })
    }
    
    return {
      errorMessage,
      retryButton,
      hasRetryOption: !!retryButton
    }
  }
}

export const testAsyncStates = {
  /**
   * Tests loading states and transitions
   */
  async testLoadingState(triggerAction: () => Promise<void>) {
    // Check initial state
    const initialLoadingIndicator = screen.queryByRole('progressbar') ||
                                   screen.queryByText(/loading/i)
    
    // Trigger async action
    const actionPromise = act(async () => {
      await triggerAction()
    })
    
    // Check loading state appears
    const loadingIndicator = screen.queryByRole('progressbar') ||
                           screen.queryByText(/loading/i)
    
    // Wait for action to complete
    await actionPromise
    
    // Check loading state disappears
    const finalLoadingIndicator = screen.queryByRole('progressbar') ||
                                screen.queryByText(/loading/i)
    
    return {
      hadInitialLoading: !!initialLoadingIndicator,
      showedLoadingDuringAction: !!loadingIndicator,
      hidLoadingAfterAction: !finalLoadingIndicator
    }
  }
}

export const testAccessibility = {
  /**
   * Tests keyboard navigation
   */
  async testKeyboardNavigation(user?: UserEvent) {
    const userEventInstance = user || userEvent.setup()
    
    // Test tab navigation
    await act(async () => {
      await userEventInstance.keyboard('{Tab}')
    })
    
    const focusedElement = document.activeElement
    
    // Test enter key activation
    await act(async () => {
      await userEventInstance.keyboard('{Enter}')
    })
    
    return {
      focusedElement,
      canNavigateWithKeyboard: focusedElement !== document.body
    }
  },

  /**
   * Tests ARIA labels and roles
   */
  checkAriaLabels(element: HTMLElement) {
    const hasAriaLabel = element.getAttribute('aria-label') ||
                        element.getAttribute('aria-labelledby')
    
    const hasRole = element.getAttribute('role')
    
    return {
      hasAriaLabel: !!hasAriaLabel,
      hasRole: !!hasRole,
      ariaLabel: hasAriaLabel,
      role: hasRole
    }
  }
}

/**
 * Utility functions for behavioral testing
 */
export const behavioralUtils = {
  /**
   * Wait for element to appear and be interactive
   */
  async waitForInteractiveElement(selector: string, timeout = 5000) {
    const element = await screen.findByText(selector, undefined, { timeout })
    expect(element).toBeInTheDocument()
    expect(element).not.toBeDisabled()
    return element
  },

  /**
   * Check if element has proper visual state
   */
  checkVisualState(element: HTMLElement, expectedState: 'active' | 'inactive' | 'selected' | 'disabled') {
    const classList = Array.from(element.classList)
    
    const stateIndicators = {
      active: ['active', 'bg-primary', 'text-primary'],
      inactive: ['inactive', 'bg-secondary', 'text-secondary'],
      selected: ['selected', 'bg-accent', 'text-accent'],
      disabled: ['disabled', 'opacity-50', 'cursor-not-allowed']
    }
    
    const expectedIndicators = stateIndicators[expectedState]
    const hasStateIndicator = expectedIndicators.some(indicator => 
      classList.some(cls => cls.includes(indicator))
    )
    
    return {
      hasVisualState: hasStateIndicator,
      classList,
      expectedState
    }
  },

  /**
   * Mock API responses for testing
   */
  createMockApiResponse(data: any, delay = 0) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay)
    })
  },

  /**
   * Create test content data
   */
  createTestContent(overrides = {}) {
    return {
      id: 'test-content-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      content_type: 'lyrics' as const,
      content: 'Test lyrics content',
      is_favorite: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      ...overrides
    }
  },

  /**
   * Create test user data
   */
  createTestUser(overrides = {}) {
    return {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      ...overrides
    }
  }
} 