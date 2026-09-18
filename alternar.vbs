Option Explicit
Dim WshShell, fso, scriptDir, http, isRunning, cmd, i

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Checar se está rodando
isRunning = False
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 500, 500, 500, 500
http.open "GET", "http://127.0.0.1:8080/api/health", False
http.send
If Err.Number = 0 And http.status = 200 Then
    isRunning = True
End If
On Error GoTo 0

If isRunning Then
    ' ESTÁ LIGADO -> DESLIGAR
    cmd = "powershell -NoProfile -WindowStyle Hidden -Command """ & _
          "$pids = (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique);" & _
          "if ($pids) { Stop-Process -Id $pids -Force -ErrorAction SilentlyContinue };" & _
          "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*HomeFlix*run.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"""
    WshShell.Run cmd, 0, True
    WshShell.Popup "⏹ HomeFlix foi DESLIGADO.", 2, "HomeFlix", 64
Else
    ' ESTÁ DESLIGADO -> LIGAR OCULTO
    WshShell.Run """" & scriptDir & "\start.bat""", 0, False
    
    For i = 1 To 14
        WScript.Sleep 500
        On Error Resume Next
        Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
        http.setTimeouts 500, 500, 500, 500
        http.open "GET", "http://127.0.0.1:8080/api/health", False
        http.send
        If Err.Number = 0 And http.status = 200 Then
            Exit For
        End If
        On Error GoTo 0
    Next
    
    WshShell.Popup "🎬 HomeFlix foi LIGADO!" & vbCrLf & "📡 Acesso: http://localhost:8080", 2, "HomeFlix", 64
End If
