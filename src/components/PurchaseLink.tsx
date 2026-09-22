import { ExternalLink } from 'lucide-react';
import { safeProductUrl } from '@/lib/external-media';

export function PurchaseLink({ url, isMockData, className = '', children = '前往購買' }: { url: string; isMockData: boolean; className?: string; children?: React.ReactNode }) {
  const safeUrl = safeProductUrl(url, isMockData);
  if (!safeUrl) return <span title={isMockData ? '模擬資料沒有真實購買連結' : '來源網址未通過安全驗證'} className={`${className} cursor-not-allowed bg-slate-100 text-slate-500 border border-slate-200 shadow-none hover:bg-slate-100`}>{isMockData ? '模擬資料，無購買連結' : '購買連結不可用'}</span>;
  return <a href={safeUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={className}>{children}<ExternalLink className="w-3.5 h-3.5" /></a>;
}
