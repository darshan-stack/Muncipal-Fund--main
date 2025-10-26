# Quick Installation Script for Municipal Fund Blockchain System
# Run this after cloning the repository

Write-Host "🚀 Starting Municipal Fund Blockchain System Setup..." -ForegroundColor Cyan
Write-Host "=" * 60

# Step 1: Install Node dependencies
Write-Host "`n📦 Step 1/6: Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red; exit 1 }
Write-Host "✅ Root dependencies installed" -ForegroundColor Green

# Step 2: Install backend dependencies
Write-Host "`n📦 Step 2/6: Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red; exit 1 }
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Step 3: Install AI dependencies
Write-Host "`n🤖 Step 3/6: Installing AI service dependencies..." -ForegroundColor Yellow
pip install -r requirements-ai.txt
if ($LASTEXITCODE -ne 0) { Write-Host "⚠️  AI dependencies failed (optional)" -ForegroundColor Yellow }
else { Write-Host "✅ AI dependencies installed" -ForegroundColor Green }

# Step 4: Install frontend dependencies
Write-Host "`n⚛️  Step 4/6: Installing frontend dependencies..." -ForegroundColor Yellow
cd ../frontend
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red; exit 1 }
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Step 5: Create environment files
Write-Host "`n⚙️  Step 5/6: Setting up environment files..." -ForegroundColor Yellow
cd ../backend
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ Created backend/.env (please edit with your keys)" -ForegroundColor Green
} else {
    Write-Host "⚠️  backend/.env already exists" -ForegroundColor Yellow
}

cd ../frontend
if (!(Test-Path .env)) {
    @"
REACT_APP_CONTRACT_ADDRESS=
REACT_APP_NETWORK=mumbai
REACT_APP_BACKEND_URL=http://localhost:5001
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ Created frontend/.env" -ForegroundColor Green
} else {
    Write-Host "⚠️  frontend/.env already exists" -ForegroundColor Yellow
}

cd ..
if (!(Test-Path .env)) {
    @"
PRIVATE_KEY=
ORACLE_ADDRESS=
POLYGONSCAN_API_KEY=
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ Created root/.env (please edit with your keys)" -ForegroundColor Green
} else {
    Write-Host "⚠️  root/.env already exists" -ForegroundColor Yellow
}

# Step 6: Compile smart contracts
Write-Host "`n🔨 Step 6/6: Compiling smart contracts..." -ForegroundColor Yellow
npx hardhat compile
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to compile contracts" -ForegroundColor Red; exit 1 }
Write-Host "✅ Smart contracts compiled" -ForegroundColor Green

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Setup PostgreSQL database:" -ForegroundColor White
Write-Host "   createdb municipal_fund" -ForegroundColor Gray
Write-Host "   psql municipal_fund < database/schema.sql" -ForegroundColor Gray

Write-Host "`n2. Edit environment files with your credentials:" -ForegroundColor White
Write-Host "   - backend/.env (DB credentials, Pinata keys)" -ForegroundColor Gray
Write-Host "   - .env (Wallet private key)" -ForegroundColor Gray

Write-Host "`n3. Get testnet MATIC from faucet:" -ForegroundColor White
Write-Host "   https://faucet.polygon.technology/" -ForegroundColor Gray

Write-Host "`n4. Deploy smart contract:" -ForegroundColor White
Write-Host "   npx hardhat run scripts/deploy.js --network mumbai" -ForegroundColor Gray

Write-Host "`n5. Start all services:" -ForegroundColor White
Write-Host "   Terminal 1: cd backend && npm start" -ForegroundColor Gray
Write-Host "   Terminal 2: cd backend && python qualityVerificationAI.py" -ForegroundColor Gray
Write-Host "   Terminal 3: cd frontend && npm start" -ForegroundColor Gray

Write-Host "`n6. Access the application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Citizen Portal: http://localhost:3000/citizen_view.html" -ForegroundColor Gray
Write-Host "   Oracle API: http://localhost:5001" -ForegroundColor Gray
Write-Host "   AI Service: http://localhost:5002" -ForegroundColor Gray

Write-Host "`n📖 For detailed instructions, see:" -ForegroundColor Yellow
Write-Host "   - COMPLETE_SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host "   - IMPLEMENTATION_SUMMARY.md" -ForegroundColor Gray

Write-Host "`n🎉 Happy coding!" -ForegroundColor Cyan
