@echo off
echo ================================================================
echo   MUNICIPAL FUND TRACKER - COMPLETE STARTUP
echo   With Anonymous Tender System + AI Verification
echo ================================================================
echo.

cd /d "%~dp0"

echo [Step 1/5] Checking dependencies...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found! Please install from https://nodejs.org/
    pause
    exit /b 1
)

where py >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found! Please install from https://python.org/
    pause
    exit /b 1
)

echo   - Node.js: OK
echo   - Python: OK
echo.

echo [Step 2/5] Installing dependencies...
echo   Installing Node.js packages...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo   Installing Python packages...
cd backend
py -m pip install flask flask-cors web3 python-dotenv
cd ..
echo.

echo [Step 3/5] Compiling smart contracts...
call npx hardhat compile
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Contract compilation failed!
    pause
    exit /b 1
)
echo.

echo [Step 4/5] Starting local blockchain...
echo   Starting Hardhat node in background...
start /B cmd /c "npx hardhat node > hardhat_node.log 2>&1"
timeout /t 10 /nobreak >nul
echo   Blockchain started!
echo.

echo [Step 5/5] Deploying contract...
call npx hardhat run scripts\deploy.js --network localhost
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Contract deployment failed!
    pause
    exit /b 1
)
echo.

echo ================================================================
echo   DEPLOYMENT COMPLETE!
echo ================================================================
echo.
echo   1. Blockchain: http://localhost:8545
echo   2. Backend API: Starting now...
echo   3. Frontend: Open http://localhost:3000
echo.
echo   DEMO ACCOUNTS (3 Login Types):
echo   - Admin: admin / admin123
echo   - Supervisor: supervisor / super123  
echo   - Citizen: citizen / citizen123
echo.
echo ================================================================
echo.

echo Starting backend server...
cd backend
start cmd /k "py server.py"
cd ..

timeout /t 3 /nobreak >nul

echo Starting frontend...
cd frontend
start cmd /k "npm start"
cd ..

echo.
echo ================================================================
echo   ALL SERVICES STARTED!
echo ================================================================
echo   Press any key to view logs...
pause >nul

type hardhat_node.log

pause
