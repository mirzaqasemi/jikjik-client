#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

MODE="${1:-dev}"

ensure_config_exists

case "$MODE" in
    dev)
        REGISTRATION_ENABLED=true
        REGISTRATION_WITHOUT_VERIFICATION=true
        ;;
    locked)
        REGISTRATION_ENABLED=false
        REGISTRATION_WITHOUT_VERIFICATION=false
        ;;
    *)
        echo "Usage: $0 dev|locked" >&2
        exit 1
        ;;
esac

tmp_file="$(mktemp)"

grep -Ev '^(public_baseurl|enable_registration|enable_registration_without_verification|registration_shared_secret):' \
    "$MATRIX_CONFIG_FILE" > "$tmp_file"

cat >> "$tmp_file" <<EOF

# Jikjik local development overrides.
public_baseurl: "$MATRIX_BASE_URL/"
enable_registration: $REGISTRATION_ENABLED
enable_registration_without_verification: $REGISTRATION_WITHOUT_VERIFICATION
registration_shared_secret: "$MATRIX_REGISTRATION_SECRET"
EOF

mv "$tmp_file" "$MATRIX_CONFIG_FILE"

echo "Synapse config updated: $MODE"
echo "Restart Synapse for changes to take effect."
