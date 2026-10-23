try {
    $mtb = New-Object -ComObject "Mtb.Application" -ErrorAction Stop
    $proj = $mtb.ActiveProject
    
    # Execute a simple set of commands
    Write-Output "Executing: Set C1 10 20 25 30 40 50 End"
    $proj.ExecuteCommand("Set C1`n10 20 25 30 40 50`nEnd.")
    
    Write-Output "Executing: Describe C1."
    $proj.ExecuteCommand("Describe C1.")
    
    Write-Output "Commands in project: $($proj.Commands.Count)"
    foreach ($cmd in $proj.Commands) {
        Write-Output "--- Command: $($cmd.Command) ---"
        Write-Output "Outputs count: $($cmd.Outputs.Count)"
        foreach ($out in $cmd.Outputs) {
            Write-Output "  OutputType: $($out.OutputType)"
            if ($out.OutputType -eq 1 -or $out.OutputType -eq "Text" -or $out.Text) {
                Write-Output "  Text:`n$($out.Text)"
            }
        }
    }
    
    $mtb.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($mtb) | Out-Null
} catch {
    Write-Output "Error: $_"
}
