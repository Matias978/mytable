Add-Type -AssemblyName System.IO.Compression.FileSystem

$minitabDir = "C:\Program Files\Minitab\Minitab 22"
$zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $minitabDir "Dialogs.data"))

# Let's check some chunks for dialog titles or command keywords
$chunks = $zip.Entries | Where-Object { $_.FullName -like "static/js/*.chunk.js" -and $_.Length -gt 10KB }

Write-Output "Scanning $($chunks.Count) chunks for dialog keywords..."
foreach ($c in $chunks) {
    $stream = $c.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    $stream.Dispose()
    
    # Match title, dialogName, or command template
    $matches = [regex]::Matches($text, '(?i)(?:dialogName|dialogId|commandName|title|commandTemplate)["'':\s]+([A-Za-z0-9_ -]{3,35})')
    if ($matches.Count -gt 0) {
        $found = ($matches | Select-Object -First 5 | ForEach-Object { $_.Groups[1].Value.Trim() }) -join ", "
        Write-Output "[$($c.Name)] -> $found"
    }
}

$zip.Dispose()
