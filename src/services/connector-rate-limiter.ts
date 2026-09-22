/** Fixed-window limit for each source within this server process. */
export class ConnectorRateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private readonly maxRequests = 30, private readonly windowMs = 60_000) {}

  allow(source: string, now = Date.now()): boolean {
    const recent = (this.requests.get(source) || []).filter((timestamp) => timestamp > now - this.windowMs);
    if (recent.length >= this.maxRequests) {
      this.requests.set(source, recent);
      return false;
    }
    recent.push(now);
    this.requests.set(source, recent);
    return true;
  }
}
