@echo off
chcp 65001 >nul
echo Encerrando HomeFlix...
powershell -NoProfile -Command "$pids = (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($pids) { Stop-Process -Id $pids -Force -ErrorAction SilentlyContinue }; Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*HomeFlix*run.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo HomeFlix encerrado com sucesso.
timeout /t 2 >nul
