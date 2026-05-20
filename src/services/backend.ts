import * as session from './session';
import { mustGetUser } from './session';
import { decryptTextMessage, encryptTextMessage, type Keys, setupKeys, signRequest } from "@/services/crypto.ts";

// -----------------------------------------
// Types
// -----------------------------------------
export interface User
{
    username: string;
    displayName: string;
    lastSeen?: string;
    encPublicKey: string;
}

export interface Message
{
    sender: User;
    content: string;
    date: Date;
}

type EncryptedMsgContent = { [userId: string]: string };

interface EncryptedMessage
{
    sender: User;
    content: EncryptedMsgContent;
    date: Date;
}

export interface Chat
{
    id: string;
    title?: string;
    users: User[];
    lastMsg: {
        sender: string;
        content: string;
        date: Date;
    };
}


function handleFetchFailure<T>(r: Response): Promise<T> {
    return r.ok ? r.json() : r.json().then(e => Promise.reject(e));
}

async function authorizedFetchJson<T>(method: string, data: any, input: RequestInfo | URL,
                                      init?: RequestInit, username?: string, privateKey?: CryptoKey): Promise<T> {
    if (username == null) {
        username = session.mustGetUser().username;
    }
    const authHeaders = await signRequest(username, data, method, privateKey);

    return fetch(input, {
        ...init,
        headers: {"Content-Type": "application/json", ...(init?.headers || {}), ...authHeaders},
    }).then(handleFetchFailure<T>);
}

// -----------------------------------------
// API Functions
// -----------------------------------------
export async function login(username: string): Promise<User | null> {
    await setupKeys(username, (keys) => register(username, keys));
    return currentUser(username);
}

export async function currentUser(username?: string): Promise<User | null> {
    return authorizedFetchJson("currentUser", {}, "/api/current_user", {
        method: "GET",
    }, username)
}

async function register(username: string, keys: Keys) {
    // Backend expects PEM for sign key
    const pemWrap = (b64: string) =>
        `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)!.join("\n")}\n-----END PUBLIC KEY-----`;

    // Manually sign register request because it might be first time
    const body = {
        publicKeys: {
            sign: pemWrap(keys.signPub),
            enc: keys.encPub,
        }
    };
    await authorizedFetchJson("register", body, "/api/register", {
        method: "POST",
        body: JSON.stringify(body),
    }, username, keys.signPrivKey);
}

export async function getChats(filter?: string): Promise<Chat[]> {
    const body = {filter: filter || ""};
    const response = await authorizedFetchJson<{ chats: Chat[] }>("getChats", body, "/api/chats", {
        method: "POST",
        body: JSON.stringify(body)
    });
    return response.chats;
}

export async function getChat(chatId: string) {
    return await authorizedFetchJson<Chat>("getChat", {chatId}, `/api/chats/${chatId}`, {
        method: "GET",
    });
}

export async function getMessages(chatId: string): Promise<Message[]> {
    const messages = (await authorizedFetchJson<{
        messages: EncryptedMessage[]
    }>("getMessages", {chatId}, `/api/chats/${chatId}/messages`, {
        method: "POST",
    })).messages;

    const username = mustGetUser().username;

    return Promise.all(messages.map(async em => {
        return {
            ...em,
            content: await decryptTextMessage(em.content[username]),
        }
    }));
}

export async function sendMessage(req: {
    username: string;
    chat: Chat;
    content: string;
}): Promise<void> {
    const msg: EncryptedMsgContent = {};
    for (const user of req.chat.users) {
        if (user.encPublicKey == "" || user.encPublicKey == null) {
            throw Error(`user ${user.username} has not registered yet!`);
        }
        msg[user.username] = await encryptTextMessage(req.content, user.encPublicKey);
    }

    const data = {content: msg, chat_id: req.chat.id, uid: crypto.randomUUID()};
    await authorizedFetchJson("sendMessage", data, `/api/message`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getContacts(): Promise<User[]> {
    return (await authorizedFetchJson<{ contacts: User[] }>("getContacts", {}, `/api/contacts`, {
        method: "POST",
    })).contacts;
}
