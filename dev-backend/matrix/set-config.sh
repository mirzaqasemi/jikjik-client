#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

MODE="${1:-dev}"

ensure_config_exists

write_config_in_container() {
    require_docker

    echo "Updating Docker-owned Synapse config from the Synapse container..."
    docker run --rm \
        --user 0 \
        --mount type=bind,src="$MATRIX_DATA_DIR",dst=/data \
        --entrypoint sh \
        -e MATRIX_BASE_URL="$MATRIX_BASE_URL" \
        -e REGISTRATION_ENABLED="$REGISTRATION_ENABLED" \
        -e REGISTRATION_WITHOUT_VERIFICATION="$REGISTRATION_WITHOUT_VERIFICATION" \
        -e MATRIX_REGISTRATION_SECRET="$MATRIX_REGISTRATION_SECRET" \
        "$MATRIX_IMAGE" \
        -c '
set -eu
config=/data/homeserver.yaml
tmp="$(mktemp /data/homeserver.yaml.XXXXXX)"
trap "rm -f \"$tmp\"" EXIT
awk '"'"'
    /^# Jikjik local development overrides\.$/ { next }
    /^(public_baseurl|enable_registration|enable_registration_without_verification|registration_shared_secret):/ { next }
    /^(rc_login|rc_registration|rc_message):/ { skip = 1; next }
    /^user_directory:/ { skip = 1; next }
    skip && /^[^[:space:]]/ { skip = 0 }
    !skip { print }
'"'"' "$config" > "$tmp"
cat >> "$tmp" <<EOF

# Jikjik local development overrides.
public_baseurl: "$MATRIX_BASE_URL/"
enable_registration: $REGISTRATION_ENABLED
enable_registration_without_verification: $REGISTRATION_WITHOUT_VERIFICATION
registration_shared_secret: "$MATRIX_REGISTRATION_SECRET"
user_directory:
  search_all_users: true
rc_login:
  address:
    per_second: 50
    burst_count: 100
  account:
    per_second: 50
    burst_count: 100
  failed_attempts:
    per_second: 50
    burst_count: 100
rc_registration:
  per_second: 50
  burst_count: 100
rc_message:
  per_second: 50
  burst_count: 100
EOF
chmod 0644 "$tmp"
chown --reference="$config" "$tmp" 2>/dev/null || true
mv "$tmp" "$config"
trap - EXIT
'
}

config_is_writable() {
    local config_dir
    config_dir="$(dirname "$MATRIX_CONFIG_FILE")"

    if [[ -w "$MATRIX_CONFIG_FILE" && -w "$config_dir" ]]; then
        return 0
    fi

    return 1
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

if ! config_is_writable; then
    write_config_in_container
    echo "Synapse config updated: $MODE"
    echo "Restart Synapse for changes to take effect."
    exit 0
fi

config_dir="$(dirname "$MATRIX_CONFIG_FILE")"
tmp_file="$(mktemp "$config_dir/homeserver.yaml.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT

awk '
    /^# Jikjik local development overrides\.$/ { next }
    /^(public_baseurl|enable_registration|enable_registration_without_verification|registration_shared_secret):/ { next }
    /^(rc_login|rc_registration|rc_message):/ { skip = 1; next }
    /^user_directory:/ { skip = 1; next }
    skip && /^[^[:space:]]/ { skip = 0 }
    !skip { print }
' "$MATRIX_CONFIG_FILE" > "$tmp_file"

cat >> "$tmp_file" <<EOF

# Jikjik local development overrides.
public_baseurl: "$MATRIX_BASE_URL/"
enable_registration: $REGISTRATION_ENABLED
enable_registration_without_verification: $REGISTRATION_WITHOUT_VERIFICATION
registration_shared_secret: "$MATRIX_REGISTRATION_SECRET"
user_directory:
  search_all_users: true
rc_login:
  address:
    per_second: 50
    burst_count: 100
  account:
    per_second: 50
    burst_count: 100
  failed_attempts:
    per_second: 50
    burst_count: 100
rc_registration:
  per_second: 50
  burst_count: 100
rc_message:
  per_second: 50
  burst_count: 100
EOF

chmod 0644 "$tmp_file"
mv "$tmp_file" "$MATRIX_CONFIG_FILE"
trap - EXIT

echo "Synapse config updated: $MODE"
echo "Restart Synapse for changes to take effect."
