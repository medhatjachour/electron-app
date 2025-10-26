# Database Repair Script for Electron POS
# Fixes database lock issues and timeout errors

Write-Host "🔧 Database Repair Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$dbPath = ".\prisma\dev.db"
$dbWalPath = "$dbPath-wal"
$dbShmPath = "$dbPath-shm"

# Check if database exists
if (-not (Test-Path $dbPath)) {
    Write-Host "❌ Database not found at: $dbPath" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database found: $dbPath" -ForegroundColor Green
Write-Host ""

# Step 1: Check for WAL files (Write-Ahead Log)
Write-Host "Step 1: Checking for WAL files..." -ForegroundColor Yellow
if (Test-Path $dbWalPath) {
    Write-Host "  ⚠️  WAL file found: $dbWalPath" -ForegroundColor Yellow
    $walSize = (Get-Item $dbWalPath).Length
    Write-Host "  Size: $walSize bytes"
}
if (Test-Path $dbShmPath) {
    Write-Host "  ⚠️  SHM file found: $dbShmPath" -ForegroundColor Yellow
    $shmSize = (Get-Item $dbShmPath).Length
    Write-Host "  Size: $shmSize bytes"
}
Write-Host ""

# Step 2: Run SQLite PRAGMA checks
Write-Host "Step 2: Running database integrity check..." -ForegroundColor Yellow

# Create a temporary SQL script
$sqlScript = @"
-- Check database integrity
PRAGMA integrity_check;

-- Check foreign keys
PRAGMA foreign_key_check;

-- Show current journal mode
PRAGMA journal_mode;

-- Show database size
PRAGMA page_count;
PRAGMA page_size;

-- Optimize database
PRAGMA optimize;

-- Checkpoint WAL file (if exists)
PRAGMA wal_checkpoint(FULL);

-- Set WAL mode for better concurrency
PRAGMA journal_mode=WAL;

-- Increase busy timeout
PRAGMA busy_timeout=60000;
"@

$tempSqlFile = ".\temp-db-check.sql"
$sqlScript | Out-File -FilePath $tempSqlFile -Encoding UTF8

# Run SQLite command (requires sqlite3.exe)
Write-Host "  Attempting to run SQLite checks..." -ForegroundColor Cyan

# Try to use sqlite3 if available
$sqlite3Path = Get-Command sqlite3 -ErrorAction SilentlyContinue
if ($sqlite3Path) {
    Write-Host "  ✅ SQLite3 found, running checks..." -ForegroundColor Green
    sqlite3 $dbPath < $tempSqlFile
} else {
    Write-Host "  ⚠️  SQLite3 not found in PATH" -ForegroundColor Yellow
    Write-Host "  Skipping direct SQLite checks" -ForegroundColor Yellow
    Write-Host "  Install SQLite tools: https://www.sqlite.org/download.html" -ForegroundColor Cyan
}

# Clean up temp file
Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
Write-Host ""

# Step 3: Backup database
Write-Host "Step 3: Creating backup..." -ForegroundColor Yellow
$backupPath = ".\prisma\dev.db.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $dbPath $backupPath
Write-Host "  ✅ Backup created: $backupPath" -ForegroundColor Green
Write-Host ""

# Step 4: Rebuild with Prisma
Write-Host "Step 4: Rebuilding Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
Write-Host ""

# Step 5: Reset database (optional - uncomment if needed)
# Write-Host "Step 5: Reset database (DANGER: This will delete all data!)" -ForegroundColor Red
# $confirm = Read-Host "Type 'YES' to reset database, or press Enter to skip"
# if ($confirm -eq "YES") {
#     npx prisma migrate reset --force
#     Write-Host "  ✅ Database reset complete" -ForegroundColor Green
# } else {
#     Write-Host "  ⏭️  Database reset skipped" -ForegroundColor Yellow
# }

Write-Host ""
Write-Host "✅ Database repair complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your Electron app: npm run dev" -ForegroundColor White
Write-Host "2. If issues persist, check the backup at: $backupPath" -ForegroundColor White
Write-Host "3. Review console logs for any remaining errors" -ForegroundColor White
Write-Host ""
