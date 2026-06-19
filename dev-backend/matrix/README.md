# Local Matrix Backend

This folder contains helper scripts for running a local Synapse homeserver for Jikjik development.

Generated homeserver data lives in `.matrix/synapse` at the repo root. That directory is ignored by Git.
The frontend uses `matrix-js-sdk` directly against this homeserver; there is no separate local API proxy to run.

## Quick Start

Linux, macOS, or Windows Git Bash:

```bash
dev-backend/matrix/setup.sh
dev-backend/matrix/start.sh

dev-backend/matrix/add-user.sh alex92 password
dev-backend/matrix/add-user.sh bob password

dev-backend/matrix/seed.sh
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/setup.ps1
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/start.ps1

powershell -ExecutionPolicy Bypass -File dev-backend/matrix/add-user.ps1 alex92 password
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/add-user.ps1 bob password

powershell -ExecutionPolicy Bypass -File dev-backend/matrix/seed.ps1
```

The local homeserver URL is:

```text
http://localhost:8008
```

The Vite app reads:

```text
VITE_MATRIX_BASE_URL=http://localhost:8008
```

from `.env.local`.

## Scripts

Every script has both a Bash version and a PowerShell version:

- `setup.sh` / `setup.ps1`: pulls the Docker image, generates Synapse config, applies dev registration config, and creates `.env.local` if missing.
- `start.sh` / `start.ps1`: starts the local Synapse container.
- `stop.sh` / `stop.ps1`: stops the local Synapse container.
- `restart.sh` / `restart.ps1`: restarts the local Synapse container.
- `status.sh` / `status.ps1`: prints container status and checks the Matrix client API.
- `logs.sh` / `logs.ps1`: follows Synapse logs.
- `add-user.sh <username> <password> [--admin]` / `add-user.ps1 <username> <password> [-Admin]`: creates a local Matrix user using the configured dev registration secret.
- `seed.sh` / `seed.ps1`: creates sample users, rooms, and messages for local UI testing.
- `set-config.sh dev|locked` / `set-config.ps1 dev|locked`: enables local dev registration, user-directory search, and relaxed local rate limits, or locks registration.
- `reset.sh` / `reset.ps1`: deletes the local container and all local Matrix data after confirmation.

## Windows Notes

Both Windows paths are supported:

- Git Bash: run the `.sh` scripts.
- PowerShell: run the `.ps1` scripts.

If PowerShell blocks local scripts because of execution policy, use:

```powershell
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/status.ps1
```

Docker Desktop must be running before using the scripts.

## Useful Users

Linux, macOS, or Git Bash:

```bash
dev-backend/matrix/add-user.sh alex92 password
dev-backend/matrix/add-user.sh bob password
dev-backend/matrix/add-user.sh admin password --admin
```

PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/add-user.ps1 alex92 password
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/add-user.ps1 bob password
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/add-user.ps1 admin password -Admin
```

These become:

```text
@alex92:localhost
@bob:localhost
@admin:localhost
```

## Seed Data

Create a small set of local users and chats:

```bash
dev-backend/matrix/seed.sh
```

PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/seed.ps1
```

The default seeded password is `password`. Override it with `MATRIX_SEED_PASSWORD`.

The primary test login is:

```text
alex92 / password
```

The seed creates direct chats with Bob and Maya plus a group room. Re-running the seed creates another set of rooms and messages.

## Configuration Overrides

You can override defaults per command:

```bash
MATRIX_PORT=8010 MATRIX_BASE_URL=http://localhost:8010 dev-backend/matrix/start.sh
```

PowerShell:

```powershell
$env:MATRIX_PORT = "8010"
$env:MATRIX_BASE_URL = "http://localhost:8010"
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/start.ps1
```

Common variables:

- `MATRIX_CONTAINER_NAME`
- `MATRIX_IMAGE`
- `MATRIX_SERVER_NAME`
- `MATRIX_BASE_URL`
- `MATRIX_PORT`
- `MATRIX_DATA_DIR`
- `MATRIX_REGISTRATION_SECRET`

Do not expose this dev homeserver publicly with open registration enabled.

`set-config` also enables `user_directory.search_all_users` so local contact search can discover dev users through the Matrix SDK. It relaxes local login, registration, and message rate limits so seed scripts can run without waiting on Synapse throttling.
