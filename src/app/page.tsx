'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Globe, ShieldCheck, Calculator, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const hotKeywords = [
    'Sony WH-1000XM5',
    'iPhone 15 Pro 256GB',
    'Bose QuietComfort Ultra',
    'DELL U2723QE 4K螢幕',
    '羅技 MX Master 3S',
    '象印 NW-PV10 電子鍋',
    'Dyson Airstrait'
  ];

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>跨平台規格比對與總到手價智慧計算系統</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          聰明比價，不只比最低價。<br />
          <span className="text-blue-600">算清到手成本，推薦最適合之選</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          以台灣與日本模擬商品示範規格比對、匯率與稅費估算，依保固、到貨速度與賣家評價展示購買決策方式。所有價格均非即時報價。
        </p>

        {/* 大型搜尋框 */}
        <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
          <form action="/search" method="get" className="flex items-center gap-2">
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              name="q"
              required
              placeholder="輸入商品名稱、型號 (例: Sony XM5, iPhone 256GB, 象印電子鍋)..."
              className="flex-1 bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm sm:text-base py-2"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <span>智慧比價</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 熱門關鍵字標籤 */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 pt-2">
          <span className="font-semibold text-slate-600">熱門搜尋：</span>
          {hotKeywords.map((tag) => (
            <button
              key={tag}
              onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
              className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-1 rounded-full transition text-slate-600"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* 支援平台圖示區 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        <h2 className="text-base font-bold text-slate-800">已串接與預留擴充之電商資料來源</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
            <div className="text-xl">🇹🇼</div>
            <div className="font-bold text-slate-900 text-sm">台灣優選電商 (模擬)</div>
            <div className="text-[11px] text-emerald-600 font-semibold">● 正常連線 (Mock Connector)</div>
            <div className="text-xs text-slate-500">含台灣公司貨、24H快速出貨與原廠官方旗艦店。</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
            <div className="text-xl">🇯🇵</div>
            <div className="font-bold text-slate-900 text-sm">日本直送電商 (模擬)</div>
            <div className="text-[11px] text-emerald-600 font-semibold">● 正常連線 (Mock Connector)</div>
            <div className="text-xs text-slate-500">日圓定價、跨境空運海運試算與原裝100V電器。</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/60 border border-dashed border-slate-300 text-left space-y-1.5">
            <div className="text-xl">📦</div>
            <div className="font-bold text-slate-700 text-sm">Amazon Japan</div>
            <div className="text-[11px] text-slate-500 font-medium">○ PA-API 介面預留 (Stub)</div>
            <div className="text-xs text-slate-400">符合官方聯盟行銷 API 安全合規介面規範。</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/60 border border-dashed border-slate-300 text-left space-y-1.5">
            <div className="text-xl">🏬</div>
            <div className="font-bold text-slate-700 text-sm">台灣綜合大電商</div>
            <div className="text-[11px] text-slate-500 font-medium">○ momo / PChome 擴展預留</div>
            <div className="text-xs text-slate-400">標準 CommerceConnector 隨插即用架構。</div>
          </div>
        </div>
      </section>

      {/* 核心價值特色 */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">為什麼使用 SmartPrice 比價決策？</h2>
          <p className="text-sm text-slate-500">不只秀出最低價，解決跨國網購的資訊盲點與運費關稅陷阱</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">透明總到手價計算</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              自動換算即時外幣匯率、包含當地配送、國際跨境運費、依法申報之海關進口關稅與營業稅，無隱藏費用。
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">規格變體精準防呆</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              不同容量 (128G vs 256G)、不同尺寸嚴格禁止錯誤合併比價；清晰標註日本 100V 與台灣 110V 電壓相容提示。
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">七維度客觀推薦</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              結合總到手價、保固期限、賣家評分、到貨天數等多面向給予「最佳綜合推薦」，並提供真實且詳盡的評分理由。
            </p>
          </div>
        </div>
      </section>

      {/* 價格資訊免責宣告提示條 */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <div className="text-base font-bold text-amber-600">ℹ️</div>
        <div className="space-y-1">
          <div className="font-bold">MVP 測試環境價格免責說明：</div>
          <p className="text-amber-800 leading-relaxed">
            本展示站點為 MVP 概念驗證版本，所有商品名稱、型號、規格與報價均來自系統內建之「台灣與日本模擬資料庫 (Mock Data)」，請勿作為真實交易購買憑據。本站不代收任何款項，購買皆導引至原始電商官方頁面。
          </p>
        </div>
      </div>
    </div>
  );
}
