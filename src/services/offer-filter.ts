import { ProductOffer, SearchQuery } from '@/types/commerce';

const includes = (value: string | undefined, search: string | undefined) =>
  !search || Boolean(value?.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

/** Apply all user filters to normalized values so currencies share the same TWD limits. */
export function matchesOffer(offer: ProductOffer, query: SearchQuery): boolean {
  const shipping = offer.landedCost.domesticShippingTwd + offer.landedCost.internationalShippingTwd;
  if (!includes(offer.brand, query.brand) || !includes(offer.model, query.model)) return false;
  if (query.category && offer.category.toLowerCase() !== query.category.toLowerCase()) return false;
  if (query.condition && offer.condition !== query.condition) return false;
  if (!includes(offer.variant.color, query.color)) return false;
  if (!includes(offer.variant.size, query.size)) return false;
  if (!includes(offer.variant.capacity, query.capacity)) return false;
  if (!includes(offer.variant.voltage, query.voltage)) return false;
  if (query.specification && !`${offer.title} ${JSON.stringify(offer.rawData)}`.toLocaleLowerCase().includes(query.specification.toLocaleLowerCase())) return false;
  if (query.countryOfOrigin && offer.countryOfOrigin.toUpperCase() !== query.countryOfOrigin.toUpperCase()) return false;
  if (query.shipsToTaiwan !== undefined && offer.shipsToTaiwan !== query.shipsToTaiwan) return false;
  if (query.warrantyType && offer.warrantyType !== query.warrantyType) return false;
  if (query.sources?.length && !query.sources.includes(offer.source)) return false;
  if (query.minPrice !== undefined && offer.landedCost.totalTwd < query.minPrice) return false;
  if (query.maxPrice !== undefined && offer.landedCost.totalTwd > query.maxPrice) return false;
  if (query.minShipping !== undefined && shipping < query.minShipping) return false;
  if (query.maxShipping !== undefined && shipping > query.maxShipping) return false;
  if (query.maxDeliveryDays !== undefined && offer.maxDeliveryDays > query.maxDeliveryDays) return false;
  if (query.minSellerRating !== undefined && offer.sellerRating < query.minSellerRating) return false;
  if (query.minReturnPolicyDays !== undefined && offer.returnPolicyDays < query.minReturnPolicyDays) return false;
  if (query.inStock && offer.stockStatus === 'OUT_OF_STOCK') return false;
  return true;
}
