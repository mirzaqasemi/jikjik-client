$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Require-Docker

New-Item -ItemType Directory -Force -Path $Script:MatrixDataDir | Out-Null

Write-Host "Pulling $Script:MatrixImage..."
docker pull $Script:MatrixImage

if (-not (Test-Path $Script:MatrixConfigFile)) {
    Write-Host "Generating Synapse config in $Script:MatrixDataDir..."
    docker run --rm `
        --mount "type=bind,src=$Script:MatrixDataDir,dst=/data" `
        -e "SYNAPSE_SERVER_NAME=$Script:MatrixServerName" `
        -e "SYNAPSE_REPORT_STATS=no" `
        $Script:MatrixImage generate
} else {
    Write-Host "Synapse config already exists at $Script:MatrixConfigFile"
}

& "$PSScriptRoot/set-config.ps1" dev

$envLocal = Join-Path $Script:RepoRoot ".env.local"
if (-not (Test-Path $envLocal)) {
    Write-Utf8NoBom -Path $envLocal -Lines @("VITE_MATRIX_BASE_URL=$Script:MatrixBaseUrl")
    Write-Host "Created .env.local"
} else {
    Write-Host ".env.local already exists; leaving it unchanged."
}

Write-Host ""
Write-Host "Setup complete."
Write-Host "Start Synapse with: dev-backend/matrix/start.ps1"
