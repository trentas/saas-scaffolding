import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock next/server before importing the module
vi.mock('next/server', () => ({
  NextRequest: class {
    headers: Headers;
    constructor(url: string, init?: { headers?: Record<string, string> }) {
      this.headers = new Headers(init?.headers);
    }
  },
  NextResponse: {
    json(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return { body, status: init?.status, headers: init?.headers };
    },
  },
}));

import { rateLimit, authRateLimit, strictAuthRateLimit, apiRateLimit, uploadRateLimit } from '@/lib/rate-limit';

function createMockRequest(ip = '1.2.3.4'): any {
  return {
    headers: new Headers({ 'x-forwarded-for': ip }),
  };
}

describe('rateLimit', () => {
  beforeEach(() => {
    // Reset rate limit stores between tests by using unique store names
  });

  it('allows requests under the limit', () => {
    const req = createMockRequest('10.0.0.1');
    const storeName = `test-allow-${Date.now()}`;
    const result = rateLimit(req, storeName, { limit: 5, windowSeconds: 60 });
    expect(result).toBeNull();
  });

  it('blocks requests over the limit', () => {
    const req = createMockRequest('10.0.0.2');
    const storeName = `test-block-${Date.now()}`;
    const config = { limit: 3, windowSeconds: 60 };

    // Use up the limit
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(req, storeName, config)).toBeNull();
    }

    // Next request should be blocked
    const blocked = rateLimit(req, storeName, config);
    expect(blocked).not.toBeNull();
    expect((blocked as any).status).toBe(429);
    expect((blocked as any).headers['Retry-After']).toBeDefined();
    expect((blocked as any).headers['X-RateLimit-Limit']).toBe('3');
    expect((blocked as any).headers['X-RateLimit-Remaining']).toBe('0');
  });

  it('tracks different IPs independently', () => {
    const storeName = `test-ips-${Date.now()}`;
    const config = { limit: 1, windowSeconds: 60 };

    const req1 = createMockRequest('10.0.1.1');
    const req2 = createMockRequest('10.0.1.2');

    expect(rateLimit(req1, storeName, config)).toBeNull();
    expect(rateLimit(req2, storeName, config)).toBeNull();

    // Both should be blocked on second request
    expect(rateLimit(req1, storeName, config)).not.toBeNull();
    expect(rateLimit(req2, storeName, config)).not.toBeNull();
  });

  it('uses custom key when provided', () => {
    const storeName = `test-custom-key-${Date.now()}`;
    const config = { limit: 1, windowSeconds: 60 };
    const req = createMockRequest('10.0.2.1');

    expect(rateLimit(req, storeName, config, 'user@example.com')).toBeNull();
    expect(rateLimit(req, storeName, config, 'user@example.com')).not.toBeNull();

    // Different custom key should be allowed
    expect(rateLimit(req, storeName, config, 'other@example.com')).toBeNull();
  });

  it('resets after window expires', () => {
    const storeName = `test-expire-${Date.now()}`;
    const config = { limit: 1, windowSeconds: 1 }; // 1 second window
    const req = createMockRequest('10.0.3.1');

    expect(rateLimit(req, storeName, config)).toBeNull();
    expect(rateLimit(req, storeName, config)).not.toBeNull();

    // Manually expire the entry
    vi.useFakeTimers();
    vi.advanceTimersByTime(2000);

    expect(rateLimit(req, storeName, config)).toBeNull();
    vi.useRealTimers();
  });

  it('returns correct 429 response body', () => {
    const storeName = `test-body-${Date.now()}`;
    const config = { limit: 1, windowSeconds: 60 };
    const req = createMockRequest('10.0.4.1');

    rateLimit(req, storeName, config);
    const blocked = rateLimit(req, storeName, config) as any;

    expect(blocked.body).toEqual({ error: 'Too many requests. Please try again later.' });
  });

  it('handles request without headers gracefully', () => {
    const storeName = `test-no-headers-${Date.now()}`;
    const req = { headers: undefined } as any;
    const result = rateLimit(req, storeName, { limit: 5, windowSeconds: 60 });
    expect(result).toBeNull();
  });
});

describe('pre-configured rate limiters', () => {
  it('authRateLimit allows 10 requests', () => {
    const req = createMockRequest('20.0.0.1');
    for (let i = 0; i < 10; i++) {
      expect(authRateLimit(req)).toBeNull();
    }
    expect(authRateLimit(req)).not.toBeNull();
  });

  it('strictAuthRateLimit allows 5 requests', () => {
    const req = createMockRequest('20.0.0.2');
    for (let i = 0; i < 5; i++) {
      expect(strictAuthRateLimit(req)).toBeNull();
    }
    expect(strictAuthRateLimit(req)).not.toBeNull();
  });

  it('apiRateLimit allows 60 requests', () => {
    const req = createMockRequest('20.0.0.3');
    for (let i = 0; i < 60; i++) {
      expect(apiRateLimit(req)).toBeNull();
    }
    expect(apiRateLimit(req)).not.toBeNull();
  });

  it('uploadRateLimit allows 10 requests', () => {
    const req = createMockRequest('20.0.0.4');
    for (let i = 0; i < 10; i++) {
      expect(uploadRateLimit(req)).toBeNull();
    }
    expect(uploadRateLimit(req)).not.toBeNull();
  });
});
