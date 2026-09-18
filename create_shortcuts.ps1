$desktop = [Environment]::GetFolderPath('Desktop')
$projDir = "C:\Users\Allme\OneDrive\Documentos\Projetos\HomeFlix"
$wsh = New-Object -ComObject WScript.Shell

# 1. Ligar HomeFlix
$s1 = $wsh.CreateShortcut("$desktop\Ligar HomeFlix.lnk")
$s1.TargetPath = "wscript.exe"
$s1.Arguments = "`"$projDir\ligar.vbs`""
$s1.WorkingDirectory = $projDir
$s1.Description = "Ligar o servidor HomeFlix em segundo plano"
$s1.IconLocation = "shell32.dll, 137"
$s1.Save()

# 2. Desligar HomeFlix
$s2 = $wsh.CreateShortcut("$desktop\Desligar HomeFlix.lnk")
$s2.TargetPath = "wscript.exe"
$s2.Arguments = "`"$projDir\desligar.vbs`""
$s2.WorkingDirectory = $projDir
$s2.Description = "Desligar o servidor HomeFlix"
$s2.IconLocation = "shell32.dll, 131"
$s2.Save()

# 3. Alternar HomeFlix (On-Off)
$s3 = $wsh.CreateShortcut("$desktop\Alternar HomeFlix (On-Off).lnk")
$s3.TargetPath = "wscript.exe"
$s3.Arguments = "`"$projDir\alternar.vbs`""
$s3.WorkingDirectory = $projDir
$s3.Description = "Alternar ligar/desligar o HomeFlix em 1 clique"
$s3.IconLocation = "shell32.dll, 238"
$s3.Save()

Write-Host "Atalhos criados com sucesso na Área de Trabalho!"
