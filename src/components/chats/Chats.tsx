import { Spinner } from "@/components/ui/spinner.tsx";
import { subscribeChatsChanged } from "@/services/backend-event.ts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from 'react-router-dom';
import * as hooks from '../../hooks/useDebounce.ts';
import * as router from '../../router.tsx';
import * as backend from '../../services/backend.ts';
import * as session from '../../services/session.ts';
import Menu from "../menu/Menu.tsx";
import SearchBar from "../search-bar/SearchBar.tsx";
import ChatList from "./chat-list/ChatList.tsx";
import ContactList from "../contact-list/ContactList.tsx";
import { normalizeError } from "@/utilities/normalized-error.ts";
import { draftDm } from "@/services/draft-storage";
import { toast } from "sonner";

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
        error,
        refetch
    } = useQuery<Data>({
        queryKey: ["allChatsAndContacts", user?.userId, debouncedSearchQuery], // "allChats" is the name/address of the cached data
        queryFn: async () => {
            const chats = await backend.getChats(debouncedSearchQuery);
            if (debouncedSearchQuery != "") {
                const contacts = await backend.searchContacts(debouncedSearchQuery);
                return { chats, contacts }
            }
            return { chats, contacts: [] };
        },
        enabled: user != null, // Do not run queryFn until user exists.
        retry: 2,
        // If the component is unmounted, the listener is removed and might miss the chatsChanged enevt, 
        // so we tell the useQuery to refetch data on mount and don't use from cached data:
        refetchOnMount: "always"
    });
    const { chats, contacts } = data; // onrolling data

    useEffect(() => {
        const cleanup = subscribeChatsChanged(() => {
            refetch();
        });
        return cleanup;
    }, [refetch]); //TODO: Is it needed to add refetch to dependency array?

    if (user == null) {
        // replace: The new webpage (login page) replaces the page you are currently viewing (chats page) in the history list. 
        // Clicking the browser's "Back" button will skip the old page and take you to the page you visited before it.
        // It avoids a weird back-button loop. [Login, Chats] -> Chats redirects you to login so: [Login] -> Notice Chats disappeared (Login replace).
        return <Navigate to={router.LOGIN_ROUTE} replace />;
    }

    function logout() {
        backend.logout();
        navigate(router.LOGIN_ROUTE);
    }

    function selectChat(chat: backend.Chat) {
        if (chat.membership === "invite") {
            navigate(`/chats/${chat.id}/invite`);
        }
        else if (chat.membership === "join") {
            navigate(`/chats/${chat.id}`)
        } else if (chat.membership === undefined){
            navigate(`/chats/${chat.id}`);
            toast("You are not a member!");
        }
        setSearchQuery("");
    }

    function selectContact(contact: backend.User) {
        draftDm(contact);
        navigate(`/chats/draft`);
        setSearchQuery("");
    }

    let content = <></>;
    if (isLoading) {
        content =
            <div className="flex items-center mt-15 justify-center">
                <Spinner className="size-8" />
            </div>
    } else if (isError) {
        content =
            <div className="grid grid-rows-3 h-full px-4">
                <div className=" self-end">
                    <h3 className="font-semibold mb-3">Failed to load chats</h3>
                    <span className="inline-block font-normal muted-text tracking-wide xl:px-3">{normalizeError(error).message}</span>
                </div>
            </div>
    } else {
        if ((chats.length > 0 || contacts.length > 0)) {
            content =
                <div>
                    <ChatList chats={chats} onSelect={selectChat} />
                    {
                        contacts.length > 0 &&
                        <>
                            <div className="flex h-7 px-5 mt-3 text-[13.5px] muted-text font-light muted-background text-start items-center">Contacts</div>
                            <ContactList contacts={contacts} onSelect={selectContact} />
                        </>
                    }
                </div>
        }
        // If chats.length == 0 and contacts.length == 0 and debouncedSearchQuery == "" it means the user has no chats and doesn't search anything
        else if (debouncedSearchQuery == "") {
            content = <div className="grid grid-rows-3 h-full px-4">
                <div className=" self-end">
                    <h3 className="font-semibold mb-3">No chats yet</h3>
                    <span className="inline-block font-normal muted-text tracking-wide xl:px-3">Get started by messaging someone or by creating a room</span>
                </div>
            </div>
        } else { // If debouncedSearchQuery != ""  it means the user searches something and chats.length == 0 and contacts.length == 0 so there is no results
            content = <div className="flex flex-col gap-y-2 mt-15 muted-text font-medium">
                No Results
                <span className="font-normal text-[15px] tracking-wide">There were no results for {debouncedSearchQuery}.</span>
            </div>
        }
    }

    return (
        <div className="flex flex-col w-full h-full pt-5 pb-3">

            {/* <!-- Top: Header Section --> */}
            <div className="flex w-full px-4 items-center gap-4">
                {/* <!-- Hamburger Menu --> */}
                <Menu logout={logout} user={user} />

                {/* <!-- Search Bar --> */}
                <SearchBar onChange={setSearchQuery} value={searchQuery} />
            </div>

            {/* <!-- Middle: Chat List --> */}
            {content}

        </div>
    );
}
