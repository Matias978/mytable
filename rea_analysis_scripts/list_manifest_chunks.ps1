Add-Type -AssemblyName System.IO.Compression.FileSystem

$minitabDir = "C:\Program Files\Minitab\Minitab 22"
$zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $minitabDir "Dialogs.data"))

# Let's inspect the asset-manifest.json to see all chunk files and keys
$manifest = $zip.GetEntry("asset-manifest.json")
$stream = $manifest.Open()
$reader = New-Object System.IO.StreamReader($stream)
$json = $reader.ReadToEnd() | ConvertFrom-Json
$stream.Dispose()
$zip.Dispose()

Write-Output "Total files in manifest: $(($json.files | Get-Member -MemberType NoteProperty).Count)"
# Let's list some key chunk mappings
$propNames = ($json.files | Get-Member -MemberType NoteProperty).Name
$dialogProps = $propNames | Where-Object { $_ -match "chunk\.js$" }
Write-Output "Total chunk.js entries: $($dialogProps.Count)"
$dialogProps | Select-Object -First 30 | ForEach-Object {
    Write-Output "  $_  ->  $($json.files.$_)"
}
