import GroupMemberSelector from "@/components/group-member-selector/GroupMemberSelector";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import * as backend from "@/services/backend";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

type Params = {
    open: boolean,
    setOpenDialog: (open: boolean) => void,
    currentMembers: backend.User[],
}

export default function AddGroupMembersDialog(params: Params) {
    const [selectedMembers, setSelectedMembers] = useState<Map<string, backend.User>>(new Map());
    const urlParams = useParams();
    if (urlParams.chatId === undefined) {
        throw new Error("Missing chatId");
    }
    const chatId = urlParams.chatId;

    const addMembersMutation = useMutation({
        mutationFn: async (params: { invitees: string[] }) => {
            return await backend.inviteUsers(chatId, params.invitees);
        },
        onSuccess: () => {
            toast("Invitations sent successfully");
            params.setOpenDialog(false);

        },
        onError: (error) => {
            toast(normalizeError(error).message);
        }
    });

    function createGroup(members: Map<string, backend.User>) {
        const userIds: string[] = [...members.values()].map((user) => user.userId);
        addMembersMutation.mutate({ invitees: userIds });
    }
    function handleCloseRequest() {
        if (!addMembersMutation.isPending) {
            const emptySelectedMembers = new Map();
            setSelectedMembers(emptySelectedMembers);
            params.setOpenDialog(false);
        }
    }

    return (
        <>
            <Dialog open={params.open} onOpenChange={(open) => {
                if (!open) {
                    handleCloseRequest();
                }
            }}>
                <DialogContent showCloseButton={false} className="max-w-full md:max-w-94!">
                    <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
                        <GroupMemberSelector key="members"
                            selectedMembers={selectedMembers}
                            onSelectionChange={setSelectedMembers}
                            currentMembers={params.currentMembers}
                        />
                    </div>
                    <DialogFooter className="grow-0 grid grid-cols-4">
                        <Button className="col-start-3" variant="outline" disabled={addMembersMutation.isPending} onClick={handleCloseRequest}>Cancel</Button>
                        <Button
                            type="submit"
                            className="col-start-4"
                            onClick={() => createGroup(selectedMembers)}>
                            {addMembersMutation.isPending ?
                                <Spinner data-icon="inline-start" />
                                : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}