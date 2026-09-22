'use client';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { safeImageUrl } from '@/lib/external-media';

export function ProductImage({ url, alt, className = '' }: { url: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const safeUrl = safeImageUrl(url);
  if (!safeUrl || failed) return <div role="img" aria-label={`${alt}：圖片無法顯示`} className={`${className} flex items-center justify-center text-slate-400`}><ImageOff className="h-8 w-8" /></div>;
  return <img src={`/api/images?url=${encodeURIComponent(safeUrl)}`} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
