import { auth, db, isFirebaseConfigured } from './firebase';
import logger from './logger';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseAuthUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit 
} from 'firebase/firestore';

export interface FirebaseTestResult {
  success: boolean;
  error?: string;
  details?: any;
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

/**
 * Test Firebase client configuration
 */
export async function testFirebaseClient(): Promise<FirebaseTestResult> {
  try {
    if (!isFirebaseConfigured) {
      return {
        success: false,
        error: 'Firebase client not configured - missing environment variables'
      };
    }

    if (!auth || !db) {
      return {
        success: false,
        error: 'Firebase services not initialized'
      };
    }

    // Test auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      logger.log('Auth state changed:', user?.email || 'No user');
    });

    // Test Firestore connection
    const testCollection = collection(db, 'health-check');
    const testQuery = query(testCollection, limit(1));
    await getDocs(testQuery);

    unsubscribe();

    return {
      success: true,
      details: {
        authConfigured: !!auth,
        firestoreConfigured: !!db,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error during Firebase client test'
    };
  }
}

/**
 * Test Firebase admin configuration via API
 */
export async function testFirebaseAdmin(): Promise<FirebaseTestResult> {
  try {
    // Test admin configuration via API endpoint
    const response = await fetch('/api/firebase-test');
    const result = await response.json();
    
    if (response.ok && result.success) {
      return {
        success: true,
        details: {
          message: 'Firebase Admin SDK is properly configured',
          configured: result.configured,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        }
      };
    } else {
      return {
        success: false,
        error: result.error || 'Firebase Admin API test failed'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error during Firebase admin test'
    };
  }
}

/**
 * Create a test user in Firebase Auth
 */
export async function createTestUser(email: string, password: string): Promise<FirebaseTestResult> {
  try {
    if (!auth) {
      return {
        success: false,
        error: 'Firebase Auth not initialized'
      };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      success: true,
      details: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create test user'
    };
  }
}

/**
 * Sign in with test credentials
 */
export async function signInTestUser(email: string, password: string): Promise<FirebaseTestResult> {
  try {
    if (!auth) {
      return {
        success: false,
        error: 'Firebase Auth not initialized'
      };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      success: true,
      details: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to sign in test user'
    };
  }
}

/**
 * Test Firestore operations
 */
export async function testFirestore(): Promise<FirebaseTestResult> {
  try {
    if (!db) {
      return {
        success: false,
        error: 'Firestore not initialized'
      };
    }

    const testDocId = `test-${Date.now()}`;
    const testData = {
      message: 'Firebase integration test',
      timestamp: new Date().toISOString(),
      success: true
    };

    // Write test document
    const testDocRef = doc(db, 'integration-tests', testDocId);
    await setDoc(testDocRef, testData);

    // Read test document
    const docSnap = await getDoc(testDocRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Test document was not created'
      };
    }

    const retrievedData = docSnap.data();
    
    return {
      success: true,
      details: {
        documentId: testDocId,
        dataMatch: retrievedData.message === testData.message,
        retrievedData
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Firestore test failed'
    };
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<FirebaseTestResult> {
  try {
    if (!auth) {
      return {
        success: false,
        error: 'Firebase Auth not initialized'
      };
    }

    await firebaseSignOut(auth);
    
    return {
      success: true,
      details: {
        message: 'User signed out successfully'
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to sign out user'
    };
  }
}

/**
 * Run comprehensive Firebase integration test
 */
export async function runFirebaseIntegrationTest(): Promise<{
  overall: boolean;
  results: Record<string, FirebaseTestResult>;
}> {
  const results: Record<string, FirebaseTestResult> = {};

  logger.log('Starting Firebase integration test...');

  // Test client configuration
  results.clientConfig = await testFirebaseClient();
  
  // Test admin configuration
  results.adminConfig = await testFirebaseAdmin();
  
  // Test Firestore operations
  results.firestore = await testFirestore();

  const overall = Object.values(results).every(result => result.success);

  logger.log('Firebase integration test completed:', {
    overall,
    results: Object.entries(results).map(([key, result]) => ({
      test: key,
      success: result.success,
      error: result.error
    }))
  });

  return { overall, results };
} 