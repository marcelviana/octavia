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
          initialization: result.initialization,
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

    // Test document write
    const testDocRef = doc(db, 'health-check', 'test-doc');
    await setDoc(testDocRef, {
      timestamp: new Date().toISOString(),
      test: true
    });

    // Test document read
    const docSnap = await getDoc(testDocRef);
    if (!docSnap.exists()) {
      throw new Error('Failed to read test document');
    }

    // Test collection query
    const testCollection = collection(db, 'health-check');
    const testQuery = query(testCollection, where('test', '==', true), limit(1));
    const querySnapshot = await getDocs(testQuery);

    if (querySnapshot.empty) {
      throw new Error('Failed to query test collection');
    }

    return {
      success: true,
      details: {
        writeTest: 'passed',
        readTest: 'passed',
        queryTest: 'passed',
        documentId: docSnap.id
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error during Firestore test'
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
 * Test Firebase authentication (client-side)
 */
export async function testFirebaseAuth(email: string, password: string): Promise<FirebaseTestResult> {
  try {
    if (!auth) {
      return {
        success: false,
        error: 'Firebase Auth not initialized'
      };
    }

    // Test user creation
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user) {
      throw new Error('User creation failed - no user returned');
    }

    // Test getting ID token
    const idToken = await user.getIdToken();
    
    if (!idToken) {
      throw new Error('Failed to get ID token');
    }

    // Test token verification via API
    const verifyResponse = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    });

    const verifyResult = await verifyResponse.json();
    
    if (!verifyResult.success) {
      throw new Error(`Token verification failed: ${verifyResult.error}`);
    }

    // Clean up - sign out and delete user
    await firebaseSignOut(auth);

    return {
      success: true,
      details: {
        userCreated: true,
        tokenGenerated: true,
        tokenVerified: true,
        userId: user.uid,
        userEmail: user.email
      }
    };
  } catch (error: any) {
    // Try to clean up on error
    try {
      if (auth?.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (cleanupError) {
      logger.warn('Failed to clean up after auth test error:', cleanupError);
    }

    return {
      success: false,
      error: error.message || 'Unknown error during Firebase auth test'
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