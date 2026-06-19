#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

require_docker

if ! container_exists; then
    echo "$MATRIX_CONTAINER_NAME does not exist yet." >&2
    exit 1
fi

docker logs -f "$MATRIX_CONTAINER_NAME"
