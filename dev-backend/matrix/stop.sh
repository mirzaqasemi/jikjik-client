#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

require_docker

if container_running; then
    docker stop "$MATRIX_CONTAINER_NAME"
    echo "Stopped $MATRIX_CONTAINER_NAME."
else
    echo "$MATRIX_CONTAINER_NAME is not running."
fi
