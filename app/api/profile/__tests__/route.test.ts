import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

// Mock Supabase service
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

// Set up the chain properly for all Supabase operations
mockSelect.mockReturnValue({
  eq: mockEq,
  single: mockSingle
})
mockEq.mockReturnValue({
  select: mockSelect,
  single: mockSingle
})
mockInsert.mockReturnValue({
  select: mockSelect,
  single: mockSingle
})
mockUpdate.mockReturnValue({
  eq: mockEq,
  select: mockSelect,
  single: mockSingle
})
mockFrom.mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate
})

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => ({ from: mockFrom })
}))

// Mock Firebase admin
vi.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: vi.fn()
}))

// Mock rate limiting
vi.mock('@/lib/user-rate-limit', async () => {
  const actual = await vi.importActual('@/lib/user-rate-limit')
  return {
    ...(actual as object),
    // B1.3: limites neutralizados nos testes de rota (o contrato do
    // limiter tem suite propria em lib/__tests__/user-rate-limit.test.ts)
    enforceUserLimit: vi.fn(() => null),
    checkRateLimit: vi.fn(() => ({ ok: true, scope: 'user', limit: 999, remaining: 999, resetTime: Date.now() + 60000 })),
    authFailureLimited: vi.fn(() => false),
    recordAuthFailure: vi.fn(),
    getAuthFailureLimit: vi.fn(() => null)
  }
})

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn()
  }
}))

// Import the actual route handlers
import { GET, POST, PATCH } from '../route'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import logger from '@/lib/logger'

// Get mocked functions for type safety
const mockVerifyFirebaseToken = vi.mocked(verifyFirebaseToken)
const mockLogger = vi.mocked(logger)

describe('/api/profile', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    email_verified: true,
    aud: 'test-project',
    auth_time: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    firebase: {
      identities: { email: ['test@example.com'] },
      sign_in_provider: 'google.com'
    },
    iss: 'https://securetoken.google.com/test-project',
    sub: 'test-user-123',
    iat: Math.floor(Date.now() / 1000)
  }

  // Payload REAL enviado pelo signUp em contexts/firebase-auth-context.tsx:
  // { ...userData, id, email } onde userData vem de components/auth/signup-panel.tsx
  const realSignupPayload = {
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    primary_instrument: 'Guitar',
    id: 'test-user-123',
    email: 'test@example.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/profile', () => {
    it('returns 401 when user is not authenticated', async () => {
      // Override the global mock to return null (unauthenticated)
      mockRequireAuthServerSecure.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        headers: { authorization: 'Bearer invalid-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeTruthy()
      expect(data.error).toMatch(/Unauthorized|Authentication required/)
    })

    it('returns null when profile does not exist', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        headers: { authorization: 'Bearer valid-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeNull()
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.uid)
    })

    it('returns profile when it exists', async () => {
      const mockProfile = {
        id: mockUser.uid,
        email: mockUser.email,
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValue({ data: mockProfile, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        headers: { authorization: 'Bearer valid-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProfile)
    })

    it('handles database errors gracefully', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' }
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        headers: { authorization: 'Bearer valid-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('works with session cookie authentication', async () => {
      const mockProfile = {
        id: mockUser.uid,
        email: mockUser.email,
        full_name: 'Cookie User'
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValue({ data: mockProfile, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        headers: { cookie: 'firebase-session=valid-session-token; other=value' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProfile)
    })
  })

  describe('POST /api/profile', () => {
    it('returns 401 when user is not authenticated', async () => {
      // Override the global mock to return null (unauthenticated)
      mockRequireAuthServerSecure.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(realSignupPayload)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeTruthy()
      expect(data.error).toMatch(/Unauthorized|Authentication required/)
    })

    it('BUG(profile-create): creates profile with the real signup payload (first_name/last_name)', async () => {
      const mockProfile = {
        id: mockUser.uid,
        email: mockUser.email,
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        primary_instrument: 'Guitar',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSingle.mockResolvedValue({ data: mockProfile, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(realSignupPayload)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockProfile)
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      // O insert deve preservar os campos do signup — o schema de validação
      // não pode descartá-los silenciosamente
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUser.uid,
        email: mockUser.email,
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        primary_instrument: 'Guitar'
      }))
    })

    it('BUG(profile-create): ignores client-provided id/email and uses the authenticated user', async () => {
      mockSingle.mockResolvedValue({ data: {}, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          ...realSignupPayload,
          id: 'spoofed-id',
          email: 'spoofed@evil.com'
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUser.uid,
        email: mockUser.email
      }))
    })

    it('BUG(profile-create): returns validation error for invalid data', async () => {
      // Se o insert acontecer (comportamento bugado), não deixa o teste
      // quebrar por outro motivo — a asserção é sobre o status 400
      mockSingle.mockResolvedValue({ data: {}, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ first_name: 'x'.repeat(200) })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('handles database errors during creation', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key violation' }
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(realSignupPayload)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create profile' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('handles invalid JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: 'invalid json{'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/profile', () => {
    it('returns 401 when user is not authenticated', async () => {
      // Override the global mock to return null (unauthenticated)
      mockRequireAuthServerSecure.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          authorization: 'Bearer invalid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ first_name: 'Updated' })
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeTruthy()
      expect(data.error).toMatch(/Unauthorized|Authentication required/)
    })

    it('BUG(profile-create): updates profile with real profile fields (first_name/last_name)', async () => {
      // Payload real de updateProfile em contexts/firebase-auth-context.tsx (Partial<Profile>)
      const updateData = {
        first_name: 'Updated',
        last_name: 'Person',
        full_name: 'Updated Person'
      }

      const mockUpdatedProfile = {
        id: mockUser.uid,
        email: mockUser.email,
        ...updateData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }

      mockSingle.mockResolvedValue({ data: mockUpdatedProfile, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockUpdatedProfile)
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updated_at: expect.any(String)
      }))
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.uid)
    })

    it('BUG(profile-create): returns validation error for invalid update data', async () => {
      mockSingle.mockResolvedValue({ data: {}, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ bio: 'x'.repeat(3000) })
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('handles database errors during update', async () => {
      const updateData = { first_name: 'Updated' }

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update profile' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('BUG(profile-create): handles partial updates correctly', async () => {
      const partialUpdate = { bio: 'Only updating bio' }

      const mockUpdatedProfile = {
        id: mockUser.uid,
        email: mockUser.email,
        first_name: 'Existing',
        bio: 'Only updating bio',
        updated_at: '2024-01-02T00:00:00Z'
      }

      mockSingle.mockResolvedValue({ data: mockUpdatedProfile, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(partialUpdate)
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockUpdatedProfile)
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        bio: 'Only updating bio',
        updated_at: expect.any(String)
      }))
    })
  })
})
