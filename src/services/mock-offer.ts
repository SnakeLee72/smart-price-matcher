import { MOCK_PRODUCTS_DATA } from '@/connectors/mock-data';
import { ConnectorRegistry } from '@/connectors/registry';

export function findMockProduct(id: string) {
  return MOCK_PRODUCTS_DATA.find((product) =>
    `${product.source}_${product.sourceProductId}` === id || product.sourceProductId === id
  );
}

export async function findMockOffer(id: string) {
  const raw = findMockProduct(id);
  if (!raw) return null;
  const connector = ConnectorRegistry.getInstance().getConnector(raw.source);
  return connector ? connector.normalize(raw) : null;
}
