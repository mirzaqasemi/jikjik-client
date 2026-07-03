import {
    ClientEvent,
    RoomEvent,
    type MatrixClient,
} from "matrix-js-sdk";
import type { User } from "./backend";
import { findDirectRoomId } from "./direct-room";
import { DraftStorage } from "./draft-storage";

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

    if (event === "draftDmResolved") {
        queueMicrotask(resolveDraftDmFromKnownRooms);
    }

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

function handleRoom(): void {
    resolveDraftDmFromKnownRooms();
}

function handleRoomMembership(): void {
    resolveDraftDmFromKnownRooms();
}

function handleRoomTimeline(): void {
    resolveDraftDmFromKnownRooms();
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
