#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

require_docker

if container_running; then
    echo "$MATRIX_CONTAINER_NAME is running."
    docker ps --filter "name=$MATRIX_CONTAINER_NAME"
    echo
    echo "Client API:"
    curl -fsS "$MATRIX_BASE_URL/_matrix/client/versions" || true
    echo
else
    echo "$MATRIX_CONTAINER_NAME is not running."
    if container_exists; then
        echo "Container exists and can be started."
    else
        echo "Container has not been created yet."
    fi
fi
