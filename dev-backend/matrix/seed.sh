#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-backend/matrix/env.sh
source "$SCRIPT_DIR/env.sh"

PASSWORD="${MATRIX_SEED_PASSWORD:-password}"

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
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const data = JSON.parse(input);
  let value = data;
  for (const key of path) {
    value = value?.[key];
  }
  if (value == null) {
    process.exit(1);
  }
  process.stdout.write(String(value));
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

json_create_room_payload() {
    node -e '
const name = process.argv[1];
const topic = process.argv[2];
const invite = process.argv[3] ? process.argv[3].split(",").filter(Boolean) : [];
const isDirect = process.argv[4] === "true";
process.stdout.write(JSON.stringify({
  preset: "private_chat",
  visibility: "private",
  name,
  topic,
  invite,
  is_direct: isDirect,
  initial_state: [
    {
      type: "m.room.history_visibility",
      state_key: "",
      content: { history_visibility: "shared" },
    },
  ],
}));
' "$1" "$2" "$3" "$4"
}

json_message_payload() {
    node -e '
const body = process.argv[1];
process.stdout.write(JSON.stringify({
  msgtype: "m.text",
  body,
}));
' "$1"
}

matrix_request() {
    local method="$1"
    local token="$2"
    local path="$3"
    local body="$4"
    local body_file status attempt

    body_file="$(mktemp)"
    for attempt in 1 2 3 4 5 6; do
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

matrix_post() {
    local token="$1"
    local path="$2"
    local body="$3"
    matrix_request "POST" "$token" "$path" "$body"
}

matrix_put() {
    local token="$1"
    local path="$2"
    local body="$3"
    matrix_request "PUT" "$token" "$path" "$body"
}

register_user() {
    local username="$1"
    local output

    if output="$(docker exec "$MATRIX_CONTAINER_NAME" register_new_matrix_user \
        "http://localhost:8008" \
        -k "$MATRIX_REGISTRATION_SECRET" \
        -u "$username" \
        -p "$PASSWORD" \
        --exists-ok \
        --no-admin 2>&1)"; then
        if [[ "$output" == *"User already exists. Skipping."* ]]; then
            echo "User already exists: @$username:$MATRIX_SERVER_NAME"
        else
            echo "Registered @$username:$MATRIX_SERVER_NAME"
        fi
    else
        echo "Registration skipped for @$username:$MATRIX_SERVER_NAME"
        echo "$output" | sed 's/^/  /'
    fi
}

login_user() {
    local username="$1"
    local payload response

    payload="$(json_login_payload "$username" "$PASSWORD")"
    response="$(matrix_post "" "/_matrix/client/v3/login" "$payload")"
    json_get "access_token" <<< "$response"
}

create_room() {
    local owner_token="$1"
    local name="$2"
    local topic="$3"
    local invite_csv="$4"
    local is_direct="$5"
    local payload response

    payload="$(json_create_room_payload "$name" "$topic" "$invite_csv" "$is_direct")"
    response="$(matrix_post "$owner_token" "/_matrix/client/v3/createRoom" "$payload")"
    json_get "room_id" <<< "$response"
}

join_room() {
    local token="$1"
    local room_id="$2"

    matrix_post "$token" "/_matrix/client/v3/join/$room_id" "{}" >/dev/null
}

send_message() {
    local token="$1"
    local room_id="$2"
    local txn_id="$3"
    local body="$4"
    local payload

    payload="$(json_message_payload "$body")"
    matrix_put "$token" "/_matrix/client/v3/rooms/$room_id/send/m.room.message/$txn_id" "$payload" >/dev/null
}

user_id() {
    local username="$1"
    printf '@%s:%s' "$username" "$MATRIX_SERVER_NAME"
}

echo "Seeding local Matrix data at $MATRIX_BASE_URL"

USERS=(alex92 bob maya sara)
for username in "${USERS[@]}"; do
    register_user "$username"
done

declare -A TOKENS
for username in "${USERS[@]}"; do
    TOKENS["$username"]="$(login_user "$username")"
    echo "Logged in @$username:$MATRIX_SERVER_NAME"
done

bob_id="$(user_id bob)"
maya_id="$(user_id maya)"
sara_id="$(user_id sara)"

alex_bob_room="$(create_room "${TOKENS[alex92]}" "Bob" "Seed direct chat between Alex and Bob." "$bob_id" "true")"
join_room "${TOKENS[bob]}" "$alex_bob_room"
send_message "${TOKENS[alex92]}" "$alex_bob_room" "seed-alex-bob-1-$(date +%s)" "Hey Bob, I wired the Matrix SDK into the client."
send_message "${TOKENS[bob]}" "$alex_bob_room" "seed-alex-bob-2-$(date +%s)" "Nice. I can see the local Synapse rooms now."
send_message "${TOKENS[alex92]}" "$alex_bob_room" "seed-alex-bob-3-$(date +%s)" "Encryption is still off for this first dev pass."

alex_maya_room="$(create_room "${TOKENS[alex92]}" "Maya" "Seed direct chat between Alex and Maya." "$maya_id" "true")"
join_room "${TOKENS[maya]}" "$alex_maya_room"
send_message "${TOKENS[maya]}" "$alex_maya_room" "seed-alex-maya-1-$(date +%s)" "I added a couple of profile-ish messages for contact testing."
send_message "${TOKENS[alex92]}" "$alex_maya_room" "seed-alex-maya-2-$(date +%s)" "Perfect. This should show up when I log in as alex92."

group_room="$(create_room "${TOKENS[alex92]}" "Jikjik Dev Room" "Seed group room for local Matrix development." "$bob_id,$maya_id,$sara_id" "false")"
join_room "${TOKENS[bob]}" "$group_room"
join_room "${TOKENS[maya]}" "$group_room"
join_room "${TOKENS[sara]}" "$group_room"
send_message "${TOKENS[alex92]}" "$group_room" "seed-group-1-$(date +%s)" "Welcome to the local Matrix seed room."
send_message "${TOKENS[bob]}" "$group_room" "seed-group-2-$(date +%s)" "This room is useful for testing chat lists and last-message previews."
send_message "${TOKENS[maya]}" "$group_room" "seed-group-3-$(date +%s)" "I am checking member display in a multi-user room."
send_message "${TOKENS[sara]}" "$group_room" "seed-group-4-$(date +%s)" "Looks good from another account too."

echo
echo "Seed complete."
echo "Login with any seeded user and password: $PASSWORD"
echo "Primary test login: alex92 / $PASSWORD"
