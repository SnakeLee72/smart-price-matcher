import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SearchOrchestrator } from '@/services/search-orchestrator';
import { parseSearchIntent } from '@/services/search-intent';

export const dynamic = 'force-dynamic';
const orchestrator = new SearchOrchestrator();
const optionalText = z.string().trim().min(1).max(100).optional();
const optionalAmount = z.coerce.number().finite().min(0).optional();
const optionalBoolean = z.enum(['true', 'false']).transform((value) => value === 'true').optional();

const SearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(160).default('Sony'),
  brand: optionalText,
  model: optionalText,
  category: optionalText,
  minPrice: optionalAmount,
  maxPrice: optionalAmount,
  minShipping: optionalAmount,
  maxShipping: optionalAmount,
  condition: z.enum(['BRAND_NEW', 'OPEN_BOX', 'REFURBISHED', 'USED']).optional(),
  warrantyType: z.enum(['TAIWAN_OFFICIAL', 'PARALLEL_IMPORT', 'ORIGIN_DOMESTIC', 'NONE']).optional(),
  color: optionalText,
  size: optionalText,
  capacity: optionalText,
  voltage: optionalText,
  specification: optionalText,
  countryOfOrigin: z.string().trim().length(2).optional(),
  shipsToTaiwan: optionalBoolean,
  inStock: optionalBoolean,
  maxDeliveryDays: z.coerce.number().int().min(0).max(365).optional(),
  minSellerRating: z.coerce.number().finite().min(0).max(5).optional(),
  minReturnPolicyDays: z.coerce.number().int().min(0).max(365).optional(),
  sources: z.string().max(250).transform((value) => value.split(',').map((source) => source.trim()).filter(Boolean)).optional(),
  mode: z.enum(['BALANCED', 'LOWEST_PRICE', 'FASTEST_DELIVERY', 'BEST_WARRANTY', 'TAIWAN_OFFICIAL', 'TRUSTED_SELLER']).default('BALANCED'),
  sortBy: z.enum(['RECOMMENDED', 'PRICE_ASC', 'PRICE_DESC', 'ORIGINAL_PRICE_ASC', 'FASTEST_DELIVERY', 'SELLER_RATING', 'WARRANTY_BEST', 'UPDATED_DESC']).default('RECOMMENDED'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
}).refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
  message: '最低價格不得高於最高價格', path: ['maxPrice']
}).refine((query) => query.minShipping === undefined || query.maxShipping === undefined || query.minShipping <= query.maxShipping, {
  message: '最低運費不得高於最高運費', path: ['maxShipping']
});

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = () => new Date().toISOString();
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = SearchQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '搜尋條件無效', details: parsed.error.flatten(), requestId, timestamp: timestamp() }, { status: 400 });
    }

    const { q, mode, ...filters } = parsed.data;
    const intent = parseSearchIntent(q);
    const query = {
      ...intent,
      ...filters,
      maxPrice: filters.maxPrice ?? intent.maxPrice,
      warrantyType: filters.warrantyType ?? intent.warrantyType,
      shipsToTaiwan: filters.shipsToTaiwan ?? intent.shipsToTaiwan,
      capacity: filters.capacity ?? intent.capacity,
      color: filters.color ?? intent.color,
      voltage: filters.voltage ?? intent.voltage,
      countryOfOrigin: filters.countryOfOrigin ?? intent.countryOfOrigin
    };
    const result = await orchestrator.executeSearch(query, mode);
    return NextResponse.json({
      success: true,
      data: { keyword: q, totalCount: result.totalCount, page: query.page, pageSize: query.pageSize,
        successfulSources: result.successfulSources, failedSources: result.failedSources, cached: result.cached, offers: result.offers },
      requestId,
      timestamp: result.searchedAt
    });
  } catch (error) {
    console.error(`[Search API Error] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '搜尋暫時無法完成', requestId, timestamp: timestamp() }, { status: 500 });
  }
}
