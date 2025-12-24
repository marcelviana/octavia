/**
 * Test utilities for rendering components with authentication context
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { mockAuthContextValue, mockUser, mockProfile } from '@/src/test-setup'

/**
 * Custom render function that provides auth context
 * Use this for integration tests that need auth
 */
export function renderWithAuth(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, options)
}

/**
 * Export mock values for use in tests
 */
export { mockAuthContextValue, mockUser, mockProfile }

/**
 * Helper to create custom mock user
 */
export function createMockUser(overrides: Partial<typeof mockUser> = {}) {
  return {
    ...mockUser,
    ...overrides
  }
}

/**
 * Helper to create custom mock profile
 */
export function createMockProfile(overrides: Partial<typeof mockProfile> = {}) {
  return {
    ...mockProfile,
    ...overrides
  }
}

