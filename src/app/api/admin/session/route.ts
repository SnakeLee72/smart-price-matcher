import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authorized = isAuthorizedAdmin(request);
  return NextResponse.json({ success: authorized, error: authorized ? undefined : '管理驗證失敗', timestamp: new Date().toISOString() }, { status: authorized ? 200 : 403, headers: { 'Cache-Control': 'no-store' } });
}
