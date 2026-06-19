#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

require_docker
ensure_config_exists

if container_running; then
    echo "$MATRIX_CONTAINER_NAME is already running."
    exit 0
fi

if container_exists; then
    echo "Starting existing $MATRIX_CONTAINER_NAME..."
    docker start "$MATRIX_CONTAINER_NAME"
else
    echo "Creating and starting $MATRIX_CONTAINER_NAME..."
    docker run -d --name "$MATRIX_CONTAINER_NAME" \
        --mount type=bind,src="$MATRIX_DATA_DIR",dst=/data \
        -p "$MATRIX_PORT:8008" \
        "$MATRIX_IMAGE"
fi

echo "Synapse is starting at $MATRIX_BASE_URL"
echo "Check status with: dev-backend/matrix/status.sh"
