import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from '../../src/lib/rate-limit';

// Note: Since the module uses a module-level Map, we need to be careful about state leakage between tests.
// Ideally, the implementation would allow injecting the store or resetting it, but for now we use unique keys.

describe('checkRateLimit', () => {
  const uniqueKey = `test-key-${Date.now()}`;

  it('should allow request within limit', () => {
    const result = checkRateLimit(uniqueKey, 2, 1000);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should block request after limit exceeded', () => {
    // First request (already made above)
    // Second request
    const result2 = checkRateLimit(uniqueKey, 2, 1000);
    expect(result2.ok).toBe(true);
    expect(result2.remaining).toBe(0);

    // Third request should fail
    const result3 = checkRateLimit(uniqueKey, 2, 1000);
    expect(result3.ok).toBe(false);
    expect(result3.remaining).toBe(0);
  });

  it('should reset count after window expires', async () => {
    const newKey = `test-reset-key-${Date.now()}`;
    
    // Use up the limit
    checkRateLimit(newKey, 1, 50); // 1 req allowed
    const blocked = checkRateLimit(newKey, 1, 50);
    expect(blocked.ok).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 60));

    // Should be allowed again
    const allowed = checkRateLimit(newKey, 1, 50);
    expect(allowed.ok).toBe(true);
    expect(allowed.remaining).toBe(0);
  });
});
