import ConfirmationDialog from "@/components/confirmation-dialog/ConfirmationDialog";
import { useIsUserBlocked } from "@/hooks/useIsUserBlocked";
import { useUnblockUser } from "@/hooks/useUnblockUser";
import * as backend from "@/services/backend";
import * as session from "@/services/session";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, MessageCircle, UserRoundCheck, UserRoundX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ChatActionButton from "../../chat-action-button/ChatActionButton";

type Props = {
    otherUserId: string;
    displayName: string;
    onCloseRequest: () => void;
}

export default function DmActions(props: Props) {
    const {
        data: isBlocked,
        isPending
    } = useIsUserBlocked(props.otherUserId);
    const unblockUser = useUnblockUser();
    const queryClient = useQueryClient();
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
    const rawUser: backend.User | null = session.useSession();
    if (rawUser === null) {
        throw new Error("User not authenticated");
    }
    const currentUser = rawUser;

    const blockUserMutation = useMutation({
        mutationFn: () => {
            return backend.blockUser(props.otherUserId);
        },
        onSuccess: () => {
            setIsBlockDialogOpen(false);
            queryClient.setQueryData(
                ["isUserBlocked", props.otherUserId],
                true
            );

            queryClient.invalidateQueries({
                queryKey: ["blockedUsers", currentUser.userId]
            });

            toast(`${props.displayName} is now blocked`);
        },
        onError: (err) => {
            console.error("failed to block this user", err.message);
        }
    });

    function handleMessageClick() {
        props.onCloseRequest();
    }

    return (
        <div id="DmActions" className="flex flex-col pb-4">
            <div className="flex gap-4 h-18">
                {isPending ?
                    <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                    : isBlocked ?
                        <ChatActionButton
                            disabled={unblockUser.isPending}
                            title="Unblock user"
                            icon={UserRoundCheck}
                            onClick={() => unblockUser.mutate(props.otherUserId)} />
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
