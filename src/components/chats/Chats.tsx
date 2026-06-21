import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
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
import { SearchIcon } from "lucide-react";


export default function Chats() {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = hooks.useDebounce(searchQuery, 300);
    const navigate = useNavigate();
    const user: backend.User | null = session.useSession();

    type Data = {
        chats: backend.Chat[],
        contacts: backend.User[]
    }
    const {
        data = { chats: [], contacts: [] },
        isLoading,
        isError,
        error
    } = useQuery<Data>({
        queryKey: ["allChats", user?.username, debouncedSearchQuery], // "allChats" is the name/address of the cached data
        queryFn: async () => {
            const chats = await backend.getChats(debouncedSearchQuery);
            const contacts = await backend.searchContacts(debouncedSearchQuery);
            return { chats, contacts }
        },
        enabled: user != null ////Do not run queryFn until user exists.
    });
    const { chats, contacts } = data; // onrolling data
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
        <div className="w-full h-full pt-5 pb-3 chats-page">

            {/* <!-- Top: Header Section --> */}
            <div className="flex px-4 items-center gap-4">

                {/* <!-- Hamburger Menu --> */}
                <div>
                    <Menu logout={logout} user={user} />
                </div>

                {/* <Searchbar /> */}

                {/* <!-- Search Bar --> */}
                <InputGroup className="search-bar">
                    <InputGroupInput id="inline-start-input" placeholder="Search chats, people, groups..." onChange={(e) => setSearchQuery(e.target.value)} />
                    <InputGroupAddon align="inline-start">
                        <SearchIcon className="text-muted-foreground" />
                    </InputGroupAddon>
                </InputGroup>
            </div>

            {/* <!-- Middle: Chat List --> */}
            {isLoading ?
                <div className="flex items-center mt-15 justify-center">
                    <Spinner className="size-8"/>
                </div>
                : (chats.length > 0 || contacts.length > 0) ?
                <>
                    <div className="overflow-auto mt-8 px-4 chat-list">
                        {
                            chats.map(chat => (
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
                                            <div className="chat-preview unread-text">{chat.lastMsg?.content}</div>
                                            <div className="w-4 h-4 flex justify-center rounded-full unread-badge">2</div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        }
                    </div>
                    {
                        contacts.length > 0 &&
                        <div className="pt-3">
                            <div className="flex h-7 px-5 text-[13.5px] muted-text font-light muted-background text-start items-center">Contacts</div>
                            <div className="px-4">
                                {
                                    contacts.map((contact) => (
                                        <button onClick={() => navigate(`/chats/${1}`)} key={contact.userId}
                                            className="flex m-auto h-18 items-center w-full chat-item">
                                            <div className="relative h-10 w-10 shrink-0">
                                                <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                                                {/* {username.img != null && <img src={username.img} alt="David" class="avatar"/>} */}
                                                {/* {chat.img != null && <img src={chat.img} alt="David" class="avatar" />} */}
                                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chart-2  border-2 border-white" aria-label="Online" />
                                            </div>
                                            <div className="flex-1 pb-2.5 pt-2.5 ml-3 chat-info">
                                                <div className="flex flex-col items-start">
                                                    <div className="chat-name">{contact.displayName}</div>
                                                    <span className="muted-text font-light text-[13px]">last seen recently</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    }
                </> :
                <div className="flex flex-col gap-y-2 mt-15 muted-text font-medium">
                No Results
                <span className="font-normal text-[15px] tracking-wide">There were no results for "{debouncedSearchQuery}".</span>
                </div>
            }
        </div>
    );
}
