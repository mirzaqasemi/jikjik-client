import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { subscribeCurrentUserChange } from "@/services/backend-event.ts";
import * as backend from '@/services/backend.ts';
import { useQuery } from "@tanstack/react-query";
import { AlignJustify } from "lucide-react";
import { useEffect, useState } from "react";
import BlockedListDialog from "../blocked-list-dialog/BlockedListDialog.tsx";
import CreateGroupDialog from "../create-group-dialog/CreateGroupDialog.tsx";
import MediaAvatar from "../media-avatar/MediaAvatar.tsx";
import MyProfileDialog from "../my-profile-dialog/MyProfileDialog.tsx";
import './Menu.css';
import SidebarMenuActions from "./sidebar-menu-actions/SidebarMenuActions.tsx";
import { Skeleton } from "../ui/skeleton.tsx";

type Props = {
    logout: () => void;
    userId: string | null;
}


export default function Menu(props: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [newGroupState, setNewGroupState] = useState({ open: false, sessionId: 0 });
    const [isBlockedListOpen, setIsBlockedListOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const {
        data: currentUser,
        isLoading,
        isError,
        refetch
    } = useQuery<backend.User | null>({
        queryKey: ["currentUserProfileDetails", props.userId],
        queryFn: backend.currentUser,
        enabled: props.userId !== null, // Do not run queryFn until user exists.
        refetchOnMount: "always"
    });

    useEffect(() => {
        const cleanup = subscribeCurrentUserChange(() => {
            refetch();
        });
        return cleanup;
    });

    function openNewGroup() {
        // useState does not merge objects. You must create a new object
        setNewGroupState((prev) => ({
            sessionId: prev.sessionId + 1,
            open: true
        }));
        setOpen(false);
    }

    return (
        <div>
            <Sheet open={open} onOpenChange={setOpen}>
                {/* Hamburger icon */}
                <SheetTrigger asChild>
                    <AlignJustify className="text-muted-foreground cursor-pointer" />
                </SheetTrigger>

                {/* Opend Menu */}
                <SheetContent showCloseButton={false} side="left" className="gap-3">
                    <SheetHeader className="gap-4 pb-0">
                        {isLoading
                            ? <div className="flex flex-col items-start gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <Skeleton className="h-4 w-50" />
                            </div>
                            : <>
                                <MediaAvatar avatarUri={currentUser?.avatarUri} size="size-13" name={currentUser?.displayName} />
                                <SheetTitle>{isError ? "Faild to load user" : currentUser?.displayName}</SheetTitle>
                                <SheetDescription className="sr-only">
                                    User profile and account settings
                                </SheetDescription>
                            </>
                        }
                    </SheetHeader>

                    <SidebarMenuActions
                        onOpenProfile={() => setIsProfileOpen(true)}
                        onNewGroup={openNewGroup}
                        onOpenBlockedUsers={() => setIsBlockedListOpen(true)}
                        onLogout={() => props.logout()}
                    />
                </SheetContent>
            </Sheet>
            <CreateGroupDialog key={newGroupState.sessionId} open={newGroupState.open} onCloseRequest={() => setNewGroupState((prev) => ({ ...prev, open: false }))} />
            <BlockedListDialog open={isBlockedListOpen} onCloseRequest={() => setIsBlockedListOpen(false)} />
            <MyProfileDialog user={currentUser} open={isProfileOpen} onCloseRequest={() => setIsProfileOpen(false)} />
        </div>
    );
}

