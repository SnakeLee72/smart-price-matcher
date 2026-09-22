'use client';
import { ProductImage } from '@/components/ProductImage';
import { PurchaseLink } from '@/components/PurchaseLink';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductOffer } from '@/types/commerce';
import { RecommendationScoreResult } from '@/types/recommendation';
import { WarrantyBadgeTag, ConditionBadgeTag, MockDataBadge } from '@/components/Badges';
import { ExternalLink, Trash2, ArrowLeft, Star, Clock, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { PriceBreakdownModal } from '@/components/PriceBreakdownModal';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawIds = searchParams.get('ids') || '';

  const [offers, setOffers] = useState<(ProductOffer & { evaluation?: RecommendationScoreResult })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<ProductOffer | null>(null);

  const fetchCompareData = async (idsString: string) => {
    const ids = idsString.split(',').filter(Boolean);
    if (ids.length === 0) {
      setOffers([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: ids.slice(0, 4) })
      });
      const json = await res.json();
      if (json.success) {
        setOffers(json.data.offers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompareData(rawIds);
  }, [rawIds]);

  const removeOffer = (id: string) => {
    const remaining = offers.filter((o) => o.id !== id);
    setOffers(remaining);
    const newIds = remaining.map((o) => o.id).join(',');
    router.replace(`/compare?ids=${newIds}`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">正在產生多品項規格與到手成本矩陣...</p>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-sm">
        <div className="text-4xl">⚖️</div>
        <h2 className="font-bold text-slate-900 text-lg">尚未選取比較商品</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          請於搜尋結果頁點擊卡片右上角的「比較」圖示（最多可同時選取 4 款），系統將為您生成清晰的價格、運費與規格差異矩陣。
        </p>
        <Link
          href="/search?q=Sony"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition"
        >
          前往搜尋並加入比較
        </Link>
      </div>
    );
  }

  // 取得所有出現過的規格欄位
  const specKeys = Array.from(
    new Set(offers.flatMap((o) => Object.keys(o.rawData || {})))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/search" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回搜尋結果</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">多品項規格與到手價格矩陣比較 ({offers.length} / 4)</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 w-40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                比較項目
              </th>
              {offers.map((offer) => (
                <th key={offer.id} className="p-4 text-left w-64 align-top">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <MockDataBadge />
                      <button
                        onClick={() => removeOffer(offer.id)}
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="從比較移除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <ProductImage
                      url={offer.imageUrl}
                      alt={offer.title}
                      className="w-24 h-24 object-contain mx-auto bg-white rounded p-1"
                    />
                    <h4 className="font-semibold text-xs text-slate-900 line-clamp-2 h-8">
                      {offer.title}
                    </h4>
                    <div className="text-[11px] text-slate-400">來源：{offer.source === 'mock_tw_store' ? '台灣商城' : '日本直送'}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {/* 總到手價 */}
            <tr className="bg-blue-50/40 font-bold">
              <td className="p-4 text-blue-900">預估總到手價</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4 text-blue-600 text-base">
                  <div className="flex items-center gap-1">
                    <span>NT$ {offer.landedCost.totalTwd.toLocaleString()}</span>
                    <button
                      onClick={() => setSelectedBreakdown(offer)}
                      className="text-slate-400 hover:text-blue-600"
                      title="查看成本計算明細"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              ))}
            </tr>

            {/* 原幣售價 */}
            <tr>
              <td className="p-4 text-slate-500 font-medium">原始定價與幣別</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4 text-slate-700">
                  {offer.currency} {offer.salePrice.toLocaleString()}
                </td>
              ))}
            </tr>

            {/* 運費與稅費 */}
            <tr>
              <td className="p-4 text-slate-500 font-medium">運費及稅費負擔</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4 text-slate-700 space-y-1">
                  <div>境內運費: NT$ {offer.landedCost.domesticShippingTwd}</div>
                  {offer.landedCost.internationalShippingTwd > 0 && (
                    <div>國際運費: NT$ {offer.landedCost.internationalShippingTwd}</div>
                  )}
                  {offer.landedCost.estimatedDutyTwd > 0 && (
                    <div className="text-amber-700">進口關稅: NT$ {offer.landedCost.estimatedDutyTwd}</div>
                  )}
                </td>
              ))}
            </tr>

            {/* 保固條件 */}
            <tr>
              <td className="p-4 text-slate-500 font-medium">保固類型與期限</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4">
                  <WarrantyBadgeTag warrantyType={offer.warrantyType} months={offer.warrantyMonths} />
                </td>
              ))}
            </tr>

            {/* 商品狀態 */}
            <tr>
              <td className="p-4 text-slate-500 font-medium">商品狀態</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4">
                  <ConditionBadgeTag condition={offer.condition} />
                </td>
              ))}
            </tr>

            {/* 到貨時程 */}
            <tr>
              <td className="p-4 text-slate-500 font-medium">預估配送到貨</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4 text-slate-700">
                  約 {offer.minDeliveryDays} ~ {offer.maxDeliveryDays} 個工作天
                </td>
              ))}
            </tr>

            {/* 賣家信用與評價 */}
            <tr>
              <td className="p-4 text-slate-500 font-medium">賣家評價信譽</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4 text-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900">{offer.sellerName}</div>
                  <div className="flex items-center text-amber-500 gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{Number(offer.sellerRating).toFixed(1)} / 5.0</span>
                    <span className="text-slate-400">({offer.sellerReviewCount})</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* 退貨政策 */}
            <tr>
              <td className="p-4 text-slate-500 font-medium">鑑賞期與退貨</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4 text-slate-700">
                  {offer.returnPolicyDays > 0 ? `${offer.returnPolicyDays} 天商品猶豫期` : '海外直送恕無法無條件退貨'}
                </td>
              ))}
            </tr>

            {/* 動態規格欄位 */}
            {specKeys.map((key) => (
              <tr key={key}>
                <td className="p-4 text-slate-500 font-medium capitalize">{key}</td>
                {offers.map((offer) => (
                  <td key={offer.id} className="p-4 text-slate-700">
                    {String(offer.rawData?.[key] || '-')}
                  </td>
                ))}
              </tr>
            ))}

            {/* 前往電商購買 */}
            <tr className="bg-slate-50">
              <td className="p-4 text-slate-500 font-medium">官方購買連結</td>
              {offers.map((offer) => (
                <td key={offer.id} className="p-4">
                  <PurchaseLink
                    url={offer.productUrl}
                    isMockData={offer.isMockData}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm transition"
                  >
                    <span>前往電商下單</span>
                  </PurchaseLink>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {selectedBreakdown && (
        <PriceBreakdownModal
          offer={selectedBreakdown}
          isOpen={true}
          onClose={() => setSelectedBreakdown(null)}
        />
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">載入比較資料中...</div>}>
      <CompareContent />
    </Suspense>
  );
}
