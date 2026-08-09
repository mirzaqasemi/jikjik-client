import Chat from "@/components/chat/Chat";
import { useParams } from "react-router-dom";

export function ChatPage() {
    const chatId = useParams().chatId;
    return <Chat key={chatId} />
}