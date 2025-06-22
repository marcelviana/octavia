import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test Firebase Admin configuration
    const configStatus = {
      projectId: !!process.env.FIREBASE_PROJECT_ID,
      clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    };

    const allConfigured = Object.values(configStatus).every(Boolean);

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK configuration check',
      configured: allConfigured,
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

    // Test token verification
    const decodedToken = await verifyFirebaseToken(idToken);

    return NextResponse.json({
      success: true,
      message: 'Token verified successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      },
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