import { DialogContent } from "@/components/ui/dialog";
import * as backend from '@/services/backend';
import * as session from "@/services/session.ts";
import * as utilities from "@/utilities/utilities.ts";
import ChatDetailsHeader from "./chat-details-header/ChatDetailsHeader";
import DmDetailsBody from "./dm-details-body/DmDetailsBody";
import GroupDetailsBody from "./group-details-body/GroupDetailsBody";

type Props = {
    chat: backend.Chat;
    openDialog: boolean;
    onCloseRequest: () => void;
}

export default function ChatDetailsDialog(props: Props) {
    const chatTitle = utilities.getTitle(props.chat);
    const rawUser = session.getUser();
    if (rawUser === null) {
        throw new Error("User not authenticated");
    }
    const user = rawUser;
    let otherUser: backend.User | undefined;
    if (props.chat.isDm) {
        otherUser = props.chat.users.find((u) => u.userId !== user.userId);
    }

    return (
        <DialogContent
            slot="chat-details-dialog"
            className="flex flex-col pb-0 gap-0! h-130! max-h-150! max-w-full md:max-w-100!">
            <ChatDetailsHeader
                title={chatTitle}
                avatarUrl={props.chat.avatarUrl || undefined}
                description={props.chat.isDm ? "last seen recently" : `${props.chat.users.length} members`}
            />
            {props.chat.isDm ?
                <DmDetailsBody otherUser={otherUser!} onCloseRequest={props.onCloseRequest} />
                : <>
                    <GroupDetailsBody users={props.chat.users} chat={props.chat} />
                </>
            }
        </DialogContent>
    );
}