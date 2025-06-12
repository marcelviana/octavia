import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, vi, describe, it, beforeEach, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)
import { cleanup } from '@testing-library/react'
const push = vi.fn()
const signIn = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push })
}))
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ signIn })
}))

import { LoginForm } from '../login-form'

beforeEach(() => {
  push.mockReset()
  signIn.mockReset()
})
afterEach(cleanup)

describe('LoginForm', () => {
  it('submits credentials and redirects on success', async () => {
    signIn.mockResolvedValue({ error: null })
    render(<LoginForm />)
    await userEvent.type(screen.getAllByLabelText(/email/i)[0], 'user@example.com')
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'secret')
    await userEvent.click(screen.getAllByRole('button', { name: /sign in/i })[0])

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('user@example.com', 'secret')
    })
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/')
    })
  })

  it('shows error when signIn fails', async () => {
    signIn.mockResolvedValue({ error: { message: 'bad creds' } })
    render(<LoginForm />)
    await userEvent.type(screen.getAllByLabelText(/email/i)[0], 'user@example.com')
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'secret')
    await userEvent.click(screen.getAllByRole('button', { name: /sign in/i })[0])

    await waitFor(() => expect(signIn).toHaveBeenCalled())
    expect(await screen.findByText('bad creds')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })
})
