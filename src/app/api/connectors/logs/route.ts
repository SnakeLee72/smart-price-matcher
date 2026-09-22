import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const QuerySchema = z.object({
  source: z.string().trim().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30)
});

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  if (!isAuthorizedAdmin(request)) return NextResponse.json({ success: false, error: '無權查看來源紀錄', requestId, timestamp: new Date().toISOString() }, { status: 403 });
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: '查詢條件無效', requestId, timestamp: new Date().toISOString() }, { status: 400 });
  try {
    const { page, pageSize, source } = parsed.data;
    const where = source ? { source } : {};
    const [totalCount, records] = await Promise.all([
      prisma.connectorLog.count({ where }),
      prisma.connectorLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })
    ]);
    const response = NextResponse.json({ success: true, data: records.map((record) => ({
      id: record.id, source: record.source, status: record.status, latencyMs: record.latencyMs,
      errorMessage: record.errorMessage, createdAt: record.createdAt.toISOString()
    })), page, pageSize, totalCount, requestId, timestamp: new Date().toISOString() });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error(`[Connector Logs GET] ${requestId}`, error);
    return NextResponse.json({ success: false, error: '無法取得來源紀錄', requestId, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
