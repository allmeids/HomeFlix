$rootDir = "C:\Users\Allme\OneDrive\Documentos\Projetos\HomeFlix"
$python = "$rootDir\.venv\Scripts\python.exe"

# Verificar se já está rodando
$conn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Start-Process "http://localhost:8080"
    (New-Object -ComObject Wscript.Shell).Popup("🎬 HomeFlix já está rodando!`nAbrindo no navegador...", 2, "HomeFlix", 64) | Out-Null
    exit
}

# Iniciar em background sem janela (WindowStyle Hidden)
Start-Process -FilePath $python -ArgumentList "run.py" -WorkingDirectory "$rootDir\backend" -WindowStyle Hidden

# Aguardar subida da API
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Milliseconds 400
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($r.status -eq "ok") { break }
    } catch {}
}

(New-Object -ComObject Wscript.Shell).Popup("🎬 HomeFlix LIGADO com sucesso!`n📡 http://localhost:8080", 2, "HomeFlix", 64) | Out-Null
