@echo off
setlocal
cd /d "%~dp0"
title Smart Store - Local Website

echo ========================================
echo        SMART STORE - LOCAL WEBSITE
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Please install Node.js LTS from https://nodejs.org/
  echo Then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First launch: installing project dependencies...
  echo This may take a few minutes.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting Smart Store...
echo Your browser will open automatically.
echo Keep this window open while using the website.
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173/"
call npm run dev -- --host 127.0.0.1

endlocal
