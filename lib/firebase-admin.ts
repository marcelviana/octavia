import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import '@/lib/logger'

// Helper function to properly format the private key
function formatPrivateKey(privateKey: string): string {
  if (!privateKey) {
    throw new Error('Firebase private key is not set');
  }
  
  // Remove any extra quotes and handle different newline formats
  let formattedKey = privateKey.trim();
  
  // Remove surrounding quotes if present
  if ((formattedKey.startsWith('"') && formattedKey.endsWith('"')) ||
      (formattedKey.startsWith("'") && formattedKey.endsWith("'"))) {
    formattedKey = formattedKey.slice(1, -1);
  }
  
  // Replace escaped newlines with actual newlines
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  
  // Ensure proper PEM format
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format - must be a PEM formatted private key');
  }
  
  return formattedKey;
}

// Check if we're in a Node.js environment (not Edge Runtime)
function isNodeJsRuntime(): boolean {
  try {
    return typeof process !== 'undefined' && 
           process.versions && 
           process.versions.node !== undefined;
  } catch {
    return false;
  }
}

// Initialize Firebase Admin SDK
export function initializeFirebaseAdmin() {
  // Only initialize in Node.js environment
  if (!isNodeJsRuntime()) {
    throw new Error('Firebase Admin SDK can only be used in Node.js runtime, not Edge Runtime');
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formatPrivateKey(privateKey),
      }),
    });
    
    console.log('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

// Get Firebase Admin Auth instance
export function getFirebaseAdminAuth() {
  if (!isNodeJsRuntime()) {
    throw new Error('Firebase Admin Auth can only be used in Node.js runtime');
  }
  
  // Ensure Firebase Admin is initialized
  if (admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
  
  return getAuth();
}

// Verify Firebase ID token
export async function verifyFirebaseToken(idToken: string) {
  if (!isNodeJsRuntime()) {
    throw new Error('Token verification can only be done in Node.js runtime');
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error(`Firebase ID token verification failed: ${error.message}`);
  }
}

// Create a custom token
export async function createCustomToken(uid: string, additionalClaims?: object) {
  if (!isNodeJsRuntime()) {
    throw new Error('Custom token creation can only be done in Node.js runtime');
  }

  try {
    const auth = getFirebaseAdminAuth();
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error: any) {
    console.error('Firebase custom token creation failed:', error.message);
    throw new Error(`Firebase custom token creation failed: ${error.message}`);
  }
}

// Get user by UID
export async function getUserByUid(uid: string) {
  if (!isNodeJsRuntime()) {
    throw new Error('User lookup can only be done in Node.js runtime');
  }

  try {
    const auth = getFirebaseAdminAuth();
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error: any) {
    console.error('Firebase get user failed:', error.message);
    throw new Error(`Firebase get user failed: ${error.message}`);
  }
}

// Create a new user
export async function createUser(userData: {
  email: string;
  password?: string;
  displayName?: string;
  emailVerified?: boolean;
}) {
  if (!isNodeJsRuntime()) {
    throw new Error('User creation can only be done in Node.js runtime');
  }

  try {
    const auth = getFirebaseAdminAuth();
    const userRecord = await auth.createUser(userData);
    return userRecord;
  } catch (error: any) {
    console.error('Firebase create user failed:', error.message);
    throw new Error(`Firebase create user failed: ${error.message}`);
  }
}

// Update user
export async function updateUser(uid: string, userData: {
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  disabled?: boolean;
}) {
  if (!isNodeJsRuntime()) {
    throw new Error('User update can only be done in Node.js runtime');
  }

  try {
    const auth = getFirebaseAdminAuth();
    const userRecord = await auth.updateUser(uid, userData);
    return userRecord;
  } catch (error: any) {
    console.error('Firebase update user failed:', error.message);
    throw new Error(`Firebase update user failed: ${error.message}`);
  }
}

// Delete user
export async function deleteUser(uid: string) {
  if (!isNodeJsRuntime()) {
    throw new Error('User deletion can only be done in Node.js runtime');
  }

  try {
    const auth = getFirebaseAdminAuth();
    await auth.deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    console.error('Firebase delete user failed:', error.message);
    throw new Error(`Firebase delete user failed: ${error.message}`);
  }
}