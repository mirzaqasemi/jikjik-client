import type {
    MatrixEvent,
    MatrixHttpMethod,
    MatrixJoinedRoomsResponse,
    MatrixLoginResponse,
    MatrixMemberContent,
    MatrixMessageContent,
    MatrixMessagesResponse,
    MatrixRoomAvatarContent,
    MatrixRoomCanonicalAliasContent,
    MatrixRoomCreateContent,
    MatrixRoomEncryptionContent,
    MatrixProfileResponse,
    MatrixRoomNameContent,
    MatrixRoomTopicContent,
    MatrixSession,
    MatrixUserDirectoryResponse,
} from "./matrix-models";
import * as session from "./session";

// -----------------------------------------
// Types
// -----------------------------------------
// TODO: Move these app-facing backend models to a dedicated models file or folder later.
export interface User
{
    /** Matrix user id, for example "@alex92:localhost". */
    username: string;

    /** Human-readable display name from Matrix profile or room membership state. */
    displayName: string;

    /** Matrix avatar MXC URI from profile, user directory, or room membership state. */
    avatarUrl?: string | null;

    /** Legacy UI status label. Currently populated from Matrix membership when available. */
    lastSeen?: string;

    /** Room membership state for this user, for example "join" or "invite". */
    membership?: string;
}

export interface Message
{
    /** User who sent the message. */
    sender: User;

    /** Plain text message body. Encryption is currently disabled. */
    content: string;

    /** Message timestamp converted from Matrix origin_server_ts. */
    date: Date;

    /**
     * @deprecated Use transactionId instead. This is the client-side Matrix transaction id and will be removed later.
     */
    uid?: string;

    /** Client-generated Matrix transaction id used for idempotent sends. */
    transactionId?: string;

    /** Server-generated Matrix event id, for example "$event:localhost". */
    eventId?: string;

    /** Matrix room id where this message belongs, for example "!room:localhost". */
    roomId?: string;

    /** Matrix message type, for example "m.text". */
    messageType?: string;

    /** Event age in milliseconds as reported by Matrix, when included in the response. */
    age?: number;
}

export interface Chat
{
    /** Matrix room id, for example "!room:localhost". */
    id: string;

    /** Room display title from m.room.name, or derived from members for group chats. */
    title?: string;

    /** Joined room members currently exposed to the UI. */
    users: User[];

    /** Most recent text message loaded for the room, or null when no text message was found. */
    lastMsg: Message | null;

    /** Room avatar MXC URI from m.room.avatar. */
    avatarUrl?: string;

    /** Main published room alias from m.room.canonical_alias. */
    canonicalAlias?: string;

    /** Matrix user id that created the room. */
    creator?: string;

    /** True when the room has m.room.encryption state. */
    encrypted?: boolean;

    /** Matrix encryption algorithm from m.room.encryption, for example "m.megolm.v1.aes-sha2". */
    encryptionAlgorithm?: string;

    /** Matrix room version from m.room.create. */
    roomVersion?: string;

    /** Room topic from m.room.topic. */
    topic?: string;
}

const MATRIX_BASE_URL = (import.meta.env.VITE_MATRIX_BASE_URL || "http://localhost:8008").replace(/\/$/, "");
const MATRIX_ACCESS_TOKEN_KEY = "matrixAccessToken";
const MATRIX_DEVICE_ID_KEY = "matrixDeviceId";
const MATRIX_USER_ID_KEY = "matrixUserId";

// -----------------------------------------
// Matrix helpers
// -----------------------------------------
function matrixPath(path: string): string {
    return `${MATRIX_BASE_URL}/_matrix/client/v3${path}`;
}

function encodePathPart(value: string): string {
    return encodeURIComponent(value);
}

function storeMatrixSession(matrixSession: MatrixSession): void {
    localStorage.setItem(MATRIX_ACCESS_TOKEN_KEY, matrixSession.accessToken);
    localStorage.setItem(MATRIX_USER_ID_KEY, matrixSession.userId);

    if (matrixSession.deviceId) {
        localStorage.setItem(MATRIX_DEVICE_ID_KEY, matrixSession.deviceId);
    } else {
        localStorage.removeItem(MATRIX_DEVICE_ID_KEY);
    }
}

function getMatrixSession(): MatrixSession | null {
    const accessToken = localStorage.getItem(MATRIX_ACCESS_TOKEN_KEY);
    const userId = localStorage.getItem(MATRIX_USER_ID_KEY);

    if (!accessToken || !userId) {
        return null;
    }

    return {
        accessToken,
        deviceId: localStorage.getItem(MATRIX_DEVICE_ID_KEY) || undefined,
        userId,
    };
}

export function clearMatrixSession(): void {
    localStorage.removeItem(MATRIX_ACCESS_TOKEN_KEY);
    localStorage.removeItem(MATRIX_DEVICE_ID_KEY);
    localStorage.removeItem(MATRIX_USER_ID_KEY);
}

async function matrixFetch<T>(method: MatrixHttpMethod, path: string, body?: unknown, authenticated = true): Promise<T> {
    const headers: Record<string, string> = {};

    if (body != null) {
        headers["Content-Type"] = "application/json";
    }

    if (authenticated) {
        const matrixSession = getMatrixSession();
        if (matrixSession == null) {
            throw new Error("User not logged in");
        }
        headers.Authorization = `Bearer ${matrixSession.accessToken}`;
    }

    const response = await fetch(matrixPath(path), {
        method,
        headers,
        body: body == null ? undefined : JSON.stringify(body),
    });

    if (response.ok) {
        if (response.status === 204) {
            return undefined as T;
        }
        return response.json() as Promise<T>;
    }

    let message = `Matrix request failed: ${method} ${path} (${response.status})`;
    try {
        const errorBody = await response.json() as { error?: string; errcode?: string };
        message = errorBody.error || errorBody.errcode || message;
    } catch {
        // Keep the status-based message when Synapse does not return JSON.
    }
    throw new Error(message);
}

function getCurrentMatrixUserId(): string {
    const matrixSession = getMatrixSession();
    if (matrixSession != null) {
        return matrixSession.userId;
    }

    return session.mustGetUser().username;
}

function displayNameFromUserId(userId: string): string {
    const localPart = userId.startsWith("@") ? userId.slice(1).split(":")[0] : userId;
    return localPart || userId;
}

function userFromMemberEvent(event: MatrixEvent<MatrixMemberContent>): User {
    const userId = event.state_key || event.sender || "";
    return {
        username: userId,
        displayName: event.content?.displayname || displayNameFromUserId(userId),
        avatarUrl: event.content?.avatar_url,
        lastSeen: event.content?.membership,
        membership: event.content?.membership,
    };
}

async function userFromId(userId: string): Promise<User> {
    try {
        const profile = await matrixFetch<MatrixProfileResponse>("GET", `/profile/${encodePathPart(userId)}`);
        return {
            username: userId,
            displayName: profile.displayname || displayNameFromUserId(userId),
            avatarUrl: profile.avatar_url,
        };
    } catch {
        return {
            username: userId,
            displayName: displayNameFromUserId(userId),
        };
    }
}

function messageFromEvent(event: MatrixEvent<MatrixMessageContent>, roomUsers: User[]): Message | null {
    if (event.type !== "m.room.message" || event.content?.msgtype !== "m.text" || !event.content.body) {
        return null;
    }

    const senderId = event.sender || "";
    const sender = roomUsers.find(user => user.username === senderId) || {
        username: senderId,
        displayName: displayNameFromUserId(senderId),
    };

    const transactionId = event.unsigned?.transaction_id;

    return {
        sender,
        content: event.content.body,
        date: new Date(event.origin_server_ts || Date.now()),
        uid: transactionId,
        transactionId,
        eventId: event.event_id,
        roomId: event.room_id,
        messageType: event.content.msgtype,
        age: event.age ?? event.unsigned?.age,
    };
}

async function getRoomState(roomId: string): Promise<MatrixEvent[]> {
    return matrixFetch<MatrixEvent[]>("GET", `/rooms/${encodePathPart(roomId)}/state`);
}

function usersFromRoomState(state: MatrixEvent[]): User[] {
    return state
        .filter(event => {
            const content = event.content as MatrixMemberContent | undefined;
            return event.type === "m.room.member" &&
                content?.membership === "join" &&
                typeof event.state_key === "string";
        })
        .map(event => event as MatrixEvent<MatrixMemberContent>)
        .map(userFromMemberEvent);
}

function titleFromRoomState(state: MatrixEvent[], users: User[]): string | undefined {
    const roomNameEvent = state.find(event => {
        const content = event.content as MatrixRoomNameContent | undefined;
        return event.type === "m.room.name" && typeof content?.name === "string";
    });
    const roomName = (roomNameEvent?.content as MatrixRoomNameContent | undefined)?.name;

    if (roomName) {
        return roomName;
    }

    if (users.length > 2) {
        return users
            .filter(user => user.username !== getCurrentMatrixUserId())
            .map(user => user.displayName)
            .join(", ");
    }

    return undefined;
}

function contentFromState<TContent>(state: MatrixEvent[], type: string): TContent | undefined {
    return state.find(event => event.type === type)?.content as TContent | undefined;
}

async function getRoomMessages(roomId: string, roomUsers: User[], limit: number): Promise<Message[]> {
    const query = new URLSearchParams({
        dir: "b",
        limit: String(limit),
    });
    const response = await matrixFetch<MatrixMessagesResponse>("GET", `/rooms/${encodePathPart(roomId)}/messages?${query}`);

    return response.chunk
        .map(event => messageFromEvent(event, roomUsers))
        .filter((message): message is Message => message != null)
        .reverse();
}

async function chatFromRoomId(roomId: string): Promise<Chat> {
    const state = await getRoomState(roomId);
    let users = usersFromRoomState(state);

    if (users.length === 0) {
        users = [await userFromId(getCurrentMatrixUserId())];
    }

    const messages = await getRoomMessages(roomId, users, 1);
    const avatar = contentFromState<MatrixRoomAvatarContent>(state, "m.room.avatar");
    const canonicalAlias = contentFromState<MatrixRoomCanonicalAliasContent>(state, "m.room.canonical_alias");
    const create = contentFromState<MatrixRoomCreateContent>(state, "m.room.create");
    const encryption = contentFromState<MatrixRoomEncryptionContent>(state, "m.room.encryption");
    const topic = contentFromState<MatrixRoomTopicContent>(state, "m.room.topic");

    return {
        id: roomId,
        title: titleFromRoomState(state, users),
        users,
        lastMsg: messages[0] || null,
        avatarUrl: avatar?.url,
        canonicalAlias: canonicalAlias?.alias,
        creator: create?.creator,
        encrypted: encryption != null,
        encryptionAlgorithm: encryption?.algorithm,
        roomVersion: create?.room_version,
        topic: topic?.topic,
    };
}

// -----------------------------------------
// API Functions
// -----------------------------------------
export async function login(username: string, password: string): Promise<User | null> {
    const loginResponse = await matrixFetch<MatrixLoginResponse>("POST", "/login", {
        type: "m.login.password",
        identifier: {
            type: "m.id.user",
            user: username,
        },
        password,
    }, false);

    storeMatrixSession({
        accessToken: loginResponse.access_token,
        deviceId: loginResponse.device_id,
        userId: loginResponse.user_id,
    });

    return currentUser();
}

export async function currentUser(username?: string): Promise<User | null> {
    const matrixSession = getMatrixSession();
    const userId = username || matrixSession?.userId;

    if (!userId) {
        return null;
    }

    return userFromId(userId);
}

export async function getChats(filter?: string): Promise<Chat[]> {
    const response = await matrixFetch<MatrixJoinedRoomsResponse>("GET", "/joined_rooms");
    const chats = await Promise.all(response.joined_rooms.map(chatFromRoomId));
    const normalizedFilter = (filter || "").trim().toLowerCase();

    const sortedChats = chats.sort((a, b) => {
        const aTime = a.lastMsg?.date.getTime() || 0;
        const bTime = b.lastMsg?.date.getTime() || 0;
        return bTime - aTime;
    });

    if (!normalizedFilter) {
        return sortedChats;
    }

    return sortedChats.filter(chat => {
        const haystack = [
            chat.title,
            chat.lastMsg?.content,
            ...chat.users.map(user => user.displayName),
            ...chat.users.map(user => user.username),
        ].filter(Boolean).join(" ").toLowerCase();

        return haystack.includes(normalizedFilter);
    });
}

export async function getChat(chatId: string): Promise<Chat> {
    return chatFromRoomId(chatId);
}

export async function getMessages(chatId: string): Promise<Message[]> {
    const chat = await getChat(chatId);
    return getRoomMessages(chatId, chat.users, 50);
}

export async function sendMessage(req: {
    username: string;
    chat: Chat;
    content: string;
    /**
     * @deprecated Use transactionId instead. This is the client-side Matrix transaction id and will be removed later.
     */
    uid?: string;
    transactionId?: string;
}): Promise<void> {
    const transactionId = req.transactionId || req.uid || crypto.randomUUID();
    await matrixFetch<Record<string, string>>(
        "PUT",
        `/rooms/${encodePathPart(req.chat.id)}/send/m.room.message/${encodePathPart(transactionId)}`,
        {
            msgtype: "m.text",
            body: req.content,
        }
    );
}

export async function getContacts(): Promise<User[]> {
    const searchTerms = "abcdefghijklmnopqrstuvwxyz0123456789_".split("");
    const responses = await Promise.all(searchTerms.map(searchTerm =>
        matrixFetch<MatrixUserDirectoryResponse>("POST", "/user_directory/search", {
            search_term: searchTerm,
            limit: 20,
        }).catch(() => ({ results: [] }))
    ));
    const currentUserId = getCurrentMatrixUserId();
    const contacts = new Map<string, User>();

    for (const response of responses) {
        for (const result of response.results) {
            if (result.user_id === currentUserId || contacts.has(result.user_id)) {
                continue;
            }

            contacts.set(result.user_id, {
                username: result.user_id,
                displayName: result.display_name || displayNameFromUserId(result.user_id),
                avatarUrl: result.avatar_url,
            });
        }
    }

    return [...contacts.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}
