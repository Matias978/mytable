Add-Type -AssemblyName System.IO.Compression.FileSystem

$minitabDir = "C:\Program Files\Minitab\Minitab 22"
$zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $minitabDir "Dialogs.data"))

# Let's search inside the main JS bundle or chunk files for registered dialog names/IDs
$mainJsEntry = $zip.GetEntry("static/js/main.f0d4c589.js")
if ($mainJsEntry) {
    Write-Output "main.js size: $([math]::Round($mainJsEntry.Length/1MB, 2)) MB"
    $stream = $mainJsEntry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    $stream.Dispose()
    
    # Let's look for command names or dialog registrations
    # Commonly: "Describe", "OneSampleZ", "TwoSampleT", "ANOVA", "Regression", "ControlChart", etc.
    $regexMatches = [regex]::Matches($text, '(\b[A-Za-z0-9_]{3,30}Dialog\b|\b[A-Za-z0-9_]{3,30}Test\b)')
    $uniqueDialogs = $regexMatches | ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 40
    Write-Output "`nDetected Dialog / Test identifiers in main.js:"
    $uniqueDialogs | ForEach-Object { Write-Output "  $_" }
}

$zip.Dispose()
