import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

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

// Mock validation utilities
vi.mock('@/lib/validation-utils', () => ({
  validateRequestBody: vi.fn(),
  createValidationErrorResponse: vi.fn(() => 
    new Response(JSON.stringify({ error: 'Validation failed' }), { status: 400 })
  ),
  createUnauthorizedResponse: vi.fn(() => 
    new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  ),
  createServerErrorResponse: vi.fn((message: string) => 
    new Response(JSON.stringify({ error: message }), { status: 500 })
  )
}))

// Mock validation schemas
vi.mock('@/lib/validation-schemas', () => ({
  createProfileSchema: {},
  updateProfileSchema: {}
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  withRateLimit: vi.fn((handler) => handler)
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Import the actual route handlers
import { GET, POST, PATCH } from '../route'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { validateRequestBody } from '@/lib/validation-utils'
import logger from '@/lib/logger'

// Get mocked functions for type safety
const mockVerifyFirebaseToken = vi.mocked(verifyFirebaseToken)
const mockValidateRequestBody = vi.mocked(validateRequestBody)
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/profile', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

      const request = new NextRequest('http://localhost:3000/api/profile', {
        headers: { authorization: 'Bearer invalid-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
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
        display_name: 'Test User',
        bio: 'A test user profile',
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
        display_name: 'Cookie User'
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
      mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: { authorization: 'Bearer invalid-token' },
        body: JSON.stringify({ display_name: 'Test User' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('creates profile successfully with valid data', async () => {
      const profileInput = {
        display_name: 'New User',
        bio: 'A new user joining the platform',
        website: 'https://example.com'
      }

      const mockProfile = {
        id: mockUser.uid,
        email: mockUser.email,
        ...profileInput,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockValidateRequestBody.mockResolvedValue({
        success: true,
        data: profileInput
      })
      mockSingle.mockResolvedValue({ data: mockProfile, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: JSON.stringify(profileInput)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProfile)
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUser.uid,
        email: mockUser.email,
        ...profileInput
      }))
    })

    it('returns validation error for invalid data', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockValidateRequestBody.mockResolvedValue({
        success: false,
        errors: ['Display name is required'],
        details: {} as any
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: JSON.stringify({ bio: 'No display name' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Validation failed' })
    })

    it('handles database errors during creation', async () => {
      const profileInput = { display_name: 'Test User' }

      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockValidateRequestBody.mockResolvedValue({
        success: true,
        data: profileInput
      })
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { message: 'Duplicate key violation' } 
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: JSON.stringify(profileInput)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create profile' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('handles invalid JSON gracefully', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: 'invalid json{'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create profile' })
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('PATCH /api/profile', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: { authorization: 'Bearer invalid-token' },
        body: JSON.stringify({ display_name: 'Updated Name' })
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('updates profile successfully with valid data', async () => {
      const updateData = {
        display_name: 'Updated User',
        bio: 'Updated bio'
      }

      const mockUpdatedProfile = {
        id: mockUser.uid,
        email: mockUser.email,
        ...updateData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockValidateRequestBody.mockResolvedValue({
        success: true,
        data: updateData,
        errors: []
      })
      mockSingle.mockResolvedValue({ data: mockUpdatedProfile, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: { authorization: 'Bearer valid-token' },
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

    it('returns validation error for invalid update data', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockValidateRequestBody.mockResolvedValue({
        success: false,
        data: null,
        errors: ['Bio too long']
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: { authorization: 'Bearer valid-token' },
        body: JSON.stringify({ bio: 'x'.repeat(1000) })
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Validation failed' })
    })

    it('handles database errors during update', async () => {
      const updateData = { display_name: 'Updated Name' }

      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockValidateRequestBody.mockResolvedValue({
        success: true,
        data: updateData,
        errors: []
      })
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { message: 'Profile not found' } 
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: { authorization: 'Bearer valid-token' },
        body: JSON.stringify(updateData)
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update profile' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('handles partial updates correctly', async () => {
      const partialUpdate = { bio: 'Only updating bio' }

      const mockUpdatedProfile = {
        id: mockUser.uid,
        email: mockUser.email,
        display_name: 'Existing Name',
        bio: 'Only updating bio',
        updated_at: '2024-01-02T00:00:00Z'
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockUser)
      mockValidateRequestBody.mockResolvedValue({
        success: true,
        data: partialUpdate,
        errors: []
      })
      mockSingle.mockResolvedValue({ data: mockUpdatedProfile, error: null })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: { authorization: 'Bearer valid-token' },
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