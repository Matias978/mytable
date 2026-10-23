$minitabDir = "C:\Program Files\Minitab\Minitab 22"

Write-Output "=== 1. Checking Minitab executables and DLLs ==="
Get-ChildItem -Path $minitabDir -Filter "*.exe" | ForEach-Object {
    $ver = (Get-Item $_.FullName).VersionInfo
    [PSCustomObject]@{
        Name = $_.Name
        SizeMB = [math]::Round($_.Length / 1MB, 2)
        ProductVersion = $ver.ProductVersion
        Description = $ver.FileDescription
    }
} | Format-Table -AutoSize

Write-Output "`n=== 2. Checking Dialogs and Data Files ==="
Get-ChildItem -Path $minitabDir -Filter "*.data" | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $magic = -join ($bytes[0..3] | ForEach-Object { '{0:X2}' -f $_ })
    $ascii = -join ($bytes[0..15] | ForEach-Object { if ($_ -ge 32 -and $_ -le 126) { [char]$_ } else { '.' } })
    [PSCustomObject]@{
        Name = $_.Name
        SizeMB = [math]::Round($_.Length / 1MB, 2)
        MagicHex = $magic
        SampleAscii = $ascii
    }
} | Format-Table -AutoSize

Write-Output "`n=== 3. Inspecting mtb.dlg in Resources ==="
$dlgPath = Join-Path $minitabDir "Resources\1033\mtb.dlg"
if (Test-Path $dlgPath) {
    $bytes = [System.IO.File]::ReadAllBytes($dlgPath)
    $text = [System.Text.Encoding]::ASCII.GetString($bytes[0..[Math]::Min(1000, $bytes.Length-1)])
    Write-Output "mtb.dlg first 1000 chars:"
    Write-Output $text
}
