import { DialogContent } from "@/components/ui/dialog";
import * as backend from '@/services/backend';
import * as session from "@/services/session.ts";
import * as utilities from "@/utilities/utilities.ts";
import AvatarDialogHeader from "../../avatar-dialog-header/AvatarDialogHeader";
import DmDetailsBody from "./dm-details-body/DmDetailsBody";
import GroupDetailsBody from "./group-details-body/GroupDetailsBody";

type Props = {
    chat: backend.Chat;
    openDialog: boolean;
    onCloseRequest: () => void;
}

export default function ChatDetailsDialog(props: Props) {
    const chatTitle = utilities.getTitle(props.chat);
    const rawUserId = session.getUserId();
    if (rawUserId === null) {
        throw new Error("User not authenticated");
    }
    const userId = rawUserId;
    let otherUser: backend.User | undefined;
    if (props.chat.isDm) {
        otherUser = props.chat.users.find((u) => u.userId !== userId);
    }

    return (
        <DialogContent
            slot="chat-details-dialog"
            className="flex max-h-[calc(100dvh-4rem)] overflow-y-auto flex-col pb-0 gap-0! max-w-xs md:max-w-100!">
            <AvatarDialogHeader
                title={chatTitle}
                avatarUri={props.chat.avatarUrl || undefined}
                description={props.chat.isDm ? "last seen recently" : `${props.chat.users.length} members`}
            />
            {props.chat.isDm ?
                <DmDetailsBody otherUser={otherUser!} onCloseRequest={props.onCloseRequest} />
                : <GroupDetailsBody users={props.chat.users} chat={props.chat} />
            }
        </DialogContent>
    );
}