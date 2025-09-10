import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Firebase admin functions
const mockCreateUser = vi.fn()
const mockUpdateUser = vi.fn()
const mockDeleteUser = vi.fn()
const mockGetUserByUid = vi.fn()
const mockVerifyFirebaseToken = vi.fn()

vi.mock('@/lib/firebase-admin', () => ({
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  deleteUser: mockDeleteUser,
  getUserByUid: mockGetUserByUid,
  verifyFirebaseToken: mockVerifyFirebaseToken
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  withRateLimit: vi.fn((handler) => handler)
}))

// Import the actual route handlers
import { GET, POST, PUT, DELETE } from '../route'

// Mock console to suppress error logs during tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalConsoleError
})

describe('/api/auth/user', () => {
  const mockAdmin = {
    uid: 'admin-user-123',
    email: 'admin@example.com',
    email_verified: true
  }

  const mockUserRecord = {
    uid: 'test-user-456',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    disabled: false,
    metadata: {
      creationTime: '2024-01-01T00:00:00Z',
      lastSignInTime: '2024-01-02T00:00:00Z'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/auth/user', () => {
    it('returns 401 when no authorization header is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/user?uid=test-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ 
        success: false, 
        error: 'Unauthorized' 
      })
    })

    it('returns 401 when authorization header is invalid', async () => {
      mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

      const request = new NextRequest('http://localhost:3000/api/auth/user?uid=test-123', {
        headers: { authorization: 'Bearer invalid-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ 
        success: false, 
        error: 'Unauthorized' 
      })
    })

    it('returns 400 when uid parameter is missing', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        headers: { authorization: 'Bearer valid-admin-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ 
        success: false, 
        error: 'Missing uid parameter' 
      })
    })

    it('returns user data when request is valid', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockGetUserByUid.mockResolvedValue(mockUserRecord)

      const request = new NextRequest('http://localhost:3000/api/auth/user?uid=test-user-456', {
        headers: { authorization: 'Bearer valid-admin-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: {
          uid: 'test-user-456',
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: true,
          disabled: false,
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-02T00:00:00Z'
        }
      })
      expect(mockGetUserByUid).toHaveBeenCalledWith('test-user-456')
    })

    it('handles Firebase admin errors gracefully', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockGetUserByUid.mockRejectedValue(new Error('User not found'))

      const request = new NextRequest('http://localhost:3000/api/auth/user?uid=nonexistent-user', {
        headers: { authorization: 'Bearer valid-admin-token' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'User not found'
      })
    })
  })

  describe('POST /api/auth/user', () => {
    it('returns 401 when not authenticated as admin', async () => {
      mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'POST',
        headers: { authorization: 'Bearer invalid-token' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123'
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized'
      })
    })

    it('returns 400 when email is missing', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify({
          password: 'password123',
          displayName: 'Test User'
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Email is required'
      })
    })

    it('creates user successfully with valid data', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        emailVerified: true
      }

      const createdUser = {
        uid: 'new-user-789',
        email: 'newuser@example.com',
        displayName: 'New User',
        emailVerified: true,
        disabled: false,
        metadata: {
          creationTime: '2024-01-03T00:00:00Z',
          lastSignInTime: null
        }
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockCreateUser.mockResolvedValue(createdUser)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify(newUserData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: {
          uid: 'new-user-789',
          email: 'newuser@example.com',
          displayName: 'New User',
          emailVerified: true,
          disabled: false,
          creationTime: '2024-01-03T00:00:00Z',
          lastSignInTime: null
        }
      })
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        emailVerified: true
      })
    })

    it('creates user with minimal data (email only)', async () => {
      const minimalUserData = {
        email: 'minimal@example.com'
      }

      const createdUser = {
        uid: 'minimal-user-101',
        email: 'minimal@example.com',
        displayName: undefined,
        emailVerified: false,
        disabled: false,
        metadata: {
          creationTime: '2024-01-03T00:00:00Z',
          lastSignInTime: null
        }
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockCreateUser.mockResolvedValue(createdUser)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify(minimalUserData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user?.email).toBe('minimal@example.com')
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'minimal@example.com',
        password: undefined,
        displayName: undefined,
        emailVerified: undefined
      })
    })

    it('handles Firebase admin creation errors', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockCreateUser.mockRejectedValue(new Error('Email already exists'))

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'password123'
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Email already exists'
      })
    })
  })

  describe('PUT /api/auth/user', () => {
    it('returns 401 when not authenticated as admin', async () => {
      mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'PUT',
        headers: { authorization: 'Bearer invalid-token' },
        body: JSON.stringify({
          uid: 'test-user-456',
          displayName: 'Updated Name'
        })
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized'
      })
    })

    it('returns 400 when uid is missing', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'PUT',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify({
          displayName: 'Updated Name',
          email: 'updated@example.com'
        })
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'UID is required'
      })
    })

    it('updates user successfully with valid data', async () => {
      const updateData = {
        uid: 'test-user-456',
        email: 'updated@example.com',
        displayName: 'Updated User',
        emailVerified: true,
        disabled: false
      }

      const updatedUser = {
        ...mockUserRecord,
        email: 'updated@example.com',
        displayName: 'Updated User'
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockUpdateUser.mockResolvedValue(updatedUser)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'PUT',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify(updateData)
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: {
          uid: 'test-user-456',
          email: 'updated@example.com',
          displayName: 'Updated User',
          emailVerified: true,
          disabled: false,
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-02T00:00:00Z'
        }
      })
      expect(mockUpdateUser).toHaveBeenCalledWith('test-user-456', {
        email: 'updated@example.com',
        displayName: 'Updated User',
        emailVerified: true,
        disabled: false
      })
    })

    it('handles partial updates correctly', async () => {
      const partialUpdate = {
        uid: 'test-user-456',
        displayName: 'Only Name Updated'
      }

      const updatedUser = {
        ...mockUserRecord,
        displayName: 'Only Name Updated'
      }

      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockUpdateUser.mockResolvedValue(updatedUser)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'PUT',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify(partialUpdate)
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user?.displayName).toBe('Only Name Updated')
      expect(mockUpdateUser).toHaveBeenCalledWith('test-user-456', {
        email: undefined,
        displayName: 'Only Name Updated',
        emailVerified: undefined,
        disabled: undefined
      })
    })

    it('handles Firebase admin update errors', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockUpdateUser.mockRejectedValue(new Error('User not found'))

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'PUT',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify({
          uid: 'nonexistent-user',
          displayName: 'Updated Name'
        })
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'User not found'
      })
    })
  })

  describe('DELETE /api/auth/user', () => {
    it('returns 401 when not authenticated as admin', async () => {
      mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'DELETE',
        headers: { authorization: 'Bearer invalid-token' },
        body: JSON.stringify({
          uid: 'test-user-456'
        })
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized'
      })
    })

    it('returns 400 when uid is missing', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify({})
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'UID is required'
      })
    })

    it('deletes user successfully', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockDeleteUser.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify({
          uid: 'test-user-456'
        })
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true
      })
      expect(mockDeleteUser).toHaveBeenCalledWith('test-user-456')
    })

    it('handles Firebase admin deletion errors', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)
      mockDeleteUser.mockRejectedValue(new Error('User not found'))

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: JSON.stringify({
          uid: 'nonexistent-user'
        })
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'User not found'
      })
    })
  })

  describe('Authentication Helper', () => {
    it('handles missing Bearer prefix in authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/user?uid=test-123', {
        headers: { authorization: 'InvalidFormat token-here' }
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized'
      })
    })

    it('handles invalid JSON in request body gracefully', async () => {
      mockVerifyFirebaseToken.mockResolvedValue(mockAdmin)

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-admin-token' },
        body: 'invalid json{'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})