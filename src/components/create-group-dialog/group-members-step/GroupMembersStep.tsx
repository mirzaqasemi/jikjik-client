import ContactChips from "@/components/contact-chips/ContactChips.tsx";
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/services/session";
import { normalizeError } from "@/utilities/normalized-error.ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as hooks from '../../../hooks/useDebounce.ts';
import * as backend from '../../../services/backend.ts';
import ContactList from "../../contact-list/ContactList.tsx";
import SearchBar from "../../search-bar/SearchBar.tsx";
import { Button } from "../../ui/button.tsx";
import './GroupMembersStep.css';

type Params = {
    onNext: (members: Map<string, backend.User>) => void,
    onClose: () => void,
}

export default function GroupMembersStep(params: Params) {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = hooks.useDebounce(searchQuery, 300);
    const user = useSession();
    const [selectedMembers, setSelectedMembers] = useState<Map<string, backend.User>>(new Map());

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
        enabled: user != null, // Do not run queryFn until user exists.
        retry: 2,
        refetchOnMount: "always"
    });

    function handleSelect(contact: backend.User) {
        const newSelectedMembers = new Map(selectedMembers);
        if (newSelectedMembers.delete(contact.userId)) {
            setSelectedMembers(newSelectedMembers);
        } else {
            setSelectedMembers(newSelectedMembers.set(contact.userId, contact));
        }
    }

    function unselectMember(contact: backend.User) {
        const newSelectedMembers = new Map(selectedMembers);
        newSelectedMembers.delete(contact.userId);
        setSelectedMembers(newSelectedMembers);
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
    if (debouncedSearchQuery == "" || isLoading) {
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
        content = <>
            <ContactList key="list" contacts={contacts} onSelect={(contact) => handleSelect(contact)} selectedMembers={selectedMembers} />
        </>
    }

    return (
        <div className="flex flex-col justify-between w-full max-w-full min-w-0">
            <DialogHeader className="hidden">
                <DialogTitle />
                <DialogDescription/>
            </DialogHeader>
            <div className="flex max-w-full gap-y-1 mb-3 max-h-27 overflow-y-auto no-scrollbar">
                <ContactChips contacts={[...selectedMembers.values()]} onRemove={unselectMember} />
            </div>
            {/* Header */}
            <div className="grow-0">
                <SearchBar onChange={setSearchQuery} value={searchQuery} />
            </div>

            {/* Middle Section */}
            <div className="grow no-scrollbar overflow-y-auto h-[50vh] mt-5 mb-3">
                {content}
            </div>

            {/* Footer */}
            <DialogFooter className="grow-0 grid grid-cols-4">
                <Button className="col-start-3" variant="outline" onClick={() => params.onClose()}>Cancel</Button>
                <Button type="submit" className="col-start-4" onClick={() => params.onNext(selectedMembers)}>Next</Button>
            </DialogFooter>
        </div>
    );
}


