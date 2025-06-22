import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import logger from '@/lib/logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

export const app = getApps().length === 0
  ? isFirebaseConfigured
    ? (() => {
        const initializedApp = initializeApp(firebaseConfig);
        logger.log('Firebase client initialized');
        return initializedApp;
      })()
    : (() => {
        logger.warn('Firebase not configured - missing environment variables');
        return undefined;
      })()
  : getApp();

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.includes('localhost')) {
    logger.warn('⚠️ You are connected to production Firebase Auth in development!');
  }
  if (auth) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      logger.log('Connected to Firebase Auth emulator');
    } catch (error) {
      // Emulator might not be running, that's ok
    }
  }
  
  if (db) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080); 
      logger.log('Connected to Firestore emulator');
    } catch (error) {
      // Emulator might not be running, that's ok
    }
  }
}

export default app;