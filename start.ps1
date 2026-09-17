$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# Identificar IP local
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress
if (-not $localIp) {
    $localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🎬 HomeFlix — Servidor de Streaming Pessoal & TV ao Vivo" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "📡 Acessar localmente:       http://localhost:8080" -ForegroundColor Green
if ($localIp) {
    Write-Host "🌐 Acessar na Smart TV/Rede: http://${localIp}:8080" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Cyan

$pythonExe = "python"
if (Test-Path "$rootDir\.venv\Scripts\python.exe") {
    $pythonExe = "$rootDir\.venv\Scripts\python.exe"
} elseif (Test-Path "$rootDir\backend\.venv\Scripts\python.exe") {
    $pythonExe = "$rootDir\backend\.venv\Scripts\python.exe"
}

Set-Location "$rootDir\backend"
& $pythonExe run.py
