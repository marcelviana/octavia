import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
  message?: string;
};

// Global rate limit cache
const rateLimitCache = new LRUCache<string, number>({
  max: 1000,
  ttl: 60000, // 1 minute default
});

export function createRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    const key = `${ip}:${request.nextUrl.pathname}`;
    
    const currentCount = rateLimitCache.get(key) || 0;
    if (currentCount >= config.maxRequests) {
      return NextResponse.json(
        { 
          error: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil(config.windowMs / 1000)
        },
        { status: 429 }
      );
    }
    
    rateLimitCache.set(key, currentCount + 1);
    return null; // Allow request to proceed
  };
}

// Pre-configured rate limiters
export const apiRateLimit = createRateLimit({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  message: 'Too many API requests'
});

export const uploadRateLimit = createRateLimit({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  message: 'Too many upload attempts'
});

export const authRateLimit = createRateLimit({
  maxRequests: 5,
  windowMs: 60000, // 1 minute
  message: 'Too many authentication attempts'
});