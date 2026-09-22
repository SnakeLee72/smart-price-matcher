import { CommerceConnector, ConnectorHealth } from './base';
import { MockTaiwanConnector } from './mock-taiwan';
import { MockJapanConnector } from './mock-japan';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, CommerceConnector> = new Map();

  private constructor() {
    this.register(new MockTaiwanConnector());
    this.register(new MockJapanConnector());
  }

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  public register(connector: CommerceConnector): void {
    this.connectors.set(connector.source, connector);
  }

  public getConnector(source: string): CommerceConnector | undefined {
    return this.connectors.get(source);
  }

  public getAllConnectors(): CommerceConnector[] {
    return Array.from(this.connectors.values());
  }

  public getEnabledConnectors(): CommerceConnector[] {
    return this.getAllConnectors().filter((c) => c.isEnabled());
  }

  public setConnectorStatus(source: string, enabled: boolean): boolean {
    const connector = this.connectors.get(source);
    if (!connector) return false;
    connector.setEnabled(enabled);
    return true;
  }

  public async getHealthStatuses(): Promise<ConnectorHealth[]> {
    const results = await Promise.allSettled(
      this.getAllConnectors().map((c) => c.healthCheck())
    );

    return results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return res.value;
      }
      const c = this.getAllConnectors()[index];
      return {
        source: c.source,
        displayName: c.displayName,
        status: 'DOWN',
        latencyMs: 0,
        message: res.reason instanceof Error ? res.reason.message : 'Unknown error during health check',
        lastCheckedAt: new Date().toISOString()
      };
    });
  }
}
