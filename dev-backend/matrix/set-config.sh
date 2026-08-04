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
    /^(rc_login|rc_registration|rc_registration_token_validity|rc_message|rc_admin_redaction|rc_joins|rc_joins_per_room|rc_3pid_validation|rc_invites|rc_third_party_invite|rc_media_create|rc_presence|rc_delayed_event_mgmt|rc_reports|rc_room_creation|rc_user_directory):/ { skip = 1; next }
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
    per_second: 100
    burst_count: 1000
  account:
    per_second: 100
    burst_count: 1000
  failed_attempts:
    per_second: 100
    burst_count: 1000
rc_registration:
  per_second: 100
  burst_count: 1000
rc_registration_token_validity:
  per_second: 100
  burst_count: 1000
rc_message:
  per_second: 100
  burst_count: 1000
rc_admin_redaction:
  per_second: 100
  burst_count: 1000
rc_joins:
  local:
    per_second: 100
    burst_count: 1000
  remote:
    per_second: 100
    burst_count: 1000
rc_joins_per_room:
  per_second: 100
  burst_count: 1000
rc_3pid_validation:
  per_second: 100
  burst_count: 1000
rc_invites:
  per_room:
    per_second: 100
    burst_count: 1000
  per_user:
    per_second: 100
    burst_count: 1000
  per_issuer:
    per_second: 100
    burst_count: 1000
rc_third_party_invite:
  per_second: 100
  burst_count: 1000
rc_media_create:
  per_second: 100
  burst_count: 1000
rc_presence:
  per_user:
    per_second: 100
    burst_count: 1000
rc_delayed_event_mgmt:
  per_second: 100
  burst_count: 1000
rc_reports:
  per_second: 100
  burst_count: 1000
rc_room_creation:
  per_second: 100
  burst_count: 1000
rc_user_directory:
  per_second: 100
  burst_count: 1000
room_list_publication_rules:
  - action: allow
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
    /^(rc_login|rc_registration|rc_registration_token_validity|rc_message|rc_admin_redaction|rc_joins|rc_joins_per_room|rc_3pid_validation|rc_invites|rc_third_party_invite|rc_media_create|rc_presence|rc_delayed_event_mgmt|rc_reports|rc_room_creation|rc_user_directory):/ { skip = 1; next }
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
    per_second: 100
    burst_count: 1000
  account:
    per_second: 100
    burst_count: 1000
  failed_attempts:
    per_second: 100
    burst_count: 1000
rc_registration:
  per_second: 100
  burst_count: 1000
rc_registration_token_validity:
  per_second: 100
  burst_count: 1000
rc_message:
  per_second: 100
  burst_count: 1000
rc_admin_redaction:
  per_second: 100
  burst_count: 1000
rc_joins:
  local:
    per_second: 100
    burst_count: 1000
  remote:
    per_second: 100
    burst_count: 1000
rc_joins_per_room:
  per_second: 100
  burst_count: 1000
rc_3pid_validation:
  per_second: 100
  burst_count: 1000
rc_invites:
  per_room:
    per_second: 100
    burst_count: 1000
  per_user:
    per_second: 100
    burst_count: 1000
  per_issuer:
    per_second: 100
    burst_count: 1000
rc_third_party_invite:
  per_second: 100
  burst_count: 1000
rc_media_create:
  per_second: 100
  burst_count: 1000
rc_presence:
  per_user:
    per_second: 100
    burst_count: 1000
rc_delayed_event_mgmt:
  per_second: 100
  burst_count: 1000
rc_reports:
  per_second: 100
  burst_count: 1000
rc_room_creation:
  per_second: 100
  burst_count: 1000
rc_user_directory:
  per_second: 100
  burst_count: 1000
EOF

chmod 0644 "$tmp_file"
mv "$tmp_file" "$MATRIX_CONFIG_FILE"
trap - EXIT

echo "Synapse config updated: $MODE"
echo "Restart Synapse for changes to take effect."
