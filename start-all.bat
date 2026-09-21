@echo off
rem Campus Knowledge Base - Local dev launcher (ASCII only to avoid encoding issues)
rem Starts: MySQL(service) + Chroma(8000) + Embedding(9997) + Backend(8080) + Frontend(5174)
cd /d "%~dp0"

echo ==============================================
echo   Campus Knowledge Base - Local Launcher
echo ==============================================
echo.

rem ---------- 1. Load secrets from .env ----------
if not exist ".env" (
  echo [ERROR] .env not found. Create it first.
  pause
  exit /b 1
)
for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do set "%%a=%%b"

rem Map backend env vars
set "DB_USERNAME=root"
set "DB_PASSWORD=%MYSQL_ROOT_PASSWORD%"
set "EMBEDDING_URL=http://localhost:9997/v1/embeddings"
set "CHROMA_URL=http://localhost:8000"

rem ---------- 2. Ensure MySQL service is running ----------
echo [1/4] MySQL ...
sc query MySQL80 | find /i "RUNNING" >nul
if errorlevel 1 (
  net start MySQL80 >nul 2>&1
  echo   MySQL80 started
) else (
  echo   MySQL80 already running
)

rem ---------- 3. Start Chroma vector store ----------
echo [2/4] Chroma vector store :8000
start "Chroma" cmd /k "chroma run --path chroma-data"

rem ---------- 4. Start Embedding service ----------
echo [3/4] Embedding BGE-M3 :9997
start "Embedding" cmd /k "python embedding_server.py"

rem ---------- 5. Start backend and frontend ----------
echo [4/4] Backend :8080 and Frontend :5174
start "Backend" cmd /k "mvn -q -f backend\pom.xml spring-boot:run"
start "Frontend" cmd /k "cd /d frontend-react && npm run dev"

echo.
echo ==============================================
echo   All services launched in separate windows.
echo     Frontend  : http://localhost:5174
echo     Backend   : http://localhost:8080
echo     Chroma    : http://localhost:8000
echo     Embedding : http://localhost:9997
echo.
echo   MySQL runs as Windows service (MySQL80).
echo ==============================================
echo.
pause