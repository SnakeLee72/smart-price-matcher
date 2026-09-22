'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ProductOffer } from '@/types/commerce';
import { RecommendationScoreResult } from '@/types/recommendation';
import { 
  RecommendationBadgeTag, 
  WarrantyBadgeTag, 
  ConditionBadgeTag, 
  MockDataBadge 
} from './Badges';
import { PriceBreakdownModal } from './PriceBreakdownModal';
import { Star, Shield, Clock, HelpCircle, Bookmark, BarChart2 } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { PurchaseLink } from './PurchaseLink';

interface Props {
  offer: ProductOffer & { evaluation?: RecommendationScoreResult };
  viewMode?: 'grid' | 'list';
  onAddToCompare?: (offer: ProductOffer) => void;
  onToggleFavorite?: (offer: ProductOffer) => void;
  isCompared?: boolean;
  isFavorited?: boolean;
}

export function ProductCard({
  offer,
  viewMode = 'grid',
  onAddToCompare,
  onToggleFavorite,
  isCompared = false,
  isFavorited = false
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const { landedCost, evaluation } = offer;

  const isJapan = offer.countryOfOrigin === 'JP' || offer.currency === 'JPY';

  return (
    <>
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden ${
        viewMode === 'list' ? 'md:flex-row' : ''
      }`}>
        {/* 商品圖片區 */}
        <div className={`relative bg-slate-50 flex items-center justify-center p-4 ${
          viewMode === 'list' ? 'md:w-64 shrink-0' : 'h-48'
        }`}>
          <ProductImage
            url={offer.imageUrl}
            alt={offer.title}
            className="max-h-full max-w-full object-contain mix-blend-multiply"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            <MockDataBadge />
            {evaluation?.recommendationLabel && (
              <RecommendationBadgeTag badge={evaluation.recommendationLabel} />
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.preventDefault(); onToggleFavorite(offer); }}
                className={`p-1.5 rounded-full bg-white/90 shadow-sm transition ${
                  isFavorited ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-slate-600'
                }`}
                title={isFavorited ? '已收藏' : '加入收藏'}
              >
                <Bookmark className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
            )}
            {onAddToCompare && (
              <button
                onClick={(e) => { e.preventDefault(); onAddToCompare(offer); }}
                className={`p-1.5 rounded-full bg-white/90 shadow-sm transition ${
                  isCompared ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
                title={isCompared ? '已加入比較' : '加入商品比較'}
              >
                <BarChart2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 商品內容區 */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            {/* 標籤列 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                isJapan ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {isJapan ? '🇯🇵 日本直送' : '🇹🇼 台灣商城'}
              </span>
              <ConditionBadgeTag condition={offer.condition} />
              <WarrantyBadgeTag warrantyType={offer.warrantyType} months={offer.warrantyMonths} />
            </div>

            {/* 標題 */}
            <Link href={`/products/${offer.id}`} className="block group">
              <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition">
                {offer.title}
              </h3>
            </Link>

            {/* 賣家與評分 */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700 truncate max-w-[150px]">{offer.sellerName}</span>
              <span className="flex items-center text-amber-500 font-semibold gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {Number(offer.sellerRating).toFixed(1)}
              </span>
              <span className="text-slate-400">({offer.sellerReviewCount.toLocaleString()} 則評價)</span>
            </div>

            {/* 規格變體摘要 */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-600 pt-1">
              {offer.variant.color && <span className="bg-slate-100 px-1.5 py-0.5 rounded">顏色: {offer.variant.color}</span>}
              {offer.variant.capacity && <span className="bg-slate-100 px-1.5 py-0.5 rounded">容量: {offer.variant.capacity}</span>}
              {offer.variant.size && <span className="bg-slate-100 px-1.5 py-0.5 rounded">尺寸: {offer.variant.size}</span>}
              {offer.variant.voltage && <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">{offer.variant.voltage}</span>}
            </div>

            {/* 推薦理由或風險警告摘要 */}
            {evaluation?.recommendationReasons?.[0] && (
              <div className="text-xs text-blue-700 bg-blue-50/70 p-2 rounded-lg flex items-start gap-1.5">
                <span className="font-bold text-blue-600">✓</span>
                <span>{evaluation.recommendationReasons[0]}</span>
              </div>
            )}
            {evaluation?.riskWarnings?.[0] && (
              <div className="text-xs text-amber-700 bg-amber-50/70 p-2 rounded-lg flex items-start gap-1.5">
                <span className="font-bold text-amber-600">⚠</span>
                <span>{evaluation.riskWarnings[0]}</span>
              </div>
            )}
          </div>

          {/* 價格與按鈕列 */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-slate-400">
                  原幣：{offer.currency} {offer.salePrice.toLocaleString()}
                  {offer.originalPrice > offer.salePrice && (
                    <span className="line-through ml-1">{offer.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-slate-500 font-medium">總到手價</span>
                  <span className="text-xl font-bold text-slate-900">
                    NT$ {landedCost.totalTwd.toLocaleString()}
                  </span>
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-slate-400 hover:text-blue-600 transition ml-1"
                    title="查看到手價計算明細"
                  >
                    <HelpCircle className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <div className="flex items-center gap-1 justify-end text-emerald-600 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>約 {offer.minDeliveryDays}-{offer.maxDeliveryDays} 天抵達</span>
                </div>
                {landedCost.isEstimated && (
                  <div className="text-[11px] text-amber-600">包含預估稅費</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href={`/products/${offer.id}`}
                className="text-center text-xs font-medium py-2 px-3 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition"
              >
                商品詳情
              </Link>
              <PurchaseLink
                url={offer.productUrl}
                isMockData={offer.isMockData}
                className="flex items-center justify-center gap-1 text-center text-xs font-semibold py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
              >
                <span>前往購買</span>
              </PurchaseLink>
            </div>
          </div>
        </div>
      </div>

      <PriceBreakdownModal
        offer={offer}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
