/*
  Warnings:

  - A unique constraint covering the columns `[row,block,number]` on the table `garages` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "garages_block_row_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "garages_row_block_number_key" ON "garages"("row", "block", "number");
