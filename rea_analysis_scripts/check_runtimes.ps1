Write-Output ("Node: " + (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source))
Write-Output ("npm: " + (Get-Command npm -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source))
Write-Output ("Python: " + (Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source))
Write-Output ("dotnet: " + (Get-Command dotnet -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source))
if (Get-Command node -ErrorAction SilentlyContinue) { node -v }
if (Get-Command npm -ErrorAction SilentlyContinue) { npm -v }
if (Get-Command python -ErrorAction SilentlyContinue) { python --version }
if (Get-Command dotnet -ErrorAction SilentlyContinue) { dotnet --version }
