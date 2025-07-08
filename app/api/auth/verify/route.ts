import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { verifyTokenSchema } from '@/lib/validation-schemas';
import { 
  validateRequestBody,
  createValidationErrorResponse,
  createServerErrorResponse
} from '@/lib/validation-utils';

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
    const body = await request.json();
    
    // Validate request body
    const bodyValidation = await validateRequestBody(body, verifyTokenSchema);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: bodyValidation.errors
        },
        { status: 400 }
      );
    }

    const { token } = bodyValidation.data;


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
    
    // Return appropriate error status based on error type
    if (error.message && (error.message.includes('expired') || error.message.includes('invalid'))) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired token' 
        },
        { status: 401 }
      );
    }

    // Don't expose internal error details to client
    return NextResponse.json(
      { 
        success: false, 
        error: 'Token verification failed' 
      },
      { status: 500 }
    );
  }
} 