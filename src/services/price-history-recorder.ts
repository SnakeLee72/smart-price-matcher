import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ProductOffer } from '@/types/commerce';

let retryAfter = 0;

export function shouldRecordSnapshot(
  previous: { price: number; landedCostTwd: number; recordedAt: Date } | null,
  price: number,
  landedCostTwd: number,
  now = Date.now()
): boolean {
  if (!previous) return true;
  return previous.price !== price || previous.landedCostTwd !== landedCostTwd ||
    now - previous.recordedAt.getTime() >= 24 * 60 * 60 * 1000;
}

async function recordOne(offer: ProductOffer) {
  const saved = await prisma.productOffer.upsert({
    where: { source_sourceProductId: { source: offer.source, sourceProductId: offer.sourceProductId } },
    create: {
      source: offer.source, sourceProductId: offer.sourceProductId, title: offer.title,
      normalizedTitle: offer.normalizedTitle, brand: offer.brand, model: offer.model || null,
      category: offer.category, condition: offer.condition, sellerName: offer.sellerName,
      sellerRating: offer.sellerRating, sellerReviewCount: offer.sellerReviewCount,
      imageUrl: offer.imageUrl, productUrl: offer.productUrl, currency: offer.currency,
      originalPrice: offer.originalPrice, salePrice: offer.salePrice, couponDiscount: offer.couponDiscount,
      domesticShipping: offer.domesticShipping, internationalShipping: offer.internationalShipping,
      estimatedDuty: offer.landedCost.estimatedDutyTwd, estimatedVat: offer.landedCost.estimatedTaxTwd,
      serviceFee: offer.serviceFee, landedCostTwd: offer.landedCost.totalTwd,
      isShippingEstimated: offer.landedCost.missingCostFields.includes('internationalShipping'),
      isTaxEstimated: offer.landedCost.isEstimated, stockStatus: offer.stockStatus,
      minDeliveryDays: offer.minDeliveryDays, maxDeliveryDays: offer.maxDeliveryDays,
      shipsToTaiwan: offer.shipsToTaiwan, countryOfOrigin: offer.countryOfOrigin,
      warrantyType: offer.warrantyType, warrantyMonths: offer.warrantyMonths,
      returnPolicyDays: offer.returnPolicyDays, isOfficialStore: offer.isOfficialStore,
      isAuthorizedSeller: offer.isAuthorizedSeller, rawData: offer.rawData as Prisma.InputJsonValue,
      isMockData: offer.isMockData, lastUpdatedAt: new Date(offer.lastUpdatedAt)
    },
    update: {
      title: offer.title, salePrice: offer.salePrice, originalPrice: offer.originalPrice,
      landedCostTwd: offer.landedCost.totalTwd, stockStatus: offer.stockStatus,
      lastUpdatedAt: new Date(offer.lastUpdatedAt)
    }
  });
  const previous = await prisma.priceHistory.findFirst({ where: { offerId: saved.id }, orderBy: { recordedAt: 'desc' } });
  const last = previous ? { price: Number(previous.price), landedCostTwd: Number(previous.landedCostTwd), recordedAt: previous.recordedAt } : null;
  if (shouldRecordSnapshot(last, offer.salePrice, offer.landedCost.totalTwd)) {
    await prisma.priceHistory.create({ data: {
      offerId: saved.id, canonicalProductId: saved.canonicalProductId,
      price: offer.salePrice, currency: offer.currency, landedCostTwd: offer.landedCost.totalTwd
    } });
  }
}

/** Record observations only when a database-backed deployment opts in. */
export async function recordOfferPrices(offers: ProductOffer[]): Promise<void> {
  if (process.env.ENABLE_PRICE_PERSISTENCE !== 'true' || Date.now() < retryAfter) return;
  try {
    for (let offset = 0; offset < offers.length; offset += 4) {
      await Promise.all(offers.slice(offset, offset + 4).map(recordOne));
    }
  } catch (error) {
    retryAfter = Date.now() + 60_000;
    throw error;
  }
}
