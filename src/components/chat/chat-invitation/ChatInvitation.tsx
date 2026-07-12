import * as backend from "@/services/backend";
import * as session from "@/services/session";
import { Button } from "../../ui/button";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import Header from "../header/Header";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";


export default function ChatInvitation() {
    const rawUser = session.getUser();
    const chat = useLoaderData<backend.Chat>();
    const navigate = useNavigate();
    const chatId = useParams().chatId;

    const mutation = useMutation({
        mutationFn: backend.acceptChatInvitation,
        onSuccess: () => {
            navigate(`/chats/${chatId}`);
        },
        onError: (error) => {
            console.error("Failed to join", error);
        }
    });
    async function startChating() {
        mutation.mutate(chatId!);
    }

    return (
        <div className="flex flex-col w-full items-center">
            <Header chat={chat} />
            {mutation.isPending ?
                <Spinner />
                :
                <div className="flex flex-col justify-center items-center gap-3 w-80 sm:w-90 lg:w-100 py-7 px-3 rounded-4xl text-xl bg-white">
                    <div className="space-y-2.5 mb-3">
                        <h3>Do you want to chat with {chat.title}?</h3>
                        <div className="flex justify-center items-center gap-x-2">
                            <div className="flex justify-center items-center font-bold w-12 h-12 rounded-full bg-chart-2 text-chart-4">{chat.title?.charAt(0).toUpperCase()}</div>
                            <span className="muted-text">{chat.title} wants to chat</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-y-2.5 gap-x-4 w-70 sm:w-75">
                        <div className="flex justify-between">
                            <Button variant="outline" className='w-[49%] lg:w-[47%]'>Decline</Button>
                            <Button className='w-[49%] lg:w-[47%]' onClick={startChating}>Start Chatting</Button>
                        </div>
                        <Button variant="outline" className='w-full text-destructive'>Decline and Block</Button>
                    </div>
                </div>
            }
        </div>
    );
}