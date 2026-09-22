import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@/connectors/registry';
import { RecommendationEngine } from '@/services/recommendation-engine';
import { MOCK_PRODUCTS_DATA } from '@/connectors/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  try {
    const registry = ConnectorRegistry.getInstance();
    const connectors = registry.getEnabledConnectors();

    // 尋找指定的 Offer
    let targetRaw = MOCK_PRODUCTS_DATA.find((p) => `${p.source}_${p.sourceProductId}` === id || p.sourceProductId === id);
    if (!targetRaw) {
      return NextResponse.json({
        success: false,
        error: '找不到指定的商品',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const connector = connectors.find((c) => c.source === targetRaw?.source);
    if (!connector) {
      return NextResponse.json({
        success: false,
        error: '該商品之供應來源目前未啟用',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    const currentOffer = await connector.normalize(targetRaw);

    // 尋找相同型號/品牌的相關通路報價 (Cross-Platform Offers)
    const relatedRaws = MOCK_PRODUCTS_DATA.filter((p) => {
      const matchBrand = p.brand?.toLowerCase() === targetRaw?.brand?.toLowerCase();
      const matchModel = p.model?.toLowerCase() === targetRaw?.model?.toLowerCase();
      return matchBrand && matchModel;
    });

    const relatedOffers = await Promise.all(
      relatedRaws.map(async (r) => {
        const c = connectors.find((item) => item.source === r.source);
        return c ? await c.normalize(r) : null;
      })
    );
    const validRelatedOffers = relatedOffers.filter((o): o is NonNullable<typeof o> => o !== null);

    const evaluations = RecommendationEngine.evaluate(validRelatedOffers);
    const offersWithEval = validRelatedOffers.map((o) => ({
      ...o,
      evaluation: evaluations.get(o.id)
    }));

    return NextResponse.json({
      success: true,
      data: {
        product: {
          ...currentOffer,
          evaluation: evaluations.get(currentOffer.id)
        },
        competingOffers: offersWithEval,
        specifications: targetRaw.rawAttributes,
        isMockData: true
      },
      requestId,
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    console.error(`[Product Detail API Error] RequestId: ${requestId}`, err);
    return NextResponse.json({
      success: false,
      error: '讀取商品詳細資料失敗',
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
