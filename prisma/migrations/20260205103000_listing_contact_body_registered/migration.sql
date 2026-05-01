-- Listing fields added after initial migration (match schema.prisma)

ALTER TABLE "Listing" ADD COLUMN "bodyColor" TEXT;
ALTER TABLE "Listing" ADD COLUMN "contactName" TEXT;
ALTER TABLE "Listing" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "Listing" ADD COLUMN "allowWhatsapp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN "registeredCityId" TEXT;

CREATE INDEX "Listing_registeredCityId_idx" ON "Listing"("registeredCityId");

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_registeredCityId_fkey" FOREIGN KEY ("registeredCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
