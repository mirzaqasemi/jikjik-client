#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

usage() {
    echo "Usage: $0 <username> <password> [--admin]" >&2
}

USERNAME="${1:-}"
PASSWORD="${2:-}"
ADMIN_FLAG="${3:---no-admin}"

if [[ -z "$USERNAME" || -z "$PASSWORD" ]]; then
    usage
    exit 1
fi

if [[ "$ADMIN_FLAG" != "--admin" && "$ADMIN_FLAG" != "--no-admin" ]]; then
    usage
    exit 1
fi

require_docker
ensure_config_exists

if ! container_running; then
    echo "$MATRIX_CONTAINER_NAME is not running. Start it first with dev-backend/matrix/start.sh" >&2
    exit 1
fi

docker exec "$MATRIX_CONTAINER_NAME" register_new_matrix_user \
    "http://localhost:8008" \
    -c /data/homeserver.yaml \
    -u "$USERNAME" \
    -p "$PASSWORD" \
    "$ADMIN_FLAG"

echo "Registered @$USERNAME:$MATRIX_SERVER_NAME"
