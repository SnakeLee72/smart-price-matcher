import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    return NextResponse.json({ success: true, status: 'ready', timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, status: 'unavailable', timestamp: new Date().toISOString() }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
