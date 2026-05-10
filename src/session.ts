import { useEffect, useState } from "react";
import type { User } from "./backend";

export type Listener = () => void;


const displayNameKey = 'displayName';
const usernameKey = 'username';

let currentUser: User = null;
let listeners = new Set<Listener>();

export function getUser(): User {
    if (currentUser == null) {
        const username = localStorage.getItem(usernameKey);
        if (username != null) {
            currentUser = {
                username: username,
                displayName: localStorage.getItem(displayNameKey)
            }
        }
    }
    return currentUser;
}

export function setUser(username: string, displayName: string): void {
    localStorage.setItem(usernameKey, username);
    localStorage.setItem(displayNameKey, displayName);
    localStorage.setItem('loggedIn', 'true');
    currentUser = {
        username: username,
        displayName: displayName
    }
    callListeners();
}

export function logoutUser(): void {
    localStorage.removeItem(usernameKey);
    localStorage.removeItem(displayNameKey);
    localStorage.removeItem('loggedIn')
    currentUser = null;
    callListeners();
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



export function useSession(): User {
    const [userInfo, setUserInfo] = useState<User>(getUser());
    useEffect(() => {
        const cleanup = addListener(() => {
            setUserInfo(getUser());
        });
        return cleanup;
    }, []);
    return userInfo;
}