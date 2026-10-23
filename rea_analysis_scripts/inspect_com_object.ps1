try {
    $mtb = New-Object -ComObject "Mtb.Application" -ErrorAction Stop
    Write-Output "Successfully created Mtb.Application COM object!"
    Write-Output "`n=== Properties and Methods of Mtb.Application ==="
    $mtb | Get-Member | Select-Object -First 40 | ForEach-Object {
        Write-Output "  $($_.MemberType) $($_.Name)"
    }
    
    # Check ActiveProject
    if ($mtb.ActiveProject) {
        Write-Output "`n=== ActiveProject Properties & Methods ==="
        $mtb.ActiveProject | Get-Member | Select-Object -First 30 | ForEach-Object {
            Write-Output "  $($_.MemberType) $($_.Name)"
        }
    }
    
    # Don't leave instance open
    $mtb.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($mtb) | Out-Null
} catch {
    Write-Output "Error inspecting COM object: $_"
}
