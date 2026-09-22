ALTER TABLE "UserFavorite" ALTER COLUMN "userId" DROP DEFAULT;

CREATE UNIQUE INDEX "UserFavorite_userId_offerId_key" ON "UserFavorite"("userId", "offerId");

CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "targetPriceTwd" DECIMAL(12,2) NOT NULL,
    "email" VARCHAR(254),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PriceAlert_userId_idx" ON "PriceAlert"("userId");
CREATE UNIQUE INDEX "PriceAlert_userId_offerId_key" ON "PriceAlert"("userId", "offerId");
