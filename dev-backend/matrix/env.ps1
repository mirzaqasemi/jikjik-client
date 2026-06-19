$ErrorActionPreference = "Stop"

$Script:ScriptDir = Split-Path -Parent $PSCommandPath
$Script:RepoRoot = Resolve-Path (Join-Path $Script:ScriptDir "../..")

$Script:MatrixDataDir = if ($env:MATRIX_DATA_DIR) { $env:MATRIX_DATA_DIR } else { Join-Path $Script:RepoRoot ".matrix/synapse" }
$Script:MatrixContainerName = if ($env:MATRIX_CONTAINER_NAME) { $env:MATRIX_CONTAINER_NAME } else { "jikjik-synapse" }
$Script:MatrixImage = if ($env:MATRIX_IMAGE) { $env:MATRIX_IMAGE } else { "matrixdotorg/synapse:latest" }
$Script:MatrixServerName = if ($env:MATRIX_SERVER_NAME) { $env:MATRIX_SERVER_NAME } else { "localhost" }
$Script:MatrixBaseUrl = if ($env:MATRIX_BASE_URL) { $env:MATRIX_BASE_URL } else { "http://localhost:8008" }
$Script:MatrixPort = if ($env:MATRIX_PORT) { $env:MATRIX_PORT } else { "8008" }
$Script:MatrixRegistrationSecret = if ($env:MATRIX_REGISTRATION_SECRET) { $env:MATRIX_REGISTRATION_SECRET } else { "dev-secret-change-me" }
$Script:MatrixConfigFile = Join-Path $Script:MatrixDataDir "homeserver.yaml"

function Require-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is required but was not found in PATH."
    }
}

function Test-ContainerExists {
    $names = docker ps -a --format '{{.Names}}'
    return $names -contains $Script:MatrixContainerName
}

function Test-ContainerRunning {
    $names = docker ps --format '{{.Names}}'
    return $names -contains $Script:MatrixContainerName
}

function Assert-ConfigExists {
    if (-not (Test-Path $Script:MatrixConfigFile)) {
        throw "Missing $Script:MatrixConfigFile. Run dev-backend/matrix/setup.ps1 first."
    }
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string[]]$Lines
    )

    $encoding = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllLines($Path, $Lines, $encoding)
}
