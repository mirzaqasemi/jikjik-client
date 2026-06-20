import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";

import { SearchIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useQuery } from "@tanstack/react-query";

import { useState } from "react";
import { Navigate, useNavigate } from 'react-router-dom';
import * as hooks from '../../hooks/useDebounce.ts';
import * as router from '../../router.tsx';
import * as backend from '../../services/backend.ts';
import * as session from '../../services/session.ts';
import * as utils from "../../utilities/utilities.ts";
import './Chats.css';
import Menu from "../menu/Menu.tsx";

export default function Chats() {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = hooks.useDebounce(searchQuery, 300);
    const navigate = useNavigate();
    const user: backend.User | null = session.useSession();

    const {
        data: allChats = [],
        isLoading,
        isError,
        error
    } = useQuery<backend.Chat[]>({
        queryKey: ["allChats", user?.username, debouncedSearchQuery],
        queryFn: () => backend.getChats(debouncedSearchQuery), // ! means: “TypeScript, trust me — user is NOT null or undefined here.”
        enabled: user != null ////Do not run queryFn until user exists.
    });


    if (user == null) {
        return <Navigate to={router.LOGIN_ROUTE} replace />;    // replace: The new webpage (login page) replaces the page you are currently viewing (chats page) in the history list. 
        // Clicking the browser's "Back" button will skip the old page and take you to the page you visited before it.
        // It avoids a weird back-button loop. [Login, Chats] -> Chats redirects you to login so: [Login] -> Notice Chats disappeared (Login replace).
    }

    function logout() {
        session.logoutUser();
        navigate(router.LOGIN_ROUTE);
    }

    if (isError) {
        console.error(error.message);
        return (
            <div className="flex justify-center items-center h-full">
                Failed to load chats.
            </div>
        );
    }

    return (
        <div className="w-full px-4 pt-5 pb-3 chats-page">

            {/* <!-- Top: Header Section --> */}
            <div className="flex items-center gap-4">
                {/* <!-- Hamburger Menu --> */}
               <Menu logout={logout} user={user}/>

                {/* <!-- Search Bar --> */}
                <InputGroup className="search-bar">
                    <InputGroupInput id="inline-start-input" placeholder="Search chats, people, groups..." />
                    <InputGroupAddon align="inline-start">
                        <SearchIcon className="text-muted-foreground" />
                    </InputGroupAddon>
                </InputGroup>
            </div>

            {isLoading ?
                <Spinner />
                /* <!-- Middle: Chat List --> */
                : <div className="overflow-auto mt-8">
                    {
                        allChats.map(chat => (
                            <button onClick={() => navigate(`/chats/${chat.id}`)} key={chat.id}
                                className="flex m-auto h-18 items-center w-full chat-item">
                                <div className="relative h-10 w-10 shrink-0">
                                    <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                                    {/* {username.img != null && <img src={username.img} alt="David" class="avatar"/>} */}
                                    {/* {chat.img != null && <img src={chat.img} alt="David" class="avatar" />} */}
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chart-2  border-2 border-white" aria-label="Online" />
                                </div>
                                <div className="flex-1 pb-2.5 pt-2.5 ml-3 border-b chat-info">
                                    <div className="flex label-row">
                                        <div className="chat-name">{utils.getTitle(user.username, chat)}</div>
                                        <span className="text-muted-foreground chat-meta unread-time">{utils.formatDate(chat.lastMsg?.date)}</span>
                                    </div>
                                    <div className="flex label-row">
                                        <div className="chat-preview unread-text">{chat.lastMsg?.content} Hey!</div>
                                        <div className="w-4 h-4 flex justify-center rounded-full unread-badge">2</div>
                                    </div>
                                </div>
                            </button>
                        ))
                    }
                </div>
            }
        </div>
    );
}
