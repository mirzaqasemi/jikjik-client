#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MATRIX_DATA_DIR="${MATRIX_DATA_DIR:-$REPO_ROOT/.matrix/synapse}"
MATRIX_CONTAINER_NAME="${MATRIX_CONTAINER_NAME:-jikjik-synapse}"
MATRIX_IMAGE="${MATRIX_IMAGE:-matrixdotorg/synapse:latest}"
MATRIX_SERVER_NAME="${MATRIX_SERVER_NAME:-localhost}"
MATRIX_BASE_URL="${MATRIX_BASE_URL:-http://localhost:8008}"
MATRIX_PORT="${MATRIX_PORT:-8008}"
MATRIX_REGISTRATION_SECRET="${MATRIX_REGISTRATION_SECRET:-dev-secret-change-me}"
MATRIX_CONFIG_FILE="$MATRIX_DATA_DIR/homeserver.yaml"

require_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo "Docker is required but was not found in PATH." >&2
        exit 1
    fi
}

container_exists() {
    docker ps -a --format '{{.Names}}' | grep -Fxq "$MATRIX_CONTAINER_NAME"
}

container_running() {
    docker ps --format '{{.Names}}' | grep -Fxq "$MATRIX_CONTAINER_NAME"
}

ensure_config_exists() {
    if [[ ! -f "$MATRIX_CONFIG_FILE" ]]; then
        echo "Missing $MATRIX_CONFIG_FILE. Run dev-backend/matrix/setup.sh first." >&2
        exit 1
    fi
}
