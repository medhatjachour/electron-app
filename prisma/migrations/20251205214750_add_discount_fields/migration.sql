/*
  Warnings:

  - Added the required column `finalPrice` to the `SaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "refundedQuantity" INTEGER NOT NULL DEFAULT 0,
    "price" REAL NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'NONE',
    "discountValue" REAL NOT NULL DEFAULT 0,
    "finalPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "discountReason" TEXT,
    "discountAppliedBy" TEXT,
    "discountAppliedAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "SaleTransaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SaleItem" ("createdAt", "id", "price", "productId", "quantity", "refundedAt", "refundedQuantity", "total", "transactionId", "variantId") SELECT "createdAt", "id", "price", "productId", "quantity", "refundedAt", "refundedQuantity", "total", "transactionId", "variantId" FROM "SaleItem";
DROP TABLE "SaleItem";
ALTER TABLE "new_SaleItem" RENAME TO "SaleItem";
CREATE INDEX "SaleItem_transactionId_idx" ON "SaleItem"("transactionId");
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");
CREATE INDEX "SaleItem_createdAt_idx" ON "SaleItem"("createdAt");
CREATE INDEX "SaleItem_transactionId_productId_idx" ON "SaleItem"("transactionId", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
