import { DialogContent } from "@/components/ui/dialog";
import * as backend from '@/services/backend';
import * as session from "@/services/session.ts";
import * as utilities from "@/utilities/utilities.ts";
import ChatDetailsHeader from "./chat-details-header/ChatDetailsHeader";
import DmDetailsBody from "./dm-details-body/DmDetailsBody";
import GroupDetailsBody from "./group-details-body/GroupDetailsBody";

type Props = {
    chat: backend.Chat;
}

export default function ChatDetailsDialog(props: Props) {
    const chatTitle = utilities.getTitle(props.chat);
    const rawUser = session.getUser();
    if (rawUser === null) {
        throw new Error("User not authenticated");
    }
    const user = rawUser;
    let otherUser;
    if (props.chat.isDm) {
        otherUser = props.chat.users.find((u) => u.userId !== user.userId);
    }

    return (
        <DialogContent className="bg-border pb-0 md:h-10/12 max-h-full max-w-full md:max-w-100! rounded-none md:rounded-lg">
            <ChatDetailsHeader
                title={chatTitle}
                avatarUrl={props.chat.avatarUrl || undefined}
                description={props.chat.isDm ? "last seen recently" : `${props.chat.users.length} members`}
            />
            {props.chat.isDm ?
                <DmDetailsBody displayName={otherUser!.displayName} username={otherUser!.userId} />
                : <>
                    <GroupDetailsBody users={props.chat.users} chatTitle={chatTitle} chatAvatar={props.chat.avatarUrl} chatId={props.chat.id}/>
                </>
            }
        </DialogContent>
    );
}