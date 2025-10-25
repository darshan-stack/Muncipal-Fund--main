# 🚀 Quick Deployment Script for Windows PowerShell
# This script will guide you through deploying to REAL blockchain

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   BLOCKCHAIN DEPLOYMENT - QUICK START" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if .env exists
Write-Host "Step 1: Checking for .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Verify it has PRIVATE_KEY
    $envContent = Get-Content .env -Raw
    if ($envContent -match "PRIVATE_KEY=0x") {
        Write-Host "✅ PRIVATE_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: PRIVATE_KEY not found or invalid in .env" -ForegroundColor Red
        Write-Host "`nPlease add to .env file:" -ForegroundColor Yellow
        Write-Host "PRIVATE_KEY=0xYourPrivateKeyHere`n" -ForegroundColor White
        exit
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "`nCreating .env template..." -ForegroundColor Yellow
    
    "PRIVATE_KEY=your_private_key_here" | Out-File -FilePath .env -Encoding UTF8
    
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "1. Open MetaMask → Account Details → Export Private Key" -ForegroundColor White
    Write-Host "2. Copy your private key (starts with 0x)" -ForegroundColor White
    Write-Host "3. Open .env file" -ForegroundColor White
    Write-Host "4. Replace 'your_private_key_here' with your actual key" -ForegroundColor White
    Write-Host "5. Run this script again`n" -ForegroundColor White
    
    # Open .env in notepad
    notepad .env
    exit
}

# Check for testnet MATIC
Write-Host "`nStep 2: Checking prerequisites..." -ForegroundColor Yellow
Write-Host "Do you have testnet MATIC in your wallet? (yes/no)" -ForegroundColor Cyan
$hasMatic = Read-Host

if ($hasMatic -ne "yes") {
    Write-Host "`n❌ You need testnet MATIC to deploy" -ForegroundColor Red
    Write-Host "`nGet free MATIC from:" -ForegroundColor Yellow
    Write-Host "1. https://faucet.polygon.technology/" -ForegroundColor White
    Write-Host "2. Select 'Mumbai' network" -ForegroundColor White
    Write-Host "3. Paste your MetaMask address" -ForegroundColor White
    Write-Host "4. Wait 1-2 minutes`n" -ForegroundColor White
    
    Start-Process "https://faucet.polygon.technology/"
    exit
}

Write-Host "✅ Prerequisites ready" -ForegroundColor Green

# Install dependencies
Write-Host "`nStep 3: Installing dependencies..." -ForegroundColor Yellow
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Compile contract
Write-Host "`nStep 4: Compiling smart contract..." -ForegroundColor Yellow
npx hardhat compile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Compilation failed!" -ForegroundColor Red
    exit
}

Write-Host "✅ Contract compiled successfully" -ForegroundColor Green

# Deploy
Write-Host "`nStep 5: Deploying to Mumbai testnet..." -ForegroundColor Yellow
Write-Host "This will take 30-60 seconds...`n" -ForegroundColor Cyan

npx hardhat run scripts/deploy.js --network mumbai

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "   🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Your Municipal Fund Tracker is now on REAL blockchain!" -ForegroundColor Cyan
    Write-Host "Demo mode has been automatically disabled.`n" -ForegroundColor Cyan
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your frontend: cd frontend ; npm start" -ForegroundColor White
    Write-Host "2. Open: http://localhost:3000/contractor/signup" -ForegroundColor White
    Write-Host "3. Register a contractor - MetaMask will open!" -ForegroundColor White
    Write-Host "4. You'll get a REAL blockchain ID (1, 2, 3...)`n" -ForegroundColor White
    
} else {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Write-Host "`nCommon issues:" -ForegroundColor Yellow
    Write-Host "- Invalid private key in .env" -ForegroundColor White
    Write-Host "- Insufficient MATIC balance" -ForegroundColor White
    Write-Host "- Network connection issues`n" -ForegroundColor White
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
