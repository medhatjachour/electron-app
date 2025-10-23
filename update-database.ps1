# 🔄 Database Update Script
# This script refreshes your database with fresh test data

Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🗄️  DATABASE UPDATE UTILITY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "⚠️  WARNING: This will DELETE all existing data!" -ForegroundColor Red
Write-Host "   and create fresh test data with 140+ records.`n" -ForegroundColor Yellow

$confirmation = Read-Host "Do you want to continue? (yes/no)"

if ($confirmation -ne 'yes') {
    Write-Host "`n❌ Operation cancelled.`n" -ForegroundColor Red
    exit
}

Write-Host "`n🚀 Starting database update...`n" -ForegroundColor Green

# Run Prisma seed
Write-Host "📝 Running seed script..." -ForegroundColor Cyan
npm run prisma:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Database updated successfully!`n" -ForegroundColor Green
    
    Write-Host "📊 What was created:" -ForegroundColor Cyan
    Write-Host "   • 4 Users (admin, sales, inventory, finance)" -ForegroundColor White
    Write-Host "   • 4 Stores (Downtown, Mall, Airport, Suburban)" -ForegroundColor White
    Write-Host "   • 4 Employees" -ForegroundColor White
    Write-Host "   • 4 Customers (Bronze to Platinum tiers)" -ForegroundColor White
    Write-Host "   • 15 Products (Electronics, Clothing, Sports, etc.)" -ForegroundColor White
    Write-Host "   • 35+ Product Variants (different colors/sizes)" -ForegroundColor White
    Write-Host "   • 75+ Sales Transactions (across 90 days)" -ForegroundColor White
    Write-Host "   • 50+ Financial Transactions (income & expenses)`n" -ForegroundColor White
    
    Write-Host "🎯 Test Scenarios Covered:" -ForegroundColor Cyan
    Write-Host "   ✅ Sales Status: 70% Completed, 20% Pending, 10% Cancelled" -ForegroundColor Green
    Write-Host "   ✅ Date Ranges: Today, 7 days, 30 days, 90 days" -ForegroundColor Green
    Write-Host "   ✅ Payment Methods: Cash and Card" -ForegroundColor Green
    Write-Host "   ✅ Price Ranges: $19.99 to $2,499.99" -ForegroundColor Green
    Write-Host "   ✅ Categories: 8 different product categories" -ForegroundColor Green
    Write-Host "   ✅ Growth Metrics: Period-over-period comparisons`n" -ForegroundColor Green
    
    Write-Host "🔐 Login Credentials:" -ForegroundColor Cyan
    Write-Host "   Username: admin    | Password: admin123" -ForegroundColor Yellow
    Write-Host "   Username: sales    | Password: sales123" -ForegroundColor Yellow
    Write-Host "   Username: finance  | Password: finance123`n" -ForegroundColor Yellow
    
    Write-Host "📖 For detailed documentation, see:" -ForegroundColor Cyan
    Write-Host "   SEED_DATA_GUIDE.md`n" -ForegroundColor White
    
    Write-Host "💡 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart your Electron app (npm run dev)" -ForegroundColor White
    Write-Host "   2. Login and navigate to Finance page" -ForegroundColor White
    Write-Host "   3. Test different date ranges" -ForegroundColor White
    Write-Host "   4. View Sales Status breakdown chart`n" -ForegroundColor White
    
} else {
    Write-Host "`n❌ Seed failed! Check the error message above.`n" -ForegroundColor Red
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
