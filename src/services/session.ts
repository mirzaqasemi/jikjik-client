import { useEffect, useState } from "react";
import type { MatrixSession } from "./matrix-models";
import type { User } from "./backend";

export type Listener = () => void;
export type SessionItemKey = string | string[];


const matrixAccessTokenKey = "matrixAccessToken";
const matrixDeviceIdKey = "matrixDeviceId";
const matrixUserIdKey = "matrixUserId";
const appSessionItemPrefix = "app:";

let currentUserId: string | null = null;
const listeners = new Set<Listener>();

export function getUserId(): string | null {
    if (currentUserId == null) {
        const matrixSession = getMatrixSession();
        if (matrixSession != null) {
            currentUserId = matrixSession.userId;
        }
    }
    return currentUserId;
}

// throws error if user is null
export function mustGetUserId(): string {
    const userId = getUserId();
    if (userId == null) {
        throw Error("User not logged in");
    }
    return userId;
}

export function getMatrixSession(): MatrixSession | null {
    const accessToken = localStorage.getItem(matrixAccessTokenKey);
    const userId = localStorage.getItem(matrixUserIdKey);

    if (!accessToken || !userId) {
        return null;
    }

    return {
        accessToken,
        deviceId: localStorage.getItem(matrixDeviceIdKey) || undefined,
        userId,
    };
}

export function setMatrixSession(matrixSession: MatrixSession): void {
    const previousUserId = localStorage.getItem(matrixUserIdKey);
    if (previousUserId !== matrixSession.userId) {
        clearSessionItems();
    }

    localStorage.setItem(matrixAccessTokenKey, matrixSession.accessToken);
    localStorage.setItem(matrixUserIdKey, matrixSession.userId);

    if (matrixSession.deviceId) {
        localStorage.setItem(matrixDeviceIdKey, matrixSession.deviceId);
    } else {
        localStorage.removeItem(matrixDeviceIdKey);
    }

    currentUserId = matrixSession.userId;
    callListeners();
}

export function clearSession(): void {
    localStorage.removeItem(matrixAccessTokenKey);
    localStorage.removeItem(matrixDeviceIdKey);
    localStorage.removeItem(matrixUserIdKey);
    clearSessionItems();
    currentUserId = null;
    callListeners();
}

function normalizeSessionItemKey(key: SessionItemKey): string {
    const parts = Array.isArray(key) ? key : [key];
    return `${appSessionItemPrefix}${parts.map(encodeURIComponent).join(":")}`;
}

export function setSessionItem(key: SessionItemKey, value: unknown): void {
    sessionStorage.setItem(normalizeSessionItemKey(key), JSON.stringify(value));
}

export function getSessionItem<T>(key: SessionItemKey): T | null {
    const normalizedKey = normalizeSessionItemKey(key);
    const value = sessionStorage.getItem(normalizedKey);
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        sessionStorage.removeItem(normalizedKey);
        return null;
    }
}

export function removeSessionItem(key: SessionItemKey): void {
    sessionStorage.removeItem(normalizeSessionItemKey(key));
}

export function removeSessionItemsByPrefix(prefix: SessionItemKey): void {
    const normalizedPrefix = normalizeSessionItemKey(prefix);
    const nestedPrefix = `${normalizedPrefix}:`;

    for (let index = sessionStorage.length - 1; index >= 0; index--) {
        const key = sessionStorage.key(index);
        if (key === normalizedPrefix || key?.startsWith(nestedPrefix)) {
            sessionStorage.removeItem(key);
        }
    }
}

export function clearSessionItems(): void {
    for (let index = sessionStorage.length - 1; index >= 0; index--) {
        const key = sessionStorage.key(index);
        if (key?.startsWith(appSessionItemPrefix)) {
            sessionStorage.removeItem(key);
        }
    }
}

export function addListener(listener: Listener): () => void {
    listeners.add(listener);
    return () => removeListener(listener);
}

function removeListener(listener: Listener): void {
    listeners.delete(listener);
}

function callListeners() {
    listeners.forEach((listener) => listener());
}

export function useCurrentUserId(): string | null {
    const [userId, setUserId] = useState<string | null>(getUserId());
    useEffect(() => {
        return addListener(() => {
            setUserId(getUserId());
        });
    }, []);
    return userId;
}
