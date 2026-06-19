#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

require_docker

mkdir -p "$MATRIX_DATA_DIR"

echo "Pulling $MATRIX_IMAGE..."
docker pull "$MATRIX_IMAGE"

if [[ ! -f "$MATRIX_CONFIG_FILE" ]]; then
    echo "Generating Synapse config in $MATRIX_DATA_DIR..."
    docker run --rm \
        --mount type=bind,src="$MATRIX_DATA_DIR",dst=/data \
        -e SYNAPSE_SERVER_NAME="$MATRIX_SERVER_NAME" \
        -e SYNAPSE_REPORT_STATS=no \
        "$MATRIX_IMAGE" generate
else
    echo "Synapse config already exists at $MATRIX_CONFIG_FILE"
fi

"$SCRIPT_DIR/set-config.sh" dev

if [[ ! -f "$REPO_ROOT/.env.local" ]]; then
    printf 'VITE_MATRIX_BASE_URL=%s\n' "$MATRIX_BASE_URL" > "$REPO_ROOT/.env.local"
    echo "Created .env.local"
else
    echo ".env.local already exists; leaving it unchanged."
fi

echo
echo "Setup complete."
echo "Start Synapse with: dev-backend/matrix/start.sh"
