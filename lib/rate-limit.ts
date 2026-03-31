import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

/** Periodically clean up expired entries to prevent memory leaks */
function cleanup(store: Map<string, RateLimitEntry>) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

// Run cleanup every 60 seconds for each store
setInterval(() => {
  for (const store of stores.values()) {
    cleanup(store);
  }
}, 60_000);

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers?.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers?.get('x-real-ip') ?? '127.0.0.1';
}

/**
 * Check rate limit for a given key. Returns null if allowed, or a Response if blocked.
 */
function check(
  storeName: string,
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const store = getStore(storeName);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  entry.count++;
  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit middleware for API routes.
 * Returns null if the request is allowed, or a 429 Response if rate limited.
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const limited = rateLimit(request, 'auth', { limit: 10, windowSeconds: 60 });
 *   if (limited) return limited;
 *   // ... handle request
 * }
 */
export function rateLimit(
  request: NextRequest,
  storeName: string,
  config: RateLimitConfig,
  /** Custom key (e.g. email). Defaults to client IP. */
  key?: string
): NextResponse | null {
  const identifier = key ?? getClientIp(request);
  const result = check(storeName, identifier, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

// Pre-configured rate limiters for common use cases

/** Auth routes: 10 requests per minute per IP */
export function authRateLimit(request: NextRequest) {
  return rateLimit(request, 'auth', { limit: 10, windowSeconds: 60 });
}

/** Strict auth routes (password reset, email verification): 5 requests per 15 minutes per IP */
export function strictAuthRateLimit(request: NextRequest) {
  return rateLimit(request, 'auth-strict', { limit: 5, windowSeconds: 900 });
}

/** API routes (authenticated): 60 requests per minute per IP */
export function apiRateLimit(request: NextRequest) {
  return rateLimit(request, 'api', { limit: 60, windowSeconds: 60 });
}

/** Upload routes: 10 requests per minute per IP */
export function uploadRateLimit(request: NextRequest) {
  return rateLimit(request, 'upload', { limit: 10, windowSeconds: 60 });
}
