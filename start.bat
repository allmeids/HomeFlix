@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ==========================================================
echo  HomeFlix - Servidor de Streaming Pessoal ^& TV ao Vivo
echo ==========================================================
echo  Local:            http://localhost:8080

rem Obter IP local da máquina
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i /c:"IPv4" ^| findstr /v /c:"127.0.0.1"') do (
    set "LOCAL_IP=%%a"
    goto ip_found
)
:ip_found
if defined LOCAL_IP (
    set "LOCAL_IP=!LOCAL_IP: =!"
    echo  Smart TV / Rede:  http://!LOCAL_IP!:8080
)
echo ==========================================================

rem Detectar executavel Python (venv local ou do sistema)
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
) else if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0backend\.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

cd backend
"%PYTHON_EXE%" run.py
if errorlevel 1 (
    echo.
    echo Ocorreu um erro ao executar o HomeFlix.
    pause
)
