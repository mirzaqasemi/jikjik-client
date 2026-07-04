import {
    EventType,
    type MatrixClient,
    type Room,
} from "matrix-js-sdk";

export type DirectRooms = Record<string, string[]>;

export function isVisibleRoom(room: Room): boolean {
    return ["invite", "join"].includes(room.getMyMembership());
}

function isActiveMembership(membership?: string): boolean {
    return membership != null && ["invite", "join"].includes(membership);
}

function hasActiveUser(room: Room, userId: string): boolean {
    return isActiveMembership(room.getMember(userId)?.membership);
}

function directRoomsFromAccountData(client: MatrixClient): DirectRooms {
    return client.getAccountData(EventType.Direct)?.getContent<DirectRooms>() || {};
}

function directRoomIdFromAccountData(
    client: MatrixClient,
    directRooms: DirectRooms,
    userId: string,
): string | null {
    for (const roomId of directRooms[userId] || []) {
        const room = client.getRoom(roomId);
        if (room != null && isVisibleRoom(room) && hasActiveUser(room, userId)) {
            return roomId;
        }
    }

    return null;
}

function isDirectInviteWithUser(room: Room, userId: string): boolean {
    return room.getDMInviter() != null && room.guessDMUserId() === userId;
}

function findDirectInviteRoomId(client: MatrixClient, userId: string): string | null {
    return client.getRooms().find(room => {
        return isVisibleRoom(room) && isDirectInviteWithUser(room, userId);
    })?.roomId || null;
}

export function findDirectRoomId(
    client: MatrixClient,
    userId: string,
    directRooms: DirectRooms = directRoomsFromAccountData(client),
): string | null {
    return directRoomIdFromAccountData(client, directRooms, userId)
        || findDirectInviteRoomId(client, userId);
}
