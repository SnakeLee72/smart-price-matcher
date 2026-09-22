import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ConnectorRegistry } from '@/connectors/registry';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

const ToggleConnectorSchema = z.object({
  source: z.string(),
  enabled: z.boolean()
});

export async function GET() {
  const registry = ConnectorRegistry.getInstance();
  const connectors = registry.getAllConnectors();

  const data = connectors.map((c) => ({
    source: c.source,
    displayName: c.displayName,
    country: c.country,
    isMock: c.isMock,
    enabled: c.isEnabled()
  }));

  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ success: false, error: '無權執行管理操作', requestId: crypto.randomUUID(), timestamp: new Date().toISOString() }, { status: 403 });
  }
  try {
    const body = await request.json();
    const parsed = ToggleConnectorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: '參數格式錯誤'
      }, { status: 400 });
    }

    const { source, enabled } = parsed.data;
    const registry = ConnectorRegistry.getInstance();
    const ok = registry.setConnectorStatus(source, enabled);

    if (!ok) {
      return NextResponse.json({
        success: false,
        error: `找不到 Connector: ${source}`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Connector ${source} 狀態已更新為 ${enabled ? '啟用' : '停用'}`
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      error: '更新 Connector 狀態失敗'
    }, { status: 500 });
  }
}
