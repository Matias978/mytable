Add-Type -AssemblyName System.IO.Compression.FileSystem

$minitabDir = "C:\Program Files\Minitab\Minitab 22"
$zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $minitabDir "Dialogs.data"))
$maps = @($zip.Entries | Where-Object { $_.Name -like "*.js.map" })
Write-Output "Total js.map files in Dialogs.data: $($maps.Count)"
$maps | Select-Object -First 15 | ForEach-Object {
    Write-Output "  $($_.FullName) ($([math]::Round($_.Length/1KB, 1)) KB)"
}

# Also inspect mss-graphs.data
$graphsZip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $minitabDir "mss-graphs.data"))
Write-Output "`nTotal entries in mss-graphs.data: $($graphsZip.Entries.Count)"
$graphsZip.Entries | Select-Object -First 25 | ForEach-Object {
    Write-Output "  $($_.FullName) ($([math]::Round($_.Length/1KB, 1)) KB)"
}

$zip.Dispose()
$graphsZip.Dispose()
