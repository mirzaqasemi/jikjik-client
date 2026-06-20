import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { AlignJustify, LogOut, UserRoundPlus, UsersRound } from "lucide-react";
import * as backend from '../../services/backend.ts';

type Params = {
    logout: () => void,
    user: backend.User
}

export default function Menu(params: Params) {
    return (
        <>
            <Sheet>
                <SheetTrigger asChild>
                    <AlignJustify className="text-muted cursor-pointer" />
                </SheetTrigger>
                <SheetContent showCloseButton={false} side="left" className="gap-5">
                    <SheetHeader className="gap-4 border-b pb-4">
                        <img src="" alt="" className="size-9 rounded-full" />
                        <SheetTitle>{params.user.displayName}</SheetTitle>
                    </SheetHeader>
                    <ul className="flex flex-col sidebar-icons">
                        <li>
                            <Button variant="ghost">
                                <UsersRound />
                                New Group
                            </Button>
                        </li>
                        <li>
                            <Button variant="ghost">
                                <UserRoundPlus />
                                New Contact
                            </Button>
                        </li>
                        <li>
                            <Button variant="ghost" onClick={() => params.logout()}>
                                <LogOut />
                                Logout
                            </Button>
                        </li>
                    </ul>
                </SheetContent>
            </Sheet>
        </>
    );
}

