import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin
const mockVerifyIdToken = vi.fn();
const mockGetAuth = vi.fn(() => ({ verifyIdToken: mockVerifyIdToken }));
const mockInitializeApp = vi.fn();
const mockCredential = {
  cert: vi.fn()
};

vi.mock('firebase-admin', () => ({
  apps: { length: 0 },
  initializeApp: mockInitializeApp,
  credential: mockCredential
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: mockGetAuth
}));

// Mock environment variables
const mockEnv = {
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_CLIENT_EMAIL: 'test@test-project.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: 'test-private-key'
};

describe('Firebase Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the apps array
    vi.mocked({ apps: { length: 0 } });
    
    // Mock environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  it('should initialize Firebase admin when imported', async () => {
    // Import the module to trigger initialization
    await import('../firebase-admin');
    
    expect(mockCredential.cert).toHaveBeenCalledWith({
      projectId: 'test-project',
      clientEmail: 'test@test-project.iam.gserviceaccount.com',
      privateKey: 'test-private-key'
    });
    expect(mockInitializeApp).toHaveBeenCalled();
  });

  it('should verify Firebase token successfully', async () => {
    const mockToken = 'mock-id-token';
    const mockDecodedToken = { uid: 'test-uid', email: 'test@example.com' };
    
    mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
    
    const { verifyFirebaseToken } = await import('../firebase-admin');
    const result = await verifyFirebaseToken(mockToken);
    
    expect(mockGetAuth).toHaveBeenCalled();
    expect(mockVerifyIdToken).toHaveBeenCalledWith(mockToken);
    expect(result).toEqual(mockDecodedToken);
  });

  it('should handle token verification errors', async () => {
    const mockToken = 'invalid-token';
    const mockError = new Error('Invalid token');
    
    mockVerifyIdToken.mockRejectedValue(mockError);
    
    const { verifyFirebaseToken } = await import('../firebase-admin');
    
    await expect(verifyFirebaseToken(mockToken)).rejects.toThrow('Invalid token');
  });

  it('should handle missing environment variables', () => {
    delete process.env.FIREBASE_PROJECT_ID;
    
    expect(() => {
      // This should throw when trying to access undefined env var
      require('../firebase-admin');
    }).toThrow();
  });
}); 