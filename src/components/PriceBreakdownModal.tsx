import React from 'react';
import { ProductOffer } from '@/types/commerce';

interface Props {
  offer: ProductOffer;
  isOpen: boolean;
  onClose: () => void;
}

export function PriceBreakdownModal({ offer, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const { landedCost } = offer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-900">總到手價計算明細</h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{offer.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 leading-none"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">商品原始售價 ({offer.currency})</span>
            <span className="font-medium">{offer.currency} {offer.salePrice.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">商品售價折合台幣</span>
            <span className="font-medium">NT$ {landedCost.itemPriceTwd.toLocaleString()}</span>
          </div>

          {landedCost.discountTwd > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>已折抵優惠券</span>
              <span>- NT$ {landedCost.discountTwd.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-600">境內配送運費</span>
            <span>{landedCost.domesticShippingTwd === 0 ? '免運費' : `+ NT$ ${landedCost.domesticShippingTwd.toLocaleString()}`}</span>
          </div>

          {landedCost.internationalShippingTwd > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">
                國際跨境運費
                {landedCost.missingCostFields.includes('internationalShipping') && (
                  <span className="text-xs text-amber-600 ml-1">(系統預估)</span>
                )}
              </span>
              <span>+ NT$ {landedCost.internationalShippingTwd.toLocaleString()}</span>
            </div>
          )}

          {landedCost.estimatedDutyTwd > 0 && (
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-600">預估進口海關關稅</span>
              <span>+ NT$ {landedCost.estimatedDutyTwd.toLocaleString()}</span>
            </div>
          )}

          {landedCost.estimatedTaxTwd > 0 && (
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-600">預估進口營業稅 (5%)</span>
              <span>+ NT$ {landedCost.estimatedTaxTwd.toLocaleString()}</span>
            </div>
          )}

          {landedCost.serviceFeeTwd > 0 && (
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-600">國際刷卡交易手續費 (1.5%)</span>
              <span>+ NT$ {landedCost.serviceFeeTwd.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between font-bold text-base text-blue-900">
            <span>預估總到手價</span>
            <span className="text-xl text-blue-600">NT$ {landedCost.totalTwd.toLocaleString()}</span>
          </div>
        </div>

        {landedCost.calculationNotes.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-700">計算說明與匯率依據：</h4>
            <ul className="text-xs text-slate-600 space-y-1 bg-amber-50/50 p-3 rounded border border-amber-100">
              {landedCost.calculationNotes.map((note, idx) => (
                <li key={idx}>• {note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-slate-400 text-center pt-2">
          * 總到手價包含商品售價、運費與依法申報之稅額估算，最終扣款金額請依原始電商結帳頁面為準。
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
