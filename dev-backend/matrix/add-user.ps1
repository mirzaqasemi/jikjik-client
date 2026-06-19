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

$output = docker exec $Script:MatrixContainerName register_new_matrix_user `
    "http://localhost:8008" `
    -k $Script:MatrixRegistrationSecret `
    -u $Username `
    -p $Password `
    --exists-ok `
    $adminFlag

if ($output -match "User already exists\. Skipping\.") {
    Write-Host "User already exists: @$Username`:$Script:MatrixServerName"
} else {
    $output | ForEach-Object { Write-Host $_ }
    Write-Host "Registered @$Username`:$Script:MatrixServerName"
}
