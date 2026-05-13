import type * as backend from "../services/backend";

export function getDate(date: Date): string {
    let hourNum = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const hour = (hourNum % 12).toString().padStart(2, '0');
    const timeString = `${hour}:${minute}`;
    return timeString + " " + ampm;
}

interface Chat {
    title?: string | null;
    users: backend.User[];
}

export function getTitle(username: string, chat: Chat): string {
    const users = chat.users;

    let names: string[] = [];
    if (chat.title != null) {
        return chat.title;
    }
    for (let index = 0; index < users.length; index++) {
        if (users[index].username !== username) {
            names.push(users[index].displayName);
        }
    }
    return names.join(", ");
}