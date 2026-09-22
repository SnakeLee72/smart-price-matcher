import React from 'react';
import { RecommendationBadge } from '@/types/recommendation';
import { WarrantyType, ProductCondition } from '@/types/commerce';

export function RecommendationBadgeTag({ badge }: { badge?: RecommendationBadge }) {
  if (!badge) return null;

  switch (badge) {
    case 'BEST_OVERALL':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          ★ 最佳綜合推薦
        </span>
      );
    case 'LOWEST_PRICE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          $ 最低總到手價
        </span>
      );
    case 'FASTEST_DELIVERY':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          ⚡ 最快到貨
        </span>
      );
    case 'BEST_WARRANTY':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          🛡️ 最佳保固
        </span>
      );
    default:
      return null;
  }
}

export function WarrantyBadgeTag({ warrantyType, months }: { warrantyType: WarrantyType; months?: number }) {
  switch (warrantyType) {
    case 'TAIWAN_OFFICIAL':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          台灣公司貨 ({months || 12}月保固)
        </span>
      );
    case 'PARALLEL_IMPORT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          平行輸入 ({months || 12}月店保)
        </span>
      );
    case 'ORIGIN_DOMESTIC':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
          原產國當地保固
        </span>
      );
    case 'NONE':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
          無保固
        </span>
      );
  }
}

export function ConditionBadgeTag({ condition }: { condition: ProductCondition }) {
  switch (condition) {
    case 'BRAND_NEW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          全新
        </span>
      );
    case 'OPEN_BOX':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          展示/福利品
        </span>
      );
    case 'REFURBISHED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          整新品
        </span>
      );
    case 'USED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          二手
        </span>
      );
  }
}

export function MockDataBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200" title="此資料為測試模擬資料，非真實即時報價">
      模擬資料 (Mock Data)
    </span>
  );
}
