import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSessionToken, verifySessionToken } from '@/lib/auth';

describe('createSessionToken / verifySessionToken', () => {
  it('round-trips: created token verifies to the same adminId', () => {
    const token = createSessionToken(42);
    expect(verifySessionToken(token)).toBe(42);
  });

  it('works for adminId 1', () => {
    const token = createSessionToken(1);
    expect(verifySessionToken(token)).toBe(1);
  });

  it('returns null for a tampered token', () => {
    const token = createSessionToken(7);
    // Flip the last character to corrupt the HMAC signature
    const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it('returns null for a completely invalid string', () => {
    expect(verifySessionToken('not-a-token')).toBeNull();
    expect(verifySessionToken('')).toBeNull();
  });

  it('returns null for an expired token', () => {
    // Mock Date.now to return a time 25 hours in the future when verifying
    const token = createSessionToken(99);
    const realNow = Date.now;
    const future = realNow() + 25 * 60 * 60 * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(future);
    expect(verifySessionToken(token)).toBeNull();
    vi.spyOn(Date, 'now').mockRestore();
  });

  it('different adminIds produce different tokens', () => {
    const t1 = createSessionToken(1);
    const t2 = createSessionToken(2);
    expect(t1).not.toBe(t2);
  });
});
