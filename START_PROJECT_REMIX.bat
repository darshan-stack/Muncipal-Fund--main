@echo off
echo ========================================
echo Municipal Fund Blockchain System
echo Quick Start (Remix IDE Method)
echo ========================================
echo.

echo [STEP 1] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)
echo ✓ Python found

echo.
echo [STEP 2] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)
echo ✓ Node.js found

echo.
echo [STEP 3] Installing Python dependencies...
cd backend
pip install flask flask-cors web3 python-dotenv
cd ..

echo.
echo [STEP 4] Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ========================================
echo DEPLOYMENT INSTRUCTIONS:
echo ========================================
echo.
echo Since Hardhat has installation issues, follow these steps:
echo.
echo 1. Open browser: https://remix.ethereum.org
echo 2. Upload contract from: contracts\FundTracker.sol
echo 3. Compile with Solidity 0.8.20
echo 4. Deploy to Remix VM or Polygon Mainnet
echo 5. Copy the deployed contract address
echo 6. Save the ABI to frontend\contractABI.json
echo 7. Update backend\.env with CONTRACT_ADDRESS
echo 8. Run this script again to start servers
echo.
echo Full guide: See REMIX_DEPLOYMENT_GUIDE.md
echo.
pause

echo.
echo ========================================
echo Do you have the contract address? (y/n)
echo ========================================
set /p DEPLOYED=Enter y if contract is deployed: 

if /i "%DEPLOYED%"=="y" (
    echo.
    echo [STEP 5] Starting Backend Server...
    cd backend
    start cmd /k "python server.py"
    cd ..
    
    echo.
    echo [STEP 6] Starting Frontend...
    cd frontend
    start cmd /k "npm start"
    cd ..
    
    echo.
    echo ========================================
    echo ✓ ALL SERVICES STARTED!
    echo ========================================
    echo.
    echo Backend: http://localhost:5000
    echo Frontend: http://localhost:3000
    echo.
    echo Login Credentials:
    echo   Admin:      admin / admin123
    echo   Supervisor: supervisor / super123
    echo   Citizen:    citizen / citizen123
    echo.
    echo ⚠️ SECURITY WARNING:
    echo Your MetaMask private key was shared publicly!
    echo Transfer funds to new wallet IMMEDIATELY!
    echo.
) else (
    echo.
    echo Please deploy the contract first using Remix IDE
    echo See REMIX_DEPLOYMENT_GUIDE.md for instructions
    echo.
)

pause
