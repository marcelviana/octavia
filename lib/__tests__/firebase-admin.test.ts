import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create a mock apps array that we can manipulate
const mockApps = { length: 0 };

// Mock firebase-admin
const mockVerifyIdToken = vi.fn();
const mockGetAuth = vi.fn(() => ({ verifyIdToken: mockVerifyIdToken }));
const mockInitializeApp = vi.fn();
const mockCredential = {
  cert: vi.fn()
};

vi.mock('firebase-admin', () => ({
  apps: mockApps,
  initializeApp: mockInitializeApp,
  credential: mockCredential
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: mockGetAuth
}));

// Mock environment variables with proper PEM formatted key
const mockEnv = {
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_CLIENT_EMAIL: 'test@test-project.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
UIQ6rQ6V3c9YVZVnUSYJKBKUc6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7Md
bEK6pqzN6JcJdQjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK
6pqzN6JcJdQjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pq
zN6JcJdQjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6J
cJdQjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJd
QjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjX
oE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1
OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1OHh
6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1OHh6Qj
f7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1OHh6Qjf7V
t7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1OHh6
-----END PRIVATE KEY-----`
};

describe('Firebase Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Reset the apps mock
    mockApps.length = 0;
    
    // Mock environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  afterEach(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key];
    });
    vi.resetModules();
  });

  it('should initialize Firebase admin when imported', async () => {
    // Import the module to trigger initialization
    await import('../firebase-admin');
    
    expect(mockCredential.cert).toHaveBeenCalledWith({
      projectId: 'test-project',
      clientEmail: 'test@test-project.iam.gserviceaccount.com',
      privateKey: expect.stringContaining('-----BEGIN PRIVATE KEY-----')
    });
    expect(mockInitializeApp).toHaveBeenCalled();
  });

  it('should verify Firebase token successfully', async () => {
    const mockToken = 'mock-id-token';
    const mockDecodedToken = { uid: 'test-uid', email: 'test@example.com' };
    
    // Set up apps to simulate successful initialization
    mockApps.length = 1;
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
    
    // Set up apps to simulate successful initialization
    mockApps.length = 1;
    mockVerifyIdToken.mockRejectedValue(mockError);
    
    const { verifyFirebaseToken } = await import('../firebase-admin');
    
    await expect(verifyFirebaseToken(mockToken)).rejects.toThrow('Firebase ID token verification failed: Invalid token');
  });

  it('should handle missing environment variables', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    
    // Reset modules to ensure fresh import
    vi.resetModules();
    
    // Import should not throw, but initialization should be skipped
    const firebaseAdmin = await import('../firebase-admin');
    
    // Should still be able to call verifyFirebaseToken, but it should fail
    await expect(firebaseAdmin.verifyFirebaseToken('test-token')).rejects.toThrow('Firebase Admin is not initialized');
  });
}); 