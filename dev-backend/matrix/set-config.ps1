param(
    [ValidateSet("dev", "locked")]
    [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Assert-ConfigExists

if ($Mode -eq "dev") {
    $registrationEnabled = "true"
    $registrationWithoutVerification = "true"
} else {
    $registrationEnabled = "false"
    $registrationWithoutVerification = "false"
}

$lines = Get-Content $Script:MatrixConfigFile | Where-Object {
    $_ -notmatch '^(public_baseurl|enable_registration|enable_registration_without_verification|registration_shared_secret):'
}

$overrides = @(
    ""
    "# Jikjik local development overrides."
    "public_baseurl: `"$Script:MatrixBaseUrl/`""
    "enable_registration: $registrationEnabled"
    "enable_registration_without_verification: $registrationWithoutVerification"
    "registration_shared_secret: `"$Script:MatrixRegistrationSecret`""
)

Write-Utf8NoBom -Path $Script:MatrixConfigFile -Lines ($lines + $overrides)

Write-Host "Synapse config updated: $Mode"
Write-Host "Restart Synapse for changes to take effect."
