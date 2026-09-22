const PRODUCT_HOSTS = new Set(['tw-mall.example.com', 'jp-direct.example.com']);
const IMAGE_HOSTS = new Set(['images.unsplash.com']);

function allowedHttpsUrl(value: string, hosts: Set<string>): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

/** Add real merchant hosts only after a connector has verified its outbound domains. */
export function safeProductUrl(value: string, isMockData: boolean): string | null {
  if (isMockData) return null;
  return allowedHttpsUrl(value, PRODUCT_HOSTS)?.toString() ?? null;
}

export function safeImageUrl(value: string): string | null {
  return allowedHttpsUrl(value, IMAGE_HOSTS)?.toString() ?? null;
}
