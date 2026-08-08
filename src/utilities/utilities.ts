import * as backend from "../services/backend";
import * as session from "../services/session";

const colors = [
    "bg-rose-300",
    "bg-pink-300",
    "bg-fuchsia-300",
    "bg-purple-300",
    "bg-violet-300",
    "bg-indigo-300",
    "bg-sky-300",
    "bg-cyan-300",
    "bg-teal-300",
    "bg-emerald-300",
    "bg-lime-300",
    "bg-amber-300",
    "bg-orange-300",
];

export function formatDate(date?: Date | null): string {
    if (date == null) return "";
    const hourNum = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const hour = (hourNum % 12).toString().padStart(2, '0');
    const timeString = `${hour}:${minute}`;
    return timeString + " " + ampm;
}

export function getTitle(chat: backend.Chat): string {
    const user: backend.User | null = session.getUser();
    const currentUserId = user?.userId;
    const users = chat.users;
    const names: string[] = [];
    if (chat.title != null && chat.title != "") {
        return chat.title;
    }
    for (let index = 0; index < users.length; index++) {
        if (users[index].userId !== currentUserId) {
            names.push(users[index].displayName);
        }
    }
    return names.join(", ");
}

export function getColor(seed: string): string {
    let hash = 0;
    for (let index = 0; index < seed.length; index++) {
        hash += seed.charCodeAt(index);
    }
    return colors[hash % colors.length];
}