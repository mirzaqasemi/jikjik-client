import * as backend from "@/services/backend";
import { subscribeInvitationChanged } from "@/services/backend-event";
import * as session from "@/services/session";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../ui/button";
import Header from "../header/Header";


export default function ChatInvitation() {
    const rawUser = session.getUser();
    const chat = useLoaderData<backend.Chat>();
    const navigate = useNavigate();
    const chatId = useParams().chatId!;
    // Add listener once, to know if invitation status be changed. 
    // If chatId or navigate are changed, so old listener should be cleaned and react adds new listener. 
    useEffect(() => {
        const cleanup = subscribeInvitationChanged(chatId!, (e) => {
            switch (e.change) {
                case "accepted":
                    navigate(`/chats/${chatId}`);
                    break;
                case "removed":
                    navigate(`/chats/`);
                    break;
            }
        });
        return cleanup;
    }, [chatId, navigate]);

    const joinMutation = useMutation({
        mutationFn: () => backend.acceptChatInvitation(chatId),
        onError: (error) => {
            console.error("Failed to join", error);
        },
    });

    const declineMutation = useMutation({
        mutationFn: () => backend.declineChatInvitation(chatId),
        onError: (error) => {
            console.error("Failed to decline", error);
        },
    });

    const blockMutation = useMutation({
        mutationFn: () => {
            const otherUser = chat.users.find((u) =>
                u.userId != user.userId
            )!;
            return backend.blockUser(otherUser.userId);
        },
        onSuccess: () => declineMutation.mutate(),
    });

    if (rawUser == null) {
        throw new Error("User not found!");
    }
    const user = rawUser;
    const btnDisabled = (declineMutation.isPending || declineMutation.isSuccess) || (joinMutation.isPending || joinMutation.isSuccess) || (blockMutation.isPending || blockMutation.isSuccess);

    return (
        <div className="flex flex-col w-full items-center">
            <Header chat={chat} />
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
                        <Button onClick={() => declineMutation.mutate()} disabled={btnDisabled} variant="outline" className='w-[49%] lg:w-[47%]'>
                            Decline</Button>
                        <Button onClick={() => joinMutation.mutate()} disabled={btnDisabled} className='w-[49%] lg:w-[47%]'>
                            Start Chatting</Button>
                    </div>
                    <Button onClick={() => blockMutation.mutate()} disabled={chat.users.length < 2 || btnDisabled} variant="outline" className='w-full text-destructive'>
                        Decline and Block</Button>
                </div>
            </div>
        </div >
    );
}