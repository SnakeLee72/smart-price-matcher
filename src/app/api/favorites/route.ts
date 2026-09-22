import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { attachIdentityCookie, resolveIdentity } from '@/lib/identity';
import { findMockOffer, findMockProduct } from '@/services/mock-offer';

export const dynamic = 'force-dynamic';
const FavoriteSchema = z.object({
  offerId: z.string().trim().min(1).max(150),
  targetPriceTwd: z.number().finite().positive().max(100_000_000).optional(),
  notifyOnPriceDrop: z.boolean().default(true)
});
const PageSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50)
});

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const parsed = PageSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: '分頁條件無效', requestId, timestamp: new Date().toISOString() }, { status: 400 });
  try {
    const identity = await resolveIdentity(request);
    const { page, pageSize } = parsed.data;
    const [totalCount, records] = await Promise.all([
      prisma.userFavorite.count({ where: { userId: identity.userId } }),
      prisma.userFavorite.findMany({ where: { userId: identity.userId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })
    ]);
    const data = await Promise.all(records.map(async (record) => ({
      id: record.id,
      offerId: record.offerId,
      targetPriceTwd: record.targetPriceTwd ? Number(record.targetPriceTwd) : undefined,
      notifyOnPriceDrop: record.notifyOnPriceDrop,
      createdAt: record.createdAt.toISOString(),
      product: await findMockOffer(record.offerId)
    })));
    return attachIdentityCookie(NextResponse.json({ success: true, data, page, pageSize, totalCount, requestId, timestamp: new Date().toISOString() }), identity);
  } catch (error) {
    console.error(`[Favorites GET] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '收藏資料暫時無法使用', requestId, timestamp: new Date().toISOString() }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const parsed = FavoriteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: '收藏資料無效', details: parsed.error.flatten(), requestId, timestamp: new Date().toISOString() }, { status: 400 });
    const raw = findMockProduct(parsed.data.offerId);
    if (!raw) return NextResponse.json({ success: false, error: '商品不存在', requestId, timestamp: new Date().toISOString() }, { status: 404 });
    const identity = await resolveIdentity(request);
    const offerId = `${raw.source}_${raw.sourceProductId}`;
    const record = await prisma.userFavorite.upsert({
      where: { userId_offerId: { userId: identity.userId, offerId } },
      create: { userId: identity.userId, offerId, targetPriceTwd: parsed.data.targetPriceTwd, notifyOnPriceDrop: parsed.data.notifyOnPriceDrop },
      update: { targetPriceTwd: parsed.data.targetPriceTwd, notifyOnPriceDrop: parsed.data.notifyOnPriceDrop }
    });
    return attachIdentityCookie(NextResponse.json({ success: true, data: {
      id: record.id, offerId, targetPriceTwd: record.targetPriceTwd ? Number(record.targetPriceTwd) : undefined,
      notifyOnPriceDrop: record.notifyOnPriceDrop, createdAt: record.createdAt.toISOString()
    }, requestId, timestamp: new Date().toISOString() }, { status: 201 }), identity);
  } catch (error) {
    console.error(`[Favorites POST] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '無法儲存收藏', requestId, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
