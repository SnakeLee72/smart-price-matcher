import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findMockProduct } from '@/services/mock-offer';
import { LandedCostCalculator } from '@/services/landed-cost-calculator';

export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const requestId = crypto.randomUUID();
  const raw = findMockProduct(productId);
  if (!raw) return NextResponse.json({ success: false, error: '商品不存在', requestId, timestamp: new Date().toISOString() }, { status: 404 });
  try {
    const offer = await prisma.productOffer.findUnique({ where: { source_sourceProductId: { source: raw.source, sourceProductId: raw.sourceProductId } } });
    if (!offer) return NextResponse.json({ success: true, data: null, requestId, timestamp: new Date().toISOString() });
    const rows = await prisma.priceHistory.findMany({ where: { offerId: offer.id }, orderBy: { recordedAt: 'asc' }, take: 365 });
    if (!rows.length) return NextResponse.json({ success: true, data: null, requestId, timestamp: new Date().toISOString() });
    const landed = LandedCostCalculator.calculate({
      itemPrice: raw.price, currency: raw.currency, category: raw.category,
      domesticShipping: raw.currency === 'TWD' ? raw.shippingFee : 0,
      internationalShipping: raw.currency !== 'TWD' ? raw.shippingFee : 0,
      isShippingEstimated: raw.isShippingEstimated,
      couponDiscount: 0, shipsToTaiwan: raw.shipsToTaiwan
    });
    const history = rows.map((row) => ({ date: row.recordedAt.toISOString().slice(0, 10), price: Number(row.price), landedCostTwd: Number(row.landedCostTwd) }));
    const totals = history.map((row) => row.landedCostTwd);
    return NextResponse.json({ success: true, data: {
      productId, currency: raw.currency, currentPrice: raw.price,
      currentLandedCostTwd: landed.totalTwd,
      minHistoricalPriceTwd: Math.min(...totals),
      maxHistoricalPriceTwd: Math.max(...totals),
      averagePriceTwd: Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length),
      history, isMockData: offer.isMockData
    }, requestId, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(`[Price History GET] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '價格歷史暫時無法使用', requestId, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
