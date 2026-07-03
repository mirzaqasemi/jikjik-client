import  * as backend from "../services/backend";
import  * as session from "../services/session";

export function formatDate(date?: Date | null): string {
    if (date == null) return "";
    let hourNum = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const hour = (hourNum % 12).toString().padStart(2, '0');
    const timeString = `${hour}:${minute}`;
    return timeString + " " + ampm;
}

export function getTitle( chat: backend.Chat): string {
    const user: backend.User | null = session.getUser();
    const currentUserId= user?.userId;
    const users = chat.users;
    let names: string[] = [];
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
