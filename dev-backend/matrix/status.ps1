$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Require-Docker

if (Test-ContainerRunning) {
    Write-Host "$Script:MatrixContainerName is running."
    docker ps --filter "name=$Script:MatrixContainerName"
    Write-Host ""
    Write-Host "Client API:"
    try {
        Invoke-RestMethod -Uri "$Script:MatrixBaseUrl/_matrix/client/versions" | ConvertTo-Json -Depth 10
    } catch {
        Write-Host $_.Exception.Message
    }
} else {
    Write-Host "$Script:MatrixContainerName is not running."
    if (Test-ContainerExists) {
        Write-Host "Container exists and can be started."
    } else {
        Write-Host "Container has not been created yet."
    }
}
