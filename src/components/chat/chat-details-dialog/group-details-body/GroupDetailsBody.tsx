import { Button } from "@/components/ui/button";
import * as backend from '@/services/backend';
import { UserRoundPlus, UsersRound } from 'lucide-react';
import { useState } from "react";
import AddGroupMembersDialog from "./add-group-members-dialog/AddGroupMembersDialog";
import GroupActions from "./group-actions/GroupActions";
import GroupMembersList from "./group-members-list/GroupMembersList";

type Props = {
    users: backend.User[];
}

export default function GroupDetailsBody(props: Props) {
    const [openDialog, setOpenDialog] = useState(false);
    function handleAddMembers() {
        setOpenDialog(true);
    }
    return (
        <>
            {/* Actions */}
            <GroupActions />

            {/* Members List */}
            <div className="flex flex-col -mx-6 overflow-y-auto md:rounded-b-lg bg-amber-50">
                <div className="flex flex-col px-5 lg:py-4">
                    <div className="flex lg:pt-3.5 lg:pb-7">
                        <div className="w-12">
                            <UsersRound className='size-5 ml-2 text-muted-foreground' />
                        </div>
                        <span className="font-semibold text-[13px] ml-4">{props.users.length.toString()} MEMBERS</span>
                        <Button variant="ghost" className="items-start ml-auto hover:bg-transparent" onClick={handleAddMembers}>
                            <UserRoundPlus className='size-5 text-muted-foreground' />
                        </Button>
                    </div>

                    <GroupMembersList users={props.users} />
                </div>
            </div>
            
            <AddGroupMembersDialog 
            open={openDialog} 
            setOpenDialog={setOpenDialog} 
            currentMembers={props.users} />
        </>
    );
}