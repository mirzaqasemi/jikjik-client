import {
    Dialog,
    DialogContent,
    DialogTrigger
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import * as backend from "../../../services/backend.ts";
import * as session from "../../../services/session.ts";
import * as utilities from "../../../utilities/utilities.ts";
import ChatDetailsHeader from "./chat-details-header/ChatDetailsHeader.tsx";
import DmChatDetails from "./dm-chat-details/DmChatDetails.tsx";
import GroupChatDetails from "./group-chat-details/GroupChatDetails.tsx";
import "./Header.css";

type Props = {
    chat: backend.Chat;
}

export default function Header(props: Props) {
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
        <>
            {/* <!-- Top: Header Section --> */}
            <div className="flex w-full sticky top-0 z-50 items-center conversation-header">
                <Dialog>
                    <DialogTrigger asChild className="flex w-full">
                        <button type="button" >
                            <div className="flex gap-2.5">
                                <Link to={"../"} className="lg:hidden flex justify-center items-center btn-back w-10 h-10 rounded-full">
                                    <ArrowLeft strokeWidth={"1.5"} />
                                </Link>
                                <div className="flex gap-3 items-center">
                                    <div className="avatar-container">
                                        <img src="https://i.pravatar.cc/150?img=32" alt="" className="size-11 rounded-full lg:hidden" />
                                    </div>
                                    <div className="flex flex-col items-start user-details">
                                        <span className="user-name">{chatTitle}</span>
                                        {props.chat.isDm && <span className="font-normal text-[12px] text-muted-foreground">Online</span>}
                                    </div>
                                </div>
                            </div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-border pb-0 rounded-2xl">
                        <ChatDetailsHeader
                            title={chatTitle}
                            avatarUrl={props.chat.avatarUrl || undefined}
                            description={props.chat.isDm ? "last seen recently" : `${props.chat.users.length} members`} />
                        {props.chat.isDm ?
                            <DmChatDetails displayName={otherUser!.displayName} username={otherUser!.userId}/>
                            : <GroupChatDetails users={props.chat.users} />
                        }
                    </DialogContent>
                </Dialog>

                {/* <!-- Right Side: Three Dots (Kebab Menu) --> */}
                <button className="flex icon-btn more-options-btn" aria-label="More options">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
                        strokeLinejoin="round" strokeLinecap="round">
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            </div>
        </>
    );
}