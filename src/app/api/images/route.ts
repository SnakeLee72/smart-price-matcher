import { NextRequest, NextResponse } from 'next/server';
import { safeImageUrl } from '@/lib/external-media';

export const dynamic = 'force-dynamic';
const MAX_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function GET(request: NextRequest) {
  const url = safeImageUrl(new URL(request.url).searchParams.get('url') ?? '');
  if (!url) return NextResponse.json({ success: false, error: '圖片來源不允許' }, { status: 400 });
  try {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5000), headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif' } });
    const type = response.headers.get('content-type')?.split(';')[0].toLowerCase();
    const size = Number(response.headers.get('content-length') ?? 0);
    if (!response.ok || !type || !IMAGE_TYPES.has(type) || size > MAX_BYTES) {
      await response.body?.cancel();
      return NextResponse.json({ success: false, error: '圖片格式或大小不允許' }, { status: 502 });
    }
    const reader = response.body?.getReader();
    if (!reader) return NextResponse.json({ success: false, error: '圖片無法讀取' }, { status: 502 });
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) {
        await reader.cancel();
        return NextResponse.json({ success: false, error: '圖片超過大小限制' }, { status: 502 });
      }
      chunks.push(value);
    }
    return new NextResponse(Buffer.concat(chunks), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return NextResponse.json({ success: false, error: '圖片暫時無法取得' }, { status: 502 });
  }
}
