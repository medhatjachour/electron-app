-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SaleTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "customerName" TEXT,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SaleTransaction" ("createdAt", "customerName", "id", "paymentMethod", "status", "subtotal", "tax", "total", "updatedAt", "userId") SELECT "createdAt", "customerName", "id", "paymentMethod", "status", "subtotal", "tax", "total", "updatedAt", "userId" FROM "SaleTransaction";
DROP TABLE "SaleTransaction";
ALTER TABLE "new_SaleTransaction" RENAME TO "SaleTransaction";
CREATE INDEX "SaleTransaction_createdAt_idx" ON "SaleTransaction"("createdAt");
CREATE INDEX "SaleTransaction_userId_idx" ON "SaleTransaction"("userId");
CREATE INDEX "SaleTransaction_customerId_idx" ON "SaleTransaction"("customerId");
CREATE INDEX "SaleTransaction_status_idx" ON "SaleTransaction"("status");
CREATE INDEX "SaleTransaction_paymentMethod_idx" ON "SaleTransaction"("paymentMethod");
CREATE INDEX "SaleTransaction_createdAt_status_idx" ON "SaleTransaction"("createdAt", "status");
CREATE INDEX "SaleTransaction_userId_createdAt_idx" ON "SaleTransaction"("userId", "createdAt");
CREATE INDEX "SaleTransaction_customerId_createdAt_idx" ON "SaleTransaction"("customerId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
