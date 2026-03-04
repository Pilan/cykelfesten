import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-please-change-in-production';
const COOKIE_NAME = 'cf_session';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function hmac(data: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
}

export function createSessionToken(adminId: number): string {
  const ts = Date.now().toString();
  const payload = `${adminId}:${ts}`;
  const sig = hmac(payload);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifySessionToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon === -1) return null;
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    if (hmac(payload) !== sig) return null;
    const colonIdx = payload.indexOf(':');
    if (colonIdx === -1) return null;
    const ts = parseInt(payload.slice(colonIdx + 1), 10);
    if (Date.now() - ts > 24 * 60 * 60 * 1000) return null;
    const adminId = parseInt(payload.slice(0, colonIdx), 10);
    if (isNaN(adminId)) return null;
    return adminId;
  } catch {
    return null;
  }
}

export function getSession(): { adminId: number } | null {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const adminId = verifySessionToken(token);
  if (adminId === null) return null;
  return { adminId };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

export function makeSessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60,
    path: '/',
  };
}
