#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

require_docker

echo "This will delete the local Matrix container and all data under:"
echo "$MATRIX_DATA_DIR"
echo
read -r -p "Type DELETE LOCAL MATRIX to continue: " confirmation

if [[ "$confirmation" != "DELETE LOCAL MATRIX" ]]; then
    echo "Reset cancelled."
    exit 0
fi

if container_exists; then
    docker rm -f "$MATRIX_CONTAINER_NAME"
fi

rm -rf "$MATRIX_DATA_DIR"

echo "Local Matrix backend reset."
