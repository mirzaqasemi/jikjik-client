import ConfirmationDialog from "@/components/confirmation-dialog/ConfirmationDialog";
import { CHATS_ROUTE } from "@/router";
import * as backend from "@/services/backend";
import { useMutation } from "@tanstack/react-query";
import { LogOut, Settings2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatActionButton from "../../chat-action-button/ChatActionButton";
import EditGroupDialog from "../edit-group-dialog/EditGroupDialog";
type Props = {
    chatTitle: string;
    chatAvatar?: string | null;
    chatId: string;
}

export default function GroupActions(props: Props) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const navigate = useNavigate();

    const leaveFromGroupMutation = useMutation({
        mutationFn: () => {
            return backend.leaveGroup(props.chatId);
        },
        onSuccess: () => {
            setIsLeaveOpen(false);
            navigate(CHATS_ROUTE);
        },
        onError: (err) => {
            console.error("failed to leave from group", err.message);
        }

    });

    return (
        <>
            <div className="flex gap-4 h-18">
                <ChatActionButton title="Manage" icon={Settings2} onClick={() => setIsEditOpen(true)} />
                <ChatActionButton title="Leave" icon={LogOut} onClick={() => setIsLeaveOpen(true)} />
            </div>
            <EditGroupDialog open={isEditOpen} onCloseRequest={() => setIsEditOpen(false)} />
            <ConfirmationDialog
                title={props.chatTitle}
                icon={props.chatAvatar}
                onClose={() => setIsLeaveOpen(false)}
                loading={leaveFromGroupMutation.isPending}
                onConfirm={() => leaveFromGroupMutation.mutate()}
                open={isLeaveOpen}
                confirmAction="Leave"
                rejectAction="Cancel"
                description="Are you sure you want to leave this group?"
            />
        </>
    );
}