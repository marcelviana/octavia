import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

class RateLimiter {
  private cache: LRUCache<string, number>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cache = new LRUCache({
      max: config.uniqueTokenPerInterval,
      ttl: config.interval,
    });
  }

  check(limit: number, token: string): { success: boolean; limit: number; remaining: number; reset: Date } {
    const tokenCount = (this.cache.get(token) as number) || 0;
    const hit = tokenCount + 1;
    const isRateLimited = hit > limit;
    const reset = new Date(Date.now() + this.config.interval);

    if (!isRateLimited) {
      this.cache.set(token, hit);
    }

    return {
      success: !isRateLimited,
      limit,
      remaining: Math.max(0, limit - hit),
      reset,
    };
  }
}

// Default rate limiter instances
const defaultLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

const strictLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
});

export function rateLimit(
  req: NextRequest,
  limit: number = 100,
  useStrictLimiter: boolean = false
): { success: boolean; limit: number; remaining: number; reset: Date } {
  const limiter = useStrictLimiter ? strictLimiter : defaultLimiter;
  const token = getIdentifierToken(req);
  return limiter.check(limit, token);
}

function getIdentifierToken(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIP;
  return ip || 'anonymous';
}

export function createRateLimitResponse(
  limit: number,
  remaining: number,
  reset: Date
): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${Math.ceil((reset.getTime() - Date.now()) / 1000)} seconds.`,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toISOString(),
        'Retry-After': Math.ceil((reset.getTime() - Date.now()) / 1000).toString(),
      },
    }
  );
}
// Helper function to apply rate limiting to API routes
export function withRateLimit<T extends NextRequest>(
    handler: (req: T) => Promise<NextResponse>,
    limit: number = 100,
    useStrictLimiter: boolean = false
  ) {
    return async (req: T): Promise<NextResponse> => {
      const result = rateLimit(req, limit, useStrictLimiter);
      
      if (!result.success) {
        return createRateLimitResponse(result.limit, result.remaining, result.reset);
      }
  
      const response = await handler(req);
      
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.reset.toISOString());
      
      return response;
    };
  }