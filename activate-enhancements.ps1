# Enterprise Enhancements Activation Script
# Run this to activate all optimizations

Write-Host "🚀 Activating Enterprise Enhancements..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Backup current files
Write-Host "📦 Step 1: Creating backups..." -ForegroundColor Yellow
if (Test-Path "src\renderer\src\App.tsx") {
    Copy-Item "src\renderer\src\App.tsx" "src\renderer\src\App_BACKUP.tsx" -Force
    Write-Host "✅ App.tsx backed up" -ForegroundColor Green
}

if (Test-Path "src\renderer\src\pages\Dashboard.tsx") {
    Copy-Item "src\renderer\src\pages\Dashboard.tsx" "src\renderer\src\pages\Dashboard_BACKUP.tsx" -Force
    Write-Host "✅ Dashboard.tsx backed up" -ForegroundColor Green
}

Write-Host ""

# Step 2: Activate optimized versions
Write-Host "🔄 Step 2: Activating optimized versions..." -ForegroundColor Yellow

if (Test-Path "src\renderer\src\App_OPTIMIZED.tsx") {
    Copy-Item "src\renderer\src\App_OPTIMIZED.tsx" "src\renderer\src\App.tsx" -Force
    Write-Host "✅ Optimized App.tsx activated" -ForegroundColor Green
} else {
    Write-Host "⚠️  App_OPTIMIZED.tsx not found" -ForegroundColor Red
}

if (Test-Path "src\renderer\src\pages\Dashboard_OPTIMIZED.tsx") {
    Copy-Item "src\renderer\src\pages\Dashboard_OPTIMIZED.tsx" "src\renderer\src\pages\Dashboard.tsx" -Force
    Write-Host "✅ Optimized Dashboard.tsx activated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dashboard_OPTIMIZED.tsx not found" -ForegroundColor Red
}

Write-Host ""

# Step 3: Verify new files exist
Write-Host "🔍 Step 3: Verifying new files..." -ForegroundColor Yellow

$filesToCheck = @(
    "src\renderer\src\components\LazyLoad.tsx",
    "src\renderer\src\services\index.ts",
    "src\renderer\src\services\security.ts",
    "src\renderer\src\hooks\useEnhanced.ts"
)

$allExist = $true
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $allExist = $false
    }
}

Write-Host ""

# Step 4: Check dependencies
Write-Host "📚 Step 4: Checking dependencies..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$deps = $packageJson.dependencies

if ($deps."crypto-js") {
    Write-Host "✅ crypto-js installed ($($deps."crypto-js"))" -ForegroundColor Green
} else {
    Write-Host "⚠️  crypto-js not installed. Run: npm install crypto-js @types/crypto-js" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 ACTIVATION SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

if ($allExist) {
    Write-Host "✅ All enhancement files are in place" -ForegroundColor Green
    Write-Host "✅ Optimized versions activated" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 READY TO USE! Run 'npm run dev' to test" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some files are missing. Check the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   - ENTERPRISE_ENHANCEMENTS.md (Complete guide)" -ForegroundColor White
Write-Host "   - See all features and usage examples" -ForegroundColor White
Write-Host ""

Write-Host "🔄 To revert: Copy *_BACKUP.tsx files back" -ForegroundColor Yellow
Write-Host ""
