-- AlterTable
ALTER TABLE "garages" ADD COLUMN     "cadastral_number" TEXT,
ADD COLUMN     "floors" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "notes" TEXT;
