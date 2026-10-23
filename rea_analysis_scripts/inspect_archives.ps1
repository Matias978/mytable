Add-Type -AssemblyName System.IO.Compression.FileSystem

$minitabDir = "C:\Program Files\Minitab\Minitab 22"
$dataFiles = @("Dialogs.data", "mss-graphs.data", "minitab-treeviewer.data", "mss-graph-editing.data")

foreach ($df in $dataFiles) {
    $fullPath = Join-Path $minitabDir $df
    Write-Output "=================================================="
    Write-Output "ARCHIVE: $df"
    Write-Output "=================================================="
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($fullPath)
        Write-Output "Total entries: $($zip.Entries.Count)"
        $zip.Entries | Select-Object -First 35 | ForEach-Object {
            Write-Output ("  {0,8} KB  {1}" -f [math]::Round($_.Length / 1KB, 1), $_.FullName)
        }
        $zip.Dispose()
    } catch {
        Write-Output "Error reading $($df): $_"
    }
}
