#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

MODE="${1:-dev}"

ensure_config_exists

ensure_config_writable() {
    local config_dir
    config_dir="$(dirname "$MATRIX_CONFIG_FILE")"

    if [[ -w "$MATRIX_CONFIG_FILE" && -w "$config_dir" ]]; then
        return
    fi

    require_docker

    echo "Fixing ownership for Docker-generated Synapse config..."
    docker run --rm \
        --mount type=bind,src="$MATRIX_DATA_DIR",dst=/data \
        --entrypoint sh \
        -e HOST_UID="$(id -u)" \
        -e HOST_GID="$(id -g)" \
        "$MATRIX_IMAGE" \
        -c 'chown -R "$HOST_UID:$HOST_GID" /data'

    if [[ ! -w "$MATRIX_CONFIG_FILE" || ! -w "$config_dir" ]]; then
        echo "Unable to write $MATRIX_CONFIG_FILE after fixing ownership." >&2
        exit 1
    fi
}

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

ensure_config_writable

config_dir="$(dirname "$MATRIX_CONFIG_FILE")"
tmp_file="$(mktemp "$config_dir/homeserver.yaml.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT

grep -Ev '^(public_baseurl|enable_registration|enable_registration_without_verification|registration_shared_secret):' \
    "$MATRIX_CONFIG_FILE" > "$tmp_file"

cat >> "$tmp_file" <<EOF

# Jikjik local development overrides.
public_baseurl: "$MATRIX_BASE_URL/"
enable_registration: $REGISTRATION_ENABLED
enable_registration_without_verification: $REGISTRATION_WITHOUT_VERIFICATION
registration_shared_secret: "$MATRIX_REGISTRATION_SECRET"
EOF

chmod 0644 "$tmp_file"
mv "$tmp_file" "$MATRIX_CONFIG_FILE"
trap - EXIT

echo "Synapse config updated: $MODE"
echo "Restart Synapse for changes to take effect."
