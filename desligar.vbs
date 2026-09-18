Option Explicit
Dim WshShell, fso, scriptDir, cmd

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

cmd = "powershell -NoProfile -WindowStyle Hidden -Command """ & _
      "$pids = (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique);" & _
      "if ($pids) { Stop-Process -Id $pids -Force -ErrorAction SilentlyContinue };" & _
      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*HomeFlix*run.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"""

WshShell.Run cmd, 0, True
WshShell.Popup "⏹ HomeFlix foi DESLIGADO com sucesso.", 2, "HomeFlix", 64
