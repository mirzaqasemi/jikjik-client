import { Button } from "@/components/ui/button";
import * as backend from '@/services/backend';
import { UserRoundPlus, UsersRound } from 'lucide-react';
import { useState } from "react";
import AddGroupMembersDialog from "./add-group-members-dialog/AddGroupMembersDialog";
import GroupActions from "./group-actions/GroupActions";
import GroupMembersList from "./group-members-list/GroupMembersList";
import { Separator } from "@/components/ui/separator";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";

type Props = {
    users: backend.User[];
    chat: backend.Chat
}

export default function GroupDetailsBody(props: Props) {
    const [openDialog, setOpenDialog] = useState(false);
    function handleAddMembers() {
        setOpenDialog(true);
    }
    return (
        <>
            {/* Actions */}
            <GroupActions chat={props.chat} />

            {/* Description */}
            {props.chat.topic &&
                <Item variant="muted" size="xs">
                    <ItemContent>
                        <ItemTitle className="font-semibold">Description</ItemTitle>
                        <ItemDescription>
                            {props.chat.topic}
                        </ItemDescription>
                    </ItemContent>
                </Item>
            }
            {/* Members List */}
            <div className="flex flex-col -mx-6 my-4 overflow-y-auto">
                <div className="flex flex-col px-5 lg:py-4 gap-2.5">
                    <div className="flex items-center">
                        <div className="w-12">
                            <UsersRound className='size-5 ml-2 text-muted-foreground' />
                        </div>
                        <span className="font-semibold ml-4">{props.users.length.toString()} Members</span>
                        <Button variant="ghost" className="items-start text-muted-foreground ml-auto hover:bg-transparent p-2 bg-muted rounded-lg!" onClick={handleAddMembers}>
                            <UserRoundPlus className='size-5' />
                        </Button>
                    </div>
                    <Separator />
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