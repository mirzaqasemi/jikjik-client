import { useEffect, useState } from "react";
import type { MatrixSession } from "./matrix-models";
import type { User } from "./backend";

export type Listener = () => void;
export type SessionItemKey = string | string[];


const matrixAccessTokenKey = "matrixAccessToken";
const matrixDeviceIdKey = "matrixDeviceId";
const matrixUserIdKey = "matrixUserId";
const appSessionItemPrefix = "app:";

let currentUser: User | null = null;
const listeners = new Set<Listener>();

export function getUser(): User | null{
    if (currentUser == null) {
        const matrixSession = getMatrixSession();
        if (matrixSession != null) {
            currentUser = {
                userId: matrixSession.userId,
                username: matrixSession.userId,
                displayName: matrixSession.userId
            }
        }
    }
    return currentUser;
}

// throws error if user is null
export function mustGetUser(): User {
    const user = getUser();
    if (user == null){
        throw Error("User not logged in");
    }
    return user;
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

    currentUser = {
        userId: matrixSession.userId,
        username: matrixSession.userId,
        displayName: matrixSession.userId,
    };
    callListeners();
}

export function clearSession(): void {
    localStorage.removeItem(matrixAccessTokenKey);
    localStorage.removeItem(matrixDeviceIdKey);
    localStorage.removeItem(matrixUserIdKey);
    clearSessionItems();
    currentUser = null;
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



export function useSession(): User | null{
    const [userInfo, setUserInfo] = useState<User | null>(getUser());
    useEffect(() => {
        return addListener(() => {
            setUserInfo(getUser());
        });
    }, []);
    return userInfo;
}
