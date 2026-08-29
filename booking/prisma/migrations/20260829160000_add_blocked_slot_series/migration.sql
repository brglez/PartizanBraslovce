-- AlterTable
ALTER TABLE "BlockedSlot" ADD COLUMN     "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "BlockedSlot_seriesId_idx" ON "BlockedSlot"("seriesId");
