#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

ADMIN_USERNAME="${MATRIX_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${MATRIX_ADMIN_PASSWORD:-password}"
YES=false

usage() {
    cat >&2 <<EOF
Usage: $0 [--yes]

Deletes and purges every room from the local Matrix dev backend.

Environment overrides:
  MATRIX_ADMIN_USERNAME  Admin user to create/login with. Defaults to admin.
  MATRIX_ADMIN_PASSWORD  Admin password. Defaults to password.
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --yes|-y)
            YES=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            usage
            exit 1
            ;;
    esac
done

require_docker
ensure_config_exists

if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required but was not found in PATH." >&2
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "node is required but was not found in PATH." >&2
    exit 1
fi

if ! container_running; then
    echo "$MATRIX_CONTAINER_NAME is not running. Start it first with dev-backend/matrix/start.sh" >&2
    exit 1
fi

json_get() {
    local path="$1"
    node -e '
const path = process.argv[1].split(".");
let input = "";

function pick(value, keys) {
  if (keys.length === 0) {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => pick(item, keys));
  }
  if (value == null) {
    return [];
  }

  const [key, ...rest] = keys;
  return pick(value[key], rest);
}

process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const data = JSON.parse(input);
  const values = pick(data, path).filter(value => value != null);
  if (values.length === 0) {
    process.exit(1);
  }
  process.stdout.write(values.map(value => String(value)).join("\n"));
});
' "$path"
}

json_login_payload() {
    node -e '
const user = process.argv[1];
const password = process.argv[2];
process.stdout.write(JSON.stringify({
  type: "m.login.password",
  identifier: { type: "m.id.user", user },
  password,
}));
' "$1" "$2"
}

url_encode() {
    node -e 'process.stdout.write(encodeURIComponent(process.argv[1]));' "$1"
}

matrix_request() {
    local method="$1"
    local token="$2"
    local path="$3"
    local body="${4:-}"
    local body_file status attempt

    body_file="$(mktemp)"
    for attempt in 1 2 3 4 5 6; do
        if [[ -n "$body" ]]; then
            if [[ -n "$token" ]]; then
                status="$(curl -sS \
                    -X "$method" \
                    -H "Authorization: Bearer $token" \
                    -H "Content-Type: application/json" \
                    --data-binary "$body" \
                    -o "$body_file" \
                    -w "%{http_code}" \
                    "$MATRIX_BASE_URL$path")" || status="000"
            else
                status="$(curl -sS \
                    -X "$method" \
                    -H "Content-Type: application/json" \
                    --data-binary "$body" \
                    -o "$body_file" \
                    -w "%{http_code}" \
                    "$MATRIX_BASE_URL$path")" || status="000"
            fi
        else
            if [[ -n "$token" ]]; then
                status="$(curl -sS \
                    -X "$method" \
                    -H "Authorization: Bearer $token" \
                    -o "$body_file" \
                    -w "%{http_code}" \
                    "$MATRIX_BASE_URL$path")" || status="000"
            else
                status="$(curl -sS \
                    -X "$method" \
                    -o "$body_file" \
                    -w "%{http_code}" \
                    "$MATRIX_BASE_URL$path")" || status="000"
            fi
        fi

        if [[ "$status" =~ ^2 ]]; then
            cat "$body_file"
            rm -f "$body_file"
            return 0
        fi

        if [[ "$status" == "429" && "$attempt" -lt 6 ]]; then
            sleep "$attempt"
            continue
        fi

        echo "Matrix $method failed with HTTP $status: $path" >&2
        cat "$body_file" >&2
        echo >&2
        rm -f "$body_file"
        return 1
    done

    rm -f "$body_file"
    return 1
}

login_admin() {
    local payload response

    payload="$(json_login_payload "$ADMIN_USERNAME" "$ADMIN_PASSWORD")"
    response="$(matrix_request "POST" "" "/_matrix/client/v3/login" "$payload")"
    json_get "access_token" <<< "$response"
}

ensure_admin_user() {
    local output

    if output="$(docker exec "$MATRIX_CONTAINER_NAME" register_new_matrix_user \
        "http://localhost:8008" \
        -k "$MATRIX_REGISTRATION_SECRET" \
        -u "$ADMIN_USERNAME" \
        -p "$ADMIN_PASSWORD" \
        --exists-ok \
        --admin 2>&1)"; then
        if [[ "$output" == *"User already exists. Skipping."* ]]; then
            echo "Admin user already exists: @$ADMIN_USERNAME:$MATRIX_SERVER_NAME"
        else
            echo "Registered admin user: @$ADMIN_USERNAME:$MATRIX_SERVER_NAME"
        fi
        return 0
    fi

    echo "Failed to ensure admin user @$ADMIN_USERNAME:$MATRIX_SERVER_NAME" >&2
    echo "$output" | sed 's/^/  /' >&2
    return 1
}

list_room_ids() {
    local token="$1"
    local from=0
    local response next_batch

    while :; do
        response="$(matrix_request "GET" "$token" "/_synapse/admin/v1/rooms?from=$from&limit=100&order_by=name")"
        json_get "rooms.room_id" <<< "$response" || true

        if next_batch="$(json_get "next_batch" <<< "$response" 2>/dev/null)"; then
            from="$next_batch"
            continue
        fi

        break
    done
}

delete_room() {
    local token="$1"
    local room_id="$2"
    local encoded_room_id response delete_id

    encoded_room_id="$(url_encode "$room_id")"
    response="$(matrix_request "DELETE" "$token" "/_synapse/admin/v2/rooms/$encoded_room_id" '{"block":false,"purge":true}')"
    delete_id="$(json_get "delete_id" <<< "$response")"
    echo "$delete_id"
}

wait_for_delete() {
    local token="$1"
    local delete_id="$2"
    local encoded_delete_id status response attempt

    encoded_delete_id="$(url_encode "$delete_id")"
    for attempt in {1..60}; do
        response="$(matrix_request "GET" "$token" "/_synapse/admin/v2/rooms/delete_status/$encoded_delete_id")"
        status="$(json_get "status" <<< "$response")"

        case "$status" in
            complete)
                return 0
                ;;
            failed)
                echo "Room deletion failed:" >&2
                echo "$response" >&2
                return 1
                ;;
            *)
                sleep 1
                ;;
        esac
    done

    echo "Timed out waiting for delete task $delete_id" >&2
    return 1
}

if [[ "$YES" != true ]]; then
    echo "This will delete and purge every room from the local Matrix backend at:"
    echo "$MATRIX_BASE_URL"
    echo
    echo "Users and server config will be kept. Room messages/state will be removed."
    echo
    read -r -p "Type DELETE ALL CHATS to continue: " confirmation

    if [[ "$confirmation" != "DELETE ALL CHATS" ]]; then
        echo "Delete cancelled."
        exit 0
    fi
fi

ensure_admin_user
admin_token="$(login_admin)"

mapfile -t room_ids < <(list_room_ids "$admin_token")

if [[ "${#room_ids[@]}" -eq 0 ]]; then
    echo "No rooms found."
    exit 0
fi

echo "Deleting ${#room_ids[@]} room(s)..."

for room_id in "${room_ids[@]}"; do
    [[ -z "$room_id" ]] && continue
    echo "Deleting $room_id"
    delete_id="$(delete_room "$admin_token" "$room_id")"
    wait_for_delete "$admin_token" "$delete_id"
done

echo "All local Matrix chats deleted."
