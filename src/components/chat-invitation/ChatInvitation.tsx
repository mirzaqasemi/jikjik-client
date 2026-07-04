import * as backend from "@/services/backend";
import * as session from "@/services/session";
import { Button } from "../ui/button";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";


export default function ChatInvitation() {
    const rawUser = session.getUser();
    const selectedChat = useLoaderData<backend.Chat>();
    const navigate = useNavigate();
    const chatId = useParams().chatId;
    let title;

    if (selectedChat.title != undefined) {
        title = selectedChat.title;
    } else if (selectedChat.users.length == 2) {
        title = selectedChat.users.find((user) => user.userId != rawUser?.userId)?.displayName;
    }

    async function onStartChating() {
        try {
            const response = await backend.acceptChatInvitation(chatId!);
            if (!response.id) {
                throw new Error("Couldn't join the room");
            }
            navigate(`/chats/${chatId}`)
        } catch (error) {
            console.error("Failed to join", error);
            navigate(`/chats/${chatId}/invite`);
        }
    }

    return (
        <div className="flex flex-col justify-center items-center gap-3 w-[300px] lg:w-[500px] py-7 px-3 rounded-4xl text-xl bg-white">
            <div className="space-y-2.5 mb-3">
                <h3>Do you want to chat with {title}</h3>
                <div className="flex justify-center items-center gap-x-2">
                    <div className="flex justify-center items-center font-bold w-12 h-12 rounded-full bg-chart-2 text-chart-4">{title?.charAt(0).toUpperCase()}</div>
                    <span className="muted-text">{title} wants to chat</span>
                </div>
            </div>
            <Button className='w-36' onClick={onStartChating}>Start Chatting</Button>
            <div className="flex gap-x-2">
                <Button variant="outline" className='w-36'>Decline</Button>
                <Button variant="outline" className='w-36 text-destructive'>Decline and Block</Button>
            </div>
        </div>
    );
}