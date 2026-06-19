import {
    createClient,
    EventType,
    MatrixEvent,
    MsgType,
    type MatrixClient,
    type Room,
    type RoomMember,
} from "matrix-js-sdk";
import type { IContent } from "matrix-js-sdk/lib/models/event";
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

const MATRIX_BASE_URL = (import.meta.env.VITE_MATRIX_BASE_URL || "http://localhost:8008").replace(/\/$/, "");
const TEXT_MESSAGE_EVENT_TYPE = "m.room.message";

let matrixClient: MatrixClient | null = null;

function createSdkClient(): MatrixClient {
    const matrixSession = session.getMatrixSession();

    return createClient({
        baseUrl: MATRIX_BASE_URL,
        accessToken: matrixSession?.accessToken,
        deviceId: matrixSession?.deviceId,
        timelineSupport: true,
        userId: matrixSession?.userId,
    });
}

function getClient(): MatrixClient {
    const matrixSession = session.getMatrixSession();
    if (matrixSession == null) {
        resetClient();
        throw new Error("User not logged in");
    }

    if (matrixClient != null && matrixClient.getUserId() !== matrixSession.userId) {
        resetClient();
    }

    if (matrixClient == null) {
        matrixClient = createSdkClient();
    }
    return matrixClient;
}

function resetClient(): void {
    matrixClient?.stopClient();
    matrixClient = null;
}

function displayNameFromUserId(userId: string): string {
    const localPart = userId.startsWith("@") ? userId.slice(1).split(":")[0] : userId;
    return localPart || userId;
}

function userFromMember(member: RoomMember): User {
    return {
        username: member.userId,
        displayName: member.name || displayNameFromUserId(member.userId),
        avatarUrl: member.events.member?.getContent().avatar_url,
        lastSeen: member.membership,
        membership: member.membership,
    };
}

function userFromProfile(userId: string, profile: { avatar_url?: string; displayname?: string }): User {
    return {
        username: userId,
        displayName: profile.displayname || displayNameFromUserId(userId),
        avatarUrl: profile.avatar_url,
    };
}

function messageFromEvent(event: MatrixEvent, roomUsers: User[]): Message | null {
    const content = event.getContent();
    if (event.getType() !== TEXT_MESSAGE_EVENT_TYPE || content.msgtype !== MsgType.Text || !content.body) {
        return null;
    }

    const senderId = event.getSender() || "";
    const sender = roomUsers.find(user => user.username === senderId) || {
        username: senderId,
        displayName: displayNameFromUserId(senderId),
    };
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

function chatFromSdkRoom(room: Room): Chat {
    const users = room.getJoinedMembers().map(userFromMember);
    const messages = room.getLiveTimeline()
        .getEvents()
        .map(event => messageFromEvent(event, users))
        .filter((message): message is Message => message != null);
    const create = stateContent<{ creator?: string; room_version?: string }>(room, EventType.RoomCreate);
    const encryption = stateContent<{ algorithm?: string }>(room, EventType.RoomEncryption);
    const topic = stateContent<{ topic?: string }>(room, EventType.RoomTopic);

    return {
        id: room.roomId,
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
    return {
        username: userId,
        displayName: content.displayname || displayNameFromUserId(userId),
        avatarUrl: content.avatar_url,
        lastSeen: content.membership,
        membership: content.membership,
    };
}

function chatFromInitialSync(roomId: string, response: Awaited<ReturnType<MatrixClient["roomInitialSync"]>>): Chat {
    const state = response.state || [];
    const users = state
        .filter(event => event.type === EventType.RoomMember && event.state_key && event.content.membership === "join")
        .map(event => userFromMemberState(event.state_key!, event.content));
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

async function getSdkRoomOrInitialSync(roomId: string): Promise<Chat> {
    const client = getClient();
    const room = client.getRoom(roomId);
    if (room != null) {
        return chatFromSdkRoom(room);
    }

    return chatFromInitialSync(roomId, await client.roomInitialSync(roomId, 1));
}

async function getRoomUsers(roomId: string): Promise<User[]> {
    const room = getClient().getRoom(roomId);
    if (room != null) {
        return room.getJoinedMembers().map(userFromMember);
    }

    const response = await getClient().getJoinedRoomMembers(roomId);
    return Object.entries(response.joined).map(([userId, profile]) => ({
        username: userId,
        displayName: profile.display_name || displayNameFromUserId(userId),
        avatarUrl: profile.avatar_url,
        membership: "join",
    }));
}

// -----------------------------------------
// API Functions
// -----------------------------------------
export async function login(username: string, password: string): Promise<User | null> {
    resetClient();
    const loginClient = createClient({ baseUrl: MATRIX_BASE_URL });
    const loginResponse = await loginClient.loginRequest({
        type: "m.login.password",
        identifier: {
            type: "m.id.user",
            user: username,
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

export async function currentUser(username?: string): Promise<User | null> {
    const userId = username || session.getMatrixSession()?.userId;
    if (!userId) {
        return null;
    }

    try {
        return userFromProfile(userId, await getClient().getProfileInfo(userId));
    } catch {
        return {
            username: userId,
            displayName: displayNameFromUserId(userId),
        };
    }
}

export async function getChats(filter?: string): Promise<Chat[]> {
    const response = await getClient().getJoinedRooms();
    const chats = await Promise.all(response.joined_rooms.map(getSdkRoomOrInitialSync));
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
    return getSdkRoomOrInitialSync(chatId);
}

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
    await getClient().sendTextMessage(req.chat.id, req.content, transactionId);
}

export async function getContacts(): Promise<User[]> {
    const currentUserId = session.getMatrixSession()?.userId;
    const searchTerms = "abcdefghijklmnopqrstuvwxyz0123456789_".split("");
    const responses = await Promise.all(searchTerms.map(term =>
        getClient().searchUserDirectory({ term, limit: 20 }).catch(() => ({ results: [] }))
    ));
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
