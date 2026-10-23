Add-Type -AssemblyName System.IO.Compression.FileSystem

$minitabDir = "C:\Program Files\Minitab\Minitab 22"
$zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $minitabDir "Dialogs.data"))

$mapEntry = $zip.GetEntry("static/js/23878.29ab1fdf.chunk.js.map")
if ($mapEntry) {
    $stream = $mapEntry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    # Read first 50KB to get sources array
    $buf = New-Object char[] 65536
    $charsRead = $reader.Read($buf, 0, 65536)
    $text = New-Object string ($buf, 0, $charsRead)
    $stream.Dispose()
    
    # Extract "sources":[...]
    if ($text -match '"sources":\s*\[(.*?)\]') {
        $sourcesStr = $matches[1]
        Write-Output "Found sources in map:"
        $sourcesStr -split "," | Select-Object -First 25 | ForEach-Object { Write-Output "  $_" }
    } else {
        Write-Output "No sources match found in first 64KB, printing sample:"
        Write-Output $text.Substring(0, [Math]::Min(1000, $text.Length))
    }
} else {
    Write-Output "Map entry not found"
}

$zip.Dispose()
