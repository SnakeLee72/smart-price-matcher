'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductOffer, ProductCondition, WarrantyType } from '@/types/commerce';
import { RecommendationScoreResult, RecommendationMode } from '@/types/recommendation';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Search, LayoutGrid, List, AlertTriangle, ArrowUpDown, RefreshCw, BarChart2, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialKeyword = searchParams.get('q') || 'Sony';
  const [results, setResults] = useState<(ProductOffer & { evaluation?: RecommendationScoreResult })[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('RECOMMENDED');
  const [failedSources, setFailedSources] = useState<{ source: string; reason: string }[]>([]);
  const [searchedAt, setSearchedAt] = useState<string>('');
  const [searchError, setSearchError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // 篩選條件狀態
  const [filters, setFilters] = useState<{
    brand?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    maxShipping?: number;
    capacity?: string;
    color?: string;
    source?: string;
    condition?: ProductCondition;
    warrantyType?: WarrantyType;
    shipsToTaiwan?: boolean;
    mode: RecommendationMode;
  }>({
    mode: 'BALANCED'
  });

  // 比較與收藏狀態
  const [compareList, setCompareList] = useState<ProductOffer[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteRecords, setFavoriteRecords] = useState<Map<string, string>>(new Map());
  const [favoriteError, setFavoriteError] = useState('');

  useEffect(() => {
    fetch('/api/favorites').then((response) => response.json()).then((body) => {
      if (!body.success) return;
      const records = new Map<string, string>((body.data || []).map((item: { offerId: string; id: string }) => [item.offerId, item.id]));
      setFavoriteRecords(records);
      setFavoriteIds(new Set(records.keys()));
    }).catch(() => {});
  }, []);

  const fetchResults = async (q: string) => {
    setLoading(true);
    setSearchError('');
    try {
      const params = new URLSearchParams();
      params.set('q', q);
      params.set('mode', filters.mode);
      params.set('sortBy', sortBy);
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.category) params.set('category', filters.category);
      if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
      if (filters.maxShipping !== undefined) params.set('maxShipping', filters.maxShipping.toString());
      if (filters.capacity) params.set('capacity', filters.capacity);
      if (filters.color) params.set('color', filters.color);
      if (filters.condition) params.set('condition', filters.condition);
      if (filters.source) params.set('sources', filters.source);
      if (filters.warrantyType) params.set('warrantyType', filters.warrantyType);
      if (filters.shipsToTaiwan !== undefined) params.set('shipsToTaiwan', String(filters.shipsToTaiwan));

      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setResults(json.data.offers || []);
        setTotalCount(json.data.totalCount ?? json.data.offers?.length ?? 0);
        setFailedSources(json.data.failedSources || []);
        setSearchedAt(json.timestamp || new Date().toISOString());
      } else { setResults([]); setTotalCount(0); setSearchError(json.error || '搜尋暫時無法完成'); }
    } catch (err) {
      console.error('Failed to search', err);
      setResults([]); setTotalCount(0); setSearchError('無法連線到搜尋服務，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(initialKeyword);
  }, [initialKeyword, filters, sortBy]);

  const toggleCompare = (offer: ProductOffer) => {
    if (compareList.some((item) => item.id === offer.id)) {
      setCompareList(compareList.filter((item) => item.id !== offer.id));
    } else {
      if (compareList.length >= 4) {
        alert('最多同時僅能比較 4 項商品！');
        return;
      }
      setCompareList([...compareList, offer]);
    }
  };

  const toggleFavorite = async (offer: ProductOffer) => {
    setFavoriteError('');
    try {
      const existingId = favoriteRecords.get(offer.id);
      const response = existingId
        ? await fetch(`/api/favorites/${existingId}`, { method: 'DELETE' })
        : await fetch('/api/favorites', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offerId: offer.id })
          });
      const result = await response.json();
      if (!result.success) { setFavoriteError(result.error || '無法更新收藏'); return; }
      const next = new Map(favoriteRecords);
      if (existingId) next.delete(offer.id);
      else next.set(offer.id, result.data.id);
      setFavoriteRecords(next);
      setFavoriteIds(new Set(next.keys()));
    } catch (error) {
      console.error(error);
      setFavoriteError('無法連線到收藏服務');
    }
  };

  // 尋找各領域之冠軍商品 (Top Highlights)
  const bestOverall = results.find((r) => r.evaluation?.recommendationLabel === 'BEST_OVERALL');
  const lowestPrice = results.find((r) => r.evaluation?.recommendationLabel === 'LOWEST_PRICE');

  return (
    <div className="space-y-6">
      {favoriteError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{favoriteError}</div>}
      {/* 頂部搜尋列與狀態摘要 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form action="/search" method="get" className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              name="q"
              key={initialKeyword}
              defaultValue={initialKeyword}
              required
              placeholder="搜尋品牌、型號、自然語言需求..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition"
          >
            搜尋
          </button>
        </form>

        {/* 排序與視圖切換 */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-xs text-slate-800"
            >
              <option value="RECOMMENDED">綜合推薦評分</option>
              <option value="PRICE_ASC">總到手價由低到高</option>
              <option value="PRICE_DESC">總到手價由高到低</option>
              <option value="ORIGINAL_PRICE_ASC">商品定價由低到高</option>
              <option value="FASTEST_DELIVERY">最快到貨優先</option>
              <option value="SELLER_RATING">賣家評價最高</option>
              <option value="WARRANTY_BEST">保固條件最佳</option>
              <option value="UPDATED_DESC">資料更新時間最新</option>
            </select>
          </div>

          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              title="卡片網格視圖"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              title="清單列表視圖"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 比較浮動列提示 (若有選擇商品) */}
      {compareList.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm border border-slate-700">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <span>已選取 <strong>{compareList.length}</strong> / 4 項商品進行比較</span>
          <div className="flex gap-2">
            <Link
              href={`/compare?ids=${compareList.map((i) => i.id).join(',')}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-xs font-semibold"
            >
              前往比較
            </Link>
            <button
              onClick={() => setCompareList([])}
              className="text-slate-400 hover:text-slate-200 text-xs px-2"
            >
              清空
            </button>
          </div>
        </div>
      )}

      {/* 來源失敗警告提示列 */}
      {failedSources.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            提示：部分電商來源 ({failedSources.map((f) => f.source).join(', ')}) 暫時無回應，其他正常來源結果已完整呈現。
          </span>
        </div>
      )}

      {/* 搜尋結果統計與推薦亮點摘要 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
        <div>
          搜尋關鍵字「<strong className="text-slate-900">{initialKeyword}</strong>」共有{' '}
          <strong className="text-blue-600 font-bold">{totalCount}</strong> 筆報價結果
          {searchedAt && <span className="ml-2 text-slate-400">更新於 {new Date(searchedAt).toLocaleTimeString()}</span>}
        </div>
        <div className="flex gap-3">
          {bestOverall && (
            <span className="text-blue-700 font-medium">
              ★ 最佳綜合: {bestOverall.brand} {bestOverall.model} (NT$ {bestOverall.landedCost.totalTwd.toLocaleString()})
            </span>
          )}
          {lowestPrice && (
            <span className="text-emerald-700 font-medium">
              $ 最低價: NT$ {lowestPrice.landedCost.totalTwd.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <button type="button" aria-expanded={mobileFiltersOpen} aria-controls="mobile-filters" onClick={() => setMobileFiltersOpen(true)} className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"><SlidersHorizontal className="h-4 w-4" />篩選條件</button>
      {mobileFiltersOpen && <div id="mobile-filters" className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="搜尋篩選條件">
        <button type="button" aria-label="關閉篩選器" className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileFiltersOpen(false)} />
        <div className="absolute right-0 top-0 bottom-0 w-[min(90vw,360px)] overflow-y-auto bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between"><strong>篩選條件</strong><button type="button" aria-label="關閉篩選器" onClick={() => setMobileFiltersOpen(false)}><X /></button></div>
          <FilterSidebar filters={filters} onChange={setFilters} onReset={() => setFilters({ mode: 'BALANCED' })} />
          <button type="button" onClick={() => setMobileFiltersOpen(false)} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white">查看結果</button>
        </div>
      </div>}
      {/* 主版面：左側篩選，右側商品清單 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 左側篩選器 */}
        <div className="hidden lg:block lg:col-span-1">
          <FilterSidebar
            filters={filters}
            onChange={(newFilters) => setFilters(newFilters)}
            onReset={() => setFilters({ mode: 'BALANCED' })}
          />
        </div>

        {/* 右側商品卡片列表 */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-slate-200">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-slate-600 font-medium">跨來源搜尋比價中，正在標準化商品規格與計算到手價...</p>
            </div>
          ) : searchError ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{searchError}<button type="button" onClick={() => fetchResults(initialKeyword)} className="ml-3 font-semibold underline">重試</button></div> : results.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-3xl">🔍</div>
              <h3 className="font-bold text-slate-800 text-base">找不到相符的商品報價</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                建議您嘗試減少篩選條件，或搜尋熱門品牌如「Sony」、「Apple」、「Dell」、「象印」或型號。
              </p>
              <button
                onClick={() => { setFilters({ mode: 'BALANCED' }); router.push('/search?q=Sony'); }}
                className="text-xs text-blue-600 font-semibold underline"
              >
                查看預設推薦 (Sony)
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
              {results.map((offer) => (
                <ProductCard
                  key={offer.id}
                  offer={offer}
                  viewMode={viewMode}
                  onAddToCompare={toggleCompare}
                  onToggleFavorite={toggleFavorite}
                  isCompared={compareList.some((item) => item.id === offer.id)}
                  isFavorited={favoriteIds.has(offer.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">載入中...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
