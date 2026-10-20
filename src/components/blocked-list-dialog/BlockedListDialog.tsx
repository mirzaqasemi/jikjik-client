import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { useEffect } from "react";
import * as backend from "@/services/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as session from "@/services/session.ts";
import { LoaderCircle, UserRoundCheck } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import UserInfo from "../user-info/UserInfo.tsx";
import { Separator } from "@/components/ui/separator";
type Props = {
    // onCloseRequest is called to request closing the dialog,
    // which means, the open prop should be set to false
    onCloseRequest: () => void,
    open: boolean
}

export default function BlockedListDialog(props: Props) {
    const user: backend.User | null = session.useSession();
    const queryClient = useQueryClient();
    const {
        data: blockedUsers = [],
        isLoading,
        isError,
        refetch
    } = useQuery<backend.User[]>({
        queryKey: ["blockedUsers", user?.userId],
        queryFn: () => backend.getBlockedUsers(),
        enabled: props.open
    });

    const unblockMutation = useMutation({
        mutationFn: (userId: string) => backend.unblockUser(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blockedUsers", user?.userId] })
    });

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
                                {blockedUsers.map((user) => (
                                    <div
                                        key={user.userId}
                                        dir="ltr"
                                        className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                                    >
                                        <UserInfo user={user} title={user.displayName} description={user.userId} />

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={unblockMutation.isPending}
                                            onClick={() => unblockMutation.mutate(user.userId)}
                                        >
                                            {unblockMutation.isPending ? (
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
// export function fgdfg(props: Props) {

//     const unblockMutation = useMutation({
//         mutationFn: (username: string) => backend.unblockUser(username),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
//         },
//     });

//     const filteredUsers = blockedUsers.filter((user) => {
//         const query = search.trim().toLowerCase();

//         return (
//             user.displayName?.toLowerCase().includes(query) ||
//             user.username.toLowerCase().includes(query)
//         );
//     });

//     return (
//         <Dialog
//             open={props.open}
//             onOpenChange={(isOpen) => {
//                 if (!isOpen) props.onCloseRequest();
//             }}
//         >
//             <DialogContent>


//                 <div className="flex flex-col gap-4">
//                     {/* <!-- Search Bar --> */}
//                     <SearchBar onChange={setSearchQuery} value={searchQuery} placeholder="Search blocked users..." /> */}

//                     <div className="flex items-center justify-between text-xs text-muted-foreground">
//                         <span className="font-medium">BLOCKED ACCOUNTS</span>
//                         <span>{blockedUsers.length} users</span>
//                     </div>

//                     {isLoading ? (
//                         <div className="flex justify-center py-10">
//                             <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
//                         </div>
//                     ) : isError ? (
//                         <div className="flex flex-col items-center gap-3 py-8">
//                             <p className="text-sm text-muted-foreground">
//                                 Failed to load blocked users.
//                             </p>
//                             <Button variant="outline" onClick={() => refetch()}>
//                                 Try again
//                             </Button>
//                         </div>
//                     ) : (
//                         <ScrollArea className="max-h-72">
//                             <div className="flex flex-col">
//                                 {filteredUsers.map((user) => (
//                                     <div
//                                         key={user.username}
//                                         dir="ltr"
//                                         className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
//                                     >
//                                         <Avatar className="size-10 shrink-0">
//                                             <AvatarFallback>
//                                                 {user.displayName?.charAt(0).toUpperCase() ||
//                                                     user.username.charAt(0).toUpperCase()}
//                                             </AvatarFallback>
//                                         </Avatar>

//                                         <div className="min-w-0 flex-1 text-left">
//                                             <p className="truncate text-sm font-medium">
//                                                 {user.displayName || user.username}
//                                             </p>
//                                             <p className="truncate text-xs text-muted-foreground">
//                                                 @{user.username}
//                                             </p>
//                                         </div>

//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             disabled={
//                                                 unblockMutation.isPending &&
//                                                 unblockMutation.variables === user.username
//                                             }
//                                             onClick={() => unblockMutation.mutate(user.username)}
//                                         >
//                                             {unblockMutation.isPending &&
//                                                 unblockMutation.variables === user.username ? (
//                                                 <LoaderCircle className="size-4 animate-spin" />
//                                             ) : (
//                                                 <UserRoundCheck className="size-4" />
//                                             )}
//                                             Unblock
//                                         </Button>
//                                     </div>
//                                 ))}
//                             </div>
//                         </ScrollArea>
//                     )}
//                     {unblockMutation.isError && (
//                         <p role="alert" className="text-sm text-destructive">
//                             Failed to unblock user. Please try again.
//                         </p>
//                     )}
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }
