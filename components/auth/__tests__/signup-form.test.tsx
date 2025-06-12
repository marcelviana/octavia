import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
const push = vi.fn()
const signUp = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push })
}))
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ signUp })
}))

import { SignupForm } from '../signup-form'

beforeEach(() => {
  push.mockReset()
  signUp.mockReset()
})

describe('SignupForm', () => {
  it('submits data and redirects to / on success', async () => {
    signUp.mockResolvedValue({ error: null, data: { user: {}, session: {} } })
    render(<SignupForm />)
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'secret')
    await userEvent.click(screen.getAllByRole('button', { name: /create account/i })[0])

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith('jane@example.com', 'secret', expect.objectContaining({
        first_name: 'Jane',
        last_name: 'Doe'
      }))
      expect(push).toHaveBeenCalledWith('/')
    })
  })

  it('redirects to confirm-email when no session returned', async () => {
    signUp.mockResolvedValue({ error: null, data: { user: {}, session: null } })
    render(<SignupForm />)
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'secret')
    await userEvent.click(screen.getAllByRole('button', { name: /create account/i })[0])

    await waitFor(() => {
      expect(signUp).toHaveBeenCalled()
      expect(push).toHaveBeenCalledWith('/signup/confirm-email')
    })
  })

  it('shows error when passwords do not match', async () => {
    render(<SignupForm />)
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'mismatch')
    await userEvent.click(screen.getAllByRole('button', { name: /create account/i })[0])

    expect(signUp).not.toHaveBeenCalled()
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('shows error returned from signUp', async () => {
    signUp.mockResolvedValue({ error: { message: 'failed' }, data: null })
    render(<SignupForm />)
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'secret')
    await userEvent.click(screen.getAllByRole('button', { name: /create account/i })[0])

    expect(await screen.findByText('failed')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })
})
