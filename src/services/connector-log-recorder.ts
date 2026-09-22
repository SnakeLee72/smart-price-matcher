import { prisma } from '@/lib/prisma';

export interface ConnectorObservation {
  source: string;
  status: 'SUCCESS' | 'FAILED';
  latencyMs: number;
  errorMessage?: string;
}

let retryAfter = 0;

export async function recordConnectorObservations(observations: ConnectorObservation[]): Promise<void> {
  if (process.env.ENABLE_CONNECTOR_LOGS !== 'true' || Date.now() < retryAfter || !observations.length) return;
  try {
    await prisma.connectorLog.createMany({ data: observations });
  } catch (error) {
    retryAfter = Date.now() + 60_000;
    throw error;
  }
}
