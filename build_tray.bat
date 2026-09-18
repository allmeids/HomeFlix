@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo   HomeFlix Tray — Build para Windows (.exe)
echo ============================================================
echo.

cd /d "%~dp0"

rem ── Detectar Python ─────────────────────────────────────────
if exist ".venv\Scripts\python.exe" (
    set "PYTHON=.venv\Scripts\python.exe"
    set "PIP=.venv\Scripts\pip.exe"
) else if exist "backend\.venv\Scripts\python.exe" (
    set "PYTHON=backend\.venv\Scripts\python.exe"
    set "PIP=backend\.venv\Scripts\pip.exe"
) else (
    set "PYTHON=python"
    set "PIP=pip"
)

echo [1/3] Instalando dependencias do tray (pystray, pillow, pyinstaller)...
"%PIP%" install --quiet pystray pillow requests pyinstaller
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias.
    pause
    exit /b 1
)

echo.
echo [2/3] Empacotando tray.py como .exe (sem janela, arquivo unico)...
"%PYTHON%" -m PyInstaller ^
    --onefile ^
    --windowed ^
    --noconsole ^
    --name "HomeFlix Tray" ^
    --distpath "%~dp0dist" ^
    --workpath "%~dp0build_tmp" ^
    --specpath "%~dp0build_tmp" ^
    tray.py

if errorlevel 1 (
    echo ERRO: Falha no build do PyInstaller.
    pause
    exit /b 1
)

rem ── Limpar arquivos temporários de build ─────────────────────
if exist "build_tmp" rd /s /q "build_tmp"

echo.
echo [3/3] Build concluido!
echo.
echo   Executavel: %~dp0dist\HomeFlix Tray.exe
echo.
echo ============================================================
echo  PROXIMO PASSO:
echo  Execute "install_tray.bat" para adicionar o tray a
echo  inicializacao automatica do Windows.
echo ============================================================
echo.
pause
