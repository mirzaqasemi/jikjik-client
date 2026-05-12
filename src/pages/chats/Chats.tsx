import './Chats.css';
import { getChats, type User } from "../../backend.ts";
import { getDate, getTitle } from "../../utilities.js";
import { useEffect, useState } from "react";
import * as session from '../../session.ts';
import { Link } from 'react-router-dom';

export default function Chats() {
    const [searchedUser, setSearchedUser] = useState("");
    const [allChats, setAllChats] = useState([]);
    const user: User = session.useSession();
    useEffect(() => {
        async function fetchChats() {
            try {
                setAllChats(await getChats(user.username, searchedUser));
            } catch (error) {
            }
        }
        fetchChats();
    }, [user.username, searchedUser]);

    return (
        <div id="page-inbox" className="chats-page">
            <div className="chats-header">
                <div className='d-flex justify-content-between align-items-center header-info'>
                    <h2>{user.displayName}</h2>
                    <button className="d-flex logout-btn" aria-label="More options" onClick={() => session.logoutUser()}>
                        <svg className='logout-icon' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M48 256C48 141.1 141.1 48 256 48c13.3 0 24-10.7 24-24s-10.7-24-24-24C114.6 0 0 114.6 0 256S114.6 512 256 512c13.3 0 24-10.7 24-24s-10.7-24-24-24C141.1 464 48 370.9 48 256zM392.3 134.4c-9.7-9-24.9-8.5-33.9 1.3s-8.5 24.9 1.3 33.9L426.9 232 184 232c-13.3 0-24 10.7-24 24s10.7 24 24 24l242.9 0-67.2 62.4c-9.7 9-10.3 24.2-1.3 33.9s24.2 10.3 33.9 1.3l112-104c4.9-4.5 7.7-10.9 7.7-17.6s-2.8-13-7.7-17.6l-112-104z" />
                        </svg>
                    </button>
                </div>
                <div className="search-bar">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input onChange={(e) => setSearchedUser(e.target.value)} type="text" placeholder="Search messages or users..."></input>
                </div>
            </div>

            <div className="chats-list">
                {
                    allChats.map(chat => (
                        <Link to={`/chats/${chat.id}`} key={chat.id} className="d-flex chat-item">
                            <div className="d-flex avatar-container">
                                <img src="https://i.pravatar.cc/150?img=11" alt="David" className="avatar" />
                                {/* {username.img != null && <img src={username.img} alt="David" class="avatar"/>} */}
                                {/* {chat.img != null && <img src={chat.img} alt="David" class="avatar" />} */}
                                <div className="online-dot"></div>
                            </div>
                            <div className="chat-info">
                                <div className="d-flex label-row">
                                    <div className="chat-name">{getTitle(user.username, chat)}</div>
                                    <div className="chat-meta unread-time">{getDate(chat.lastMsg.date)}</div>
                                </div>
                                <div className="d-flex label-row">
                                    <div className="chat-preview unread-text">{chat.lastMsg.content}</div>
                                    <div className="unread-badge">2</div>
                                </div>
                            </div>
                        </Link>
                    ))
                }
            </div>
        </div>
    );
}