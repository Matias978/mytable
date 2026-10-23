$dllPath = "C:\Program Files\Minitab\Minitab 22\Resources\1033\MtbResources.dll"

# Search for menu and command strings in MtbResources.dll or mtbgr.dll
$bytes = [System.IO.File]::ReadAllBytes($dllPath)
$text = [System.Text.Encoding]::Unicode.GetString($bytes)

# Let's search for statistical procedures
$terms = @("Descriptive Statistics", "One-Sample Z", "One-Sample t", "Two-Sample t", "Paired t", "One-Way ANOVA", "Two-Way ANOVA", "Regression", "Control Charts", "Capability Analysis", "Pareto", "Gage R&R", "Design of Experiments", "Time Series", "Quality Tools")

Write-Output "=== Statistical Features Found in MtbResources.dll ==="
foreach ($t in $terms) {
    $idx = $text.IndexOf($t)
    if ($idx -ge 0) {
        Write-Output ("  [FOUND] " + $t)
    } else {
        Write-Output ("  [NOT FOUND] " + $t)
    }
}
