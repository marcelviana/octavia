import { expect } from 'vitest'

/**
 * Custom matchers for behavioral testing
 * These matchers focus on user-perceivable behavior rather than implementation details
 */

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInFavoriteState(): T
    toBeInLoadingState(): T
    toBeInErrorState(): T
    toBeInteractive(): T
    toBeAccessible(): T
    toShowValidationError(message?: string): T
    toBeVisuallySelected(): T
    toBeVisuallyDisabled(): T
    toHaveAriaLabel(label?: string): T
    toHaveProperFocus(): T
    toBeInUploadState(state: 'idle' | 'uploading' | 'success' | 'error'): T
    toBeInContentState(state: 'empty' | 'loading' | 'loaded' | 'error'): T
  }
}

/**
 * Custom matcher to check if an element is in favorite state
 */
export const toBeInFavoriteState = (element: HTMLElement) => {
  const isPressed = element.getAttribute('aria-pressed') === 'true'
  const hasVisualIndicator = element.classList.contains('text-amber-500') || 
                            element.classList.contains('fill-amber-500') ||
                            element.classList.contains('bg-amber-500')
  
  const hasStarIcon = element.querySelector('.lucide-star') !== null
  
  return {
    pass: isPressed && hasVisualIndicator && hasStarIcon,
    message: () => 
      `Expected element to be in favorite state but:\n` +
      `- aria-pressed: ${element.getAttribute('aria-pressed')}\n` +
      `- has visual indicator: ${hasVisualIndicator}\n` +
      `- has star icon: ${hasStarIcon}`
  }
}

/**
 * Custom matcher to check if an element is in loading state
 */
export const toBeInLoadingState = (element: HTMLElement) => {
  const hasLoadingIndicator = element.querySelector('[role="progressbar"]') !== null ||
                             element.querySelector('.animate-spin') !== null ||
                             element.textContent?.includes('Loading') ||
                             element.textContent?.includes('loading')
  
  const isDisabled = element.hasAttribute('disabled') || 
                    element.getAttribute('aria-disabled') === 'true'
  
  return {
    pass: hasLoadingIndicator || isDisabled,
    message: () => 
      `Expected element to be in loading state but:\n` +
      `- has loading indicator: ${hasLoadingIndicator}\n` +
      `- is disabled: ${isDisabled}`
  }
}

/**
 * Custom matcher to check if an element is in error state
 */
export const toBeInErrorState = (element: HTMLElement) => {
  const hasErrorClass = element.classList.contains('error') ||
                       element.classList.contains('text-red-500') ||
                       element.classList.contains('border-red-500') ||
                       element.classList.contains('bg-red-50')
  
  const hasErrorIcon = element.querySelector('.lucide-alert-circle') !== null ||
                      element.querySelector('.lucide-x-circle') !== null
  
  const hasErrorMessage = element.textContent?.toLowerCase().includes('error') ||
                         element.textContent?.toLowerCase().includes('failed') ||
                         element.textContent?.toLowerCase().includes('invalid')
  
  const hasAriaInvalid = element.getAttribute('aria-invalid') === 'true'
  
  return {
    pass: hasErrorClass || hasErrorIcon || hasErrorMessage || hasAriaInvalid,
    message: () => 
      `Expected element to be in error state but:\n` +
      `- has error class: ${hasErrorClass}\n` +
      `- has error icon: ${hasErrorIcon}\n` +
      `- has error message: ${hasErrorMessage}\n` +
      `- has aria-invalid: ${hasAriaInvalid}`
  }
}

/**
 * Custom matcher to check if an element is interactive
 */
export const toBeInteractive = (element: HTMLElement) => {
  const isDisabled = element.hasAttribute('disabled') || 
                    element.getAttribute('aria-disabled') === 'true'
  
  const hasTabIndex = element.hasAttribute('tabindex') && 
                     element.getAttribute('tabindex') !== '-1'
  
  const isClickable = element.tagName === 'BUTTON' ||
                     element.tagName === 'A' ||
                     element.getAttribute('role') === 'button' ||
                     element.getAttribute('role') === 'link'
  
  const hasClickHandler = element.onclick !== null
  
  return {
    pass: !isDisabled && (hasTabIndex || isClickable || hasClickHandler),
    message: () => 
      `Expected element to be interactive but:\n` +
      `- is disabled: ${isDisabled}\n` +
      `- has tabindex: ${hasTabIndex}\n` +
      `- is clickable: ${isClickable}\n` +
      `- has click handler: ${hasClickHandler}`
  }
}

/**
 * Custom matcher to check if an element is accessible
 */
export const toBeAccessible = (element: HTMLElement) => {
  const hasAriaLabel = element.getAttribute('aria-label') !== null ||
                      element.getAttribute('aria-labelledby') !== null
  
  const hasRole = element.getAttribute('role') !== null
  
  const hasSemanticTag = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']
                        .includes(element.tagName)
  
  const hasKeyboardSupport = element.hasAttribute('tabindex') ||
                           ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
  
  return {
    pass: (hasAriaLabel || hasSemanticTag) && hasKeyboardSupport,
    message: () => 
      `Expected element to be accessible but:\n` +
      `- has aria label: ${hasAriaLabel}\n` +
      `- has semantic tag: ${hasSemanticTag}\n` +
      `- has keyboard support: ${hasKeyboardSupport}\n` +
      `- has role: ${hasRole}`
  }
}

/**
 * Custom matcher to check if an element shows validation error
 */
export const toShowValidationError = (element: HTMLElement, expectedMessage?: string) => {
  const hasAriaInvalid = element.getAttribute('aria-invalid') === 'true'
  const hasErrorClass = element.classList.contains('error') ||
                       element.classList.contains('border-red-500') ||
                       element.classList.contains('text-red-500')
  
  // Look for error message in nearby elements
  const parent = element.parentElement
  const errorElement = parent?.querySelector('[role="alert"]') ||
                      parent?.querySelector('.error-message') ||
                      parent?.querySelector('.text-red-500')
  
  const hasErrorMessage = errorElement !== null
  const errorText = errorElement?.textContent || ''
  
  const messageMatches = expectedMessage ? 
    errorText.toLowerCase().includes(expectedMessage.toLowerCase()) : 
    true
  
  return {
    pass: hasAriaInvalid && hasErrorMessage && messageMatches,
    message: () => 
      `Expected element to show validation error${expectedMessage ? ` "${expectedMessage}"` : ''} but:\n` +
      `- has aria-invalid: ${hasAriaInvalid}\n` +
      `- has error class: ${hasErrorClass}\n` +
      `- has error message: ${hasErrorMessage}\n` +
      `- error text: "${errorText}"\n` +
      `- message matches: ${messageMatches}`
  }
}

/**
 * Custom matcher to check if an element is visually selected
 */
export const toBeVisuallySelected = (element: HTMLElement) => {
  const hasSelectedClass = element.classList.contains('selected') ||
                          element.classList.contains('bg-primary') ||
                          element.classList.contains('bg-blue-500') ||
                          element.classList.contains('ring-2')
  
  const hasAriaSelected = element.getAttribute('aria-selected') === 'true'
  const hasAriaPressed = element.getAttribute('aria-pressed') === 'true'
  
  return {
    pass: hasSelectedClass || hasAriaSelected || hasAriaPressed,
    message: () => 
      `Expected element to be visually selected but:\n` +
      `- has selected class: ${hasSelectedClass}\n` +
      `- has aria-selected: ${hasAriaSelected}\n` +
      `- has aria-pressed: ${hasAriaPressed}`
  }
}

/**
 * Custom matcher to check if an element is visually disabled
 */
export const toBeVisuallyDisabled = (element: HTMLElement) => {
  const hasDisabledClass = element.classList.contains('disabled') ||
                          element.classList.contains('opacity-50') ||
                          element.classList.contains('cursor-not-allowed')
  
  const isDisabled = element.hasAttribute('disabled') ||
                    element.getAttribute('aria-disabled') === 'true'
  
  return {
    pass: hasDisabledClass && isDisabled,
    message: () => 
      `Expected element to be visually disabled but:\n` +
      `- has disabled class: ${hasDisabledClass}\n` +
      `- is disabled: ${isDisabled}`
  }
}

/**
 * Custom matcher to check if an element has proper aria label
 */
export const toHaveAriaLabel = (element: HTMLElement, expectedLabel?: string) => {
  const ariaLabel = element.getAttribute('aria-label')
  const ariaLabelledBy = element.getAttribute('aria-labelledby')
  
  const hasLabel = ariaLabel !== null || ariaLabelledBy !== null
  
  let labelMatches = true
  if (expectedLabel && ariaLabel) {
    labelMatches = ariaLabel.toLowerCase().includes(expectedLabel.toLowerCase())
  }
  
  return {
    pass: hasLabel && labelMatches,
    message: () => 
      `Expected element to have aria label${expectedLabel ? ` "${expectedLabel}"` : ''} but:\n` +
      `- aria-label: "${ariaLabel}"\n` +
      `- aria-labelledby: "${ariaLabelledBy}"\n` +
      `- label matches: ${labelMatches}`
  }
}

/**
 * Custom matcher to check if an element has proper focus
 */
export const toHaveProperFocus = (element: HTMLElement) => {
  const isFocused = document.activeElement === element
  const isFocusable = element.hasAttribute('tabindex') ||
                     ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
  
  const hasVisualFocus = element.classList.contains('focus:ring-2') ||
                        element.classList.contains('focus:outline-2') ||
                        window.getComputedStyle(element).outline !== 'none'
  
  return {
    pass: isFocused && isFocusable,
    message: () => 
      `Expected element to have proper focus but:\n` +
      `- is focused: ${isFocused}\n` +
      `- is focusable: ${isFocusable}\n` +
      `- has visual focus: ${hasVisualFocus}`
  }
}

/**
 * Custom matcher to check upload state
 */
export const toBeInUploadState = (element: HTMLElement, expectedState: 'idle' | 'uploading' | 'success' | 'error') => {
  const hasProgressBar = element.querySelector('[role="progressbar"]') !== null
  const hasSpinner = element.querySelector('.animate-spin') !== null
  const hasSuccessIcon = element.querySelector('.lucide-check') !== null
  const hasErrorIcon = element.querySelector('.lucide-x') !== null
  
  const stateIndicators = {
    idle: !hasProgressBar && !hasSpinner && !hasSuccessIcon && !hasErrorIcon,
    uploading: hasProgressBar || hasSpinner,
    success: hasSuccessIcon,
    error: hasErrorIcon
  }
  
  const isInExpectedState = stateIndicators[expectedState]
  
  return {
    pass: isInExpectedState,
    message: () => 
      `Expected element to be in upload state "${expectedState}" but:\n` +
      `- has progress bar: ${hasProgressBar}\n` +
      `- has spinner: ${hasSpinner}\n` +
      `- has success icon: ${hasSuccessIcon}\n` +
      `- has error icon: ${hasErrorIcon}`
  }
}

/**
 * Custom matcher to check content state
 */
export const toBeInContentState = (element: HTMLElement, expectedState: 'empty' | 'loading' | 'loaded' | 'error') => {
  const hasLoadingIndicator = element.querySelector('[role="progressbar"]') !== null ||
                             element.textContent?.includes('Loading')
  
  const hasContent = element.children.length > 0 && 
                    !element.textContent?.includes('No content') &&
                    !element.textContent?.includes('Empty')
  
  const hasEmptyMessage = element.textContent?.includes('No content') ||
                         element.textContent?.includes('Empty') ||
                         element.textContent?.includes('nothing to show')
  
  const hasErrorMessage = element.textContent?.includes('Error') ||
                         element.textContent?.includes('Failed') ||
                         element.querySelector('.text-red-500') !== null
  
  const stateIndicators = {
    empty: hasEmptyMessage && !hasContent,
    loading: hasLoadingIndicator,
    loaded: hasContent && !hasLoadingIndicator && !hasErrorMessage,
    error: hasErrorMessage
  }
  
  const isInExpectedState = stateIndicators[expectedState] || false
  
  return {
    pass: isInExpectedState,
    message: () => 
      `Expected element to be in content state "${expectedState}" but:\n` +
      `- has loading indicator: ${hasLoadingIndicator}\n` +
      `- has content: ${hasContent}\n` +
      `- has empty message: ${hasEmptyMessage}\n` +
      `- has error message: ${hasErrorMessage}`
  }
}

// Register all custom matchers
export function setupCustomMatchers() {
  expect.extend({
    toBeInFavoriteState,
    toBeInLoadingState,
    toBeInErrorState,
    toBeInteractive,
    toBeAccessible,
    toShowValidationError,
    toBeVisuallySelected,
    toBeVisuallyDisabled,
    toHaveAriaLabel,
    toHaveProperFocus,
    toBeInUploadState,
    toBeInContentState
  })
}

// Export individual matchers for direct use
export const customMatchers = {
  toBeInFavoriteState,
  toBeInLoadingState,
  toBeInErrorState,
  toBeInteractive,
  toBeAccessible,
  toShowValidationError,
  toBeVisuallySelected,
  toBeVisuallyDisabled,
  toHaveAriaLabel,
  toHaveProperFocus,
  toBeInUploadState,
  toBeInContentState
} 