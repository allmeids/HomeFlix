@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo   HomeFlix Tray — Instalar na Inicializacao do Windows
echo ============================================================
echo.

cd /d "%~dp0"

set "EXE_PATH=%~dp0dist\HomeFlix Tray.exe"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP%\HomeFlix Tray.lnk"

rem ── Verifica se o .exe existe ────────────────────────────────
if not exist "%EXE_PATH%" (
    echo ERRO: "%EXE_PATH%" nao encontrado.
    echo Execute build_tray.bat primeiro para gerar o executavel.
    echo.
    pause
    exit /b 1
)

rem ── Cria o atalho na pasta Startup via PowerShell ────────────
echo Criando atalho na inicializacao do Windows...
powershell -NoProfile -WindowStyle Hidden -Command ^
    "$ws = New-Object -ComObject WScript.Shell; ^
     $s = $ws.CreateShortcut('%SHORTCUT%'); ^
     $s.TargetPath = '%EXE_PATH%'; ^
     $s.WorkingDirectory = '%~dp0'; ^
     $s.Description = 'HomeFlix Tray — Controle do servidor de streaming'; ^
     $s.Save()"

if errorlevel 1 (
    echo ERRO: Falha ao criar atalho.
    pause
    exit /b 1
)

echo.
echo [OK] Atalho criado em:
echo   %SHORTCUT%
echo.
echo Iniciando o HomeFlix Tray agora...
start "" "%EXE_PATH%"

echo.
echo ============================================================
echo  Pronto! O icone do HomeFlix aparecera na gaveta (system
echo  tray) do Windows. Clique com botao direito para ligar,
echo  desligar ou abrir no navegador.
echo ============================================================
echo.
pause
