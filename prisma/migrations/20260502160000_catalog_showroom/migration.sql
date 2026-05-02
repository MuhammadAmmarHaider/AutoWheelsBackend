-- Drop dual-condition on marketplace listings (all listings remain for-sale used inventory only)
DROP INDEX IF EXISTS "Listing_carCondition_idx";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "carCondition";
DROP TYPE IF EXISTS "CarCondition";

CREATE TABLE "NewCarCatalog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL,
    "indicativePrice" DOUBLE PRECISION,
    "year" INTEGER NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewCarCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewCarCatalogImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "newCarCatalogId" TEXT NOT NULL,

    CONSTRAINT "NewCarCatalogImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NewCarCatalog_brandId_idx" ON "NewCarCatalog"("brandId");

CREATE INDEX "NewCarCatalog_modelId_idx" ON "NewCarCatalog"("modelId");

CREATE INDEX "NewCarCatalog_featured_idx" ON "NewCarCatalog"("featured");

CREATE INDEX "NewCarCatalog_createdAt_idx" ON "NewCarCatalog"("createdAt");

CREATE INDEX "NewCarCatalogImage_newCarCatalogId_idx" ON "NewCarCatalogImage"("newCarCatalogId");

ALTER TABLE "NewCarCatalog" ADD CONSTRAINT "NewCarCatalog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NewCarCatalog" ADD CONSTRAINT "NewCarCatalog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "CarModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NewCarCatalogImage" ADD CONSTRAINT "NewCarCatalogImage_newCarCatalogId_fkey" FOREIGN KEY ("newCarCatalogId") REFERENCES "NewCarCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
