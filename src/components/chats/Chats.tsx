import { Spinner } from "@/components/ui/spinner.tsx";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, useNavigate } from 'react-router-dom';
import * as hooks from '../../hooks/useDebounce.ts';
import * as router from '../../router.tsx';
import * as backend from '../../services/backend.ts';
import * as session from '../../services/session.ts';
import Menu from "../menu/Menu.tsx";
import ChatList from "./chat-list/ChatList.tsx";
import ContactList from "./contact-list/ContactList.tsx";
import SearchBar from "../search-bar/SearchBar.tsx";
import './Chats.css';


export default function Chats() {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = hooks.useDebounce(searchQuery, 300);
    const user: backend.User | null = session.useSession();
    const navigate = useNavigate();

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
        enabled: user != null, ////Do not run queryFn until user exists.
        retry: 2,
        refetchInterval: 1000,
    });
    const { chats, contacts } = data; // onrolling data

    if (user == null) {
        return <Navigate to={router.LOGIN_ROUTE} replace />;    // replace: The new webpage (login page) replaces the page you are currently viewing (chats page) in the history list. 
        // Clicking the browser's "Back" button will skip the old page and take you to the page you visited before it.
        // It avoids a weird back-button loop. [Login, Chats] -> Chats redirects you to login so: [Login] -> Notice Chats disappeared (Login replace).
    }

    function logout() {
        backend.logout();
        navigate(router.LOGIN_ROUTE);
    }

    function clearSearch() {
        setSearchQuery("");
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
                <Menu logout={logout} user={user} />

                {/* <!-- Search Bar --> */}
                <SearchBar onChange={setSearchQuery} value={searchQuery} />
            </div>

            {/* <!-- Middle: Chat List --> */}
            {isLoading ?
                <div className="flex items-center mt-15 justify-center">
                    <Spinner className="size-8" />
                </div>
                : (chats.length > 0 || contacts.length > 0) ?
                    <>
                        <ChatList chats={chats} onSelect={clearSearch} />
                        {
                            contacts.length > 0 &&
                            <ContactList contacts={contacts} onSelect={clearSearch} />
                        }
                    </> :
                    (debouncedSearchQuery == "") ?
                        <div className="grid grid-rows-3 h-full px-4">
                            <div className=" self-end">
                                <h3 className="font-semibold mb-3">No chats yet</h3>
                                <span className="inline-block font-normal muted-text tracking-wide w-2xs">Get started by messaging someone or by creating a room</span>
                            </div>
                        </div>
                        :
                        <div className="flex flex-col gap-y-2 mt-15 muted-text font-medium">
                            No Results
                            <span className="font-normal text-[15px] tracking-wide">There were no results for "{debouncedSearchQuery}".</span>
                        </div>
            }
        </div>
    );
}
