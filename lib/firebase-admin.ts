import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

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

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('Firebase Admin: Missing required environment variables');
      console.warn('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      // Don't throw error here, let the verification function handle it
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formatPrivateKey(privateKey),
        }),
      });
      console.log('Firebase Admin initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    // Don't throw error here to allow the app to start
  }
}

export async function verifyFirebaseToken(idToken: string) {
  try {
    // Check if Firebase Admin is properly initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error(`Firebase ID token verification failed: ${error.message}`);
  }
}