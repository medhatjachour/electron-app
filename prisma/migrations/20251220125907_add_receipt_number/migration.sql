/*
  Warnings:

  - A unique constraint covering the columns `[receiptNumber]` on the table `FinancialTransaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receiptNumber]` on the table `SaleTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FinancialTransaction" ADD COLUMN "receiptNumber" TEXT;

-- AlterTable
ALTER TABLE "SaleTransaction" ADD COLUMN "receiptNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FinancialTransaction_receiptNumber_key" ON "FinancialTransaction"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SaleTransaction_receiptNumber_key" ON "SaleTransaction"("receiptNumber");
