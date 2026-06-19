$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Require-Docker

Write-Host "This will delete the local Matrix container and all data under:"
Write-Host $Script:MatrixDataDir
Write-Host ""

$confirmation = Read-Host "Type DELETE LOCAL MATRIX to continue"

if ($confirmation -ne "DELETE LOCAL MATRIX") {
    Write-Host "Reset cancelled."
    exit 0
}

if (Test-ContainerExists) {
    docker rm -f $Script:MatrixContainerName
}

if (Test-Path $Script:MatrixDataDir) {
    Remove-Item -Recurse -Force $Script:MatrixDataDir
}

Write-Host "Local Matrix backend reset."
