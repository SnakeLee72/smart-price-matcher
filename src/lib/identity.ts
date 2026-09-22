import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const COOKIE_NAME = 'spm_guest';
const SESSION_AGE_SECONDS = 90 * 24 * 60 * 60;

export interface Identity {
  userId: string;
  email?: string;
  newGuestToken?: string;
}

function signature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createGuestToken(secret: string, now = Date.now()): string {
  const payload = `${randomUUID()}.${now}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyGuestToken(value: string | undefined, secret: string, now = Date.now()): string | null {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3 || !/^[0-9a-f-]{36}$/i.test(parts[0])) return null;
  const createdAt = Number(parts[1]);
  if (!Number.isSafeInteger(createdAt) || createdAt > now || now - createdAt > SESSION_AGE_SECONDS * 1000) return null;
  const expected = Buffer.from(signature(`${parts[0]}.${parts[1]}`, secret));
  const actual = Buffer.from(parts[2]);
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? parts[0] : null;
}

export async function resolveIdentity(request: NextRequest): Promise<Identity> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for personalized data');
  const authToken = await getToken({ req: request, secret });
  if (authToken?.sub) return { userId: `oauth:${authToken.sub}`, email: authToken.email || undefined };

  const existing = verifyGuestToken(request.cookies.get(COOKIE_NAME)?.value, secret);
  if (existing) return { userId: `guest:${existing}` };
  const newGuestToken = createGuestToken(secret);
  const userId = `guest:${newGuestToken.split('.')[0]}`;
  return { userId, newGuestToken };
}

export function attachIdentityCookie(response: NextResponse, identity: Identity): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store');
  if (identity.newGuestToken) {
    response.cookies.set(COOKIE_NAME, identity.newGuestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_AGE_SECONDS
    });
  }
  return response;
}
