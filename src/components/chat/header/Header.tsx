import {
    Dialog,
    DialogTrigger
} from "@/components/ui/dialog";
import * as utilities from "@/utilities/utilities.ts";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import * as backend from "../../../services/backend.ts";
import ChatDetailsDialog from "../chat-details-dialog/ChatDetailsDialog.tsx";
import "./Header.css";
import MediaAvatar from "@/components/media-avatar/MediaAvatar.tsx";

type Props = {
    chat: backend.Chat;
}

export default function Header(props: Props) {
    const chatTitle = utilities.getTitle(props.chat);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    return (
        <>
            {/* <!-- Top: Header Section --> */}
            <div className="flex w-full sticky top-0 z-50 items-center conversation-header">
                <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => {
                    if (!open) {
                        setIsDetailsDialogOpen(false);
                    }
                }}>
                    <DialogTrigger asChild className="flex w-full">
                        <button type="button" onClick={() => setIsDetailsDialogOpen(true)}>
                            {/* Chat header content */}
                            <div className="flex items-center gap-2.5">
                                <Link to={"../"} className="lg:hidden flex justify-center items-center btn-back w-10 h-10 rounded-full">
                                    <ArrowLeft strokeWidth={"1.5"} />
                                </Link>
                                <div className="flex gap-3 items-center">
                                    <MediaAvatar avatarUrl={props.chat.avatarUrl} size="size-13" name={props.chat.title}>
                                    </MediaAvatar>
                                    <div className="flex flex-col min-w-0 flex-1 items-start user-details">
                                        <span className="font-medium truncate">{chatTitle}</span>
                                        {props.chat.isDm && <span className="font-normal text-[12px] text-muted-foreground">Online</span>}
                                    </div>
                                </div>
                            </div>
                        </button>
                    </DialogTrigger>
                    <ChatDetailsDialog
                        chat={props.chat}
                        openDialog={isDetailsDialogOpen}
                        onCloseRequest={() => setIsDetailsDialogOpen(false)}
                    />
                </Dialog>
            </div>
        </>
    );
}