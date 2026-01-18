@echo off
REM JTTB Development Server (Windows)
REM Runs frontend and backend concurrently

echo ========================================
echo   JTTB Dev Server
echo ========================================

REM Set environment variables for backend
set JTTB_JWT_SECRET=dev-secret-key
set JTTB_USER=admin
set JTTB_PASSWORD=admin

echo.
echo [Backend] Starting on http://localhost:3000
start "JTTB Backend" cmd /c "cd /d %~dp0jttb-back && npm start"

echo [Frontend] Starting on http://localhost:4200
start "JTTB Frontend" cmd /c "cd /d %~dp0jttb-front && npm start"

echo.
echo ========================================
echo   Frontend: http://localhost:4200
echo   Backend:  http://localhost:3000
echo   User: admin / Password: admin
echo ========================================
echo.
echo Close the terminal windows to stop servers
pause
