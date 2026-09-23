import type { MessageWithStatus } from "@/components/chat/Chat";
import * as session from "./session";
import { useEffect, useState } from "react";

const pendingMsgsKeyPrefix = "pendingMsgs"

type Listener = () => void;

const listeners: Map<string, Set<Listener>> = new Map();

function getPendingMsgsKey(chatId: string): string[] {
    return [pendingMsgsKeyPrefix, chatId];
}

export function getPendingMsgs(chatId: string): MessageWithStatus[] {
    return session.getSessionItem(getPendingMsgsKey(chatId)) ?? [];
}

function setPendingMsgs(chatId: string, pendingMsgs: MessageWithStatus[]): void {
    session.setSessionItem(getPendingMsgsKey(chatId), pendingMsgs);
    const chatListeners = getListeners(chatId);
    // Call all listeners
    for (const listener of chatListeners) {
        listener();
    }
}

export function updatePendingMsgs(chatId: string, updater: (msgs: MessageWithStatus[]) => MessageWithStatus[]) {
    const current = getPendingMsgs(chatId);
    const newValue = updater(current);
    // if nothing changed, newValue and current are literally the same array object.
    if (newValue === current) {
        return;
    }
    setPendingMsgs(chatId, newValue);
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
    const [, forceRender] = useState(0);
    useEffect(() => {
        // tells React that storage changed
        const cleanup = subscribeToPendingMsgs(chatId, () => {
            // causes a re-render
            forceRender(previous => previous + 1);
        });
        return cleanup;
    }, [chatId]);
    // reads the current data
    return getPendingMsgs(chatId);
}

export const PendingMessageStorage = {
    updatePendingMsgs,
    getPendingMsgs,
    subscribeToPendingMsgs,
    usePendingMsgs
}