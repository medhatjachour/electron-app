#!/bin/bash
# Quick Performance Test for Barcode Search

echo "🔍 Barcode Search Performance Test"
echo "===================================="
echo ""

cd /home/medhat/Documents/electron-app

# Get database stats
echo "📊 Database Stats:"
sqlite3 prisma/dev.db <<EOF
SELECT 
  'Total Products:' as stat, COUNT(*) as count FROM Product
UNION ALL
SELECT 
  'Total Variants:', COUNT(*) FROM ProductVariant
UNION ALL
SELECT 
  'Variants with Barcode:', COUNT(*) FROM ProductVariant WHERE barcode IS NOT NULL;
EOF
echo ""

# Test barcode search speed
echo "⚡ Testing Barcode Search Speed:"
echo "Sample barcodes for testing:"
sqlite3 prisma/dev.db "SELECT barcode FROM ProductVariant WHERE barcode IS NOT NULL LIMIT 3;"
echo ""

# Time a barcode lookup
TEST_BARCODE=$(sqlite3 prisma/dev.db "SELECT barcode FROM ProductVariant WHERE barcode IS NOT NULL LIMIT 1;")
echo "🏃 Testing lookup for: $TEST_BARCODE"
time sqlite3 prisma/dev.db "SELECT p.name, pv.sku, pv.price, pv.stock FROM Product p JOIN ProductVariant pv ON p.id = pv.productId WHERE pv.barcode = '$TEST_BARCODE';"
echo ""

# Check indexes
echo "📑 Barcode Indexes:"
sqlite3 prisma/dev.db "SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='ProductVariant' AND name LIKE '%barcode%';"
echo ""

echo "✅ Test Complete!"
echo ""
echo "💡 To test in app:"
echo "   1. Open QuickSale page"
echo "   2. Type: $TEST_BARCODE"
echo "   3. Should find product instantly!"
