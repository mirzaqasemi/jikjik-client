import type { User } from "./backend";
import * as session from "./session";

const draftDmUserKey = "draftDmUser";

export const DraftMessageAction = {
    Display: "display",
    Send: "send",
} as const;

export type DraftMessageAction = typeof DraftMessageAction[keyof typeof DraftMessageAction];

export interface DraftMessage {
    content: string;
    action: DraftMessageAction;
    updatedAt: number;
}

function getDraftMessageKey(roomId: string): string[] {
    return ["draftMsg", roomId];
}

export function draftDm(user: User): void {
    session.setSessionItem(draftDmUserKey, user);
}

export function getDraftDm(): User | null {
    return session.getSessionItem<User>(draftDmUserKey);
}

export function removeDraftDm(): void {
    session.removeSessionItem(draftDmUserKey);
}

export function draftMsg(
    roomId: string,
    content: string,
    action: DraftMessageAction = DraftMessageAction.Display,
): void {
    if (content.length === 0) {
        removeDraftForRoom(roomId);
        return;
    }

    const draft: DraftMessage = {
        content,
        action,
        updatedAt: Date.now(),
    };

    session.setSessionItem(getDraftMessageKey(roomId), draft);
}

export function getDraftForRoom(roomId: string): DraftMessage | null {
    return session.getSessionItem<DraftMessage>(getDraftMessageKey(roomId));
}

export function removeDraftForRoom(roomId: string): void {
    session.removeSessionItem(getDraftMessageKey(roomId));
}

export function clearDrafts(): void {
    session.clearSessionItems();
}

export const DraftStorage = {
    draftDm,
    getDraftDm,
    removeDraftDm,
    draftMsg,
    getDraftForRoom,
    removeDraftForRoom,
    clearDrafts,
};
