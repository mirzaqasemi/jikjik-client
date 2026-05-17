import { useEffect, useRef, useState } from "react";
import { Link, useLoaderData, useParams } from 'react-router-dom';
import * as backend from "../../services/backend.ts";
import * as session from '../../services/session.ts';
import * as utilities from "../../utilities/utilities.ts";
import './Chat.css';

export default function Chat() {
    const params = useParams<{ chatId: string }>();
    const selectedChat = useLoaderData<backend.Chat>();
    const rawUser = session.getUser();
    const [messages, setMessages] = useState<backend.Message[]>([]);
    const [inputStr, setinputStr] = useState("");
    const loadingPromise = useRef<Promise<any> | null>(null);

    let classStr = "";

    if (rawUser == null) {
        throw new Error("User not authenticated");
    }
    const user = rawUser;

    if (params?.chatId == null) {
        throw new Error("Missing chatId");
    }
    const chatId = params.chatId;

    useEffect(() => {
        //TODO Optimize 
        const id = setInterval(
            async () => {
                if (loadingPromise.current != null) {
                    await loadingPromise.current;
                    loadingPromise.current = null;
                }

                async function load() {
                    const msgs = await backend.getMesseges(chatId);
                    setMessages([...msgs]);
                }
                loadingPromise.current = load();
            }, 1000);
        return () => {
            clearInterval(id);
        }
    }, [chatId]);

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

    async function addToMessages() {
        if (loadingPromise.current != null) {
            await loadingPromise.current;
            loadingPromise.current = null;
        }

        if (!inputStr.trim()) return;
        let msgObj = {
            sender: user,
            content: inputStr,
            date: new Date()
        }
        setMessages(prev => [...prev, msgObj]);
        setinputStr("");
        loadingPromise.current = backend.sendMessage({ username: user.username, chatId: chatId, content: inputStr });
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            </div>
            {/* <!-- Middle: Messages Section --> */}
            <div className="flex flex-col message-area">
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
                            <div className="flex message-meta">{utilities.getDate(message.date)}</div>
                        </div>
                    })
                }
            </div>
            {/* <!-- Bottom: Input Section --> */}
            <div className="flex justify-center chat-input-area">
                <input value={inputStr} type="text" placeholder="Type a message..." onChange={(e) => setinputStr(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            addToMessages();
                        }
                    }} />
                <button onClick={addToMessages} className="flex justify-center btn-send">
                    <svg style={{ transform: "rotate(90deg)" }} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
}