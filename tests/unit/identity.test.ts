import assert from 'assert';
import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { attachIdentityCookie, createGuestToken, resolveIdentity, verifyGuestToken } from '../../src/lib/identity';

async function run() {
  const previous = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = 'unit-test-secret-only-not-for-deployment';
  try {
    const signed = createGuestToken(process.env.NEXTAUTH_SECRET, 1000);
    assert.ok(verifyGuestToken(signed, process.env.NEXTAUTH_SECRET, 1000));
    assert.strictEqual(verifyGuestToken(`${signed}x`, process.env.NEXTAUTH_SECRET, 1000), null);
    assert.strictEqual(verifyGuestToken(signed, process.env.NEXTAUTH_SECRET, 90 * 86400000 + 1001), null);

    const first = await resolveIdentity(new NextRequest('http://localhost/api/favorites'));
    assert.ok(first.userId.startsWith('guest:'));
    const response = attachIdentityCookie(NextResponse.json({ ok: true }), first);
    const cookie = response.cookies.get('spm_guest');
    assert.ok(cookie?.value);
    assert.strictEqual(cookie.httpOnly, true);
    const repeat = await resolveIdentity(new NextRequest('http://localhost/api/favorites', { headers: { Cookie: `spm_guest=${cookie.value}` } }));
    assert.strictEqual(repeat.userId, first.userId);

    const jwt = await encode({ token: { sub: 'google:account-1', email: 'verified@example.com' }, secret: process.env.NEXTAUTH_SECRET, maxAge: 3600 });
    const authenticated = await resolveIdentity(new NextRequest('http://localhost/api/favorites', { headers: { Cookie: `next-auth.session-token=${jwt}` } }));
    assert.strictEqual(authenticated.userId, 'oauth:google:account-1');
    assert.strictEqual(authenticated.email, 'verified@example.com');
  } finally {
    if (previous === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = previous;
  }
}

export default run();
