# Diagnostic Script for Willingness API Issue

Write-Host "🔍 Rapid Red Care Circle - Willingness API Diagnostics" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Check 1: Database exists
Write-Host "1️⃣ Checking database..." -ForegroundColor Yellow
if (Test-Path "database.sqlite") {
    Write-Host "   ✅ Database file exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Database file NOT found" -ForegroundColor Red
    Write-Host "   💡 Run: npm start (to create database)" -ForegroundColor Cyan
}
Write-Host ""

# Check 2: Migration files exist
Write-Host "2️⃣ Checking migration files..." -ForegroundColor Yellow
$migrations = Get-ChildItem "src/migrations" -Filter "*.js" | Select-Object -ExpandProperty Name
Write-Host "   Found $($migrations.Count) migration files:" -ForegroundColor Green
foreach ($migration in $migrations) {
    Write-Host "   - $migration" -ForegroundColor Gray
}
Write-Host ""

# Check 3: Check if willingness migration exists
Write-Host "3️⃣ Checking willingness migration..." -ForegroundColor Yellow
$willingnessMigration = Get-ChildItem "src/migrations" -Filter "*willingness*.js"
if ($willingnessMigration) {
    Write-Host "   ✅ Willingness migration found: $($willingnessMigration.Name)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Willingness migration NOT found" -ForegroundColor Red
}
Write-Host ""

# Check 4: Check Donor model
Write-Host "4️⃣ Checking Donor model..." -ForegroundColor Yellow
$donorModel = Get-Content "src/models/Donor.js" -Raw
if ($donorModel -match "is_willing") {
    Write-Host "   ✅ is_willing field found in model" -ForegroundColor Green
} else {
    Write-Host "   ❌ is_willing field NOT found in model" -ForegroundColor Red
}
if ($donorModel -match "passed_eligibility") {
    Write-Host "   ✅ passed_eligibility field found in model" -ForegroundColor Green
} else {
    Write-Host "   ❌ passed_eligibility field NOT found in model" -ForegroundColor Red
}
Write-Host ""

# Check 5: Check routes
Write-Host "5️⃣ Checking donor routes..." -ForegroundColor Yellow
$donorRoutes = Get-Content "src/routes/donors.js" -Raw
if ($donorRoutes -match "router\.post\('/willingness'") {
    Write-Host "   ✅ POST /willingness route found" -ForegroundColor Green
} else {
    Write-Host "   ❌ POST /willingness route NOT found" -ForegroundColor Red
}
Write-Host ""

# Check 6: Check if server is running
Write-Host "6️⃣ Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Server is running on port 3000" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Server is NOT running on port 3000" -ForegroundColor Red
    Write-Host "   💡 Run: npm start" -ForegroundColor Cyan
}
Write-Host ""

# Summary
Write-Host "=" * 60
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run migrations:" -ForegroundColor Yellow
Write-Host "   npx sequelize-cli db:migrate" -ForegroundColor White
Write-Host ""
Write-Host "2. Start/Restart server:" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "3. Test API endpoint:" -ForegroundColor Yellow
Write-Host "   node test-willingness-api.js" -ForegroundColor White
Write-Host ""
Write-Host "4. Check browser console for errors" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 60
