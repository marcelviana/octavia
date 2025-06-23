import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase client SDK
const mockInitializeApp = vi.fn();
const mockGetApps = vi.fn();
const mockGetApp = vi.fn();
const mockGetAuth = vi.fn();
const mockGetFirestore = vi.fn();

vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
  getApps: mockGetApps,
  getApp: mockGetApp
}));

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  connectAuthEmulator: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  connectFirestoreEmulator: vi.fn()
}));

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef'
};

describe('Firebase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Clear all env vars first
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_FIREBASE_')) {
        delete process.env[key];
      }
    });
    
    // Mock environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  it('should initialize Firebase when all config is present', async () => {
    mockGetApps.mockReturnValue([]);
    const mockApp = { name: 'test-app' };
    mockInitializeApp.mockReturnValue(mockApp);
    mockGetAuth.mockReturnValue({ config: {} });
    mockGetFirestore.mockReturnValue({ _settings: {} });
    
    const firebase = await import('../firebase');
    
    expect(mockInitializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: 'test-project.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef'
    });
    expect(firebase.isFirebaseConfigured).toBe(true);
  });

  it('should not initialize Firebase when config is missing', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    mockGetApps.mockReturnValue([]);
    
    const firebase = await import('../firebase');
    
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(firebase.isFirebaseConfigured).toBe(false);
  });

  it('should use existing app if already initialized', async () => {
    const mockApp = { name: 'existing-app' };
    mockGetApps.mockReturnValue([mockApp]);
    mockGetApp.mockReturnValue(mockApp);
    mockGetAuth.mockReturnValue({ config: {} });
    mockGetFirestore.mockReturnValue({ _settings: {} });
    
    const firebase = await import('../firebase');
    
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetApp).toHaveBeenCalled();
    expect(firebase.isFirebaseConfigured).toBe(true);
  });

  it('should export null services when not configured', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    mockGetApps.mockReturnValue([]);
    
    const firebase = await import('../firebase');
    
    expect(firebase.auth).toBeNull();
    expect(firebase.db).toBeNull();
    expect(firebase.isFirebaseConfigured).toBe(false);
  });
}); 