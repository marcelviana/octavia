import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import logger from '@/lib/logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Debug logging to see what we actually have
if (typeof window !== 'undefined') {
  console.log('Firebase Config Values:', {
    apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'EMPTY',
    authDomain: firebaseConfig.authDomain || 'EMPTY',
    projectId: firebaseConfig.projectId || 'EMPTY',
    storageBucket: firebaseConfig.storageBucket || 'EMPTY',
    messagingSenderId: firebaseConfig.messagingSenderId || 'EMPTY',
    appId: firebaseConfig.appId || 'EMPTY',
  });
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

// Debug logging for Firebase configuration
if (typeof window !== 'undefined') {
  logger.log('Firebase Config Check:', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
    storageBucket: firebaseConfig.storageBucket ? 'SET' : 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'SET' : 'MISSING',
    appId: firebaseConfig.appId ? 'SET' : 'MISSING',
    isConfigured: isFirebaseConfigured
  });
}

export const app = getApps().length === 0
  ? isFirebaseConfigured
    ? (() => {
        try {
          const initializedApp = initializeApp(firebaseConfig);
          logger.log('Firebase client initialized successfully');
          return initializedApp;
        } catch (error) {
          logger.error('Failed to initialize Firebase client:', error);
          return undefined;
        }
      })()
    : (() => {
        logger.warn('Firebase not configured - missing environment variables');
        return undefined;
      })()
  : getApp();

export const auth = app ? (() => {
  try {
    const authInstance = getAuth(app);
    logger.log('Firebase Auth initialized');
    return authInstance;
  } catch (error) {
    logger.error('Failed to initialize Firebase Auth:', error);
    return null;
  }
})() : null;

export const db = app ? (() => {
  try {
    const dbInstance = getFirestore(app);
    logger.log('Firebase Firestore initialized');
    return dbInstance;
  } catch (error) {
    logger.error('Failed to initialize Firebase Firestore:', error);
    return null;
  }
})() : null;

// Only connect to emulators if explicitly requested
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  if (auth) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      logger.log('Connected to Firebase Auth emulator');
    } catch (error) {
      logger.warn('Failed to connect to Firebase Auth emulator:', error);
    }
  }
  
  if (db) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080); 
      logger.log('Connected to Firestore emulator');
    } catch (error) {
      logger.warn('Failed to connect to Firestore emulator:', error);
    }
  }
} else if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // In development, warn if not using production config properly
  if (isFirebaseConfigured) {
    logger.log('Firebase client configured for production use in development');
    if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.includes('firebaseapp.com')) {
      logger.warn('⚠️ Firebase Auth Domain might not be configured correctly');
    }
  }
}

export default app;