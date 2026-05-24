import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLoaderData, useParams } from 'react-router-dom';
import * as backend from "../../services/backend.ts";
import * as session from '../../services/session.ts';
import * as utilities from "../../utilities/utilities.ts";
import './Chat.css';

export default function Chat() {
    const params = useParams<{ chatId: string }>();
    const selectedChat = useLoaderData<backend.Chat>();
    const [inputStr, setinputStr] = useState("");
    const queryClient = useQueryClient(); // Give access to the big cache/storage room
    const rawUser = session.getUser();
    const bottomRef = useRef<HTMLDivElement>(null);
    //FIXME
    let classStr = "";

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
        data: messages = [], // Rename "data" to "messages" 
        isLoading,
        isError,
    } = useQuery<backend.Message[]>({
        queryKey: ["messagesId", chatId],
        queryFn: () => backend.getMessages(chatId),
        enabled: !!user && !!chatId
    });

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
    }, [messages.length]);

    //FIXME
    function getMessageSender(message: backend.Message) {
        if (selectedChat.users.length > 2 && message.sender.username != user.username) { //In group
            classStr = "received"
            return <div className="flex sender-title">{message.sender.displayName}</div>
        } else if (message.sender.username === user.username) {
            classStr = "sent";
            return;
        }
        classStr = "received";
        return;
    }

    const sendMessageMutation = useMutation({
        mutationFn: (params: { username: string, chat: backend.Chat, content: string }) => {
            return backend.sendMessage(params);
        },
        onMutate: ({ content }) => {
            const msgObj = {
                sender: user,
                content,
                date: new Date()
            }
            // queryClient.setQueryData(queryKey, updater)
            queryClient.setQueryData<backend.Message[] /*The data stored under this key is Message[]*/>(
                ["messagesId", chatId], // Go find cached messages for this chat
                oldMessages => [ //const oldMessages = queryClient.getQueryData(["messagesId", chatId]); Which TanStack internally does it and passes it automatically
                    ...(oldMessages ?? []), //If oldMessages is undefined, use empty array instead
                    msgObj
                ] // Replace cached data, UI instantly rerenders
            )
        },
        onError: (err, params) => {
            console.log("failed to send message", params, err)
        },
    });


    async function addToMessages() {
        if (!inputStr.trim()) return;

        const content = inputStr; // Save inputStr before clearing

        setinputStr("");
        sendMessageMutation.mutate({
            username: user.username,
            chat: selectedChat,
            content: content
        });
    }

    return (
        <div className="flex flex-col chat-page">
            {/* <!-- Top: Header Section --> */}
            <div className="flex align-center conversation-header">
                <Link to={"../"} className="btn-back">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div className="flex">
                    <div className="avatar-container">
                        <img src="https://i.pravatar.cc/150?img=32" alt="" className="avatar" />
                    </div>
                    <div className="flex flex-col user-details">
                        <span className="user-name">{utilities.getTitle(user.username, selectedChat)}</span>
                        <span className="user-status">Online</span>
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
                    <div className="flex justify-center items-center h-full">
                        <div
                            className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-indigo-700" />
                    </div>
                    :
                    <div className="flex flex-col messages-area">
                        <div className="date-separator">TODAY</div>
                        {
                            messages.map((message, index) => {
                                let messageSender = getMessageSender(message);
                                return <div key={index} className={"flex flex-col message-wrapper" + " " + classStr}>
                                    <div className="flex flex-col message-bubble">
                                        {
                                            messageSender
                                        }
                                        <div>{message.content}</div>
                                    </div>
                                    <div className="flex message-meta">{utilities.formatDate(message.date)}</div>
                                </div>
                            })
                        }
                        <div ref={bottomRef}></div>
                    </div>
            }
            {/* <!-- Bottom: Input Section --> */}
            <div className="flex justify-center chat-input-area">
                <input value={inputStr} type="text" placeholder="Type a message..."
                    onChange={(e) => setinputStr(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            addToMessages();
                        }
                    }} />
                <button onClick={addToMessages} className="flex justify-center btn-send">
                    <svg style={{ transform: "rotate(90deg)" }} width="18" height="18" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
}
