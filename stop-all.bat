@echo off
rem Campus Knowledge Base - Stop all app services (ASCII only to avoid encoding issues)
cd /d "%~dp0"

echo ==============================================
echo   Campus Knowledge Base - Stop All
echo ==============================================
echo.

echo [1/4] Frontend  :5173
for /f "tokens=5" %%A in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":5173"') do taskkill /F /PID %%A >nul 2>&1

echo [2/4] Backend   :8080
for /f "tokens=5" %%A in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":8080"') do taskkill /F /PID %%A >nul 2>&1

echo [3/4] Chroma    :8000
for /f "tokens=5" %%A in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":8000"') do taskkill /F /PID %%A >nul 2>&1

echo [4/4] Embedding :9997
for /f "tokens=5" %%A in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":9997"') do taskkill /F /PID %%A >nul 2>&1

echo.
echo   All app services stopped.
echo   MySQL80 system service is left running.
echo ==============================================
echo.
pause