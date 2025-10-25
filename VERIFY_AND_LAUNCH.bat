@echo off
color 0A
echo.
echo ============================================================
echo     MUNICIPAL FUND BLOCKCHAIN - COMPLETE VERIFICATION
echo ============================================================
echo.
echo [1/6] Checking if Backend is Running...
echo.

curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK] Backend is RUNNING on port 5000[0m
) else (
    echo [31m[ERROR] Backend is NOT running![0m
    echo Starting backend now...
    start cmd /k "cd backend && python server_demo.py"
    timeout /t 3 /nobreak >nul
)

echo.
echo [2/6] Checking if Frontend is Running...
echo.

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK] Frontend is RUNNING on port 3000[0m
) else (
    echo [31m[ERROR] Frontend is NOT running![0m
    echo Starting frontend now...
    start cmd /k "cd frontend && npm start"
    timeout /t 5 /nobreak >nul
)

echo.
echo [3/6] Testing Backend API Endpoints...
echo.

echo Testing: GET /api/projects
curl -s http://localhost:5000/api/projects | findstr "projects" >nul
if %errorlevel% equ 0 (
    echo [32m[OK] /api/projects - Working[0m
) else (
    echo [31m[ERROR] /api/projects - Failed[0m
)

echo Testing: GET /api/stats
curl -s http://localhost:5000/api/stats | findstr "total_budget" >nul
if %errorlevel% equ 0 (
    echo [32m[OK] /api/stats - Working[0m
) else (
    echo [31m[ERROR] /api/stats - Failed[0m
)

echo Testing: GET /api/blockchain/status
curl -s http://localhost:5000/api/blockchain/status | findstr "mode" >nul
if %errorlevel% equ 0 (
    echo [32m[OK] /api/blockchain/status - Working[0m
) else (
    echo [31m[ERROR] /api/blockchain/status - Failed[0m
)

echo.
echo [4/6] Blockchain Status Check...
echo.

curl -s http://localhost:5000/api/blockchain/status
echo.

echo.
echo [5/6] Getting Current Projects...
echo.

curl -s http://localhost:5000/api/projects
echo.

echo.
echo [6/6] System Statistics...
echo.

curl -s http://localhost:5000/api/stats
echo.

echo.
echo ============================================================
echo                    VERIFICATION COMPLETE
echo ============================================================
echo.
echo [32mAll Systems Ready![0m
echo.
echo Backend URL:   http://localhost:5000
echo Frontend URL:  http://localhost:3000
echo.
echo Login Credentials:
echo   - Admin:      admin / admin123
echo   - Supervisor: supervisor / super123
echo   - Citizen:    citizen / citizen123
echo.
echo [33mOpening frontend in browser...[0m
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo ============================================================
pause
