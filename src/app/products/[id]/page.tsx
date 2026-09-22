'use client';
import { ProductImage } from '@/components/ProductImage';
import { PurchaseLink } from '@/components/PurchaseLink';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProductOffer } from '@/types/commerce';
import { RecommendationScoreResult } from '@/types/recommendation';
import { 
  WarrantyBadgeTag, 
  ConditionBadgeTag, 
  RecommendationBadgeTag, 
  MockDataBadge 
} from '@/components/Badges';
import { PriceBreakdownModal } from '@/components/PriceBreakdownModal';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  Clock, 
  ShieldCheck, 
  TrendingDown, 
  HelpCircle, 
  Bell, 
  AlertCircle 
} from 'lucide-react';

interface PriceHistoryData {
  currency: string;
  currentPrice: number;
  currentLandedCostTwd: number;
  minHistoricalPriceTwd: number;
  maxHistoricalPriceTwd: number;
  averagePriceTwd: number;
  history: { date: string; price: number; landedCostTwd: number }[];
  isMockData?: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<(ProductOffer & { evaluation?: RecommendationScoreResult }) | null>(null);
  const [competingOffers, setCompetingOffers] = useState<(ProductOffer & { evaluation?: RecommendationScoreResult })[]>([]);
  const [specifications, setSpecifications] = useState<Record<string, unknown>>({});
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPriceHistory(null);
      try {
        const prodRes = await fetch(`/api/products/${id}`).then((r) => r.json());

        if (prodRes.success) {
          setProduct(prodRes.data.product);
          setCompetingOffers(prodRes.data.competingOffers || []);
          setSpecifications(prodRes.data.specifications || {});
          if (prodRes.data.product?.landedCost?.totalTwd) setAlertTargetPrice(Math.round(prodRes.data.product.landedCost.totalTwd * 0.95).toString());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    fetch(`/api/price-history/${id}`, { signal: AbortSignal.timeout(4000) })
      .then((response) => response.json())
      .then((body) => { if (body.success) setPriceHistory(body.data); })
      .catch(() => {});
  }, [id]);

  const handleSetAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTargetPrice) return;
    setAlertError('');

    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          targetPriceTwd: Number(alertTargetPrice)
        })
      });
      const json = await res.json();
      if (json.success) {
        setAlertSuccess(json.message);
      } else {
        setAlertError(json.error || '無法儲存目標價');
      }
    } catch (e) {
      console.error(e);
      setAlertError('無法連線到目標價服務');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">載入商品跨平台報價與價格歷史...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
        <h2 className="text-lg font-bold text-slate-800">找不到此商品</h2>
        <Link href="/search" className="text-sm text-blue-600 underline mt-2 inline-block">
          返回搜尋
        </Link>
      </div>
    );
  }

  const { landedCost, evaluation } = product;

  return (
    <div className="space-y-8">
      {/* 導航回上一頁 */}
      <div>
        <Link href="/search" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回搜尋結果</span>
        </Link>
      </div>

      {/* 主商品資訊區塊 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* 左側大圖 */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl relative border border-slate-100">
          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
            <MockDataBadge />
            {evaluation?.recommendationLabel && (
              <RecommendationBadgeTag badge={evaluation.recommendationLabel} />
            )}
          </div>
          <ProductImage
            url={product.imageUrl}
            alt={product.title}
            className="max-h-72 object-contain mix-blend-multiply"
          />
        </div>

        {/* 右側規格與報價詳情 */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              品牌：{product.brand}
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              型號：{product.model}
            </span>
            <ConditionBadgeTag condition={product.condition} />
            <WarrantyBadgeTag warrantyType={product.warrantyType} months={product.warrantyMonths} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {product.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{product.sellerName}</span>
            <span className="flex items-center text-amber-500 font-bold gap-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {Number(product.sellerRating).toFixed(1)}
            </span>
            <span>({product.sellerReviewCount} 則真實評價)</span>
            <span>• 來源：{product.source === 'mock_tw_store' ? '台灣商城' : '日本直送'}</span>
          </div>

          {/* 總到手價與費用卡片 */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
            <div className="flex justify-between items-baseline">
              <div>
                <div className="text-xs text-slate-500">原始通路定價：{product.currency} {product.salePrice.toLocaleString()}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xs text-slate-600 font-semibold">預估總到手價</span>
                  <span className="text-3xl font-extrabold text-blue-600">
                    NT$ {landedCost.totalTwd.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>費用計算拆解</span>
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 border-t border-slate-200 pt-3">
              <div>
                <span className="block text-slate-400">境內運費</span>
                <span className="font-medium">{landedCost.domesticShippingTwd === 0 ? '免運' : `NT$ ${landedCost.domesticShippingTwd}`}</span>
              </div>
              <div>
                <span className="block text-slate-400">國際運費</span>
                <span className="font-medium">{landedCost.internationalShippingTwd === 0 ? '免運' : `NT$ ${landedCost.internationalShippingTwd}`}</span>
              </div>
              <div>
                <span className="block text-slate-400">進口關稅與營業稅</span>
                <span className="font-medium">{landedCost.estimatedDutyTwd + landedCost.estimatedTaxTwd === 0 ? '免稅 (門檻內)' : `NT$ ${landedCost.estimatedDutyTwd + landedCost.estimatedTaxTwd}`}</span>
              </div>
            </div>
          </div>

          {/* 推薦理由與風險提示 */}
          <div className="space-y-2 text-xs">
            {evaluation?.recommendationReasons && evaluation.recommendationReasons.length > 0 && (
              <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block">推薦原因分析：</span>
                <ul className="space-y-0.5 text-blue-800">
                  {evaluation.recommendationReasons.map((r, i) => (
                    <li key={i}>✓ {r}</li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation?.riskWarnings && evaluation.riskWarnings.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl space-y-1">
                <span className="font-bold text-amber-900 block">購買注意事項與風險：</span>
                <ul className="space-y-0.5 text-amber-800">
                  {evaluation.riskWarnings.map((w, i) => (
                    <li key={i}>⚠ {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 前往電商購買按鈕 */}
          <div className="pt-2">
            <PurchaseLink
              url={product.productUrl}
              isMockData={product.isMockData}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
            >
              <span>前往原始官方通路購買</span>
            </PurchaseLink>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              本站不經手金流，下單將導引至電商授權頁面，最終價格以結帳當下所顯示為準。
            </p>
          </div>
        </div>
      </div>

      {/* 跨平台報價比較 (Competing Offers) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">其他通路報價比價 ({competingOffers.length} 個來源)</h2>
        <div className="divide-y divide-slate-100">
          {competingOffers.map((comp) => (
            <div key={comp.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <ProductImage url={comp.imageUrl} alt={comp.title} className="w-12 h-12 object-contain bg-slate-50 p-1 rounded" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{comp.sellerName}</span>
                    <span className="text-xs text-slate-500">({comp.source === 'mock_tw_store' ? '台灣商城' : '日本直送'})</span>
                    <WarrantyBadgeTag warrantyType={comp.warrantyType} />
                  </div>
                  <div className="text-xs text-slate-400">配送天數：約 {comp.minDeliveryDays}-{comp.maxDeliveryDays} 天</div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-xs text-slate-400">{comp.currency} {comp.salePrice.toLocaleString()}</div>
                  <div className="font-bold text-blue-600 text-base">NT$ {comp.landedCost.totalTwd.toLocaleString()}</div>
                </div>
                <PurchaseLink
                  url={comp.productUrl}
                  isMockData={comp.isMockData}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <span>前往查看</span>
                </PurchaseLink>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 價格歷史走勢與降價通知設定 */}
      {priceHistory && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 歷史價格統計 */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {priceHistory.isMockData && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">模擬商品的示範價格歷史，並非實際市場價格。</p>}
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">歷史價格變動趨勢</h3>
              <span className="text-xs text-slate-400">過去 30 天數據</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block">歷史最低到手價</span>
                <span className="font-bold text-emerald-600 text-sm">NT$ {priceHistory.minHistoricalPriceTwd.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">歷史平均價格</span>
                <span className="font-bold text-slate-700 text-sm">NT$ {priceHistory.averagePriceTwd.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">歷史最高價格</span>
                <span className="font-bold text-slate-700 text-sm">NT$ {priceHistory.maxHistoricalPriceTwd.toLocaleString()}</span>
              </div>
            </div>

            {/* 簡易長條/點狀走勢 */}
            <div className="space-y-2 pt-2">
              {priceHistory.history.map((h, i) => (
                <div key={i} className="flex justify-between items-center text-xs text-slate-600 border-b border-slate-50 pb-1.5">
                  <span className="text-slate-400">{h.date}</span>
                  <div className="flex items-center gap-2">
                    <span>原幣 {priceHistory.currency} {h.price.toLocaleString()}</span>
                    <span className="font-semibold text-slate-800">總到手 NT$ {h.landedCostTwd.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 降價提醒通知設定 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Bell className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-sm">設定降價提醒</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              當此商品總到手價降至您的目標金額時，系統將主動發送通知給您。
            </p>

            <form onSubmit={handleSetAlert} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">目標價格 (NT$)</label>
                <input
                  type="number"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入預期期望價格"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-lg transition"
              >
                啟用追蹤通知
              </button>
            </form>

            {alertSuccess && (
              <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                ✓ {alertSuccess}
              </div>
            )}
            {alertError && <p role="alert" className="text-xs text-red-700">{alertError}</p>}
          </div>
        </div>
      )}
      {!priceHistory && <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <h3 className="font-bold text-slate-900">目標價格</h3>
        <p className="text-sm text-slate-500">尚無已儲存的價格歷史。可先儲存目標價；電子郵件通知尚未啟用。</p>
        <form onSubmit={handleSetAlert} className="flex gap-2">
          <input aria-label="目標價格" type="number" min="1" value={alertTargetPrice} onChange={(event) => setAlertTargetPrice(event.target.value)} className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">儲存目標價</button>
        </form>
        {alertSuccess && <p className="text-sm text-emerald-700">{alertSuccess}</p>}
        {alertError && <p role="alert" className="text-sm text-red-700">{alertError}</p>}
      </div>}

      {/* 詳細規格欄位表 */}
      {Object.keys(specifications).length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">商品規格與參數</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {Object.entries(specifications).map(([k, v]) => (
              <div key={k} className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium capitalize">{k}</span>
                <span className="text-slate-800 font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <PriceBreakdownModal
        offer={product}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
