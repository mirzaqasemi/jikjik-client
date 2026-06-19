param(
    [ValidateSet("dev", "locked")]
    [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Assert-ConfigExists

function Assert-ConfigWritable {
    $configDir = Split-Path -Parent $Script:MatrixConfigFile
    $configItem = Get-Item $Script:MatrixConfigFile

    if ($configItem.IsReadOnly) {
        Set-ItemProperty -Path $Script:MatrixConfigFile -Name IsReadOnly -Value $false
    }

    try {
        $probe = [System.IO.Path]::Combine($configDir, ".write-test-$([System.Guid]::NewGuid().ToString('N'))")
        [System.IO.File]::WriteAllText($probe, "")
        Remove-Item -Force $probe
    } catch {
        throw "Unable to write $Script:MatrixConfigFile. Check file permissions or stop Synapse if it is locking the file. $($_.Exception.Message)"
    }
}

if ($Mode -eq "dev") {
    $registrationEnabled = "true"
    $registrationWithoutVerification = "true"
} else {
    $registrationEnabled = "false"
    $registrationWithoutVerification = "false"
}

$lines = @()
$skipUserDirectory = $false
foreach ($line in Get-Content $Script:MatrixConfigFile) {
    if ($line -eq "# Jikjik local development overrides.") {
        continue
    }
    if ($line -match '^(public_baseurl|enable_registration|enable_registration_without_verification|registration_shared_secret):') {
        continue
    }
    if ($line -match '^user_directory:') {
        $skipUserDirectory = $true
        continue
    }
    if ($skipUserDirectory -and $line -match '^\S') {
        $skipUserDirectory = $false
    }
    if (-not $skipUserDirectory) {
        $lines += $line
    }
}

$overrides = @(
    ""
    "# Jikjik local development overrides."
    "public_baseurl: `"$Script:MatrixBaseUrl/`""
    "enable_registration: $registrationEnabled"
    "enable_registration_without_verification: $registrationWithoutVerification"
    "registration_shared_secret: `"$Script:MatrixRegistrationSecret`""
    "user_directory:"
    "  search_all_users: true"
)

Assert-ConfigWritable

$configDir = Split-Path -Parent $Script:MatrixConfigFile
$tmpFile = [System.IO.Path]::Combine($configDir, "homeserver.yaml.$([System.Guid]::NewGuid().ToString('N')).tmp")

try {
    Write-Utf8NoBom -Path $tmpFile -Lines ($lines + $overrides)
    Move-Item -Force -Path $tmpFile -Destination $Script:MatrixConfigFile
} finally {
    if (Test-Path $tmpFile) {
        Remove-Item -Force $tmpFile
    }
}

Write-Host "Synapse config updated: $Mode"
Write-Host "Restart Synapse for changes to take effect."
