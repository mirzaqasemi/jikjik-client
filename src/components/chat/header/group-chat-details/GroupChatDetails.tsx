import { Button } from "@/components/ui/button";
import * as backend from '@/services/backend';
import { UserRoundPlus, UsersRound } from 'lucide-react';
import AddGroupMembersDialog from "./add-group-members-dialog/AddGroupMembersDialog";
import { useState } from "react";

type Props = {
    users: backend.User[];
}

export default function GroupChatDetails(props: Props) {
    const [openDialog, setOpenDialog] = useState(false);
    function handleAddMembers() {
        setOpenDialog(true);
    }
    return (
        <div className="flex flex-col -mx-6  max-h-[60vh] overflow-y-auto bg-amber-50">
            <div className="flex flex-col px-5 py-4">
                <div className="flex pt-3.5 pb-7">
                    <div className="w-12">
                        <UsersRound className='size-5 ml-2 text-muted-foreground' />
                    </div>
                    <span className="font-semibold text-[13px] ml-4">{props.users.length.toString()} MEMBERS</span>
                    <Button variant="ghost" className="items-start ml-auto hover:bg-transparent" onClick={handleAddMembers}>
                        <UserRoundPlus className='size-5 text-muted-foreground' />
                    </Button>
                </div>
                <div className='flex flex-col gap-3'>
                    {props.users.map((user, index) => (
                        <div className="flex" key={index}>
                            <div className="relative h-12 w-12 shrink-0">
                                <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                            </div>
                            <div className="flex flex-col gap-0.4 ml-4 truncate">
                                <div className="font-medium">{user.displayName}</div>
                                <span className="text-muted-foreground">last seen recently</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <AddGroupMembersDialog open={openDialog} setOpenDialog={setOpenDialog} currentMembers={props.users}/>
        </div>
    );
}