'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';


interface ProviderInfo { id: string; name: string }

export default function LoginPage() {
  const signIn = async (providerId: string) => { const auth = await import('next-auth/react'); await auth.signIn(providerId, { callbackUrl: '/favorites' }); };
  const signOut = async () => { const auth = await import('next-auth/react'); await auth.signOut({ callbackUrl: '/' }); };
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/providers').then((response) => response.json()).then((data) => setProviders(Object.values(data || {}))).catch(() => setProviders([]));
    fetch('/api/auth/session').then((response) => response.json()).then((data) => setEmail(data?.user?.email || null)).catch(() => setEmail(null));
  }, []);

  return <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
    <h1 className="text-xl font-bold">登入與收藏</h1>
    {email ? <>
      <p className="text-sm text-slate-600">目前以 {email} 登入。</p>
      <button type="button" onClick={signOut} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">登出</button>
    </> : <>
      <p className="text-sm text-slate-600">沒有設定登入平台時，可繼續以此瀏覽器的匿名身分收藏商品。匿名收藏不會自動轉移至其他裝置或登入帳號。</p>
      <div className="space-y-2">
        {providers.map((provider) => <button key={provider.id} type="button" onClick={() => signIn(provider.id)} className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">使用 {provider.name} 登入</button>)}
      </div>
      <Link href="/favorites" className="inline-block text-sm text-blue-700 underline">以匿名身分繼續</Link>
    </>}
  </div>;
}
