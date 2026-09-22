import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

/** Administrative writes are disabled until a server-side token is configured. */
export function isAuthorizedAdmin(request: NextRequest): boolean {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  const suppliedToken = request.headers.get('x-admin-token');
  if (!configuredToken || !suppliedToken) return false;
  const expected = Buffer.from(configuredToken);
  const actual = Buffer.from(suppliedToken);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
