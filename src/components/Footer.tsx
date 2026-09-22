import React from 'react';
import Link from 'next/link';
import { Shield, AlertCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <span>SmartPrice 跨平台智慧比價網</span>
              <span className="bg-rose-900/60 text-rose-300 text-[10px] px-2 py-0.5 rounded border border-rose-700">
                MVP 模擬資料版
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              致力於提供跨台灣與日本電商之規格標準化、到手價試算與智慧購買決策推薦。本系統不直接代客下單，不儲存任何個人電商帳號密碼，所有交易均安全導引至各通路官方頁面完成。
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs">支援平台與 Connector</h4>
            <ul className="space-y-1 text-slate-400">
              <li>• 台灣商城 Connector (模擬)</li>
              <li>• 日本直送 Connector (模擬)</li>
              <li>• Amazon Japan (PA-API 預留)</li>
              <li>• PChome / momo (架構預留)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs">合規與安全政策</h4>
            <div className="flex items-start gap-1.5 text-slate-400 text-xs">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>零帳密儲存、HTTPS 全程加密傳輸與外鏈白名單防護</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 space-y-3">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">價格與免責聲明：</span>
              本平台為比價與資訊聚合服務，所有顯示價格、匯率、庫存狀態及預估關稅運費均以原始商品銷售網站結帳當下所揭示之最終金額為準。若點擊外部連結前往合作電商購買，本站可能獲取聯盟行銷微薄佣金以維持伺服器運作。
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-slate-500 text-[11px] gap-2">
            <div>© {new Date().getFullYear()} Smart Price Matcher MVP. All rights reserved.</div>
            <div className="flex gap-4">
              <Link href="/admin" className="hover:text-slate-300">後台狀態</Link>
              <Link href="/compare" className="hover:text-slate-300">商品比較</Link>
              <Link href="/favorites" className="hover:text-slate-300">收藏清單</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
