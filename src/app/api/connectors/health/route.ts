import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@/connectors/registry';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const isAdmin = isAuthorizedAdmin(request);
  try {
    const statuses = await ConnectorRegistry.getInstance().getHealthStatuses();
    const data = statuses.map((status) => ({
      source: status.source,
      displayName: status.displayName,
      status: status.status,
      latencyMs: status.latencyMs,
      totalProductsCount: status.totalProductsCount,
      lastCheckedAt: status.lastCheckedAt,
      message: isAdmin ? status.message : status.status === 'HEALTHY' ? '正常運作' : '來源暫時無法使用'
    }));
    return NextResponse.json({ success: true, data, requestId, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(`[Connector Health] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '無法取得來源狀態', requestId, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
