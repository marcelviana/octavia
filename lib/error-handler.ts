import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import logger from './logger';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_001',
  AUTHENTICATION_ERROR = 'AUTH_001',
  AUTHORIZATION_ERROR = 'AUTH_002',
  NOT_FOUND = 'NOT_FOUND_001',
  RATE_LIMIT = 'RATE_LIMIT_001',
  FILE_UPLOAD_ERROR = 'UPLOAD_001',
  DATABASE_ERROR = 'DB_001',
  INTERNAL_ERROR = 'INTERNAL_001',
}

export function handleApiError(error: unknown, context?: string): NextResponse {
  const requestId = Math.random().toString(36).substring(7);
  
  // Log error with context
  logger.error('API Error', {
    requestId,
    context,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Handle specific error types
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Invalid input data',
        code: ErrorCode.VALIDATION_ERROR,
        details: error.errors,
        requestId,
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    // Don't expose internal error messages
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: ErrorCode.AUTHENTICATION_ERROR,
          requestId,
        },
        { status: 401 }
      );
    }
  }

  // Generic internal server error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: ErrorCode.INTERNAL_ERROR,
      requestId,
    },
    { status: 500 }
  );
}

export function createErrorResponse(
  message: string,
  code: ErrorCode,
  status: number = 500
): NextResponse {
  const requestId = Math.random().toString(36).substring(7);
  
  return NextResponse.json(
    {
      error: message,
      code,
      requestId,
    },
    { status }
  );
}