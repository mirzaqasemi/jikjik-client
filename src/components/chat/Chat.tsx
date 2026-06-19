import { Spinner } from "@/components/ui/spinner.tsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLoaderData, useParams } from 'react-router-dom';
import * as backend from "../../services/backend.ts";
import * as session from '../../services/session.ts';
import * as utilities from "../../utilities/utilities.ts";
import './Chat.css';
import Message from "./message/Message.tsx";


type MessageWithStatus = backend.Message & { status: "pending" | "error" };

export default function Chat() {
    const params = useParams<{ chatId: string }>();
    const selectedChat = useLoaderData<backend.Chat>();
    const [inputStr, setinputStr] = useState("");
    const queryClient = useQueryClient(); // Give access to the big cache/storage room
    const rawUser = session.getUser();
    const bottomRef = useRef<HTMLDivElement>(null);
    const [pendingMsgs, setPendingMsgs] = useState<MessageWithStatus[]>([]);

    if (rawUser == null) {
        throw new Error("User not authenticated");
    }
    const user = rawUser;

    if (params?.chatId == null) {
        throw new Error("Missing chatId");
    }
    const chatId = params.chatId;

    // Fetching data from backend
    const {
        data: serverMessages = [], // Rename "data" to "messages" 
        isLoading,
        isError,
    } = useQuery<backend.Message[]>({
        queryKey: ["messagesId", chatId],
        queryFn: () => backend.getMessages(chatId),
        enabled: !!user && !!chatId,
        refetchInterval: 500,

    });

    useEffect(() => {
        setPendingMsgs((oldPending) =>
            oldPending.filter(
                (pending) =>
                    !serverMessages.some(
                        (serverMsg) => serverMsg.uid === pending.uid
                    )
            )
        );
    }, [serverMessages]);

    if (isError) {
        return (
            <div className="flex justify-center items-center h-full">
                Failed to load chats.
            </div>
        );
    }
    //At first: Chat component Render -> DOM updated -> useLayoutEffect runs -> scroll -> PAINT 🎨 (The browser actually draws pixels on the screen so the user can see something.)
    useLayoutEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "auto"
        })
    }, [serverMessages.length]);

    const sendMessageMutation = useMutation({
        mutationFn: (params: { username: string, chat: backend.Chat, content: string, uid: string }) => {
            return backend.sendMessage(params);
        },
        //onMutate() runs immediately before mutationFn executes
        onMutate: ({ content, uid }) => {
            const msgObj: MessageWithStatus = {
                sender: user,
                content,
                date: new Date(),
                uid,
                status: "pending"
            }
            setPendingMsgs([...pendingMsgs, msgObj]);
        },
        onError: (err, params) => {
            const arr = pendingMsgs.map((pendingMsg) => {
                if (pendingMsg.uid === params.uid) {
                    return {
                        ...pendingMsg,
                        status: "error"
                    } as MessageWithStatus;
                }
                return pendingMsg;
            });
            setPendingMsgs(arr);
            console.error("failed to send message", params, err);
        },
    });

    async function addToMessages() {
        if (!inputStr.trim()) return;

        const content = inputStr; // Save inputStr before clearing

        setinputStr("");
        sendMessageMutation.mutate({
            username: user.username,
            chat: selectedChat,
            content: content,
            uid: crypto.randomUUID()
        });
    }

    return (
        <div className="flex flex-col chat-page">

            {/* <!-- Top: Header Section --> */}
            <div className="flex items-center conversation-header">
                <div className="flex gap-2.5">
                    <Link to={"../"} className="lg:hidden flex justify-center items-center btn-back w-10 h-10 rounded-full">
                        <ArrowLeft strokeWidth={"1.5"} />
                    </Link>
                    <div className="flex gap-3">
                        <div className="avatar-container">
                            <img src="https://i.pravatar.cc/150?img=32" alt="" className="size-11 rounded-full lg:hidden" />
                        </div>
                        <div className="flex flex-col items-start user-details">
                            <span className="user-name">{utilities.getTitle(user.username, selectedChat)}</span>
                            <span className="user-status">Online</span>
                        </div>
                    </div>
                </div>
                {/* <!-- Right Side: Three Dots (Kebab Menu) --> */}
                <button className="flex icon-btn more-options-btn" aria-label="More options">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
                        strokeLinejoin="round" strokeLinecap="round">
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            </div>


            {/* <!-- Middle: Messages Section --> */}
            {
                isLoading ?
                    <Spinner className="flex-1 m-auto size-9 opacity-30" />
                    :
                    <div className="flex flex-col messages-area">
                        <div className="date-separator">TODAY</div>
                        {
                            serverMessages.map((message) =>
                                <Message user={user} chat={selectedChat} message={message} key={message.uid} status="success" />
                            )
                        }
                        {
                            pendingMsgs.filter((pendingMsg) =>
                                !serverMessages.some((serverMsg) => serverMsg.uid === pendingMsg.uid)
                            ).map((pendingMsg) =>
                                < Message user={user} chat={selectedChat} message={pendingMsg} key={pendingMsg.uid} status={pendingMsg.status} />
                            )
                        }
                        <div ref={bottomRef}></div>
                    </div>
            }


            {/* <!-- Bottom: Input Section --> */}
            <div className="flex justify-center chat-input-area">
                <input value={inputStr} type="text" placeholder="Write a message..."
                    onChange={(e) => setinputStr(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            addToMessages();
                        }
                    }} />
                <button onClick={addToMessages} className="flex justify-center rounded-full btn-send ">
                    <SendHorizontal className="" fill="var(--primary)" strokeWidth={"1.5"} stroke="" />
                </button>
            </div>
        </div>
    );
}
