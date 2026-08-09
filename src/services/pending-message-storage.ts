import type { MessageWithStatus } from "@/components/chat/Chat";
import * as session from "./session";

const pendingMessagesKeyPrefix = "pendingMsgs"


function getPendingMessagesKey(chatId: string): string[] {
    return [pendingMessagesKeyPrefix, chatId];
}


export function setPendingMsgs(chatId: string, pendingMsgs: MessageWithStatus[]): void {
    session.setSessionItem(getPendingMessagesKey(chatId), pendingMsgs);
}

export function getPendingMsgs(chatId: string): MessageWithStatus[] {
    return session.getSessionItem(getPendingMessagesKey(chatId)) ?? [];
}

export const PendingMessageStorage = {
    setPendingMsgs,
    getPendingMsgs,
}