$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Require-Docker
Assert-ConfigExists

if (Test-ContainerRunning) {
    Write-Host "$Script:MatrixContainerName is already running."
    exit 0
}

if (Test-ContainerExists) {
    Write-Host "Starting existing $Script:MatrixContainerName..."
    docker start $Script:MatrixContainerName
} else {
    Write-Host "Creating and starting $Script:MatrixContainerName..."
    docker run -d --name $Script:MatrixContainerName `
        --mount "type=bind,src=$Script:MatrixDataDir,dst=/data" `
        -p "$Script:MatrixPort`:8008" `
        $Script:MatrixImage
}

Write-Host "Synapse is starting at $Script:MatrixBaseUrl"
Write-Host "Check status with: dev-backend/matrix/status.ps1"
