import ContactChips from "@/components/contact-chips/ContactChips.tsx";
import {
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/services/session";
import { normalizeError } from "@/utilities/normalized-error.ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as hooks from '../../hooks/useDebounce.ts';
import * as backend from '../../services/backend.ts';
import ContactList from "../contact-list/ContactList.tsx";
import SearchBar from "../search-bar/SearchBar.tsx";
import './GroupMemberSelector.css';

type Params = {
    onSelectionChange: (members: Map<string, backend.User>) => void;
    selectedMembers: Map<string, backend.User>,
    currentMembers?: backend.User[]
}

export default function GroupMemberSelector({
    currentMembers = [],
    ...params
}: Params) {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = hooks.useDebounce(searchQuery, 300);
    const user = useSession();

    const {
        data: contacts,
        isError,
        error,
        isLoading,
        isSuccess,
    } = useQuery({
        queryKey: ["allContacts", user?.userId, debouncedSearchQuery],
        queryFn: async () => {
            const contacts = await backend.searchContacts(debouncedSearchQuery);
            return contacts
        },
        enabled: user !== null, // Do not run queryFn until user exists.
        retry: 2,
        refetchOnMount: "always"
    });

    function handleSelect(contact: backend.User) {
        const newSelectedMembers = new Map(params.selectedMembers);
        if (newSelectedMembers.delete(contact.userId)) {
            params.onSelectionChange(newSelectedMembers);
        } else {
            params.onSelectionChange(newSelectedMembers.set(contact.userId, contact));
        }
        setSearchQuery("");
    }

    function unselectMember(contact: backend.User) {
        const newSelectedMembers = new Map(params.selectedMembers);
        newSelectedMembers.delete(contact.userId);
        params.onSelectionChange(newSelectedMembers);
    }

    const renderSkeleton = () => (
        <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-50" />
                <Skeleton className="h-4 w-37.5" />
            </div>
        </div>
    )

    let content = <></>;
    if (isLoading) {
        content = <div className="flex flex-col gap-4.5">
            {renderSkeleton()}
            {renderSkeleton()}
        </div>
    } else if (isError) {
        content =
            <div className="flex flex-col w-full h-full items-center pt-15">
                <h3 className="font-semibold mb-3">Failed to load contacts</h3>
                <span className="inline-block font-normal muted-text tracking-wide xl:px-3">{normalizeError(error).message}</span>
            </div>
    } else if (isSuccess) {
        if (contacts.length === 0) {
            content =
                <span className="inline-block text-center text-[16px] pt-3 self-center font-normal muted-text tracking-wide xl:px-3">
                    {debouncedSearchQuery === ""
                        ? "Type to search for users"
                        : "No users found."}
                </span>
        } else {
            content = <>
                {debouncedSearchQuery === "" &&
                    <div className="flex h-7 px-5 text-[13.5px] muted-text font-light muted-background text-start items-center">Recent</div>
                }
                <ContactList
                    key="list"
                    contacts={contacts}
                    onSelect={(contact) => handleSelect(contact)}
                    selectedMembers={params.selectedMembers}
                    currentMembers={currentMembers} />
            </>
        }
    }

    return (
        <div className="flex flex-col justify-between w-full max-w-full min-w-0">
            <DialogHeader className="hidden">
                <DialogTitle />
                <DialogDescription />
            </DialogHeader>
            <div className="flex max-w-full gap-y-1 mb-3 max-h-27 overflow-y-auto no-scrollbar">
                <ContactChips contacts={[...params.selectedMembers.values()]} onRemove={unselectMember} />
            </div>
            {/* Header */}
            <div className="grow-0">
                <SearchBar onChange={setSearchQuery} value={searchQuery} />
            </div>

            {/* Middle Section */}
            <div className="grow flex flex-col w-full no-scrollbar overflow-y-auto h-[50vh] mt-5 mb-3">
                {content}
            </div>
        </div>
    );
}


