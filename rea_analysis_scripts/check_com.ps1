$keys = Get-ChildItem -Path "HKLM:\SOFTWARE\Classes" -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -like "*Mtb*" -or $_.PSChildName -like "*Minitab*" }
Write-Output "Found registered classes in HKLM\SOFTWARE\Classes:"
foreach ($k in $keys) {
    Write-Output "  $($k.PSChildName)"
}
