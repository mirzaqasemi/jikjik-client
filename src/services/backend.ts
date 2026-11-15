import {
    ClientEvent,
    createClient,
    EventType,
    type MatrixClient,
    MatrixEvent,
    MsgType,
    type Room,
    type RoomMember,
    User as SdkUser,
    SyncState,
} from "matrix-js-sdk";
import { Preset, Visibility } from "matrix-js-sdk/lib/@types/partials";
import type { ICreateRoomOpts } from "matrix-js-sdk/lib/@types/requests";
import type { IContent } from "matrix-js-sdk/lib/models/event";
import {
    attachBackendEventClient,
    detachBackendEventClient,
    notifyCurrentUserProfileChange,
    subscribeChatChanged,
} from "./backend-event";
import { type DirectRooms, findDirectRoomId, getDirectRoomInviter, isDirectRoom, isVisibleRoom, } from "./direct-room";
import * as session from "./session";

// -----------------------------------------
// Types
// -----------------------------------------
// TODO: Move these app-facing backend models to a dedicated models file or folder later.
export interface User {
    /** Canonical Matrix user id, for example "@alex92:localhost". */
    userId: string;

    /**
     * @deprecated Use userId instead. This is currently kept as a compatibility alias for older UI code.
     */
    username: string;

    /** Human-readable display name from Matrix profile or room membership state. */
    displayName: string;

    /** Matrix avatar MXC URI from profile, user directory, or room membership state. */
    avatarUri?: string | null;

    /** Last known Matrix activity timestamp, derived from presence last_active_ago when available. */
    lastSeen?: Date;

    /** Matrix presence state when available. */
    presence?: "online" | "offline" | "unavailable";

    /** True when Matrix reports this user is actively online. */
    currentlyActive?: boolean;

    /** Optional Matrix presence status message. */
    statusMessage?: string;

    /** Room membership state for this user, for example "join" or "invite". */
    membership?: string;
}

export interface Message {
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

export interface Chat {
    /** Matrix room id, for example "!room:localhost". */
    id: string;

    /** True when this room is marked as a direct-message conversation. */
    isDm: boolean;

    /** True when this room is published in the public room directory. */
    isPublic: boolean;

    /** Current user's Matrix membership in this room, for example "join", "invite", or "leave". */
    membership?: string;

    /** User who invited the current user. Only available while membership is "invite". */
    inviter?: User;

    /** Room display title from m.room.name, or derived by the SDK when room state is available. */
    title?: string;

    /** Joined room members currently exposed to the UI. */
    users: User[];

    /** Most recent text message loaded for the room, or null when no text message was found. */
    lastMsg: Message | null;

    /** Room avatar MXC URI or resolved media URL from SDK room state. */
    avatarUrl?: string | null;

    /** Main published room alias from m.room.canonical_alias. */
    canonicalAlias?: string | null;

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

type UnclassifiedChat = Omit<Chat, "isDm" | "isPublic">;

export interface CreateRoomRequest {
    /** Human-readable room name shown in chat lists and room headers. */
    title: string;

    /** Optional room topic/description stored in Matrix room state. */
    topic?: string;

    /** Matrix users to invite at creation time. They are not participants until they join. */
    invitees?: string[];

    /** Matrix room directory visibility. Defaults to private. */
    visibility?: ICreateRoomOpts["visibility"];

    /** Matrix creation preset, for example private_chat or public_chat. */
    preset?: ICreateRoomOpts["preset"];

    /** Optional localpart for a published room alias. */
    roomAliasName?: string;

    /** Optional Matrix room version override. Leave unset for the homeserver default. */
    roomVersion?: string;

    /** Optional Matrix state events to include during room creation. */
    initialState?: ICreateRoomOpts["initial_state"];

    /** Optional Matrix power-level overrides for moderation/admin rules. */
    powerLevelContentOverride?: ICreateRoomOpts["power_level_content_override"];

    /** Optional low-level Matrix creation content, such as room type. */
    creationContent?: ICreateRoomOpts["creation_content"];
}

const MATRIX_BASE_URL = (import.meta.env.VITE_MATRIX_BASE_URL || "http://localhost:8008").replace(/\/$/, "");
const TEXT_MESSAGE_EVENT_TYPE = "m.room.message";

let matrixClient: MatrixClient | null = null;

function createSdkClient(): MatrixClient {
    const matrixSession = session.getMatrixSession();
    if (matrixSession == null) {
        throw new Error("User not logged in");
    }

    const client = createClient({
        baseUrl: MATRIX_BASE_URL,
        accessToken: matrixSession.accessToken,
        deviceId: matrixSession.deviceId,
        timelineSupport: true,
        userId: matrixSession.userId,
    });
    attachBackendEventClient(client);
    client.startClient({
        initialSyncLimit: 20,
    });
    return client;
}

function getClient(): MatrixClient {
    const matrixSession = session.getMatrixSession();
    if (matrixSession == null) {
        resetClient();
        throw new Error("User not logged in");
    }

    if (matrixClient !== null && matrixClient.getUserId() !== matrixSession.userId) {
        resetClient();
    }

    if (matrixClient == null) {
        matrixClient = createSdkClient();
    }
    return matrixClient;
}

function resetClient(): void {
    detachBackendEventClient();
    matrixClient?.stopClient();
    matrixClient = null;
}

function waitForInitialSync(client: MatrixClient): Promise<void> {
    if (client.isInitialSyncComplete()) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            cleanup();
            reject(new Error("Matrix initial sync timed out"));
        }, 15000);

        function cleanup() {
            client.off(ClientEvent.Sync, handleSync);
            window.clearTimeout(timeoutId);
        }

        function handleSync(state: SyncState) {
            if (client.isInitialSyncComplete() || state === SyncState.Prepared) {
                cleanup();
                resolve();
                return;
            }

            if (state === SyncState.Error || state === SyncState.Stopped) {
                cleanup();
                reject(new Error("Matrix initial sync failed"));
            }
        }

        client.on(ClientEvent.Sync, handleSync);
        const currentState = client.getSyncState();
        if (currentState != null) {
            handleSync(currentState);
        }
    });
}

function displayNameFromUserId(userId: string): string {
    const localPart = userId.startsWith("@") ? userId.slice(1).split(":")[0] : userId;
    return localPart || userId;
}

function currentServerName(): string {
    const userId = session.getMatrixSession()?.userId;
    const serverName = userId?.split(":").slice(1).join(":");
    if (!serverName) {
        throw new Error("User not logged in");
    }
    return serverName;
}

function normalizeUserId(username: string): string {
    const trimmedUsername = username.trim();
    if (trimmedUsername.startsWith("@")) {
        return trimmedUsername;
    }
    return `@${trimmedUsername}:${currentServerName()}`;
}

export function userFromUserId(
    userId: string,
    user: Omit<User, "userId" | "username"> = { displayName: displayNameFromUserId(userId) },
): User {
    return {
        userId,
        username: userId,
        ...user,
    };
}

function lastSeenFromPresence(lastActiveAgo?: number): Date | undefined {
    if (lastActiveAgo == null) {
        return undefined;
    }

    return new Date(Date.now() - lastActiveAgo);
}

async function withPresence(user: User): Promise<User> {
    //FIXME this gets 403 and too many requests
    return user;
    try {
        const presence = await getClient().getPresence(user.userId);
        return {
            ...user,
            presence: presence.presence,
            currentlyActive: presence.currently_active,
            statusMessage: presence.status_msg,
            lastSeen: lastSeenFromPresence(presence.last_active_ago),
        };
    } catch {
        return user;
    }
}

async function withPresenceForUsers(users: User[]): Promise<User[]> {
    return Promise.all(users.map(withPresence));
}

async function markDirectRoom(userId: string, roomId: string): Promise<void> {
    const client = getClient();
    const directRooms = await client.getAccountDataFromServer(EventType.Direct) || {};
    const userRooms = directRooms[userId] || [];

    if (userRooms.includes(roomId)) {
        return;
    }

    await client.setAccountData(EventType.Direct, {
        ...directRooms,
        [userId]: [...userRooms, roomId],
    });
}

async function unmarkDirectRoom(roomId: string): Promise<void> {
    const client = getClient();
    const directRooms = (await client.getAccountDataFromServer(EventType.Direct) || {}) as DirectRooms;
    const updatedDirectRooms: DirectRooms = {};
    let changed = false;

    Object.entries(directRooms).forEach(([userId, roomIds]) => {
        const updatedRoomIds = roomIds.filter(id => id !== roomId);
        if (updatedRoomIds.length !== roomIds.length) {
            changed = true;
        }
        if (updatedRoomIds.length > 0) {
            updatedDirectRooms[userId] = updatedRoomIds;
        }
    });

    if (changed) {
        await client.setAccountData(EventType.Direct, updatedDirectRooms);
    }
}

async function getDirectRooms(): Promise<DirectRooms> {
    return (await getClient().getAccountDataFromServer(EventType.Direct) || {}) as DirectRooms;
}

function userFromMember(member: RoomMember): User {
    return userFromUserId(member.userId, {
        displayName: member.name || displayNameFromUserId(member.userId),
        avatarUri: member.events.member?.getContent().avatar_url,
        membership: member.membership,
    });
}

function userFromProfile(userId: string, profile: { avatar_url?: string; displayname?: string }): User {
    return userFromUserId(userId, {
        displayName: profile.displayname || displayNameFromUserId(userId),
        avatarUri: profile.avatar_url,
    });
}

/** Upload an image to the Matrix media server and return its MXC URI. */
export async function uploadAvatar(file: File): Promise<string> {
    return (await getClient().uploadContent(file)).content_uri;
}

export async function resolveMediaUrl(mediaUri: string | null): Promise<string | null> {
    if (!mediaUri) return null;
    if (!mediaUri.startsWith("mxc://")) return mediaUri;
    const token = session.getMatrixSession()?.accessToken;
    // Convert the MXC URI to a Matrix download URL.
    const url = getClient().mxcUrlToHttp(mediaUri, undefined, undefined, undefined, undefined, undefined, true);

    if (!token || !url) return null;

    // Download the media using the current Matrix session's access token.
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) return null;
    return URL.createObjectURL(await response.blob())
}

export interface UserProfileUpdate {
    displayName?: string;
    /** Matrix MXC URI, or an empty string to clear the avatar. */
    avatarUrl?: string;
}

/** Update the supplied fields on the signed-in user's Matrix profile. */
export async function updateUserProfile({ displayName, avatarUrl }: UserProfileUpdate): Promise<void> {
    if (displayName === undefined && avatarUrl === undefined) {
        return;
    }

    const userId = session.mustGetUserId();
    const client = getClient();

    if (displayName !== undefined) {
        await client.setDisplayName(displayName);
        notifyCurrentUserProfileChange(client, userId);
    }
    if (avatarUrl !== undefined) {
        await client.setAvatarUrl(avatarUrl);
        notifyCurrentUserProfileChange(client, userId);
    }
}

/** Set the current user's display name on Matrix. */
export function setUserDisplayName(displayName: string): Promise<void> {
    return updateUserProfile({ displayName });
}

/** Set the current user's profile avatar on Matrix. */
export function setUserAvatar(avatarUrl: string): Promise<void> {
    return updateUserProfile({ avatarUrl });
}

export async function setGroupAvatar(chatId: string, avatarUrl: string): Promise<void> {
    await getClient().sendStateEvent(chatId, EventType.RoomAvatar, { url: avatarUrl })
}

function messageFromEvent(event: MatrixEvent, roomUsers: User[]): Message | null {
    const content = event.getContent();
    if (event.getType() !== TEXT_MESSAGE_EVENT_TYPE || content.msgtype !== MsgType.Text || !content.body) {
        return null;
    }

    const senderId = event.getSender() || "";
    const sender = roomUsers.find(user => user.userId === senderId) || userFromUserId(senderId, {
        displayName: displayNameFromUserId(senderId),
    });
    const transactionId = event.getTxnId() || event.getUnsigned().transaction_id;

    return {
        sender,
        content: content.body,
        date: event.getDate() || new Date(event.getTs() || Date.now()),
        uid: transactionId,
        transactionId,
        eventId: event.getId(),
        roomId: event.getRoomId(),
        messageType: content.msgtype,
        age: event.getAge(),
    };
}

function stateContent<TContent extends IContent>(room: Room, eventType: string): TContent | undefined {
    return room.currentState.getStateEvents(eventType, "")?.getContent<TContent>();
}

function chatFromSdkRoom(room: Room): UnclassifiedChat {
    const users = room.getMembers().map(userFromMember); //TODO add support for invited members
    const currentUserId = getClient().getUserId();
    const inviterId = room.getMyMembership() === "invite" && currentUserId != null
        ? room.getMember(currentUserId)?.events.member?.getSender()
        : undefined;
    const inviter = inviterId != null
        ? users.find(user => user.userId === inviterId)
        || userFromUserId(inviterId, { displayName: displayNameFromUserId(inviterId) })
        : undefined;

    const messages = room.getLiveTimeline()
        .getEvents()
        .map(event => messageFromEvent(event, users))
        .filter((message): message is Message => message != null);
    const create = stateContent<{ creator?: string; room_version?: string }>(room, EventType.RoomCreate);
    const encryption = stateContent<{ algorithm?: string }>(room, EventType.RoomEncryption);
    const topic = stateContent<{ topic?: string }>(room, EventType.RoomTopic);
    return {
        id: room.roomId,
        membership: room.getMyMembership(),
        inviter,
        title: room.name || undefined,
        users,
        lastMsg: messages.at(-1) || null,
        avatarUrl: room.getMxcAvatarUrl() || room.getAvatarUrl(MATRIX_BASE_URL, 64, 64, "crop", false),
        canonicalAlias: room.getCanonicalAlias(),
        creator: create?.creator,
        encrypted: encryption != null,
        encryptionAlgorithm: encryption?.algorithm,
        roomVersion: room.getVersion() || create?.room_version,
        topic: topic?.topic,
    };
}

function userFromMemberState(userId: string, content: IContent): User {
    return userFromUserId(userId, {
        displayName: content.displayname || displayNameFromUserId(userId),
        avatarUri: content.avatar_url,
        membership: content.membership,
    });
}

function chatFromInitialSync(
    roomId: string,
    response: Awaited<ReturnType<MatrixClient["roomInitialSync"]>>,
): UnclassifiedChat {
    const state = response.state || [];
    const users = state
        .filter(event =>
            event.type === EventType.RoomMember && event.state_key)
        .map(event => userFromMemberState(event.state_key!, event.content));
    const currentUserId = getClient().getUserId();
    const inviterId = response.membership === "invite" && currentUserId != null
        ? state.find(event =>
            event.type === EventType.RoomMember
            && event.state_key === currentUserId
            && event.content.membership === "invite"
        )?.sender
        : undefined;
    const inviter = inviterId != null
        ? users.find(user => user.userId === inviterId)
        || userFromUserId(inviterId, { displayName: displayNameFromUserId(inviterId) })
        : undefined;
    const events = (response.messages?.chunk || []).map(event => new MatrixEvent(event));
    const messages = events
        .map(event => messageFromEvent(event, users))
        .filter((message): message is Message => message != null);
    const roomName = state.find(event => event.type === EventType.RoomName)?.content.name;
    const avatar = state.find(event => event.type === EventType.RoomAvatar)?.content.url;
    const canonicalAlias = state.find(event => event.type === EventType.RoomCanonicalAlias)?.content.alias;
    const create = state.find(event => event.type === EventType.RoomCreate)?.content;
    const encryption = state.find(event => event.type === EventType.RoomEncryption)?.content;
    const topic = state.find(event => event.type === EventType.RoomTopic)?.content.topic;

    return {
        id: roomId,
        membership: response.membership,
        inviter,
        title: roomName,
        users,
        lastMsg: messages.at(-1) || null,
        avatarUrl: avatar,
        canonicalAlias,
        creator: create?.creator,
        encrypted: encryption != null,
        encryptionAlgorithm: encryption?.algorithm,
        roomVersion: create?.room_version,
        topic,
    };
}

type PublicRoomSummary = Awaited<ReturnType<MatrixClient["publicRooms"]>>["chunk"][number];

function chatFromPublicRoom(room: PublicRoomSummary): Chat {
    return {
        id: room.room_id,
        isDm: false,
        isPublic: true,
        membership: getClient().getRoom(room.room_id)?.getMyMembership(),
        title: room.name || room.canonical_alias || room.room_id,
        users: [],
        lastMsg: null,
        avatarUrl: room.avatar_url,
        canonicalAlias: room.canonical_alias,
        topic: room.topic,
    };
}

async function isRoomListedPublicly(roomId: string): Promise<boolean> {
    try {
        const response = await getClient().getRoomDirectoryVisibility(roomId);
        return response.visibility === Visibility.Public;
    } catch {
        // Directory visibility can be unavailable for remote rooms or on
        // homeservers which restrict this endpoint. Such rooms should not be
        // presented as locally discoverable unless publicRooms returned them.
        return false;
    }
}

async function getSdkRoomOrInitialSync(roomId: string, directRooms?: DirectRooms): Promise<Chat> {
    const client = getClient();
    const room = client.getRoom(roomId);
    let chat: UnclassifiedChat;
    if (room != null) {
        chat = chatFromSdkRoom(room);
    } else {
        chat = chatFromInitialSync(roomId, await client.roomInitialSync(roomId, 1));
    }

    const [resolvedDirectRooms, isPublic, users] = await Promise.all([
        directRooms ? Promise.resolve(directRooms) : getDirectRooms(),
        isRoomListedPublicly(roomId),
        withPresenceForUsers(chat.users),
    ]);

    return {
        ...chat,
        isDm: isDirectRoom(client, roomId, resolvedDirectRooms),
        isPublic,
        users,
    };
}

async function getVisibleRoomIds(): Promise<string[]> {
    const client = getClient();
    const roomIds = new Set<string>();

    await waitForInitialSync(client);

    client.getRooms()
        .filter(isVisibleRoom)
        .forEach(room => roomIds.add(room.roomId));

    const response = await client.getJoinedRooms();
    response.joined_rooms.forEach(roomId => roomIds.add(roomId));

    return [...roomIds];
}

async function getRoomUsers(roomId: string): Promise<User[]> {
    const room = getClient().getRoom(roomId);
    if (room != null) {
        return withPresenceForUsers(room.getJoinedMembers().map(userFromMember));
    }

    const response = await getClient().getJoinedRoomMembers(roomId);
    return withPresenceForUsers(Object.entries(response.joined).map(([userId, profile]) => userFromUserId(userId, {
        displayName: profile.display_name || displayNameFromUserId(userId),
        avatarUri: profile.avatar_url,
        membership: "join",
    })));
}

// -----------------------------------------
// API Functions
// -----------------------------------------
export async function login(loginIdentifier: string, password: string): Promise<User | null> {
    resetClient();
    const loginClient = createClient({ baseUrl: MATRIX_BASE_URL });
    const loginResponse = await loginClient.loginRequest({
        type: "m.login.password",
        identifier: {
            type: "m.id.user",
            user: loginIdentifier,
        },
        password,
    });

    session.setMatrixSession({
        accessToken: loginResponse.access_token,
        deviceId: loginResponse.device_id,
        userId: loginResponse.user_id,
    });
    matrixClient = createSdkClient();

    return currentUser();
}

export function logout(): void {
    resetClient();
    session.clearSession();
}

export async function currentUser(): Promise<User | null> {
    const userId = session.getMatrixSession()?.userId;
    if (!userId) {
        return null;
    }

    try {
        return userFromProfile(userId, await getClient().getProfileInfo(userId));
    } catch {
        return userFromUserId(userId);
    }
}

export async function getChats(filter?: string): Promise<Chat[]> {
    const normalizedFilter = (filter || "").trim().toLowerCase();
    const [roomIds, directRooms, publicRooms] = await Promise.all([
        getVisibleRoomIds(),
        getDirectRooms(),
        normalizedFilter
            ? getClient().publicRooms({
                limit: 20,
                filter: { generic_search_term: normalizedFilter },
            })
            : Promise.resolve(null),
    ]);
    const chats = await Promise.all(roomIds.map(roomId => getSdkRoomOrInitialSync(roomId, directRooms)));
    const sortedChats = chats.sort((a, b) => {
        const aTime = a.lastMsg?.date.getTime() || 0;
        const bTime = b.lastMsg?.date.getTime() || 0;
        return bTime - aTime;
    });

    if (!normalizedFilter) {
        return sortedChats;
    }

    const matchingChats = sortedChats.filter(chat => {
        const haystack = [
            chat.title,
            chat.lastMsg?.content,
            ...chat.users.map(user => user.displayName),
            ...chat.users.map(user => user.userId),
        ].filter(Boolean).join(" ").toLowerCase();

        return haystack.includes(normalizedFilter);
    });

    const chatsById = new Map(sortedChats.map(chat => [chat.id, chat]));
    const resultsById = new Map(matchingChats.map(chat => [chat.id, chat]));
    publicRooms?.chunk.forEach(room => {
        const chat = chatsById.get(room.room_id) || chatFromPublicRoom(room);
        resultsById.set(room.room_id, chat);
    });
    return [...resultsById.values()];
}

export async function getChat(chatId: string): Promise<Chat> {
    await waitForInitialSync(getClient()).catch(() => undefined);
    return getSdkRoomOrInitialSync(chatId);
}

export async function getDirectRoomId(username: string): Promise<string | null> {
    const userId = normalizeUserId(username);
    const client = getClient();

    await waitForInitialSync(client);

    const directRooms = await client.getAccountDataFromServer(EventType.Direct) || {};
    return findDirectRoomId(client, userId, directRooms);
}

export async function acceptChatInvitation(chatId: string): Promise<Chat> {
    const client = getClient();
    const directRoomInviter = getDirectRoomInviter(client, chatId);
    const room = await client.joinRoom(chatId);
    if (directRoomInviter != null) {
        await markDirectRoom(directRoomInviter, room.roomId);
    }
    return getSdkRoomOrInitialSync(room.roomId);
}

export async function joinPublicRoom(roomId: string): Promise<void> {
    await getClient().joinRoom(roomId);
}

export function waitForJoinRoom(roomId: string): Promise<void> {
    let settled = false;
    return new Promise((resolve, reject) => {
        const cleanup = subscribeChatChanged(roomId, (e) => {
            if (e.type === "roomChanged" && e.roomChange.type === "membership" && e.roomChange.membership === "join") {
                cleanup();
                if (!settled) {
                    settled = true;
                    resolve();
                }
            }
        });
        getSdkRoomOrInitialSync(roomId)
            .then((room) => {
                if (room.membership === "join") {
                    cleanup();
                    if (!settled) {
                        settled = true;
                        resolve();
                    }
                }
            })
            .catch((error) => {
                settled = true;
                cleanup();
                reject(error);
            });
    });
}

export async function declineChatInvitation(chatId: string): Promise<void> {
    const client = getClient();
    await client.leave(chatId);
    await client.forget(chatId).catch(() => undefined);
}

export async function deleteRoom(roomId: string): Promise<void> {
    const client = getClient();

    // Matrix does not have a client API to delete a room for everyone.
    // Leave/reject removes this user from the room, then forget removes it from this user's room history.
    await client.leave(roomId);
    await client.forget(roomId);
    await unmarkDirectRoom(roomId).catch(() => undefined);
}

/** Leave a group without forgetting its room history. */
export async function leaveGroup(chatId: string): Promise<void> {
    await getClient().leave(chatId);
}

export async function blockUser(username: string): Promise<void> {
    const userId = normalizeUserId(username);
    const client = getClient();
    const ignoredUsers = new Set(client.getIgnoredUsers());
    if (ignoredUsers.has(userId)) {
        return;
    }

    await client.setIgnoredUsers([...ignoredUsers, userId]);
}

/** Check whether a user is in the locally synchronized Matrix ignored-users list. */
export function isUserBlocked(username: string): boolean {
    const userId = normalizeUserId(username);
    return getClient().getIgnoredUsers().includes(userId);
}

export function getBlockedUsers(): Promise<User[]> {
    return withPresenceForUsers(getClient().getIgnoredUsers().map(userId => mapUser(getClient().getUser(userId) ?? {
        userId: userId,
        displayName: displayNameFromUserId(userId),
        avatarUrl: "",
    })));

}

export async function unblockUser(username: string): Promise<void> {
    const userId = normalizeUserId(username);
    const client = getClient();
    const ignoredUsers = new Set(client.getIgnoredUsers());
    if (!ignoredUsers.delete(userId)) {
        return;
    }
    await client.setIgnoredUsers([...ignoredUsers]);
}

export async function createDm(username: string): Promise<Chat> {
    const userId = normalizeUserId(username);
    const response = await getClient().createRoom({
        preset: Preset.PrivateChat,
        visibility: Visibility.Private,
        invite: [userId],
        is_direct: true,
    });

    await markDirectRoom(userId, response.room_id).catch(() => undefined);
    return getSdkRoomOrInitialSync(response.room_id);
}

export async function createRoom(req: CreateRoomRequest): Promise<Chat> {
    const preset = req.preset
        ?? (req.visibility === Visibility.Public ? Preset.PublicChat : Preset.PrivateChat);
    const visibility = req.visibility
        ?? (preset === Preset.PublicChat ? Visibility.Public : Visibility.Private);
    const response = await getClient().createRoom({
        name: req.title,
        topic: req.topic,
        invite: req.invitees?.map(normalizeUserId),
        visibility,
        preset,
        room_alias_name: req.roomAliasName,
        room_version: req.roomVersion,
        initial_state: req.initialState,
        power_level_content_override: req.powerLevelContentOverride,
        creation_content: req.creationContent,
    });

    return getSdkRoomOrInitialSync(response.room_id);
}

/** Invite users to an existing room. Invitees join only after accepting. */
export async function inviteUsers(chatId: string, userIds: string[]): Promise<void> {
    const client = getClient();
    await Promise.all(userIds.map(userId => client.invite(chatId, normalizeUserId(userId))));
}

/** Update a group's room name. Requires sufficient Matrix room permissions. */
export async function updateGroupName(chatId: string, name: string): Promise<void> {
    await getClient().setRoomName(chatId, name);
}

/** Update a group's room description. Requires sufficient Matrix room permissions. */
export async function updateGroupDescription(chatId: string, description: string): Promise<void> {
    await getClient().setRoomTopic(chatId, description);
}

//TODO handle not found error
export async function getMessages(chatId: string): Promise<Message[]> {
    const client = getClient();
    const room = client.getRoom(chatId);
    const users = await getRoomUsers(chatId);

    if (room != null) {
        await client.scrollback(room, 50);
        return room.getLiveTimeline()
            .getEvents()
            .map(event => messageFromEvent(event, users))
            .filter((message): message is Message => message != null);
    }

    const response = await client.roomInitialSync(chatId, 50);
    return (response.messages?.chunk || [])
        .map(event => messageFromEvent(new MatrixEvent(event), users))
        .filter((message): message is Message => message != null);
}

export async function sendMessage(req: {
    chat: Chat;
    content: string;
    transactionId?: string;
}): Promise<void> {
    const transactionId = req.transactionId || crypto.randomUUID();
    await getClient().sendTextMessage(req.chat.id, req.content, transactionId);
}

export async function searchContacts(query: string, limit: number = 20): Promise<User[]> {
    const currentUserId = session.getMatrixSession()?.userId;
    const users =
        query === "" ? getClient().getUsers() :
            (await getClient().searchUserDirectory({ term: query, limit })).results.map(u => {
                return {
                    userId: u.user_id,
                    displayName: u.display_name,
                    avatarUrl: u.avatar_url
                };
            })
        ;
    const contacts: User[] = [];

    for (const user of users) {
        if (user.userId === currentUserId) {
            continue;
        }

        contacts.push(mapUser(user));
    }
    return await withPresenceForUsers(contacts);
}

function mapUser(user: SdkUser | { userId: string; displayName: string | undefined; avatarUrl: string | undefined; }): User {
    return userFromUserId(user.userId, {
        displayName: user.displayName || displayNameFromUserId(user.userId),
        avatarUri: user.avatarUrl,
    });
}

