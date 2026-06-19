param(
    [string]$Password = $(if ($env:MATRIX_SEED_PASSWORD) { $env:MATRIX_SEED_PASSWORD } else { "password" })
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot/env.ps1"

Require-Docker
Assert-ConfigExists

if (-not (Test-ContainerRunning)) {
    throw "$Script:MatrixContainerName is not running. Start it first with dev-backend/matrix/start.ps1"
}

function Get-UserId {
    param([Parameter(Mandatory = $true)][string]$Username)
    return "@$Username`:$Script:MatrixServerName"
}

function Invoke-MatrixPost {
    param(
        [ValidateSet("Post", "Put")]
        [string]$Method = "Post",

        [string]$AccessToken,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$Body
    )

    $headers = @{}
    if ($AccessToken) {
        $headers.Authorization = "Bearer $AccessToken"
    }

    $json = $Body | ConvertTo-Json -Depth 20 -Compress

    for ($attempt = 1; $attempt -le 6; $attempt++) {
        try {
            return Invoke-RestMethod `
                -Method $Method `
                -Uri "$Script:MatrixBaseUrl$Path" `
                -Headers $headers `
                -ContentType "application/json" `
                -Body $json
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode -eq 429 -and $attempt -lt 6) {
                Start-Sleep -Seconds $attempt
                continue
            }

            throw
        }
    }
}

function Register-SeedUser {
    param([Parameter(Mandatory = $true)][string]$Username)

    $output = docker exec $Script:MatrixContainerName register_new_matrix_user `
        "http://localhost:8008" `
        -k $Script:MatrixRegistrationSecret `
        -u $Username `
        -p $Password `
        --exists-ok `
        --no-admin 2>&1

    if ($LASTEXITCODE -eq 0) {
        if ($output -match "User already exists\. Skipping\.") {
            Write-Host "User already exists: @$Username`:$Script:MatrixServerName"
        } else {
            Write-Host "Registered @$Username`:$Script:MatrixServerName"
        }
    } else {
        Write-Host "Registration skipped for @$Username`:$Script:MatrixServerName"
        $output | ForEach-Object { Write-Host "  $_" }
    }
}

function Login-SeedUser {
    param([Parameter(Mandatory = $true)][string]$Username)

    $response = Invoke-MatrixPost -Path "/_matrix/client/v3/login" -Body @{
        type = "m.login.password"
        identifier = @{
            type = "m.id.user"
            user = $Username
        }
        password = $Password
    }

    return $response.access_token
}

function New-SeedRoom {
    param(
        [Parameter(Mandatory = $true)][string]$OwnerToken,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Topic,
        [Parameter(Mandatory = $true)][string[]]$Invite,
        [Parameter(Mandatory = $true)][bool]$IsDirect
    )

    $response = Invoke-MatrixPost -AccessToken $OwnerToken -Path "/_matrix/client/v3/createRoom" -Body @{
        preset = "private_chat"
        visibility = "private"
        name = $Name
        topic = $Topic
        invite = $Invite
        is_direct = $IsDirect
        initial_state = @(
            @{
                type = "m.room.history_visibility"
                state_key = ""
                content = @{
                    history_visibility = "shared"
                }
            }
        )
    }

    return $response.room_id
}

function Join-SeedRoom {
    param(
        [Parameter(Mandatory = $true)][string]$AccessToken,
        [Parameter(Mandatory = $true)][string]$RoomId
    )

    Invoke-MatrixPost -AccessToken $AccessToken -Path "/_matrix/client/v3/join/$RoomId" -Body @{} | Out-Null
}

function Send-SeedMessage {
    param(
        [Parameter(Mandatory = $true)][string]$AccessToken,
        [Parameter(Mandatory = $true)][string]$RoomId,
        [Parameter(Mandatory = $true)][string]$TxnId,
        [Parameter(Mandatory = $true)][string]$Body
    )

    Invoke-MatrixPost -Method Put -AccessToken $AccessToken -Path "/_matrix/client/v3/rooms/$RoomId/send/m.room.message/$TxnId" -Body @{
        msgtype = "m.text"
        body = $Body
    } | Out-Null
}

Write-Host "Seeding local Matrix data at $Script:MatrixBaseUrl"

$users = @("alex92", "bob", "maya", "sara")
foreach ($username in $users) {
    Register-SeedUser -Username $username
}

$tokens = @{}
foreach ($username in $users) {
    $tokens[$username] = Login-SeedUser -Username $username
    Write-Host "Logged in @$username`:$Script:MatrixServerName"
}

$bobId = Get-UserId "bob"
$mayaId = Get-UserId "maya"
$saraId = Get-UserId "sara"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$alexBobRoom = New-SeedRoom `
    -OwnerToken $tokens["alex92"] `
    -Name "Bob" `
    -Topic "Seed direct chat between Alex and Bob." `
    -Invite @($bobId) `
    -IsDirect $true
Join-SeedRoom -AccessToken $tokens["bob"] -RoomId $alexBobRoom
Send-SeedMessage -AccessToken $tokens["alex92"] -RoomId $alexBobRoom -TxnId "seed-alex-bob-1-$timestamp" -Body "Hey Bob, I wired the Matrix SDK into the client."
Send-SeedMessage -AccessToken $tokens["bob"] -RoomId $alexBobRoom -TxnId "seed-alex-bob-2-$timestamp" -Body "Nice. I can see the local Synapse rooms now."
Send-SeedMessage -AccessToken $tokens["alex92"] -RoomId $alexBobRoom -TxnId "seed-alex-bob-3-$timestamp" -Body "Encryption is still off for this first dev pass."

$alexMayaRoom = New-SeedRoom `
    -OwnerToken $tokens["alex92"] `
    -Name "Maya" `
    -Topic "Seed direct chat between Alex and Maya." `
    -Invite @($mayaId) `
    -IsDirect $true
Join-SeedRoom -AccessToken $tokens["maya"] -RoomId $alexMayaRoom
Send-SeedMessage -AccessToken $tokens["maya"] -RoomId $alexMayaRoom -TxnId "seed-alex-maya-1-$timestamp" -Body "I added a couple of profile-ish messages for contact testing."
Send-SeedMessage -AccessToken $tokens["alex92"] -RoomId $alexMayaRoom -TxnId "seed-alex-maya-2-$timestamp" -Body "Perfect. This should show up when I log in as alex92."

$groupRoom = New-SeedRoom `
    -OwnerToken $tokens["alex92"] `
    -Name "Jikjik Dev Room" `
    -Topic "Seed group room for local Matrix development." `
    -Invite @($bobId, $mayaId, $saraId) `
    -IsDirect $false
Join-SeedRoom -AccessToken $tokens["bob"] -RoomId $groupRoom
Join-SeedRoom -AccessToken $tokens["maya"] -RoomId $groupRoom
Join-SeedRoom -AccessToken $tokens["sara"] -RoomId $groupRoom
Send-SeedMessage -AccessToken $tokens["alex92"] -RoomId $groupRoom -TxnId "seed-group-1-$timestamp" -Body "Welcome to the local Matrix seed room."
Send-SeedMessage -AccessToken $tokens["bob"] -RoomId $groupRoom -TxnId "seed-group-2-$timestamp" -Body "This room is useful for testing chat lists and last-message previews."
Send-SeedMessage -AccessToken $tokens["maya"] -RoomId $groupRoom -TxnId "seed-group-3-$timestamp" -Body "I am checking member display in a multi-user room."
Send-SeedMessage -AccessToken $tokens["sara"] -RoomId $groupRoom -TxnId "seed-group-4-$timestamp" -Body "Looks good from another account too."

Write-Host ""
Write-Host "Seed complete."
Write-Host "Login with any seeded user and password: $Password"
Write-Host "Primary test login: alex92 / $Password"
