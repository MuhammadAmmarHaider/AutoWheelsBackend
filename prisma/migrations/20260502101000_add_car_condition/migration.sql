-- CreateEnum
CREATE TYPE "CarCondition" AS ENUM ('USED', 'NEW');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "carCondition" "CarCondition" NOT NULL DEFAULT 'USED';

-- CreateIndex
CREATE INDEX "Listing_carCondition_idx" ON "Listing"("carCondition");
