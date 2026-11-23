# JikJik

JikJik is a responsive web chat client built with React and TypeScript. It connects directly to a Matrix homeserver for authentication, live conversations, profiles, and room management. Docker scripts in this repository run Synapse locally; there is no separate application API server.

The package and HTML title still use the earlier name `chelcheleh`.

## Features

- Password login using a Matrix username or full Matrix user ID.
- Direct messages, with existing-room resolution and room creation on the first send.
- Public and private groups, member invitations, public-room search, and joining public rooms.
- Live text messaging, last-message previews, optimistic sending indicators, and manual retry using the same transaction ID.
- Contact search through the Matrix user directory.
- Profile display-name and avatar editing, including avatar removal.
- Group name, description, and avatar editing, member invitations, and leaving groups, subject to Matrix permissions.
- Blocking and unblocking through the Matrix ignored-users list.
- A chat context menu to leave and forget a conversation for the current account.
- A split chat layout on large screens and separate list/conversation views on smaller screens.

**Current scope:** messages are plain text. End-to-end encryption is not initialized, and encrypted messages are not supported. Presence labels such as “Online” and “last seen recently” are placeholders. See [Current limitations](#current-limitations).

## Technology

| Area | Implementation |
| --- | --- |
| UI | React 19, TypeScript 6 |
| Routing | React Router 7 with route loaders |
| Server-state queries | TanStack React Query 5 |
| Messaging | `matrix-js-sdk`, pinned to `41.8.0-rc.0` |
| Styling | Tailwind CSS 4, component CSS, Inter fonts |
| Components | Radix UI / shadcn, Lucide icons, Sonner notifications |
| Development and build | Vite 8, ESLint 9, pnpm |
| Local homeserver | Synapse in Docker |

## Run locally

Run commands from the repository root. Use Node.js 24 and pnpm 10 to match CI. Docker must be installed and running for the bundled homeserver. The Bash seed script also requires `curl`, Node.js, and Bash 4+.

### 1. Install dependencies

```sh
pnpm install --frozen-lockfile
```

The project uses `pnpm-lock.yaml` and the hoisted dependency layout in `pnpm-workspace.yaml`.

### 2. Start the local homeserver

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/setup.ps1
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/start.ps1
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/status.ps1
```

Linux, macOS with Bash 4+, or Windows Git Bash:

```bash
bash dev-backend/matrix/setup.sh
bash dev-backend/matrix/start.sh
bash dev-backend/matrix/status.sh
```

Setup pulls Synapse, generates configuration under `.matrix/synapse`, applies development settings, and creates `.env.local` if missing. Wait until the status command reaches the client API before seeding.

### 3. Seed sample users and conversations

PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File dev-backend/matrix/seed.ps1
```

Bash:

```bash
bash dev-backend/matrix/seed.sh
```

The seed creates `alex92`, `bob`, `maya`, and `sara`, direct chats with Bob and Maya, and a shared development group with sample messages. The default password is `password`; override it with `MATRIX_SEED_PASSWORD`. Existing users keep their passwords, which must match the seed password. Re-running the seed creates additional rooms and messages.

### 4. Run the frontend

```sh
pnpm dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Sign in as `alex92` with the seed password. Replace the login form's prefilled `diana` / `password` values: `diana` is not created by the seed.

Use separate isolated browser sessions to test multiple accounts without overwriting their local-storage sessions.

## Configuration

The frontend reads one environment variable from `.env.local`:

```dotenv
VITE_MATRIX_BASE_URL=http://localhost:8008
```

This is also the fallback URL in `src/services/backend.ts`. Restart Vite after changing it. Production builds embed the value, so rebuild when changing the deployed homeserver URL. `VITE_` variables are public frontend settings; do not put credentials in them.

To use an existing Matrix server, set this URL, provide an existing account, and skip Docker setup and seeding. The server must be reachable from the browser and permit the frontend origin through CORS. Login uses Matrix's username identifier; the “Email or Username” label does not implement a separate email-login flow.

The helper scripts use separate environment overrides:

| Variable | Default | Purpose |
| --- | --- | --- |
| `MATRIX_CONTAINER_NAME` | `jikjik-synapse` | Docker container name |
| `MATRIX_IMAGE` | `matrixdotorg/synapse:latest` | Synapse image |
| `MATRIX_SERVER_NAME` | `localhost` | Server name in Matrix IDs |
| `MATRIX_BASE_URL` | `http://localhost:8008` | URL used by helper scripts |
| `MATRIX_PORT` | `8008` | Published host port |
| `MATRIX_DATA_DIR` | `.matrix/synapse` under the repository | Persistent server data |
| `MATRIX_REGISTRATION_SECRET` | `dev-secret-change-me` | Development registration secret |
| `MATRIX_SEED_PASSWORD` | `password` | Sample-user password |

Keep `MATRIX_PORT`, `MATRIX_BASE_URL`, and `VITE_MATRIX_BASE_URL` consistent when changing ports. Setup preserves an existing `.env.local`; later script overrides do not update it. Starting an existing container preserves its original port mapping.

The supplied server settings are for development: unverified registration, broad directory search, relaxed rate limits, and public room publication. `set-config ... locked` disables registration but retains the other development overrides. It is not production hardening.

See [the backend guide](dev-backend/matrix/README.md) for user creation, stop/restart, logs, and reset commands. Most helpers have Bash and PowerShell variants; `delete-chats.sh` is Bash-only and purges all server rooms. The UI Delete action only leaves and forgets a room for the current user. Reset scripts delete the local container and its stored data.

## Commands and checks

| Command | Result |
| --- | --- |
| `pnpm dev` | Start Vite with hot reload |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Type-check the project and build into `dist/` |
| `pnpm preview` | Serve the built frontend for local inspection |

Pull requests trigger `.github/workflows/ci.yml`: install locked dependencies, lint, and build using Node.js 24 and pnpm 10. No automated unit, integration, or browser test suite is currently configured.

For a manual smoke check, sign in with two accounts, exchange a DM, accept/decline invitations, create a group, invite a member, edit profile/group details, block/unblock a user, and leave/forget a room. Check narrow and wide layouts. A successful-send checkmark indicates sending status, not a read receipt.

## Code map

```text
src/
  main.tsx                    React root and shared QueryClient
  router.tsx                  Routes and error boundaries
  loaders/loaders.ts          Session guards and room/invitation loading
  pages/                      Login, chat layout, chat page, errors
  components/
    chat/                     Timeline, composer, invitations, room details
    chats/                    Chat search/list, room joining and deletion
    create-group-dialog/      Group creation flow
    group-member-selector/    Contact search and member selection
    menu/                     Profile, groups, blocklist, logout
    ui/                       Shared Radix/shadcn primitives
  hooks/                      Debouncing, media, blocking, avatar upload
  services/
    backend.ts                Matrix lifecycle, API calls, app models
    backend-event.ts          Typed SDK-to-UI event bridge
    direct-room.ts            Direct-room classification and lookup
    session.ts                Authentication and browser storage
    draft-storage.ts          Draft DM target and first-message handoff
    pending-message-storage.ts Pending message state and subscriptions
  models/                     Pending-message and room-form types
  utilities/                  Errors, date/color helpers, encoding, IndexedDB
  assets/                     Images and illustrations
dev-backend/matrix/            Local Synapse lifecycle and seed scripts
.github/workflows/ci.yml       Pull-request checks
```

Imports beginning with `@/` resolve to `src/` through Vite and TypeScript configuration. Theme variables and Tailwind imports live in `src/index.css`.

### Data flow and storage

1. Login saves the Matrix access token, user ID, and device ID in `localStorage`. Creating the authenticated SDK client starts synchronization.
2. Route loaders guard pages and load room details. React Query fetches chats, contacts, messages, and profiles.
3. `backend-event.ts` translates SDK events into typed subscriptions. Components refetch queries or revalidate route loaders when events arrive.
4. Selecting a contact stores a draft DM target. The draft view resolves an existing direct room when known; otherwise the first send creates one and hands its message to the conversation through session storage.
5. Sending records a pending message with a client transaction ID. Timeline messages reconcile against that ID; retries reuse it.

Draft handoffs and pending messages use `sessionStorage` with `app:` keys. They survive reloads in the same tab but are not a durable outbox or cross-device draft system. Account changes and logout clear those session items. The general IndexedDB and Base64 helpers do not provide active message encryption or durable timeline storage.

### Routes

| Route | View |
| --- | --- |
| `/` | Login; an existing local session redirects to chats |
| `/chats` | Chat list and conversation placeholder |
| `/chats/draft` | Draft DM for a selected contact |
| `/chats/:chatId` | Conversation; invitations redirect to the invitation route |
| `/chats/:chatId/invite` | Accept, decline, or decline and block |

## Build and hosting

```sh
pnpm build
pnpm preview
```

Deploy `dist/` to a static host and configure an SPA fallback to `index.html` so direct links and refreshes under `/chats/...` work. The current configuration assumes hosting at the origin root. Run Matrix separately and use an HTTPS-accessible homeserver for an HTTPS frontend.

The Vite development server binds to all interfaces (`host: true`) and polls for file changes. Preview is for local build inspection. Neither command manages Synapse.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Login fails | Check server readiness with `status`, use a seeded account, and replace the prefilled credentials. |
| Connection/initial-sync errors | Check the homeserver URL, Docker logs, reachability, and CORS. The client waits up to 15 seconds for initial sync. |
| No contacts before typing | Empty searches use users already known to the SDK. Type a name to search the server directory. |
| Profile/group changes are forbidden | Matrix enforces account permissions and room power levels. |
| Port override has no effect | Update `.env.local`, restart Vite, and check the existing container's port mapping. |
| Server reset but app appears signed in | Log out and sign in again; the browser may retain a token from the deleted server state. |
| Refreshing a chat URL returns 404 | Configure the static host's SPA fallback. |

## Current limitations

- End-to-end encryption, registration UI, password recovery, attachments, calls, reactions, typing indicators, and read receipts are not implemented.
- The composer does not save normal unsent input as you type. Draft storage serves DM selection and first-message handoff.
- Each message query calls `scrollback(..., 50)`; there is no explicit load-more or scroll-driven pagination control.
- Presence lookups are bypassed in `withPresence`; visible status labels do not reflect reliable live presence.
- Logout removes local session data and stops synchronization but does not revoke the server access token.
- Tokens persist in browser `localStorage`. This development client should not be presented as end-to-end encrypted or production hardened.
- The production build currently warns about the bundled client's large JavaScript chunk.

See [REVIEW.md](REVIEW.md) for source-review findings and validation results.
