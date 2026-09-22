'use client';
import React from 'react';
import { RecommendationMode } from '@/types/recommendation';
import { ProductCondition, WarrantyType } from '@/types/commerce';

interface FilterValues {
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
}

interface Props {
  filters: FilterValues;
  onChange: (newFilters: FilterValues) => void;
  onReset: () => void;
}

export function FilterSidebar({ filters, onChange, onReset }: Props) {
  const modes: { label: string; value: RecommendationMode }[] = [
    { label: '綜合推薦 (預設)', value: 'BALANCED' },
    { label: '最低總價優先', value: 'LOWEST_PRICE' },
    { label: '最快到貨優先', value: 'FASTEST_DELIVERY' },
    { label: '台灣公司貨保固', value: 'TAIWAN_OFFICIAL' },
    { label: '高信譽賣家優先', value: 'TRUSTED_SELLER' }
  ];

  const categories = [
    { label: '全部分類', value: '' },
    { label: '耳機 (Headphones)', value: 'Headphones' },
    { label: '智慧型手機 (Smartphones)', value: 'Smartphones' },
    { label: '顯示器 (Monitors)', value: 'Monitors' },
    { label: '電腦周邊 (Peripherals)', value: 'Peripherals' },
    { label: '日本生活家電 (Appliances)', value: 'Appliances' }
  ];

  const brands = ['Sony', 'Apple', 'Bose', 'Samsung', 'Dell', 'Logitech', 'Zojirushi', 'Dyson', 'LG', 'Sharp', 'Panasonic'];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6 text-sm">
      <div className="space-y-3">
        <label className="font-semibold text-slate-800 text-xs block">商品規格與來源</label>
        <input aria-label="容量" value={filters.capacity || ''} onChange={(event) => onChange({ ...filters, capacity: event.target.value || undefined })} placeholder="容量，例如 256GB" className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs" />
        <input aria-label="顏色" value={filters.color || ''} onChange={(event) => onChange({ ...filters, color: event.target.value || undefined })} placeholder="顏色，例如 黑" className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs" />
        <select aria-label="商品狀態" value={filters.condition || ''} onChange={(event) => onChange({ ...filters, condition: (event.target.value || undefined) as ProductCondition | undefined })} className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white">
          <option value="">所有商品狀態</option>
          <option value="BRAND_NEW">全新</option>
          <option value="OPEN_BOX">展示／拆封</option>
          <option value="REFURBISHED">整新品</option>
          <option value="USED">二手</option>
        </select>
        <select aria-label="資料來源" value={filters.source || ''} onChange={(event) => onChange({ ...filters, source: event.target.value || undefined })} className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white">
          <option value="">全部來源</option>
          <option value="mock_tw_store">模擬台灣商店</option>
          <option value="mock_jp_store">模擬日本商店</option>
        </select>
        <input aria-label="最高運費" type="number" min="0" value={filters.maxShipping ?? ''} onChange={(event) => onChange({ ...filters, maxShipping: event.target.value ? Number(event.target.value) : undefined })} placeholder="最高運費 NT$" className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs" />
      </div>
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="font-bold text-slate-900 text-base">條件篩選</h3>
        <button
          onClick={onReset}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          重設條件
        </button>
      </div>

      {/* 推薦偏好模式 */}
      <div className="space-y-2">
        <label className="font-semibold text-slate-800 text-xs block">智慧推薦決策模式</label>
        <div className="space-y-1.5">
          {modes.map((m) => (
            <label key={m.value} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="radio"
                name="recommendationMode"
                checked={filters.mode === m.value}
                onChange={() => onChange({ ...filters, mode: m.value })}
                className="text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs">{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 分類篩選 */}
      <div className="space-y-2 border-t pt-4">
        <label className="font-semibold text-slate-800 text-xs block">商品品類</label>
        <select
          value={filters.category || ''}
          onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
          className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-700 bg-slate-50 focus:bg-white"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* 總到手價區間 */}
      <div className="space-y-2 border-t pt-4">
        <label className="font-semibold text-slate-800 text-xs block">預估總到手價區間 (NT$)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="最低"
            value={filters.minPrice || ''}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            placeholder="最高"
            value={filters.maxPrice || ''}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* 品牌快捷選擇 */}
      <div className="space-y-2 border-t pt-4">
        <label className="font-semibold text-slate-800 text-xs block">品牌</label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {brands.map((b) => {
            const isSelected = filters.brand === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => onChange({ ...filters, brand: isSelected ? undefined : b })}
                className={`text-xs px-2.5 py-1 rounded-md transition border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 font-medium'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* 保固類型 */}
      <div className="space-y-2 border-t pt-4">
        <label className="font-semibold text-slate-800 text-xs block">保固與來源</label>
        <div className="space-y-1.5 text-xs text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.warrantyType === 'TAIWAN_OFFICIAL'}
              onChange={(e) => onChange({ ...filters, warrantyType: e.target.checked ? 'TAIWAN_OFFICIAL' : undefined })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>台灣原廠公司貨保固</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.warrantyType === 'ORIGIN_DOMESTIC'}
              onChange={(e) => onChange({ ...filters, warrantyType: e.target.checked ? 'ORIGIN_DOMESTIC' : undefined })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>原產國當地保固 (日本原裝)</span>
          </label>
        </div>
      </div>

      {/* 運送限制 */}
      <div className="space-y-2 border-t pt-4">
        <label className="font-semibold text-slate-800 text-xs block">配送地點</label>
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
          <input
            type="checkbox"
            checked={filters.shipsToTaiwan !== false}
            onChange={(e) => onChange({ ...filters, shipsToTaiwan: e.target.checked ? true : undefined })}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>僅顯示可寄送台灣之商品</span>
        </label>
      </div>
    </div>
  );
}
