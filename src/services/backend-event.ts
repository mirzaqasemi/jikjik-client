import {
    ClientEvent,
    RoomEvent,
    type MatrixClient,
    type MatrixEvent,
    type Room,
} from "matrix-js-sdk";
import type { User } from "./backend";
import * as session from "./session";

export interface DraftDmResolvedEvent
{
    draftUser: User;
    roomId: string;
}

export interface BackendEventMap
{
    draftDmResolved: DraftDmResolvedEvent;
}

type BackendEventListener<TEvent extends keyof BackendEventMap> = (payload: BackendEventMap[TEvent]) => void;
type AnyBackendEventListener = (payload: BackendEventMap[keyof BackendEventMap]) => void;

const listeners: Partial<Record<keyof BackendEventMap, Set<AnyBackendEventListener>>> = {};

let attachedClient: MatrixClient | null = null;

export function subscribeBackendEvent<TEvent extends keyof BackendEventMap>(
    event: TEvent,
    listener: BackendEventListener<TEvent>,
): () => void {
    const eventListeners = listeners[event] || new Set<AnyBackendEventListener>();
    eventListeners.add(listener as AnyBackendEventListener);
    listeners[event] = eventListeners;

    return () => eventListeners.delete(listener as AnyBackendEventListener);
}

export function attachBackendEventClient(client: MatrixClient): void {
    if (attachedClient === client) {
        return;
    }

    detachBackendEventClient();
    attachedClient = client;

    client.on(ClientEvent.Room, handleRoom);
    client.on(RoomEvent.MyMembership, handleRoomMembership);
    client.on(RoomEvent.Timeline, handleRoomTimeline);
}

export function detachBackendEventClient(): void {
    if (attachedClient == null) {
        return;
    }

    attachedClient.off(ClientEvent.Room, handleRoom);
    attachedClient.off(RoomEvent.MyMembership, handleRoomMembership);
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
    resolveDraftDmWithRoom(room);
}

function handleRoomMembership(room: Room): void {
    resolveDraftDmWithRoom(room);
}

function handleRoomTimeline(_event: MatrixEvent, room?: Room): void {
    if (room != null) {
        resolveDraftDmWithRoom(room);
    }
}

function resolveDraftDmWithRoom(room: Room): void {
    const draftUser = session.getDraftDm();
    if (draftUser == null || !isDirectRoomWithUser(room, draftUser.userId)) {
        return;
    }

    emitBackendEvent("draftDmResolved", {
        draftUser,
        roomId: room.roomId,
    });
}

function isDirectRoomWithUser(room: Room, userId: string): boolean {
    // TODO: Handle invite-state DMs explicitly. For now this resolves joined two-person rooms.
    const currentUserId = session.getMatrixSession()?.userId;
    const members = room.getJoinedMembers();

    return currentUserId != null
        && members.length === 2
        && members.some(member => member.userId === currentUserId)
        && members.some(member => member.userId === userId);
}
