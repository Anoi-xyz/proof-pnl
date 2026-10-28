# ProofPnL Demo Script
# Run this in PowerShell from the proof-pnl directory.
# Prerequisites: Node >= 18, Primus Chrome Extension installed.

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  ProofPnL — zkTLS PnL Badge Demo" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node version
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "[ERROR] Node.js is not installed. Get it from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green

# 2. Check .env
if (-not (Test-Path ".env")) {
    Write-Host "[SETUP] .env not found — copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[ACTION] Please edit .env and set VITE_APP_ID and APP_SECRET, then re-run." -ForegroundColor Yellow
    notepad .env
    exit 0
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match "VITE_APP_ID=$" -or $envContent -match "VITE_APP_ID=\s*$") {
    Write-Host "[ERROR] VITE_APP_ID is empty in .env. Please fill it in." -ForegroundColor Red
    exit 1
}
if ($envContent -match "APP_SECRET=$" -or $envContent -match "APP_SECRET=\s*$") {
    Write-Host "[ERROR] APP_SECRET is empty in .env. Please fill it in." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] .env configured" -ForegroundColor Green

# 3. Install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "[SETUP] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed." -ForegroundColor Red
        exit 1
    }
}
Write-Host "[OK] Dependencies installed" -ForegroundColor Green

# 4. Start
Write-Host ""
Write-Host "[START] Launching ProofPnL..." -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

npm start
