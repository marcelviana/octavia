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

const verifyTokenHandler = async (request: NextRequest): Promise<NextResponse<VerifyTokenResponse>> => {
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

// SEM rate limit até o redesenho do B1 (docs/ux/PLANO-TRANSICAO.md).
// A rota é pública, mas é chamada por getServerSideUser em TODO server
// component autenticado, e o limiter antigo (por IP, strict, compartilhado
// com auth/user e storage/delete) derrubava o usuário logado de qualquer
// rota — RATE-01, fila A #0. Paliativo aceitável em app de usuário único:
// a verificação do token é local (assinatura JWT via firebase-admin), sem
// chamada de rede por request.
export const POST = verifyTokenHandler
