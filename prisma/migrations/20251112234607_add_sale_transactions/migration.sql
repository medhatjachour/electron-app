/*
  Warnings:

  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Sale_status_paymentMethod_idx";

-- DropIndex
DROP INDEX "Sale_paymentMethod_createdAt_idx";

-- DropIndex
DROP INDEX "Sale_productId_createdAt_idx";

-- DropIndex
DROP INDEX "Sale_userId_createdAt_idx";

-- DropIndex
DROP INDEX "Sale_createdAt_status_idx";

-- DropIndex
DROP INDEX "Sale_paymentMethod_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Transaction";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SaleTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "customerName" TEXT,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "SaleTransaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SaleTransaction_createdAt_idx" ON "SaleTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "SaleTransaction_userId_idx" ON "SaleTransaction"("userId");

-- CreateIndex
CREATE INDEX "SaleTransaction_status_idx" ON "SaleTransaction"("status");

-- CreateIndex
CREATE INDEX "SaleTransaction_paymentMethod_idx" ON "SaleTransaction"("paymentMethod");

-- CreateIndex
CREATE INDEX "SaleTransaction_createdAt_status_idx" ON "SaleTransaction"("createdAt", "status");

-- CreateIndex
CREATE INDEX "SaleTransaction_userId_createdAt_idx" ON "SaleTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SaleItem_transactionId_idx" ON "SaleItem"("transactionId");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");

-- CreateIndex
CREATE INDEX "SaleItem_createdAt_idx" ON "SaleItem"("createdAt");

-- CreateIndex
CREATE INDEX "SaleItem_transactionId_productId_idx" ON "SaleItem"("transactionId", "productId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_userId_idx" ON "FinancialTransaction"("userId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_type_idx" ON "FinancialTransaction"("type");

-- CreateIndex
CREATE INDEX "FinancialTransaction_createdAt_idx" ON "FinancialTransaction"("createdAt");
