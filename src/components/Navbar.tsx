'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Search, BookmarkCheck, BarChart2, ShieldCheck, Menu, X } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: '首頁搜尋', icon: Search },
    { href: '/search', label: '比價結果', icon: Layers },
    { href: '/compare', label: '多品比較', icon: BarChart2 },
    { href: '/favorites', label: '我的收藏', icon: BookmarkCheck },
    { href: '/admin', label: '管理後台', icon: ShieldCheck }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-blue-700 transition">
            P
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">
              SmartPrice<span className="text-blue-600">.tw</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium block leading-none">
              跨平台智慧比價決策網 (MVP)
            </span>
          </div>
        </Link>

        <button type="button" className="md:hidden rounded-lg p-2 text-slate-700" aria-label={menuOpen ? '關閉選單' : '開啟選單'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">登入</Link>
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      {menuOpen && <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 grid grid-cols-2 gap-2" aria-label="手機導覽">
        <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm text-slate-700">登入</Link>
        {links.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`rounded-lg px-3 py-3 text-sm ${pathname === item.href ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>{item.label}</Link>)}
      </nav>}
    </header>
  );
}
