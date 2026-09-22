'use client';
import { ProductImage } from '@/components/ProductImage';
import { PurchaseLink } from '@/components/PurchaseLink';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductOffer } from '@/types/commerce';
import { Trash2, ExternalLink, Bookmark, Bell, ArrowRight } from 'lucide-react';

interface FavoriteItem {
  id: string;
  offerId: string;
  targetPriceTwd?: number;
  notifyOnPriceDrop: boolean;
  createdAt: string;
  product: ProductOffer | null;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/favorites');
      const json = await res.json();
      if (json.success) {
        setFavorites(json.data || []);
      } else {
        setError(json.error || '無法取得收藏');
      }
    } catch (e) {
      console.error(e);
      setError('無法連線到收藏服務');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const removeFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) setFavorites((current) => current.filter((favorite) => favorite.id !== id));
      else setError(result.error || '無法移除收藏');
    } catch (e) {
      console.error(e);
      setError('無法連線到收藏服務');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">載入我的收藏與價格追蹤清單...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">我的商品收藏與降價追蹤</h1>
          <p className="text-xs text-slate-500 mt-1">
            即時監控心儀商品的跨平台到手價格，低於目標價時主動提醒。
          </p>
        </div>
      </div>

      {error ? null : favorites.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">目前尚無收藏商品</h3>
          <p className="text-xs text-slate-500">
            在搜尋結果頁面點擊書籤圖示，即可將想觀察價格的商品加入追蹤清單。
          </p>
          <Link
            href="/search?q=Sony"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
          >
            <span>瀏覽熱門推薦商品</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {favorites.map((fav) => {
            const product = fav.product;
            if (!product) return null;

            const isPriceDrop = fav.targetPriceTwd && product.landedCost.totalTwd <= fav.targetPriceTwd;

            return (
              <div key={fav.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <ProductImage
                    url={product.imageUrl}
                    alt={product.title}
                    className="w-16 h-16 object-contain bg-slate-50 p-1.5 rounded-lg border border-slate-100"
                  />
                  <div className="space-y-1">
                    <Link
                      href={`/products/${product.id}`}
                      className="font-semibold text-sm text-slate-900 hover:text-blue-600 transition line-clamp-1"
                    >
                      {product.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>來源：{product.source === 'mock_tw_store' ? '台灣商城' : '日本直送'}</span>
                      <span>• 賣家：{product.sellerName}</span>
                    </div>
                    {fav.targetPriceTwd && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-slate-600">設定目標價：NT$ {fav.targetPriceTwd.toLocaleString()}</span>
                        {isPriceDrop && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                            ★ 已降至目標價！
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400">當前預估總到手價</div>
                    <div className="font-bold text-lg text-blue-600">
                      NT$ {product.landedCost.totalTwd.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <PurchaseLink
                      url={product.productUrl}
                      isMockData={product.isMockData}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1 shadow-sm transition"
                    >
                      <span>購買</span>
                    </PurchaseLink>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="移除收藏"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
