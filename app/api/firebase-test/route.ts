import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs'; // Explicitly use Node.js runtime

export async function GET() {
  try {
    // Test Firebase Admin configuration
    const configStatus = {
      projectId: !!process.env.FIREBASE_PROJECT_ID,
      clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    };

    const allConfigured = Object.values(configStatus).every(Boolean);

    let initializationStatus = 'not_attempted';
    let initializationError = null;

    if (allConfigured) {
      try {
        initializeFirebaseAdmin();
        initializationStatus = 'success';
      } catch (error: any) {
        initializationStatus = 'failed';
        initializationError = error.message;
      }
    } else {
      initializationStatus = 'missing_config';
    }

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK configuration check',
      configured: allConfigured,
      initialization: {
        status: initializationStatus,
        error: initializationError
      },
      details: configStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({
        success: false,
        error: 'ID token is required'
      }, { status: 400 });
    }

    // Test token verification using the new API approach
    const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    });

    const result = await verifyResponse.json();

    if (!result.success) {
      throw new Error(result.error || 'Token validation failed');
    }

    return NextResponse.json({
      success: true,
      message: 'Token verified successfully',
      user: result.user,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Token verification failed',
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }
} 