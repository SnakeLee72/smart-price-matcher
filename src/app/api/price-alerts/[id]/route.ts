import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { attachIdentityCookie, resolveIdentity } from '@/lib/identity';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = crypto.randomUUID();
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success: false, error: '提醒 ID 無效', requestId, timestamp: new Date().toISOString() }, { status: 400 });
  try {
    const identity = await resolveIdentity(request);
    const existing = await prisma.priceAlert.findFirst({ where: { id, userId: identity.userId } });
    if (!existing) return attachIdentityCookie(NextResponse.json({ success: false, error: '找不到目標價', requestId, timestamp: new Date().toISOString() }, { status: 404 }), identity);
    await prisma.$transaction([
      prisma.priceAlert.deleteMany({ where: { id, userId: identity.userId } }),
      prisma.userFavorite.updateMany({ where: { userId: identity.userId, offerId: existing.offerId }, data: { targetPriceTwd: null } })
    ]);
    return attachIdentityCookie(NextResponse.json({ success: true, requestId, timestamp: new Date().toISOString() }), identity);
  } catch (error) {
    console.error(`[Price Alerts DELETE] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '無法移除目標價', requestId, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
