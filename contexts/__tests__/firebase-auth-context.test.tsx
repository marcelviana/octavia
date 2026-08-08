import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// O test-setup global substitui o context por um mock; aqui testamos o real
vi.unmock('@/contexts/firebase-auth-context')

const mockCreateUser = vi.fn()
const mockGetIdToken = vi.fn()
const mockSendEmailVerification = vi.fn()
const mockUpdateFirebaseProfile = vi.fn()
const mockOnAuthStateChanged = vi.fn()

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  getIdToken: (...args: unknown[]) => mockGetIdToken(...args),
  updateProfile: (...args: unknown[]) => mockUpdateFirebaseProfile(...args),
  sendEmailVerification: (...args: unknown[]) => mockSendEmailVerification(...args)
}))

vi.mock('@/lib/firebase', () => ({
  auth: {},
  isFirebaseConfigured: true
}))

vi.mock('@/lib/offline-cache', () => ({
  clearOfflineContent: vi.fn()
}))

vi.mock('@/lib/offline-setlist-cache', () => ({
  clearOfflineSetlists: vi.fn()
}))

vi.mock('@/lib/firebase-session-cookies', () => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn()
}))

vi.mock('@/lib/logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

import { FirebaseAuthProvider, useFirebaseAuth } from '@/contexts/firebase-auth-context'
import logger from '@/lib/logger'

const mockLogger = vi.mocked(logger)

describe('firebase-auth-context signUp', () => {
  const userData = {
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    primary_instrument: 'Guitar'
  }

  let mockDelete: ReturnType<typeof vi.fn>
  let mockFirebaseUser: {
    uid: string
    email: string
    emailVerified: boolean
    delete: ReturnType<typeof vi.fn>
  }

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
  )

  const renderAuthHook = () => renderHook(() => useFirebaseAuth(), { wrapper })

  beforeEach(() => {
    vi.clearAllMocks()

    mockDelete = vi.fn().mockResolvedValue(undefined)
    mockFirebaseUser = {
      uid: 'new-user-uid',
      email: 'new-user@example.com',
      emailVerified: false,
      delete: mockDelete
    }

    // O listener não precisa disparar para os cenários de signUp
    mockOnAuthStateChanged.mockReturnValue(() => {})
    mockCreateUser.mockResolvedValue({ user: mockFirebaseUser })
    mockGetIdToken.mockResolvedValue('fresh-id-token')
    mockSendEmailVerification.mockResolvedValue(undefined)
    mockUpdateFirebaseProfile.mockResolvedValue(undefined)
  })

  it('BUG(profile-create): deletes the Firebase user when POST /api/profile fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const { result } = renderAuthHook()

    let signUpResult: { error: any; data: any } | undefined
    await act(async () => {
      signUpResult = await result.current.signUp('new-user@example.com', 'password123', userData)
    })

    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(signUpResult?.data).toBeNull()
    expect(signUpResult?.error?.message).toBe('Failed to create profile in database')

    vi.unstubAllGlobals()
  })

  it('BUG(profile-create): returns the POST error (not the delete error) when the rollback delete also fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    mockDelete.mockRejectedValue(new Error('network error during delete'))

    const { result } = renderAuthHook()

    let signUpResult: { error: any; data: any } | undefined
    await act(async () => {
      signUpResult = await result.current.signUp('new-user@example.com', 'password123', userData)
    })

    expect(mockDelete).toHaveBeenCalledTimes(1)
    // O caller recebe o erro original do POST, não o do delete
    expect(signUpResult?.error?.message).toBe('Failed to create profile in database')
    expect(signUpResult?.error?.message).not.toContain('network error during delete')
    // O erro do delete é apenas logado
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete orphaned Firebase user'),
      expect.objectContaining({ message: 'network error during delete' })
    )

    vi.unstubAllGlobals()
  })

  it('BUG(profile-create): never deletes the Firebase user when POST succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'new-user-uid' })
    }))

    const { result } = renderAuthHook()

    let signUpResult: { error: any; data: any } | undefined
    await act(async () => {
      signUpResult = await result.current.signUp('new-user@example.com', 'password123', userData)
    })

    expect(mockDelete).not.toHaveBeenCalled()
    expect(signUpResult?.error).toBeNull()
    expect(signUpResult?.data?.user).toBe(mockFirebaseUser)

    // Sanidade: o POST foi feito com o payload real do signup
    const fetchMock = vi.mocked(global.fetch)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/profile')
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      ...userData,
      id: 'new-user-uid',
      email: 'new-user@example.com'
    })

    vi.unstubAllGlobals()
  })
})
