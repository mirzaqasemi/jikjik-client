import { useEffect, useState } from "react";
import type { MatrixSession } from "./matrix-models";
import type { User } from "../services/backend";

export type Listener = () => void;


const matrixAccessTokenKey = "matrixAccessToken";
const matrixDeviceIdKey = "matrixDeviceId";
const matrixUserIdKey = "matrixUserId";
const draftDmUserKey = "draftDmUser";

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

export function draftDm(user: User): void {
    sessionStorage.setItem(draftDmUserKey, JSON.stringify(user));
}

export function getDraftDm(): User | null {
    const draftUser = sessionStorage.getItem(draftDmUserKey);
    if (!draftUser) {
        return null;
    }

    try {
        return JSON.parse(draftUser) as User;
    } catch {
        removeDraftDm();
        return null;
    }
}

export function removeDraftDm(): void {
    sessionStorage.removeItem(draftDmUserKey);
}

export function clearSession(): void {
    localStorage.removeItem(matrixAccessTokenKey);
    localStorage.removeItem(matrixDeviceIdKey);
    localStorage.removeItem(matrixUserIdKey);
    removeDraftDm();
    currentUser = null;
    callListeners();
}

export function logoutUser(): void {
    clearSession();
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
