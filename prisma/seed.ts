import { Prisma, PrismaClient, ProductCondition, WarrantyType } from '@prisma/client';
import { MOCK_PRODUCTS_DATA } from '../src/connectors/mock-data';
import { LandedCostCalculator } from '../src/services/landed-cost-calculator';
import { NormalizationService } from '../src/services/normalization';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 開始執行資料庫種子寫入 (Database Seeding) ---');

  // Seed is additive: never erase favorites, alerts or observed price history.

  // 1. 建立標準商品目錄 (Canonical Products)
  const canonicalItems = [
    {
      brand: 'Sony',
      model: 'WH-1000XM5',
      normalizedName: 'Sony WH-1000XM5 無線降噪耳罩耳機',
      category: 'Headphones',
      gtin: '4548736132566',
      mpn: 'WH1000XM5',
      specifications: { driver: '30mm', batteryLife: '30hrs', weight: '250g', bluetooth: '5.2' }
    },
    {
      brand: 'Bose',
      model: 'QuietComfort Ultra',
      normalizedName: 'Bose QuietComfort Ultra 無線消噪耳機',
      category: 'Headphones',
      gtin: '017817842600',
      mpn: 'QC-ULTRA',
      specifications: { spatialAudio: 'Yes', batteryLife: '24hrs', weight: '253g' }
    },
    {
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      normalizedName: 'Apple iPhone 15 Pro 旗艦智慧型手機',
      category: 'Smartphones',
      gtin: '195949038234',
      mpn: 'A3102',
      specifications: { screen: '6.1吋 Super Retina XDR', chip: 'A17 Pro', frame: '鈦金屬' }
    },
    {
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      normalizedName: 'Samsung Galaxy S24 Ultra 旗艦手機',
      category: 'Smartphones',
      gtin: '8806095300184',
      mpn: 'SM-S9280',
      specifications: { screen: '6.8吋 Dynamic AMOLED 2X', chip: 'Snapdragon 8 Gen 3', stylus: '內建S Pen' }
    },
    {
      brand: 'Dell',
      model: 'U2723QE',
      normalizedName: 'DELL UltraSharp 27 4K USB-C Hub 顯示器',
      category: 'Monitors',
      gtin: '5397184567223',
      mpn: 'U2723QE',
      specifications: { size: '27吋', resolution: '3840x2160', panel: 'IPS Black', powerDelivery: '90W' }
    },
    {
      brand: 'Logitech',
      model: 'MX Master 3S',
      normalizedName: 'Logitech 羅技 MX Master 3S 無線靜音滑鼠',
      category: 'Peripherals',
      gtin: '097855175021',
      mpn: '910-006561',
      specifications: { dpi: '8000 DPI', quietClick: 'Yes', sensor: 'Darkfield' }
    },
    {
      brand: 'Zojirushi',
      model: 'NW-PV10',
      normalizedName: '象印 炎舞炊き 壓力IH電子鍋 5.5合',
      category: 'Appliances',
      jan: '4974305224385',
      mpn: 'NW-PV10-BZ',
      specifications: { capacity: '5.5合 (1.0L)', heating: '壓力IH 炎舞炊き', innerPot: '鐵 - 豪炎金屬' }
    },
    {
      brand: 'Dyson',
      model: 'Airstrait',
      normalizedName: 'Dyson Airstrait 二合一吹風直髮器',
      category: 'Appliances',
      gtin: '5025155088210',
      mpn: 'HT01',
      specifications: { technology: '氣流直髮 (無熱面板)', airflow: '11.9 L/s', power: '1600W' }
    }
  ];

  const canonicalMap = new Map<string, string>();
  for (const c of canonicalItems) {
    const record = await prisma.canonicalProduct.findFirst({ where: { brand: c.brand, model: c.model } }) ?? await prisma.canonicalProduct.create({
      data: {
        brand: c.brand,
        model: c.model,
        normalizedName: c.normalizedName,
        category: c.category,
        gtin: c.gtin,
        mpn: c.mpn,
        specifications: c.specifications
      }
    });
    canonicalMap.set(`${c.brand.toLowerCase()}_${c.model.toLowerCase()}`, record.id);
  }

  console.log(`成功建立 ${canonicalItems.length} 項標準商品 (Canonical Products)`);

  // 2. 建立各通路 Offers 與變體
  for (const raw of MOCK_PRODUCTS_DATA) {
    const existing = await prisma.productOffer.findUnique({ where: { source_sourceProductId: { source: raw.source, sourceProductId: raw.sourceProductId } } });
    if (existing) continue;
    const norm = NormalizationService.normalizeRawProduct(raw);
    const key = `${(raw.brand || norm.brand).toLowerCase()}_${(raw.model || norm.model).toLowerCase()}`;
    const canonicalId = canonicalMap.get(key) || null;

    const landed = LandedCostCalculator.calculate({
      itemPrice: raw.price,
      currency: raw.currency,
      category: raw.category,
      domesticShipping: raw.currency === 'TWD' ? raw.shippingFee : 0,
      internationalShipping: raw.currency === 'JPY' ? raw.shippingFee : 0,
      couponDiscount: 0,
      shipsToTaiwan: raw.shipsToTaiwan
    });

    const offer = await prisma.productOffer.create({
      data: {
        canonicalProductId: canonicalId,
        source: raw.source,
        sourceProductId: raw.sourceProductId,
        title: raw.title,
        normalizedTitle: norm.normalizedTitle,
        brand: raw.brand || norm.brand,
        model: raw.model || norm.model,
        category: raw.category,
        condition: (raw.condition as ProductCondition) || ProductCondition.BRAND_NEW,
        sellerName: raw.sellerName,
        sellerRating: raw.sellerRating,
        sellerReviewCount: raw.sellerReviewCount,
        imageUrl: raw.imageUrl,
        productUrl: raw.productUrl,
        currency: raw.currency,
        originalPrice: raw.originalPrice || raw.price,
        salePrice: raw.price,
        couponDiscount: 0,
        domesticShipping: raw.currency === 'TWD' ? raw.shippingFee : 0,
        internationalShipping: raw.currency === 'JPY' ? raw.shippingFee : 0,
        estimatedDuty: landed.estimatedDutyTwd,
        estimatedVat: landed.estimatedTaxTwd,
        serviceFee: landed.serviceFeeTwd,
        landedCostTwd: landed.totalTwd,
        isShippingEstimated: !!raw.isShippingEstimated,
        isTaxEstimated: landed.isEstimated,
        stockStatus: raw.stockStatus || 'IN_STOCK',
        minDeliveryDays: raw.minDeliveryDays,
        maxDeliveryDays: raw.maxDeliveryDays,
        shipsToTaiwan: raw.shipsToTaiwan,
        countryOfOrigin: raw.countryOfOrigin,
        warrantyType: (raw.warrantyType as WarrantyType) || WarrantyType.TAIWAN_OFFICIAL,
        warrantyMonths: raw.warrantyMonths,
        returnPolicyDays: raw.returnPolicyDays,
        isOfficialStore: !!raw.isOfficialStore,
        isAuthorizedSeller: !!raw.isAuthorizedSeller,
        rawData: raw.rawAttributes as Prisma.InputJsonValue,
        isMockData: true
      }
    });

    // 建立變體 (Variant)
    if (norm.variant.color || norm.variant.capacity || norm.variant.size || norm.variant.voltage) {
      await prisma.productVariant.create({
        data: {
          offerId: offer.id,
          color: norm.variant.color,
          capacity: norm.variant.capacity,
          size: norm.variant.size,
          voltage: norm.variant.voltage
        }
      });
    }

    // 建立 3 筆歷史價格 (Price History)
    const now = new Date();
    for (let i = 2; i >= 0; i--) {
      const pastDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const fluctuation = (i === 1) ? 1.05 : (i === 2) ? 1.08 : 1.0;
      const histPrice = Math.round(raw.price * fluctuation);
      const histLandedTwd = Math.round(landed.totalTwd * fluctuation);

      await prisma.priceHistory.create({
        data: {
          offerId: offer.id,
          canonicalProductId: canonicalId,
          price: histPrice,
          currency: raw.currency,
          landedCostTwd: histLandedTwd,
          recordedAt: pastDate
        }
      });
    }
  }

  console.log(`成功匯入 ${MOCK_PRODUCTS_DATA.length} 筆通路 Offers 與歷史價格走勢！`);
  console.log('--- 種子資料寫入完成 ---');
}

main()
  .catch((e) => {
    console.error('Seeding 過程發生例外:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
