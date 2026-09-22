import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ConnectorRegistry } from '@/connectors/registry';
import { MOCK_PRODUCTS_DATA } from '@/connectors/mock-data';
import { RecommendationEngine } from '@/services/recommendation-engine';

const CompareRequestSchema = z.object({
  productIds: z.array(z.string()).min(1).max(4, '最多僅能同時比較 4 項商品')
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = CompareRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: '輸入參數錯誤',
        details: parsed.error.flatten(),
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const { productIds } = parsed.data;
    const registry = ConnectorRegistry.getInstance();
    const connectors = registry.getEnabledConnectors();

    const offers = await Promise.all(
      productIds.map(async (id) => {
        const raw = MOCK_PRODUCTS_DATA.find((p) => `${p.source}_${p.sourceProductId}` === id || p.sourceProductId === id);
        if (!raw) return null;
        const c = connectors.find((item) => item.source === raw.source);
        return c ? await c.normalize(raw) : null;
      })
    );

    const validOffers = offers.filter((o): o is NonNullable<typeof o> => o !== null);
    const evaluations = RecommendationEngine.evaluate(validOffers);

    const enrichedOffers = validOffers.map((o) => ({
      ...o,
      evaluation: evaluations.get(o.id)
    }));

    return NextResponse.json({
      success: true,
      data: {
        comparedCount: enrichedOffers.length,
        offers: enrichedOffers
      },
      requestId,
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    console.error(`[Compare API Error] RequestId: ${requestId}`, err);
    return NextResponse.json({
      success: false,
      error: '商品比較處理異常',
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
