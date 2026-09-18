Option Explicit
Dim WshShell, fso, scriptDir, http, isRunning, i

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Checar se já está rodando
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
    WshShell.Run "http://localhost:8080"
    WshShell.Popup "🎬 HomeFlix já está em execução!" & vbCrLf & "Abrindo no navegador...", 2, "HomeFlix", 64
Else
    ' 0 = Oculta totalmente o terminal
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
    
    WshShell.Popup "🎬 HomeFlix Ligado com sucesso!" & vbCrLf & "📡 Acesso: http://localhost:8080", 2, "HomeFlix", 64
End If
