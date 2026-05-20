import { useEffect, useState } from "react";
import type { User } from "../services/backend";

export type Listener = () => void;


const displayNameKey = 'displayName';
const usernameKey = 'username';

let currentUser: User | null = null;
const listeners = new Set<Listener>();

export function getUser(): User | null{
    if (currentUser == null) {
        const username = localStorage.getItem(usernameKey);
        const displayName = localStorage.getItem(displayNameKey)
        if (username != null && displayName != null) {
            currentUser = {
                username,
                displayName
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



export function useSession(): User | null{
    const [userInfo, setUserInfo] = useState<User | null>(getUser());
    useEffect(() => {
        const cleanup = addListener(() => {
            setUserInfo(getUser());
        });
        return cleanup;
    }, []);
    return userInfo;
}
