import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { attachIdentityCookie, resolveIdentity } from '@/lib/identity';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = crypto.randomUUID();
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ success: false, error: '收藏 ID 無效', requestId, timestamp: new Date().toISOString() }, { status: 400 });
  }
  try {
    const identity = await resolveIdentity(request);
    const deleted = await prisma.userFavorite.deleteMany({ where: { id, userId: identity.userId } });
    if (!deleted.count) return attachIdentityCookie(NextResponse.json({ success: false, error: '找不到收藏', requestId, timestamp: new Date().toISOString() }, { status: 404 }), identity);
    return attachIdentityCookie(NextResponse.json({ success: true, requestId, timestamp: new Date().toISOString() }), identity);
  } catch (error) {
    console.error(`[Favorites DELETE] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '無法移除收藏', requestId, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
