-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "note" TEXT,
    "customerId" TEXT,
    "saleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deposit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deposit_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "SaleTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deposit" ("amount", "createdAt", "customerId", "date", "id", "method", "note", "saleId", "updatedAt") SELECT "amount", "createdAt", "customerId", "date", "id", "method", "note", "saleId", "updatedAt" FROM "Deposit";
DROP TABLE "Deposit";
ALTER TABLE "new_Deposit" RENAME TO "Deposit";
CREATE INDEX "Deposit_customerId_idx" ON "Deposit"("customerId");
CREATE INDEX "Deposit_saleId_idx" ON "Deposit"("saleId");
CREATE INDEX "Deposit_date_idx" ON "Deposit"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
