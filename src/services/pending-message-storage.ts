import type { MessageWithStatus } from "@/components/chat/Chat";
import * as session from "./session";
import { useEffect, useState } from "react";

const pendingMsgsKeyPrefix = "pendingMsgs"

type Listener = () => void;

const listeners: Map<string, Set<Listener>> = new Map();

function getPendingMsgsKey(chatId: string): string[] {
    return [pendingMsgsKeyPrefix, chatId];
}

export function setPendingMsgs(chatId: string, pendingMsgs: MessageWithStatus[]): void {
    session.setSessionItem(getPendingMsgsKey(chatId), pendingMsgs);
    const chatListeners = getListeners(chatId);
    // Call all listeners
    for (let listener of chatListeners) {
        listener();
    }
}

export function getPendingMsgs(chatId: string): MessageWithStatus[] {
    return session.getSessionItem(getPendingMsgsKey(chatId)) ?? [];
}

function getListeners(chatId: string): Set<Listener> {
    return listeners.get(chatId) ?? new Set();
}


export function subscribeToPendingMsgs(chatId: string, listener: Listener): () => void {
    const chatListeners = getListeners(chatId);
    chatListeners.add(listener);
    listeners.set(chatId, chatListeners);
    return () => unsubscribeFromPendingMsgs(chatId, listener, chatListeners);
}

function unsubscribeFromPendingMsgs(chatId: string, listener: Listener, chatListeners: Set<Listener>) {
    chatListeners.delete(listener)
    listeners.set(chatId, chatListeners);
}

export function usePendingMsgs(chatId: string) {
    //if pendingMsgs = undefined; so it represents “the hook hasn't loaded the pending messages yet.”
    const [pendingMsgs, setPendingMsgs] = useState<MessageWithStatus[]>();
    useEffect(() => {
        setPendingMsgs(getPendingMsgs(chatId));
        const cleanup = subscribeToPendingMsgs(chatId, () => {
            setPendingMsgs(getPendingMsgs(chatId));
        });
        return cleanup;
    }, [chatId]);
    return pendingMsgs;
}

export const PendingMessageStorage = {
    setPendingMsgs,
    getPendingMsgs,
    subscribeToPendingMsgs,
    usePendingMsgs
}