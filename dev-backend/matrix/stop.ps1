$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Require-Docker

if (Test-ContainerRunning) {
    docker stop $Script:MatrixContainerName
    Write-Host "Stopped $Script:MatrixContainerName."
} else {
    Write-Host "$Script:MatrixContainerName is not running."
}
