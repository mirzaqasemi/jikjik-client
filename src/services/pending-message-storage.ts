import type { PendingMessage } from "@/models/pending-message";
import { useEffect, useReducer, useState } from "react";
import * as session from "./session";

type Listener = () => void;
type StoredPendingMessage = Omit<PendingMessage, "date"> & {
    date: string
};

const pendingMsgsKeyPrefix = "pendingMsgs"
const listeners: Map<string, Set<Listener>> = new Map();

function getPendingMsgsKey(chatId: string): string[] {
    return [pendingMsgsKeyPrefix, chatId];
}

export function getPendingMsgs(chatId: string): PendingMessage[] {
    const storedMessages: StoredPendingMessage[] = session.getSessionItem(getPendingMsgsKey(chatId)) ?? [];
    return storedMessages.map((msg) =>
    ({
        ...msg,
        date: new Date(msg.date),
    }));
}

function setPendingMsgs(chatId: string, pendingMsgs: PendingMessage[]): void {
    session.setSessionItem(getPendingMsgsKey(chatId), pendingMsgs);
    const chatListeners = getListeners(chatId);
    // Call all listeners
    for (const listener of chatListeners) {
        listener();
    }
}

export function updatePendingMsgs(chatId: string, updater: (msgs: PendingMessage[]) => PendingMessage[]) {
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
    const [, forceRender] = useReducer((x) => x + 1, 0);
    useEffect(() => {
        // tells React that storage changed
        const cleanup = subscribeToPendingMsgs(chatId, forceRender);
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