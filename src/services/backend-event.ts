import {
    ClientEvent,
    type MatrixEvent,
    RoomEvent,
    type MatrixClient,
    type Room,
} from "matrix-js-sdk";
import type { User } from "./backend";
import { findDirectRoomId } from "./direct-room";
import { DraftStorage } from "./draft-storage";

export interface DraftDmResolvedEvent
{
    draftUser: User;
    roomId: string;
}

export interface InvitationChangedEvent
{
    roomId: string;
    change: "invited" | "accepted" | "removed";
    memberships?: Record<string, string>;
    users?: string[];
}

export interface ChatsChangedEvent
{
    roomId?: string;
    reason: "room" | "membership" | "timeline" | "name" | "deleted";
}

export interface BackendEventMap
{
    draftDmResolved: DraftDmResolvedEvent;
    chatsChanged: ChatsChangedEvent;
}

type BackendEventListener<TEvent extends keyof BackendEventMap> = (payload: BackendEventMap[TEvent]) => void;
type AnyBackendEventListener = (payload: BackendEventMap[keyof BackendEventMap]) => void;
type InvitationChangedListener = (payload: InvitationChangedEvent) => void;

const listeners: Partial<Record<keyof BackendEventMap, Set<AnyBackendEventListener>>> = {};
const invitationChangedListeners = new Map<string, Set<InvitationChangedListener>>();

let attachedClient: MatrixClient | null = null;

export function subscribeBackendEvent<TEvent extends keyof BackendEventMap>(
    event: TEvent,
    listener: BackendEventListener<TEvent>,
): () => void {
    const eventListeners = listeners[event] || new Set<AnyBackendEventListener>();
    eventListeners.add(listener as AnyBackendEventListener);
    listeners[event] = eventListeners;

    if (event === "draftDmResolved") {
        queueMicrotask(resolveDraftDmFromKnownRooms);
    }

    return () => eventListeners.delete(listener as AnyBackendEventListener);
}

export function subscribeInvitationChanged(roomId: string, listener: InvitationChangedListener): () => void {
    const eventListeners = invitationChangedListeners.get(roomId) || new Set<InvitationChangedListener>();
    eventListeners.add(listener);
    invitationChangedListeners.set(roomId, eventListeners);

    return () => {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
            invitationChangedListeners.delete(roomId);
        }
    };
}

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
    client.on(RoomEvent.Timeline, handleRoomTimeline);
}

export function detachBackendEventClient(): void {
    if (attachedClient == null) {
        return;
    }

    attachedClient.off(ClientEvent.Room, handleRoom);
    attachedClient.off(ClientEvent.DeleteRoom, handleDeleteRoom);
    attachedClient.off(RoomEvent.MyMembership, handleRoomMembership);
    attachedClient.off(RoomEvent.Name, handleRoomName);
    attachedClient.off(RoomEvent.Timeline, handleRoomTimeline);
    attachedClient = null;
}

function emitBackendEvent<TEvent extends keyof BackendEventMap>(
    event: TEvent,
    payload: BackendEventMap[TEvent],
): void {
    listeners[event]?.forEach(listener => listener(payload));
}

function handleRoom(room: Room): void {
    emitChatsChanged("room", room.roomId);
    if (room.getMyMembership() === "invite") {
        emitInvitationChanged(room, "invited");
    }
    resolveDraftDmFromKnownRooms();
}

function handleDeleteRoom(roomId: string): void {
    emitChatsChanged("deleted", roomId);
    emitInvitationChangedForRoomId(roomId, "removed");
}

function handleRoomMembership(room: Room, membership: string, previousMembership?: string): void {
    emitChatsChanged("membership", room.roomId);

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
}

function handleRoomTimeline(_event: MatrixEvent, room?: Room): void {
    emitChatsChanged("timeline", room?.roomId);
    resolveDraftDmFromKnownRooms();
}

function emitChatsChanged(reason: ChatsChangedEvent["reason"], roomId?: string): void {
    emitBackendEvent("chatsChanged", {
        roomId,
        reason,
    });
}

function emitInvitationChanged(room: Room, change: InvitationChangedEvent["change"]): void {
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
    });
}

function emitInvitationChangedForRoomId(
    roomId: string,
    change: InvitationChangedEvent["change"],
    details: Pick<InvitationChangedEvent, "memberships" | "users"> = {},
): void {
    const eventListeners = invitationChangedListeners.get(roomId);
    if (eventListeners == null) {
        return;
    }

    const event: InvitationChangedEvent = {
        roomId,
        change,
        ...details,
    };
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

    emitBackendEvent("draftDmResolved", {
        draftUser,
        roomId,
    });
}
