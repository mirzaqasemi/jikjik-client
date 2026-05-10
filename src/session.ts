import type { User } from "./backend";

export type Listener = (newValue: User) => void;
interface RegisteredListener {
    id: number
    listener: Listener,
}


const displayNameKey = 'displayName';
const usernameKey = 'username';

let currentUser: User = null;
let listeners: RegisteredListener[] = [];
let lastId = 0;

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

export function addListener(listener: Listener): number {
    const newListener = {
        id: generateId(),
        listener,
    };
    listeners.push(newListener);
    return newListener.id;
}

export function removeListener(id: number): void {
    const index = listeners.findIndex((listener) => listener.id == id);
    listeners.splice(index, 1);
}

function callListeners() {
    for (let index = 0; index < listeners.length; index++) {
        const rl = listeners[index];
        rl.listener(currentUser);
    }
}

function generateId(): number {
    return lastId += 1;
}