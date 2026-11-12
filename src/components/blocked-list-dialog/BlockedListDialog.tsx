import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import * as backend from "@/services/backend";
import * as session from "@/services/session.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, UserRoundCheck } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import UserInfo from "../user-info/UserInfo.tsx";
import { useUnblockUser } from "@/hooks/useUnblockUser.ts";
type Props = {
    // onCloseRequest is called to request closing the dialog,
    // which means, the open prop should be set to false
    onCloseRequest: () => void,
    open: boolean
}

export default function BlockedListDialog(props: Props) {
    const rawUser = session.getUserId();
    if (rawUser === null) {
        throw new Error("User not authenticated");
    }
    const user = rawUser;
    const {
        data: blockedUsers = [],
        isLoading,
        isError,
        refetch,
    } = useQuery<backend.User[]>({
        queryKey: ["blockedUsers", user.userId],
        queryFn: () => backend.getBlockedUsers(),
        enabled: props.open,
    });
    const unblockUser = useUnblockUser();

    return (
        <Dialog
            // onOpenChange is called when Radix itself requests an open-state change 
            open={props.open}
            onOpenChange={(isOpen) => {
                if (!isOpen) props.onCloseRequest();
            }}>
            <DialogContent className="flex flex-col pb-6.25">
                <DialogHeader className="text-left">
                    <DialogTitle>Blocked users</DialogTitle>
                    <DialogDescription>
                        Manage accounts you've blocked.
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">BLOCKED ACCOUNTS</span>
                        <span>{blockedUsers.length} users</span>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <p className="text-sm text-muted-foreground">
                                Failed to load blocked users.
                            </p>
                            <Button variant="outline" onClick={() => refetch()}>
                                Try again
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="max-h-72">
                            <div className="flex flex-col">
                                {blockedUsers.map((blockedUser) => (
                                    <div
                                        key={blockedUser.userId}
                                        dir="ltr"
                                        className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                                    >
                                        <UserInfo user={blockedUser} title={blockedUser.displayName} description={blockedUser.userId} />

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={unblockUser.isPending}
                                            onClick={() => unblockUser.mutate(blockedUser.userId)}
                                        >
                                            {unblockUser.isPending && unblockUser.variables === blockedUser.userId ? (
                                                <LoaderCircle className="size-4 animate-spin" />
                                            ) : (
                                                <UserRoundCheck className="size-4" />
                                            )}
                                            Unblock
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
