-- AlterTable
ALTER TABLE "HallSettings" ADD COLUMN     "closedWeekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
