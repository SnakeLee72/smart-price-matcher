-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('BRAND_NEW', 'OPEN_BOX', 'REFURBISHED', 'USED');

-- CreateEnum
CREATE TYPE "WarrantyType" AS ENUM ('TAIWAN_OFFICIAL', 'PARALLEL_IMPORT', 'ORIGIN_DOMESTIC', 'NONE');

-- CreateTable
CREATE TABLE "CanonicalProduct" (
    "id" TEXT NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "gtin" VARCHAR(20),
    "ean" VARCHAR(20),
    "upc" VARCHAR(20),
    "jan" VARCHAR(20),
    "mpn" VARCHAR(100),
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOffer" (
    "id" TEXT NOT NULL,
    "canonicalProductId" TEXT,
    "source" VARCHAR(50) NOT NULL,
    "sourceProductId" VARCHAR(100) NOT NULL,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100),
    "category" VARCHAR(100) NOT NULL,
    "condition" "ProductCondition" NOT NULL DEFAULT 'BRAND_NEW',
    "sellerName" VARCHAR(150) NOT NULL,
    "sellerRating" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    "sellerReviewCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TWD',
    "originalPrice" DECIMAL(12,2) NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "couponDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "domesticShipping" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "internationalShipping" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "estimatedDuty" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "estimatedVat" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "serviceFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "landedCostTwd" DECIMAL(12,2) NOT NULL,
    "isShippingEstimated" BOOLEAN NOT NULL DEFAULT false,
    "isTaxEstimated" BOOLEAN NOT NULL DEFAULT false,
    "stockStatus" VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK',
    "minDeliveryDays" INTEGER NOT NULL DEFAULT 1,
    "maxDeliveryDays" INTEGER NOT NULL DEFAULT 3,
    "shipsToTaiwan" BOOLEAN NOT NULL DEFAULT true,
    "countryOfOrigin" VARCHAR(10) NOT NULL DEFAULT 'TW',
    "warrantyType" "WarrantyType" NOT NULL DEFAULT 'TAIWAN_OFFICIAL',
    "warrantyMonths" INTEGER NOT NULL DEFAULT 12,
    "returnPolicyDays" INTEGER NOT NULL DEFAULT 7,
    "isOfficialStore" BOOLEAN NOT NULL DEFAULT false,
    "isAuthorizedSeller" BOOLEAN NOT NULL DEFAULT false,
    "rawData" JSONB NOT NULL DEFAULT '{}',
    "isMockData" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "color" VARCHAR(50),
    "size" VARCHAR(50),
    "capacity" VARCHAR(50),
    "voltage" VARCHAR(50),
    "plugType" VARCHAR(50),
    "language" VARCHAR(50),
    "region" VARCHAR(50),
    "packageType" VARCHAR(50),

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "canonicalProductId" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "landedCostTwd" DECIMAL(12,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'anonymous_guest',
    "offerId" TEXT NOT NULL,
    "canonicalProductId" TEXT,
    "targetPriceTwd" DECIMAL(12,2),
    "notifyOnPriceDrop" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorLog" (
    "id" TEXT NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanonicalProduct_brand_model_idx" ON "CanonicalProduct"("brand", "model");

-- CreateIndex
CREATE INDEX "CanonicalProduct_normalizedName_idx" ON "CanonicalProduct"("normalizedName");

-- CreateIndex
CREATE INDEX "ProductOffer_canonicalProductId_idx" ON "ProductOffer"("canonicalProductId");

-- CreateIndex
CREATE INDEX "ProductOffer_landedCostTwd_idx" ON "ProductOffer"("landedCostTwd");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOffer_source_sourceProductId_key" ON "ProductOffer"("source", "sourceProductId");

-- CreateIndex
CREATE INDEX "ProductVariant_offerId_idx" ON "ProductVariant"("offerId");

-- CreateIndex
CREATE INDEX "PriceHistory_offerId_recordedAt_idx" ON "PriceHistory"("offerId", "recordedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_canonicalProductId_recordedAt_idx" ON "PriceHistory"("canonicalProductId", "recordedAt");

-- CreateIndex
CREATE INDEX "UserFavorite_userId_idx" ON "UserFavorite"("userId");

-- CreateIndex
CREATE INDEX "ConnectorLog_source_createdAt_idx" ON "ConnectorLog"("source", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_canonicalProductId_fkey" FOREIGN KEY ("canonicalProductId") REFERENCES "CanonicalProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_canonicalProductId_fkey" FOREIGN KEY ("canonicalProductId") REFERENCES "CanonicalProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
