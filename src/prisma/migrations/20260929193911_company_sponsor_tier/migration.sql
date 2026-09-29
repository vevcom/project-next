-- CreateEnum
CREATE TYPE "CompanySponsorTier" AS ENUM ('MAIN', 'SPONSOR', 'NONE');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "sponsorTier" "CompanySponsorTier" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "Company_sponsorTier_idx" ON "Company"("sponsorTier");
