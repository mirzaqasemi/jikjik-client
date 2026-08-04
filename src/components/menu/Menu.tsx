import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { AlignJustify, LogOut, UserRoundPlus, UsersRound } from "lucide-react";
import { useState } from "react";
import * as backend from '../../services/backend.ts';
import CreateGroupDialog from "../create-group-dialog/CreateGroupDialog.tsx";
import './Menu.css';

type Params = {
    logout: () => void,
    user: backend.User
}


export default function Menu(params: Params) {
    const [open, setOpen] = useState<boolean>(false);
    const [newGroupState, setNewGroupState] = useState({ open: false, sessionId: 0 });


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
            <Sheet open={open} onOpenChange={(open) => {
                if (!open) {
                    setOpen(false);
                }
            }}>
                {/* Hamburger icon */}
                <SheetTrigger asChild>
                    <AlignJustify className="text-muted-foreground cursor-pointer" onClick={() => setOpen(true)} />
                </SheetTrigger>

                {/* Opend Menu */}
                <SheetContent showCloseButton={false} side="left" className="gap-3">
                    <SheetHeader className="gap-4 border-b pb-3">
                        <img src="user-profile" alt="" className="size-9 rounded-full" />
                        <SheetTitle>{params.user.displayName}</SheetTitle>
                        <SheetDescription />
                    </SheetHeader>
                    <ul className="flex flex-col">
                        <li>
                            <Button variant="ghost" className="w-full justify-start rounded-none" onClick={openNewGroup}>
                                <UsersRound className="sidebar-icon" />
                                New Group
                            </Button>
                        </li>
                        <li>
                            <Button variant="ghost" className="w-full justify-start rounded-none">
                                <UserRoundPlus />
                                New Contact
                            </Button>
                        </li>
                        <li>
                            <Button variant="ghost" className="w-full justify-start rounded-none" onClick={() => params.logout()}>
                                <LogOut />
                                Logout
                            </Button>
                        </li>

                    </ul>
                </SheetContent>
            </Sheet>
            <CreateGroupDialog key={newGroupState.sessionId} open={newGroupState.open} onCloseRequest={() => setNewGroupState((prev) => ({ ...prev, open: false }))} />
        </div>
    );
}

