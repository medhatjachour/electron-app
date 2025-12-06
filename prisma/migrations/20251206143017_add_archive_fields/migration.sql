-- AlterTable
ALTER TABLE "User" ADD COLUMN "deactivatedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "deactivatedBy" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "loyaltyTier" TEXT NOT NULL DEFAULT 'Bronze',
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "archivedBy" TEXT,
    "archiveReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("createdAt", "email", "id", "loyaltyTier", "name", "phone", "totalSpent", "updatedAt") SELECT "createdAt", "email", "id", "loyaltyTier", "name", "phone", "totalSpent", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX "Customer_loyaltyTier_idx" ON "Customer"("loyaltyTier");
CREATE INDEX "Customer_isArchived_idx" ON "Customer"("isArchived");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseSKU" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" REAL NOT NULL,
    "baseCost" REAL NOT NULL,
    "hasVariants" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "archivedBy" TEXT,
    "archiveReason" TEXT,
    "storeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("baseCost", "basePrice", "baseSKU", "categoryId", "createdAt", "description", "hasVariants", "id", "name", "storeId", "updatedAt") SELECT "baseCost", "basePrice", "baseSKU", "categoryId", "createdAt", "description", "hasVariants", "id", "name", "storeId", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_baseSKU_key" ON "Product"("baseSKU");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_baseSKU_idx" ON "Product"("baseSKU");
CREATE INDEX "Product_isArchived_idx" ON "Product"("isArchived");
CREATE INDEX "Product_categoryId_createdAt_idx" ON "Product"("categoryId", "createdAt");
CREATE INDEX "Product_name_categoryId_idx" ON "Product"("name", "categoryId");
CREATE INDEX "Product_hasVariants_categoryId_idx" ON "Product"("hasVariants", "categoryId");
CREATE INDEX "Product_basePrice_categoryId_idx" ON "Product"("basePrice", "categoryId");
CREATE INDEX "Product_isArchived_categoryId_idx" ON "Product"("isArchived", "categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
