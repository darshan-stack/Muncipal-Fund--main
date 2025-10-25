@echo off
echo ========================================
echo RESTARTING FRONTEND WITH FIX
echo ========================================
echo.

echo Stopping any process on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Found process: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Starting frontend with updated configuration...
cd "c:\Users\SAKSHI SANJAY CHAVAN\Downloads\Muncipal-Fund--main\Muncipal-Fund--main\frontend"
start cmd /k "npm start"

echo.
echo ========================================
echo Frontend will open in new window!
echo Wait 10-15 seconds for compilation...
echo ========================================
echo.
echo Backend URL: http://localhost:5000
echo Frontend URL: http://localhost:3000
echo.
echo Now you can test CREATE PROJECT feature!
echo.
pause
