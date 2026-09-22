'use client';
import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Power, Server, AlertCircle, Database, CheckCircle2 } from 'lucide-react';

interface ConnectorInfo {
  source: string;
  displayName: string;
  country: string;
  isMock: boolean;
  enabled: boolean;
}

interface ConnectorHealthInfo {
  source: string;
  displayName: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  totalProductsCount?: number;
  lastCheckedAt: string;
  message?: string;
}
interface ConnectorLogInfo { id: string; source: string; status: string; latencyMs: number | null; errorMessage: string | null; createdAt: string }

export default function AdminPage() {
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [healths, setHealths] = useState<ConnectorHealthInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState('');
  const [actionError, setActionError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [logs, setLogs] = useState<ConnectorLogInfo[]>([]);

  const verifyToken = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionError('');
    try {
      const response = await fetch('/api/admin/session', { headers: { 'x-admin-token': adminToken }, cache: 'no-store' });
      if (!response.ok) { setActionError('管理驗證失敗，請檢查伺服器 Token 設定'); return; }
      setAuthenticated(true);
      await loadData();
    } catch { setActionError('無法連線至管理服務'); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [connRes, healthRes, logRes] = await Promise.all([
        fetch('/api/connectors').then((r) => r.json()),
        fetch('/api/connectors/health', { headers: { 'x-admin-token': adminToken }, cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/connectors/logs?pageSize=15', { headers: { 'x-admin-token': adminToken }, cache: 'no-store' }).then((r) => r.json())
      ]);

      if (connRes.success) setConnectors(connRes.data || []);
      if (healthRes.success) setHealths(healthRes.data || []);
      if (logRes.success) setLogs(logRes.data || []);
      else setActionError('目前無法取得資料庫中的 Connector 紀錄');
    } catch (e) {
      console.error(e);
      setActionError('無法取得管理資料，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const toggleConnector = async (source: string, currentEnabled: boolean) => {
    setActionError('');
    setUpdating(source);
    try {
      const res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ source, enabled: !currentEnabled })
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
      } else {
        setActionError(json.error || '操作失敗');
      }
    } catch (e) {
      console.error(e);
      setActionError('無法更新來源狀態');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {!authenticated && <form onSubmit={verifyToken} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <label htmlFor="admin-token" className="block text-sm font-semibold text-slate-800">管理 API Token</label>
        <input id="admin-token" type="password" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} autoComplete="off" className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="輸入伺服器設定的 ADMIN_API_TOKEN" />
        <p className="text-xs text-slate-500">僅保留於此頁記憶體；管理操作需先在伺服器設定 Token。</p>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">驗證並進入管理頁</button>
        {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}
      </form>}
      {authenticated && <>
      <div className="flex justify-end"><button type="button" onClick={() => { setAuthenticated(false); setAdminToken(''); setConnectors([]); setHealths([]); setLogs([]); }} className="text-sm text-slate-600 underline">結束管理工作階段</button></div>
      {actionError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">平台連接器管理與系統監控 (Admin Console)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            監控所有已註冊電商 Connector 之運行健康度、存取延遲與故障隔離控制。
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>重新整理狀態</span>
        </button>
      </div>

      {/* 系統安全宣告 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
        <Server className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">安全合規保護機制：</span>
          <p className="text-blue-800 leading-relaxed">
            系統嚴格遵守零密鑰洩漏原則。本管理儀表板僅顯示連接器之通訊延遲、狀態碼與抽象健康指標，所有第三方授權金鑰 (API Secret / Access Keys) 均僅留存在受保護之伺服器端環境變數中，絕不向下傳遞至前端。
          </p>
        </div>
      </div>

      {/* Connector 卡片清單 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connectors.map((connector) => {
          const health = healths.find((h) => h.source === connector.source);
          const isHealthy = health?.status === 'HEALTHY';

          return (
            <div
              key={connector.source}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{connector.displayName}</h3>
                    {connector.isMock ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        MOCK DATA
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        OFFICIAL API
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    識別碼 (ID): <code className="font-mono text-slate-600">{connector.source}</code> • 地區：{connector.country}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    connector.enabled
                      ? isHealthy
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {connector.enabled ? (
                      isHealthy ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>運作正常</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>連線異常</span>
                        </>
                      )
                    ) : (
                      <span>已手動停用</span>
                    )}
                  </span>
                </div>
              </div>

              {/* 指標統計 */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block">通訊延遲 (Latency)</span>
                  <span className="font-bold text-slate-800">{health ? `${health.latencyMs} ms` : '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">模擬在庫商品</span>
                  <span className="font-bold text-slate-800">{health?.totalProductsCount ?? '-'} 筆</span>
                </div>
                <div>
                  <span className="text-slate-400 block">最後健康檢測</span>
                  <span className="font-medium text-slate-600 truncate block">
                    {health ? new Date(health.lastCheckedAt).toLocaleTimeString() : '-'}
                  </span>
                </div>
              </div>

              {/* 系統訊息 */}
              {health?.message && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-700">診斷日誌：</span> {health.message}
                </div>
              )}

              {/* 開關控制鈕 */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  狀態切換 (Feature Flag 即時生效)
                </span>
                <button
                  onClick={() => toggleConnector(connector.source, connector.enabled)}
                  disabled={!adminToken || updating === connector.source}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition ${
                    connector.enabled
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{connector.enabled ? '停用此來源' : '啟用此來源'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-bold text-slate-900">最近 Connector 紀錄</h2>
        {logs.length === 0 ? <p className="text-sm text-slate-500">尚無可顯示的紀錄。</p> : <div className="overflow-x-auto"><table className="min-w-[580px] w-full text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="p-2">時間</th><th className="p-2">來源</th><th className="p-2">狀態</th><th className="p-2">延遲</th><th className="p-2">錯誤摘要</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-b border-slate-100"><td className="p-2">{new Date(log.createdAt).toLocaleString('zh-TW')}</td><td className="p-2">{log.source}</td><td className="p-2">{log.status}</td><td className="p-2">{log.latencyMs ?? '-'} ms</td><td className="p-2 max-w-xs truncate" title={log.errorMessage ?? ''}>{log.errorMessage ?? '-'}</td></tr>)}</tbody></table></div>}
      </section>
      </>}
    </div>
  );
}
