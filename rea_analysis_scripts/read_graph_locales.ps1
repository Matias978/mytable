Add-Type -AssemblyName System.IO.Compression.FileSystem

$minitabDir = "C:\Program Files\Minitab\Minitab 22"
$graphsZip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $minitabDir "mss-graphs.data"))
$enFiles = $graphsZip.Entries | Where-Object { $_.FullName -like "locales/en/*.json" }

Write-Output "Found $($enFiles.Count) English locale files in mss-graphs.data:"
foreach ($f in $enFiles) {
    $stream = $f.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $json = $reader.ReadToEnd()
    $stream.Dispose()
    Write-Output "=== $($f.Name) ==="
    Write-Output $json
}

$graphsZip.Dispose()
