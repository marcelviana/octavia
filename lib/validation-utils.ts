import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Validates request body against a Zod schema
 * @param body - The request body to validate
 * @param schema - The Zod schema to validate against
 * @returns Object with success/error status and data or error details
 */
export async function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: string[]; details: z.ZodError }> {
  try {
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      
      return {
        success: false,
        errors: errorMessages,
        details: error
      };
    }
    
    // Handle unexpected errors
    return {
      success: false,
      errors: ['Validation failed with unexpected error'],
      details: error as z.ZodError
    };
  }
}

/**
 * Validates query parameters against a Zod schema
 * @param searchParams - URLSearchParams object
 * @param schema - The Zod schema to validate against
 * @returns Object with success/error status and data or error details
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[]; details: z.ZodError } {
  try {
    // Convert URLSearchParams to plain object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    const validatedData = schema.parse(params);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      
      return {
        success: false,
        errors: errorMessages,
        details: error
      };
    }
    
    return {
      success: false,
      errors: ['Query parameter validation failed with unexpected error'],
      details: error as z.ZodError
    };
  }
}

/**
 * Creates a standardized validation error response
 * @param errors - Array of error messages
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with validation error
 */
export function createValidationErrorResponse(errors: string[], status: number = 400): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      message: errors.length === 1 ? errors[0] : 'Multiple validation errors occurred',
      details: errors,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Creates a standardized server error response
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with server error
 */
export function createServerErrorResponse(message: string = 'Internal server error', status: number = 500): NextResponse {
  return NextResponse.json(
    {
      error: 'Server error',
      message,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Creates a standardized unauthorized error response
 * @param message - Error message
 * @returns NextResponse with unauthorized error
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message,
      timestamp: new Date().toISOString()
    },
    { status: 401 }
  );
}

/**
 * Creates a standardized not found error response
 * @param message - Error message
 * @returns NextResponse with not found error
 */
export function createNotFoundResponse(message: string = 'Resource not found'): NextResponse {
  return NextResponse.json(
    {
      error: 'Not found',
      message,
      timestamp: new Date().toISOString()
    },
    { status: 404 }
  );
}

/**
 * Validates file upload data including MIME type and file extension
 * @param file - File object to validate
 * @param filename - Filename to validate
 * @param allowedMimeTypes - Array of allowed MIME types
 * @param allowedExtensions - Array of allowed file extensions
 * @param maxSizeBytes - Maximum file size in bytes
 * @returns Object with validation result
 */
export function validateFileUpload(
  file: File,
  filename: string,
  allowedMimeTypes: readonly string[],
  allowedExtensions: readonly string[],
  maxSizeBytes: number = 50 * 1024 * 1024 // 50MB default
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  // Check file size
  if (file.size > maxSizeBytes) {
    errors.push(`File size exceeds limit of ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed`);
  }

  // Check file extension
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push(`File extension "${extension}" is not allowed`);
  }

  // Validate filename format
  if (!/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(filename)) {
    errors.push('Filename contains invalid characters');
  }

  // Check filename length
  if (filename.length > 255) {
    errors.push('Filename is too long (maximum 255 characters)');
  }

  // Basic security checks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Filename contains invalid path characters');
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

/**
 * Sanitizes filename for secure storage
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Get the file extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  // Remove or replace problematic characters
  const sanitizedName = name
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 200); // Limit length
  
  return sanitizedName + extension;
}

/**
 * Rate limiting utility for API endpoints
 */
export class RateLimiter {
  private requests: Map<string, { count: number; timestamp: number }> = new Map();
  
  constructor(
    private windowMs: number = 60_000, // 1 minute
    private maxRequests: number = 20
  ) {
    // Clean up old entries periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests) {
        if (now - entry.timestamp > this.windowMs) {
          this.requests.delete(key);
        }
      }
    }, this.windowMs).unref();
  }
  
  /**
   * Check if request is within rate limit
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @returns Object indicating if request is allowed
   */
  checkLimit(identifier: string): { allowed: true } | { allowed: false; retryAfter: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);
    
    if (!entry || now - entry.timestamp > this.windowMs) {
      this.requests.set(identifier, { count: 1, timestamp: now });
      return { allowed: true };
    }
    
    if (entry.count >= this.maxRequests) {
      const retryAfter = Math.ceil((this.windowMs - (now - entry.timestamp)) / 1000);
      return { allowed: false, retryAfter };
    }
    
    entry.count++;
    return { allowed: true };
  }
}

/**
 * Creates a rate limit error response
 * @param retryAfter - Seconds until retry is allowed
 * @returns NextResponse with rate limit error
 */
export function createRateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      timestamp: new Date().toISOString()
    },
    { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString()
      }
    }
  );
} 