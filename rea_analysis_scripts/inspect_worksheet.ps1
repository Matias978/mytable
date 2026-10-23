try {
    $mtb = New-Object -ComObject "Mtb.Application" -ErrorAction Stop
    $proj = $mtb.ActiveProject
    $ws = $proj.ActiveWorksheet
    
    Write-Output "=== ActiveWorksheet Properties & Methods ==="
    $ws | Get-Member | Select-Object -First 35 | ForEach-Object {
        Write-Output "  $($_.MemberType) $($_.Name)"
    }
    
    Write-Output "`n=== Columns Collection Properties & Methods ==="
    $ws.Columns | Get-Member | Select-Object -First 25 | ForEach-Object {
        Write-Output "  $($_.MemberType) $($_.Name)"
    }
    
    # Check a single column if available
    if ($ws.Columns.Count -gt 0) {
        Write-Output "`n=== Column Object Properties & Methods ==="
        $ws.Columns.Item(1) | Get-Member | Select-Object -First 30 | ForEach-Object {
            Write-Output "  $($_.MemberType) $($_.Name)"
        }
    }

    $mtb.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($mtb) | Out-Null
} catch {
    Write-Output "Error: $_"
}
