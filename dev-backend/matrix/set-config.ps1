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
    if ($line -match '^(user_directory|rc_login|rc_registration|rc_registration_token_validity|rc_message|rc_admin_redaction|rc_joins|rc_joins_per_room|rc_3pid_validation|rc_invites|rc_third_party_invite|rc_media_create|rc_presence|rc_delayed_event_mgmt|rc_reports|rc_room_creation|rc_user_directory):') {
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
    "rc_login:"
    "  address:"
    "    per_second: 100"
    "    burst_count: 1000"
    "  account:"
    "    per_second: 100"
    "    burst_count: 1000"
    "  failed_attempts:"
    "    per_second: 100"
    "    burst_count: 1000"
    "rc_registration:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_registration_token_validity:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_message:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_admin_redaction:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_joins:"
    "  local:"
    "    per_second: 100"
    "    burst_count: 1000"
    "  remote:"
    "    per_second: 100"
    "    burst_count: 1000"
    "rc_joins_per_room:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_3pid_validation:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_invites:"
    "  per_room:"
    "    per_second: 100"
    "    burst_count: 1000"
    "  per_user:"
    "    per_second: 100"
    "    burst_count: 1000"
    "  per_issuer:"
    "    per_second: 100"
    "    burst_count: 1000"
    "rc_third_party_invite:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_media_create:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_presence:"
    "  per_user:"
    "    per_second: 100"
    "    burst_count: 1000"
    "rc_delayed_event_mgmt:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_reports:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_room_creation:"
    "  per_second: 100"
    "  burst_count: 1000"
    "rc_user_directory:"
    "  per_second: 100"
    "  burst_count: 1000"
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
