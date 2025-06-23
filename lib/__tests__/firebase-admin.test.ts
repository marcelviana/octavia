import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create a mock apps array that we can manipulate
const mockApps: any[] = [];

// Mock firebase-admin
const mockVerifyIdToken = vi.fn();
const mockGetUser = vi.fn();
const mockCreateUser = vi.fn();
const mockGetAuth = vi.fn(() => ({ 
  verifyIdToken: mockVerifyIdToken,
  getUser: mockGetUser,
  createUser: mockCreateUser
}));
const mockInitializeApp = vi.fn(() => ({ name: 'test-app' }));
const mockGetApp = vi.fn(() => ({ name: 'test-app' }));
const mockCredential = {
  cert: vi.fn()
};

vi.mock('firebase-admin', () => ({
  apps: mockApps,
  initializeApp: mockInitializeApp,
  app: mockGetApp,
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

    // Mock process.versions to simulate Node.js environment
    Object.defineProperty(process, 'versions', {
      value: { node: '18.0.0' },
      writable: true
    });
  });

  afterEach(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key];
    });
    vi.resetModules();
  });

  describe('initializeFirebaseAdmin', () => {
    it('should initialize Firebase admin when called explicitly', async () => {
      const { initializeFirebaseAdmin } = await import('../firebase-admin');
      
      const result = initializeFirebaseAdmin();
      
      expect(mockCredential.cert).toHaveBeenCalledWith({
        projectId: 'test-project',
        clientEmail: 'test@test-project.iam.gserviceaccount.com',
        privateKey: expect.stringContaining('-----BEGIN PRIVATE KEY-----')
      });
      expect(mockInitializeApp).toHaveBeenCalled();
      expect(result).toEqual({ name: 'test-app' });
    });

    it('should return existing app if already initialized', async () => {
      mockApps.push({ name: 'existing-app' });
      
      const { initializeFirebaseAdmin } = await import('../firebase-admin');
      
      const result = initializeFirebaseAdmin();
      
      expect(mockInitializeApp).not.toHaveBeenCalled();
      expect(mockGetApp).toHaveBeenCalled();
      expect(result).toEqual({ name: 'test-app' });
    });

    it('should throw error when environment variables are missing', async () => {
      delete process.env.FIREBASE_PROJECT_ID;
      
      const { initializeFirebaseAdmin } = await import('../firebase-admin');
      
      expect(() => initializeFirebaseAdmin()).toThrow('Missing Firebase Admin environment variables');
    });

    it('should throw error in non-Node.js environment', async () => {
      // Mock Edge Runtime environment
      Object.defineProperty(process, 'versions', {
        value: undefined,
        writable: true
      });
      
      const { initializeFirebaseAdmin } = await import('../firebase-admin');
      
      expect(() => initializeFirebaseAdmin()).toThrow('Firebase Admin SDK can only be used in Node.js runtime');
    });
  });

  describe('verifyFirebaseToken', () => {
    it('should verify Firebase token successfully', async () => {
      const mockToken = 'mock-id-token';
      const mockDecodedToken = { uid: 'test-uid', email: 'test@example.com' };
      
      mockApps.push({ name: 'test-app' });
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
      
      mockApps.push({ name: 'test-app' });
      mockVerifyIdToken.mockRejectedValue(mockError);
      
      const { verifyFirebaseToken } = await import('../firebase-admin');
      
      await expect(verifyFirebaseToken(mockToken)).rejects.toThrow('Firebase ID token verification failed: Invalid token');
    });

    it('should throw error when Firebase Admin not initialized and missing env vars', async () => {
      delete process.env.FIREBASE_PROJECT_ID;
      
      const { verifyFirebaseToken } = await import('../firebase-admin');
      
      await expect(verifyFirebaseToken('test-token')).rejects.toThrow('Firebase ID token verification failed: Missing Firebase Admin environment variables');
    });

    it('should throw error in non-Node.js environment', async () => {
      // Mock Edge Runtime environment
      Object.defineProperty(process, 'versions', {
        value: undefined,
        writable: true
      });
      
      const { verifyFirebaseToken } = await import('../firebase-admin');
      
      await expect(verifyFirebaseToken('test-token')).rejects.toThrow('Token verification can only be done in Node.js runtime');
    });
  });

  describe('getUserByUid', () => {
    it('should get user by UID successfully', async () => {
      const mockUid = 'test-uid';
      const mockUserRecord = { 
        uid: 'test-uid', 
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      mockApps.push({ name: 'test-app' });
      mockGetUser.mockResolvedValue(mockUserRecord);
      
      const { getUserByUid } = await import('../firebase-admin');
      const result = await getUserByUid(mockUid);
      
      expect(mockGetUser).toHaveBeenCalledWith(mockUid);
      expect(result).toEqual(mockUserRecord);
    });

    it('should throw error in non-Node.js environment', async () => {
      // Mock Edge Runtime environment
      Object.defineProperty(process, 'versions', {
        value: undefined,
        writable: true
      });
      
      const { getUserByUid } = await import('../firebase-admin');
      
      await expect(getUserByUid('test-uid')).rejects.toThrow('User lookup can only be done in Node.js runtime');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword',
        displayName: 'Test User'
      };
      const mockUserRecord = { 
        uid: 'new-uid', 
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      mockApps.push({ name: 'test-app' });
      mockCreateUser.mockResolvedValue(mockUserRecord);
      
      const { createUser } = await import('../firebase-admin');
      const result = await createUser(userData);
      
      expect(mockCreateUser).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockUserRecord);
    });

    it('should throw error in non-Node.js environment', async () => {
      // Mock Edge Runtime environment
      Object.defineProperty(process, 'versions', {
        value: undefined,
        writable: true
      });
      
      const { createUser } = await import('../firebase-admin');
      
      await expect(createUser({ email: 'test@example.com' })).rejects.toThrow('User creation can only be done in Node.js runtime');
    });
  });
}); 