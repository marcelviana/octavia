import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export const runtime = 'nodejs'; // Explicitly use Node.js runtime

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<VerifyTokenResponse>> {
  try {
    const body: VerifyTokenRequest = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing token in request body' 
        },
        { status: 400 }
      );
    }

    // Handle demo mode (only in development)
    if (token === 'demo-token' && process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        user: {
          uid: 'demo-user',
          email: 'demo@musicsheet.pro',
          emailVerified: true,
          displayName: 'Demo User'
        }
      });
    }

    // Reject demo token in production
    if (token === 'demo-token') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Demo authentication not allowed in production' 
        },
        { status: 401 }
      );
    }

    // Verify the Firebase token
    const decodedToken = await verifyFirebaseToken(token);

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name
      }
    });

  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    
    // Return appropriate error status
    const statusCode = error.message.includes('expired') ? 401 : 
                      error.message.includes('invalid') ? 401 : 500;

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Token verification failed' 
      },
      { status: statusCode }
    );
  }
} 