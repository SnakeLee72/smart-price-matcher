import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { attachIdentityCookie, resolveIdentity } from '@/lib/identity';
import { findMockProduct } from '@/services/mock-offer';

export const dynamic = 'force-dynamic';
const AlertSchema = z.object({
  productId: z.string().trim().min(1).max(150),
  targetPriceTwd: z.number().finite().positive().max(100_000_000),
  email: z.string().email().max(254).optional()
});

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const identity = await resolveIdentity(request);
    const records = await prisma.priceAlert.findMany({ where: { userId: identity.userId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return attachIdentityCookie(NextResponse.json({ success: true, data: records.map((record) => ({
      id: record.id, productId: record.offerId, targetPriceTwd: Number(record.targetPriceTwd),
      emailDeliveryEnabled: Boolean(record.email), enabled: record.enabled, createdAt: record.createdAt.toISOString()
    })), requestId, timestamp: new Date().toISOString() }), identity);
  } catch (error) {
    console.error(`[Price Alerts GET] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '無法取得目標價', requestId, timestamp: new Date().toISOString() }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const parsed = AlertSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: '目標價資料無效', details: parsed.error.flatten(), requestId, timestamp: new Date().toISOString() }, { status: 400 });
    const raw = findMockProduct(parsed.data.productId);
    if (!raw) return NextResponse.json({ success: false, error: '商品不存在', requestId, timestamp: new Date().toISOString() }, { status: 404 });
    const identity = await resolveIdentity(request);
    if (parsed.data.email && (!identity.email || parsed.data.email.toLowerCase() !== identity.email.toLowerCase())) {
      return attachIdentityCookie(NextResponse.json({ success: false, error: '只能使用已驗證的登入信箱', requestId, timestamp: new Date().toISOString() }, { status: 403 }), identity);
    }
    const offerId = `${raw.source}_${raw.sourceProductId}`;
    // Delivery is intentionally disabled until a verified email transport and worker exist.
    const [record] = await prisma.$transaction([
      prisma.priceAlert.upsert({
        where: { userId_offerId: { userId: identity.userId, offerId } },
        create: { userId: identity.userId, offerId, targetPriceTwd: parsed.data.targetPriceTwd, email: null },
        update: { targetPriceTwd: parsed.data.targetPriceTwd, email: null, enabled: true }
      }),
      prisma.userFavorite.upsert({
        where: { userId_offerId: { userId: identity.userId, offerId } },
        create: { userId: identity.userId, offerId, targetPriceTwd: parsed.data.targetPriceTwd, notifyOnPriceDrop: false },
        update: { targetPriceTwd: parsed.data.targetPriceTwd, notifyOnPriceDrop: false }
      })
    ]);
    return attachIdentityCookie(NextResponse.json({ success: true, message: '目標價已儲存；電子郵件通知尚未啟用', data: {
      alertId: record.id, productId: offerId, targetPriceTwd: Number(record.targetPriceTwd),
      emailDeliveryEnabled: false, createdAt: record.createdAt.toISOString()
    }, requestId, timestamp: new Date().toISOString() }, { status: 201 }), identity);
  } catch (error) {
    console.error(`[Price Alerts POST] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '無法儲存目標價', requestId, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
