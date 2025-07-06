import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, vi, describe, it, beforeEach, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)
import { cleanup } from '@testing-library/react'

const push = vi.fn()
const signUp = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push })
}))

// Mock both exports from the Firebase auth context
vi.mock('@/contexts/firebase-auth-context', () => ({
  useFirebaseAuth: () => ({ 
    signUp,
    user: null,
    loading: false,
    error: null
  }),
  useAuth: () => ({ 
    signUp,
    user: null,
    loading: false,
    error: null
  })
}))

import { SignupForm } from '../signup-form'

beforeEach(() => {
  push.mockReset()
  signUp.mockReset()
})
afterEach(cleanup)

describe('SignupForm', () => {
  it('submits data and redirects to / on success when email is verified', async () => {
    signUp.mockResolvedValue({ error: null, data: { user: { id: 'user1', emailVerified: true } } })
    render(<SignupForm />)
    
    // Fill required fields
    await userEvent.type(screen.getByLabelText(/first name/i), 'John')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getAllByLabelText(/^password$/i)[0], 'secret123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith('user@example.com', 'secret123', expect.objectContaining({
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      }))
    })
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/')
    })
  })

  it('redirects to confirm-email when email is not verified', async () => {
    signUp.mockResolvedValue({ error: null, data: { user: { id: 'user1', emailVerified: false } } })
    render(<SignupForm />)
    
    // Fill required fields
    await userEvent.type(screen.getByLabelText(/first name/i), 'John')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getAllByLabelText(/^password$/i)[0], 'secret123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(signUp).toHaveBeenCalled())
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/signup/confirm-email')
    })
  })

  it('shows error when passwords do not match', async () => {
    render(<SignupForm />)
    
    // Fill required fields with mismatched passwords
    await userEvent.type(screen.getByLabelText(/first name/i), 'John')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getAllByLabelText(/^password$/i)[0], 'secret123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('shows error returned from signUp', async () => {
    signUp.mockResolvedValue({ error: { message: 'Email already exists' }, data: null })
    render(<SignupForm />)
    
    // Fill required fields
    await userEvent.type(screen.getByLabelText(/first name/i), 'John')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getAllByLabelText(/^password$/i)[0], 'secret123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(signUp).toHaveBeenCalled())
    expect(await screen.findByText('Email already exists')).toBeInTheDocument()
  })
})
