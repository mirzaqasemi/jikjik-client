import './Chat.css';
import { getTitle, getDate } from "../../utilities.ts";
import { getMesseges, sendMessage } from "../../backend.ts";
import { useState, useEffect, useRef } from "react";
import * as session from '../../session.ts';

export default function Chat({selectedChat, navigatTo }) {
    const user = session.getUser();
    const [messages, setMessages] = useState([]);
    const [inputStr, setinputStr] = useState("");
    const loadingPromise = useRef<Promise<any>>(null);
    let classStr = "";
    useEffect(() => {
        const id = setInterval(async () => {
            if (loadingPromise.current != null) {
                await loadingPromise.current;
                loadingPromise.current = null;
            }

            async function load() {
                const msgs = await getMesseges(selectedChat.id);
                setMessages([...msgs]);
            }
            loadingPromise.current = load();
        }, 1000);
        return () => {
            clearInterval(id);
        }
    }, [selectedChat.id]);

    function getMessageSender(message) {
        if (selectedChat.users.length > 2 && message.sender.username != user.username) { //In group
            classStr = "received"
            return <div className="d-flex sender-title">{message.sender.displayName}</div>
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
        loadingPromise.current = sendMessage({ username: user.username, chatId: selectedChat.id, content: inputStr });
    }

    return (
        <div className="d-flex flex-column chat-page">
            {/* <!-- Top: Header Section --> */}
            <div className="d-flex align-items-center conversation-header">
                <button className="btn-back" onClick={() => navigatTo()}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <div className="d-flex">
                    <div className="avatar-container">
                        <img src="https://i.pravatar.cc/150?img=32" alt="" className="avatar" />
                    </div>
                    <div className="d-flex flex-column user-details">
                        <span className="user-name">{getTitle(user.username, selectedChat)}</span>
                        <span className="user-status">Online</span>
                    </div>
                </div>
                {/* <!-- Right Side: Three Dots (Kebab Menu) --> */}
                <button className="d-flex icon-btn more-options-btn" aria-label="More options">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            </div>
            {/* <!-- Middle: Messages Section --> */}
            <div className="d-flex flex-column message-area">
                <div className="date-separator">TODAY</div>
                {
                    messages.map((message, index) => {
                        let messageSender = getMessageSender(message);
                        return <div key={index} className={"d-flex flex-column message-wrapper" + " " + classStr}>
                            <div className="d-flex flex-column message-bubble">
                                {
                                    messageSender
                                }
                                <div>{message.content}</div>
                            </div>
                            <div className="d-flex message-meta">{getDate(message.date)}</div>
                        </div>
                    })
                }
            </div>
            {/* <!-- Bottom: Input Section --> */}
            <div className="d-flex chat-input-area">
                <input value={inputStr} type="text" placeholder="Type a message..." onChange={(e) => setinputStr(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            addToMessages();
                        }
                    }} />
                <button onClick={addToMessages} className="d-flex justify-content-center align-items-center btn-send">
                    <svg style={{ transform: "rotate(90deg)" }} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
}