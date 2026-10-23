Add-Type -AssemblyName System.IO.Compression.FileSystem

$minitabDir = "C:\Program Files\Minitab\Minitab 22"
$dialogsZip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $minitabDir "Dialogs.data"))

# Read index.html or manifest
$manifestEntry = $dialogsZip.GetEntry("asset-manifest.json")
if ($manifestEntry) {
    $stream = $manifestEntry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $manifestJson = $reader.ReadToEnd() | ConvertFrom-Json
    $stream.Dispose()
    
    Write-Output "=== Dialogs Asset Manifest Entrypoints ==="
    $manifestJson.entrypoints | ForEach-Object { Write-Output "  $_" }
}

# Find all files with "dialog" or json in name
Write-Output "`n=== JSON & Configuration files in Dialogs.data ==="
$dialogsZip.Entries | Where-Object { $_.Name -like "*.json" -or $_.FullName -like "*locale*" } | Select-Object -First 40 | ForEach-Object {
    Write-Output "  $($_.FullName) ($([math]::Round($_.Length/1KB, 1)) KB)"
}

$dialogsZip.Dispose()
