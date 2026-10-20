import ConfirmationDialog from "@/components/confirmation-dialog/ConfirmationDialog";
import * as backend from "@/services/backend";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle, UserRoundCheck, UserRoundX } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import ChatActionButton from "../../chat-action-button/ChatActionButton";

type Props = {
    username: string;
    displayName: string;
    onCloseRequest: () => void;
}

export default function DmActions(props: Props) {
    const [isBlocked, setIsBlocked] = useState(backend.isUserBlocked(props.username));
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
    const params = useParams<{ chatId: string }>();
    if (params.chatId === undefined) {
        throw new Error("Missing chatId");
    }
    const chatId = params.chatId;

    const blockUserMutation = useMutation({
        mutationFn: () => {
            return backend.blockUser(props.username);
        },
        onSuccess: () => {
            setIsBlocked(true);
            setIsBlockDialogOpen(false);
            toast(`${props.displayName} is now blocked`);
        },
        onError: (err) => {
            console.error("failed to block this user", err.message);
        }

    });
    const unblockUserMutation = useMutation({
        mutationFn: () => {
            return backend.unblockUser(props.username);
        },
        onSuccess: () => {
            setIsBlocked(false);
        },
        onError: (err) => {
            console.error("failed to unblock this user", err.message);
        }

    });

    function handleMessageClick() {
        props.onCloseRequest();
    }

    return (
        <div id="DmActions" className="flex flex-col pb-4">
            <div className="flex gap-4 h-18">
                {isBlocked ?
                    <ChatActionButton title="Unblock user" icon={UserRoundCheck} onClick={() => unblockUserMutation.mutate()} />
                    : <ChatActionButton title="Block user" icon={UserRoundX} onClick={() => setIsBlockDialogOpen(true)} />
                }
                <ChatActionButton title="Message" icon={MessageCircle} onClick={handleMessageClick} />
            </div>
            <ConfirmationDialog
                title={`Block ${props.displayName}`}
                open={isBlockDialogOpen}
                onClose={() => setIsBlockDialogOpen(false)}
                onConfirm={() => blockUserMutation.mutate()}
                loading={blockUserMutation.isPending}
                confirmAction="Block"
                rejectAction="Cancel"
                description={`Do you want to block ${props.displayName} from messaging on JikJik?`}
            />
        </div>
    );
}
