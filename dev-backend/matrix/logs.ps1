$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Require-Docker

if (-not (Test-ContainerExists)) {
    throw "$Script:MatrixContainerName does not exist yet."
}

docker logs -f $Script:MatrixContainerName
