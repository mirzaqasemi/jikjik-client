import {
    ClientEvent,
    EventType,
    type Membership,
    type MatrixEvent,
    MsgType,
    RoomEvent,
    type MatrixClient,
    type Room,
    type RoomMember,
    type RoomState,
    RoomStateEvent,
} from "matrix-js-sdk";
import type { User } from "./backend";
import { findDirectRoomId } from "./direct-room";
import { DraftStorage } from "./draft-storage";

/**
 * Emitted when a locally drafted DM can be matched to a real Matrix room.
 *
 * This lets the UI move from the draft route to the actual chat route when the
 * remote user creates or replies in the DM before the local user sends anything.
 */
export interface DraftDmResolvedEvent {
    /** User that was stored as the pending draft DM target. */
    draftUser: User;

    /** Matrix room id for the resolved DM, suitable for `/chats/:chatId`. */
    roomId: string;
}

/**
 * Emitted for one specific room invitation subscription.
 *
 * This is intentionally scoped by `subscribeInvitationChanged(roomId, ...)`.
 */
export interface InvitationChangedEvent {
    /** Matrix room id whose invitation state changed. */
    roomId: string;

    /** Current invitation transition for the local user. */
    change: "invited" | "accepted" | "removed";

    /** Latest known membership by Matrix user id, when the room is available locally. */
    memberships?: Record<string, string>;

    /** Convenience list of user ids present in `memberships`. */
    users?: string[];
}

/**
 * Broad chat-list invalidation event.
 *
 * Use this when the UI only needs to know that the chat collection may have
 * changed. For a single chat's detailed updates, prefer `subscribeChatChanged`.
 */
export interface ChatsChangedEvent {
    /** Matrix room id that changed, when the SDK event identifies one. */
    roomId?: string;

    /** High-level reason for refreshing the chat list. */
    reason: "room" | "membership" | "timeline" | "name" | "deleted";
}

/**
 * Message-level operation represented by `ChatChangedMessageDetails`.
 */
export type ChatChangedMessageAction = "added" | "removed" | "updated" | "redacted";

/**
 * Participant/user operation represented by `ChatChangedUserDetails`.
 */
export type ChatChangedUserAction = "membershipChanged" | "profileChanged";

/**
 * Room-level operation represented by `ChatChangedRoomDetails`.
 */
export type ChatChangedRoomDetails =
    | {
        /** A room was added to the local Matrix client. */
        type: "created";
    }
    | {
        /** A room was removed from the local Matrix client. */
        type: "deleted";
    }
    | {
        /** The current logged-in user's membership in this room changed. */
        type: "membership";
        membership: Membership;
        previousMembership?: Membership;
    }
    | {
        /** The room title changed. */
        type: "name";
        title?: string;
        previousTitle?: string;
    }
    | {
        /** The room avatar changed. */
        type: "avatar";
        avatarUrl?: string;
        previousAvatarUrl?: string;
    }
    | {
        /** The room's canonical alias changed. */
        type: "canonicalAlias";
        canonicalAlias?: string;
        previousCanonicalAlias?: string;
    }
    | {
        /** The room topic changed. */
        type: "topic";
        topic?: string;
        previousTopic?: string;
    }
    | {
        /** Room encryption metadata changed. */
        type: "encryption";
        encrypted: boolean;
        encryptionAlgorithm?: string;
        previousEncryptionAlgorithm?: string;
    }
    | {
        /** Room creation metadata changed or became available. */
        type: "creation";
        creator?: string;
        roomVersion?: string;
        previousRoomVersion?: string;
    };

/**
 * Details for message timeline changes.
 *
 * The payload is intentionally small. If the UI needs the canonical message
 * list, it should refresh `backend.getMessages(chatId)` after receiving this.
 */
export interface ChatChangedMessageDetails {
    /** Whether a message was added, removed, locally updated, or redacted. */
    action: ChatChangedMessageAction;

    /** Matrix event id of the changed message, when available. */
    eventId?: string;

    /** Client transaction id used for local echo reconciliation, when available. */
    transactionId?: string;

    /** Matrix user id of the sender, when available. */
    senderId?: string;

    /** Text body for `m.text` messages. Redactions and removals usually omit this. */
    content?: string;

    /** Matrix message type, for example `m.text`. */
    messageType?: string;

    /** Event timestamp converted to a JavaScript `Date`. */
    timestamp?: Date;

    /** True when the event was inserted while paginating older history. */
    toStartOfTimeline?: boolean;
}

/**
 * Details for a participant/user change inside a chat.
 */
export interface ChatChangedUserDetails {
    /** Whether membership or profile-ish room member data changed. */
    action: ChatChangedUserAction;

    /** Matrix user id of the room member that changed. */
    userId: string;

    /** Latest known membership, for example `join`, `invite`, or `leave`. */
    membership?: Membership;

    /** Previous membership reported by Matrix, when provided by the event. */
    previousMembership?: Membership;

    /** Latest display name exposed by the Matrix room member object. */
    displayName?: string;

    /** Previous display name from Matrix event content, if present. */
    previousDisplayName?: string | null;

    /** Latest avatar MXC URI from the membership event, if present. */
    avatarUrl?: string | null;
}

/**
 * Per-chat event emitted whenever the app-facing `Chat` object may have changed.
 *
 * This is a discriminated union. Every event has a `type` property, and that
 * property tells the UI which detail property exists on the event:
 *
 * - `type: "roomChanged"` means `roomChange` is present. Switch on
 *   `roomChange.type` for typed room-level changes such as `avatar`, `name`,
 *   `topic`, `canonicalAlias`, `membership`, `created`, or `deleted`.
 * - `type: "usersChanged"` means `user` is present and the chat's `users`
 *   array may need to be refreshed or patched.
 * - `type: "messagesChanged"` means `message` is present and the chat's
 *   messages may need to be refreshed or patched.
 *
 * The payload intentionally avoids raw Matrix state strings. Consumers should
 * switch on these typed app-level fields instead of inspecting Matrix event
 * names directly.
 */
interface ChatChangedEventBase {
    /** Matrix room id this event belongs to. Always matches the subscribed chat id. */
    chatId: string;
}

export interface ChatRoomChangedEvent extends ChatChangedEventBase {
    /** Room-level chat metadata changed. */
    type: "roomChanged";

    /** Specific room-level change. */
    roomChange: ChatChangedRoomDetails;
}

export interface ChatUsersChangedEvent extends ChatChangedEventBase {
    /** The chat's `users` array may have changed. */
    type: "usersChanged";

    /** Specific participant change. */
    user: ChatChangedUserDetails;
}

export interface ChatMessagesChangedEvent extends ChatChangedEventBase {
    /** The chat's message timeline may have changed. */
    type: "messagesChanged";

    /** Specific message timeline change. */
    message: ChatChangedMessageDetails;
}

export type ChatChangedEvent = ChatRoomChangedEvent | ChatUsersChangedEvent | ChatMessagesChangedEvent;
type ChatChangedEventPayload =
    | Omit<ChatRoomChangedEvent, "chatId">
    | Omit<ChatUsersChangedEvent, "chatId">
    | Omit<ChatMessagesChangedEvent, "chatId">;

/**
 * Legacy global backend events keyed by event name.
 *
 * @deprecated Prefer the exported per-event subscribe functions instead of this
 * generic map. It only exists to type the deprecated `subscribeBackendEvent`
 * compatibility API.
 */
export interface BackendEventMap {
    /** Draft DM resolution event payload. */
    draftDmResolved: DraftDmResolvedEvent;

    /** Broad chat-list invalidation event payload. */
    chatsChanged: ChatsChangedEvent;
}

/**
 * Legacy generic backend event listener type.
 *
 * @deprecated Prefer concrete listener types such as `DraftDmResolvedListener`,
 * `ChatsChangedListener`, `ChatChangedListener`, and `InvitationChangedListener`.
 */
type BackendEventListener<TEvent extends keyof BackendEventMap> = (payload: BackendEventMap[TEvent]) => void;
type DraftDmResolvedListener = (payload: DraftDmResolvedEvent) => void;
type ChatsChangedListener = (payload: ChatsChangedEvent) => void;
type InvitationChangedListener = (payload: InvitationChangedEvent) => void;
type ChatChangedListener = (payload: ChatChangedEvent) => void;

const draftDmResolvedListeners = new Set<DraftDmResolvedListener>();
const chatsChangedListeners = new Set<ChatsChangedListener>();
const invitationChangedListeners = new Map<string, Set<InvitationChangedListener>>();
const chatChangedListeners = new Map<string, Set<ChatChangedListener>>();

const CHAT_METADATA_EVENT_TYPES = new Set<string>([
    EventType.RoomAvatar,
    EventType.RoomCanonicalAlias,
    EventType.RoomCreate,
    EventType.RoomEncryption,
    EventType.RoomName,
    EventType.RoomTopic,
]);

let attachedClient: MatrixClient | null = null;

/**
 * Subscribe to a global backend event by name.
 *
 * @deprecated Prefer the event-specific subscribe functions, such as
 * `subscribeDraftDmResolved`, `subscribeChatsChanged`, `subscribeChatChanged`,
 * and `subscribeInvitationChanged`. Some backend events require parameters
 * during subscription, so the named functions are clearer and harder to misuse.
 *
 * @param event Event name from `BackendEventMap`.
 * @param listener Callback invoked with the typed payload for `event`.
 * @returns Cleanup function that removes this listener.
 */
export function subscribeBackendEvent<TEvent extends keyof BackendEventMap>(
    event: TEvent,
    listener: BackendEventListener<TEvent>,
): () => void {
    if (event === "draftDmResolved") {
        return subscribeDraftDmResolved(listener as DraftDmResolvedListener);
    }

    return subscribeChatsChanged(listener as ChatsChangedListener);
}

/**
 * Subscribe to draft DM resolution events.
 *
 * This fires when the locally stored draft DM target can be matched to a real
 * Matrix room. The usual UI response is to navigate from the draft chat route
 * to `/chats/:roomId`.
 *
 * @param listener Callback invoked with the resolved draft user and room id.
 * @returns Cleanup function that removes this listener.
 */
export function subscribeDraftDmResolved(listener: DraftDmResolvedListener): () => void {
    draftDmResolvedListeners.add(listener);
    queueMicrotask(resolveDraftDmFromKnownRooms);

    return () => draftDmResolvedListeners.delete(listener);
}

/**
 * Subscribe to broad chat-list invalidation events.
 *
 * Use this for chat-list views that only need to know the list may have changed.
 * For one chat's detailed room/user/message changes, use
 * `subscribeChatChanged(chatId, listener)`.
 *
 * @param listener Callback invoked with the changed room id, when known, and reason.
 * @returns Cleanup function that removes this listener.
 */
export function subscribeChatsChanged(listener: ChatsChangedListener): () => void {
    chatsChangedListeners.add(listener);

    return () => chatsChangedListeners.delete(listener);
}

/**
 * Subscribe to changes for one chat.
 *
 * This emits whenever the app-facing `Chat` object for `chatId` may have
 * changed, including room metadata, participant/user changes, message timeline
 * changes, local echo updates, redactions, membership changes, and deletion.
 *
 * The listener only receives events for the requested `chatId`. The payload is a
 * typed discriminated union, so handle it by switching on `event.type`:
 *
 * ```ts
 * subscribeChatChanged(chatId, (event) => {
 *     if (event.type === "messagesChanged") {
 *         // event.message is available here.
 *         return;
 *     }
 *
 *     if (event.type === "usersChanged") {
 *         // event.user is available here.
 *         return;
 *     }
 *
 *     // event.type === "roomChanged"; event.roomChange is available here.
 *     if (event.roomChange.type === "avatar") {
 *         // event.roomChange.avatarUrl is available here.
 *     }
 * });
 * ```
 *
 * For `roomChanged`, switch again on `event.roomChange.type` to handle the
 * specific typed room change, such as `avatar`, `name`, `topic`,
 * `canonicalAlias`, `membership`, `created`, or `deleted`.
 *
 * @param chatId Matrix room id to watch.
 * @param listener Callback invoked with the typed `ChatChangedEvent` payload.
 * @returns Cleanup function that removes this chat-specific listener.
 */
export function subscribeChatChanged(chatId: string, listener: ChatChangedListener): () => void {
    const eventListeners = chatChangedListeners.get(chatId) || new Set<ChatChangedListener>();
    eventListeners.add(listener);
    chatChangedListeners.set(chatId, eventListeners);

    return () => {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
            chatChangedListeners.delete(chatId);
        }
    };
}

/**
 * Subscribe to invitation changes for one room.
 *
 * The listener is called once on the next microtask with the currently known
 * invitation state, then again whenever the local user's invitation state
 * changes.
 *
 * @param roomId Matrix room id to watch for invitation state.
 * @param listener Callback invoked with invitation transition details.
 * @returns Cleanup function that removes this room-specific listener.
 */
export function subscribeInvitationChanged(roomId: string, listener: InvitationChangedListener): () => void {
    const eventListeners = invitationChangedListeners.get(roomId) || new Set<InvitationChangedListener>();
    eventListeners.add(listener);
    invitationChangedListeners.set(roomId, eventListeners);
    queueMicrotask(() => emitInitialInvitationChanged(roomId, listener));

    return () => {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
            invitationChangedListeners.delete(roomId);
        }
    };
}

function emitInitialInvitationChanged(roomId: string, listener: InvitationChangedListener): void {
    if (!invitationChangedListeners.get(roomId)?.has(listener)) {
        return;
    }

    const room = attachedClient?.getRoom(roomId);
    if (room == null) {
        listener({
            roomId,
            change: "removed",
        });
        return;
    }

    const membership = room.getMyMembership();
    if (membership === "invite") {
        emitInvitationChanged(room, "invited", listener);
    } else if (membership === "join") {
        emitInvitationChanged(room, "accepted", listener);
    } else {
        emitInvitationChanged(room, "removed", listener);
    }
}

/**
 * Attach this event bridge to the active Matrix client.
 *
 * Backend login/client setup owns this function. UI code should subscribe with
 * the exported subscribe functions instead of calling this directly.
 */
export function attachBackendEventClient(client: MatrixClient): void {
    if (attachedClient === client) {
        return;
    }

    detachBackendEventClient();
    attachedClient = client;

    client.on(ClientEvent.Room, handleRoom);
    client.on(ClientEvent.DeleteRoom, handleDeleteRoom);
    client.on(RoomEvent.MyMembership, handleRoomMembership);
    client.on(RoomEvent.Name, handleRoomName);
    client.on(RoomEvent.Redaction, handleRoomRedaction);
    client.on(RoomEvent.LocalEchoUpdated, handleRoomLocalEchoUpdated);
    client.on(RoomEvent.Timeline, handleRoomTimeline);
    client.on(RoomStateEvent.Events, handleRoomStateEvent);
    client.on(RoomStateEvent.Members, handleRoomStateMember);
}

/**
 * Detach Matrix SDK event listeners from the active Matrix client.
 *
 * Backend logout/client reset owns this function. It prevents duplicate SDK
 * handlers when the Matrix client is replaced.
 */
export function detachBackendEventClient(): void {
    if (attachedClient == null) {
        return;
    }

    attachedClient.off(ClientEvent.Room, handleRoom);
    attachedClient.off(ClientEvent.DeleteRoom, handleDeleteRoom);
    attachedClient.off(RoomEvent.MyMembership, handleRoomMembership);
    attachedClient.off(RoomEvent.Name, handleRoomName);
    attachedClient.off(RoomEvent.Redaction, handleRoomRedaction);
    attachedClient.off(RoomEvent.LocalEchoUpdated, handleRoomLocalEchoUpdated);
    attachedClient.off(RoomEvent.Timeline, handleRoomTimeline);
    attachedClient.off(RoomStateEvent.Events, handleRoomStateEvent);
    attachedClient.off(RoomStateEvent.Members, handleRoomStateMember);
    attachedClient = null;
}

function handleRoom(room: Room): void {
    emitChatsChanged("room", room.roomId);
    emitChatChanged(room.roomId, {
        type: "roomChanged",
        roomChange: {
            type: "created",
        },
    });
    if (room.getMyMembership() === "invite") {
        emitInvitationChanged(room, "invited");
    }
    resolveDraftDmFromKnownRooms();
}

function handleDeleteRoom(roomId: string): void {
    emitChatsChanged("deleted", roomId);
    emitChatChanged(roomId, {
        type: "roomChanged",
        roomChange: {
            type: "deleted",
        },
    });
    emitInvitationChangedForRoomId(roomId, "removed");
}

function handleRoomMembership(room: Room, membership: Membership, previousMembership?: Membership): void {
    emitChatsChanged("membership", room.roomId);
    emitChatChanged(room.roomId, {
        type: "roomChanged",
        roomChange: {
            type: "membership",
            membership,
            previousMembership,
        },
    });

    if (membership === "invite" && previousMembership !== "invite") {
        emitInvitationChanged(room, "invited");
    } else if (previousMembership === "invite" && membership === "join") {
        emitInvitationChanged(room, "accepted");
    } else if (previousMembership === "invite" && membership !== "invite") {
        emitInvitationChanged(room, "removed");
    }

    resolveDraftDmFromKnownRooms();
}

function handleRoomName(room: Room): void {
    emitChatsChanged("name", room.roomId);
    emitChatChanged(room.roomId, {
        type: "roomChanged",
        roomChange: {
            type: "name",
            title: room.name || undefined,
        },
    });
}

function handleRoomTimeline(
    event: MatrixEvent,
    room?: Room,
    toStartOfTimeline?: boolean,
    removed?: boolean,
): void {
    emitChatsChanged("timeline", room?.roomId);
    const message = messageDetailsFromEvent(event, removed === true ? "removed" : "added", toStartOfTimeline);
    if (room != null && message != null) {
        emitChatChanged(room.roomId, {
            type: "messagesChanged",
            message,
        });
    }
    resolveDraftDmFromKnownRooms();
}

function handleRoomLocalEchoUpdated(event: MatrixEvent, room: Room): void {
    const message = messageDetailsFromEvent(event, "updated");
    if (message == null) {
        return;
    }

    emitChatChanged(room.roomId, {
        type: "messagesChanged",
        message,
    });
}

function handleRoomRedaction(event: MatrixEvent, room: Room): void {
    emitChatChanged(room.roomId, {
        type: "messagesChanged",
        message: {
            action: "redacted",
            eventId: event.event.redacts,
            senderId: event.getSender(),
            timestamp: event.getDate() || new Date(event.getTs() || Date.now()),
        },
    });
}

function handleRoomStateEvent(event: MatrixEvent, state: RoomState, previousEvent: MatrixEvent | null): void {
    const roomChange = roomChangeDetailsFromStateEvent(event, previousEvent);
    if (roomChange == null) {
        return;
    }

    emitChatChanged(state.roomId, {
        type: "roomChanged",
        roomChange,
    });
}

function handleRoomStateMember(event: MatrixEvent, state: RoomState, member: RoomMember): void {
    const content = event.getContent();
    const previousContent = event.getPrevContent();
    const previousMembership = membershipValue(previousContent.membership);

    emitChatChanged(state.roomId, {
        type: "usersChanged",
        user: {
            action: previousMembership !== member.membership ? "membershipChanged" : "profileChanged",
            userId: member.userId,
            membership: membershipValue(member.membership),
            previousMembership,
            displayName: member.name,
            previousDisplayName: typeof previousContent.displayname === "string" ? previousContent.displayname : null,
            avatarUrl: typeof content.avatar_url === "string" ? content.avatar_url : undefined,
        },
    });
}

function emitChatsChanged(reason: ChatsChangedEvent["reason"], roomId?: string): void {
    const event: ChatsChangedEvent = {
        roomId,
        reason,
    };

    chatsChangedListeners.forEach(listener => listener(event));
}

function emitChatChanged(chatId: string, payload: ChatChangedEventPayload): void {
    const eventListeners = chatChangedListeners.get(chatId);
    if (eventListeners == null) {
        return;
    }

    const event: ChatChangedEvent = {
        chatId,
        ...payload,
    };

    eventListeners.forEach(listener => listener(event));
}

function roomChangeDetailsFromStateEvent(
    event: MatrixEvent,
    previousEvent: MatrixEvent | null,
): ChatChangedRoomDetails | null {
    if (!CHAT_METADATA_EVENT_TYPES.has(event.getType())) {
        return null;
    }

    const content = event.getContent();
    const previousContent = previousEvent?.getContent() || {};

    switch (event.getType()) {
        case EventType.RoomAvatar:
            return {
                type: "avatar",
                avatarUrl: stringValue(content.url),
                previousAvatarUrl: stringValue(previousContent.url),
            };
        case EventType.RoomCanonicalAlias:
            return {
                type: "canonicalAlias",
                canonicalAlias: stringValue(content.alias),
                previousCanonicalAlias: stringValue(previousContent.alias),
            };
        case EventType.RoomCreate:
            return {
                type: "creation",
                creator: stringValue(content.creator),
                roomVersion: stringValue(content.room_version),
                previousRoomVersion: stringValue(previousContent.room_version),
            };
        case EventType.RoomEncryption:
            return {
                type: "encryption",
                encrypted: true,
                encryptionAlgorithm: stringValue(content.algorithm),
                previousEncryptionAlgorithm: stringValue(previousContent.algorithm),
            };
        case EventType.RoomName:
            return {
                type: "name",
                title: stringValue(content.name),
                previousTitle: stringValue(previousContent.name),
            };
        case EventType.RoomTopic:
            return {
                type: "topic",
                topic: stringValue(content.topic),
                previousTopic: stringValue(previousContent.topic),
            };
        default:
            return null;
    }
}

function messageDetailsFromEvent(
    event: MatrixEvent,
    action: ChatChangedMessageAction,
    toStartOfTimeline?: boolean,
): ChatChangedMessageDetails | null {
    const content = event.getContent();
    if (event.getType() !== EventType.RoomMessage || content.msgtype !== MsgType.Text) {
        return null;
    }

    return {
        action,
        eventId: event.getId(),
        transactionId: event.getTxnId() || event.getUnsigned().transaction_id,
        senderId: event.getSender(),
        content: typeof content.body === "string" ? content.body : undefined,
        messageType: typeof content.msgtype === "string" ? content.msgtype : undefined,
        timestamp: event.getDate() || new Date(event.getTs() || Date.now()),
        toStartOfTimeline,
    };
}

function stringValue(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function membershipValue(value: unknown): Membership | undefined {
    return typeof value === "string" ? value as Membership : undefined;
}

function emitInvitationChanged(
    room: Room,
    change: InvitationChangedEvent["change"],
    listener?: InvitationChangedListener,
): void {
    const memberships: Record<string, string> = {};
    room.getMembers().forEach(member => {
        if (member.membership == null) {
            return;
        }

        memberships[member.userId] = member.membership;
    });

    emitInvitationChangedForRoomId(room.roomId, change, {
        memberships,
        users: Object.keys(memberships),
    }, listener);
}

function emitInvitationChangedForRoomId(
    roomId: string,
    change: InvitationChangedEvent["change"],
    details: Pick<InvitationChangedEvent, "memberships" | "users"> = {},
    listener?: InvitationChangedListener,
): void {
    const event: InvitationChangedEvent = {
        roomId,
        change,
        ...details,
    };

    if (listener != null) {
        listener(event);
        return;
    }

    const eventListeners = invitationChangedListeners.get(roomId);
    if (eventListeners == null) {
        return;
    }

    eventListeners.forEach(listener => listener(event));
}

function resolveDraftDmFromKnownRooms(): void {
    const draftUser = DraftStorage.getDraftDm();
    if (draftUser == null || attachedClient == null) {
        return;
    }

    const roomId = findDirectRoomId(attachedClient, draftUser.userId);
    if (roomId == null) {
        return;
    }

    const event: DraftDmResolvedEvent = {
        draftUser,
        roomId,
    };

    draftDmResolvedListeners.forEach(listener => listener(event));
}
