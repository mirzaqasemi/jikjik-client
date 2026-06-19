param(
    [Parameter(Mandatory = $true)]
    [string]$Username,

    [Parameter(Mandatory = $true)]
    [string]$Password,

    [switch]$Admin
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Require-Docker
Assert-ConfigExists

if (-not (Test-ContainerRunning)) {
    throw "$Script:MatrixContainerName is not running. Start it first with dev-backend/matrix/start.ps1"
}

$adminFlag = if ($Admin) { "--admin" } else { "--no-admin" }

docker exec $Script:MatrixContainerName register_new_matrix_user `
    "http://localhost:8008" `
    -c /data/homeserver.yaml `
    -u $Username `
    -p $Password `
    $adminFlag

Write-Host "Registered @$Username`:$Script:MatrixServerName"
