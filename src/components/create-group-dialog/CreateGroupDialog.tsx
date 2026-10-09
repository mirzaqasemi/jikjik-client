import {
    Dialog,
    DialogContent,
    DialogFooter
} from "@/components/ui/dialog";
import { CHATS_ROUTE } from "@/router";
import * as backend from '@/services/backend';
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { Preset } from "matrix-js-sdk";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import GroupMemberSelector from "../group-member-selector/GroupMemberSelector";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import GroupDetailsStep from "./group-details-step/GroupDetailsStep";

export type Step = "title" | "members";
export type GroupDetails = {
    title: string,
    avatar: string,
    preset: Preset
}

type Params = {
    // onCloseRequest is called to request closing the dialog,
    // which means, the open prop should be set to false
    onCloseRequest: () => void,
    open: boolean
}

export default function CreateGroupDialog(params: Params) {
    const [selectedMembers, setSelectedMembers] = useState<Map<string, backend.User>>(new Map());
    const [step, setStep] = useState<Step>("title");
    const [groupDetails, setGroupDetails] = useState<GroupDetails>({ title: "", avatar: "", preset: Preset.PrivateChat });
    const navigate = useNavigate();

    const createGroupMutation = useMutation({
        mutationFn: async (params: { invitees: string[] }) => {
            return await backend.createRoom({ title: groupDetails.title, invitees: params.invitees, preset: groupDetails.preset })
        },
        onSuccess: (data) => {
            params.onCloseRequest();
            navigate(`/chats/${data.id}`);
        },
        onError: (error) => {
            navigate(CHATS_ROUTE);
            toast(normalizeError(error).message);
        },
    });

    function createGroup(members: Map<string, backend.User>) {
        const userIds: string[] = [...members.values()].map((user) => user.userId);
        createGroupMutation.mutate({ invitees: userIds });
    }

    function handleBack() {
        setStep("title");
        const emptySelectedMembers = new Map();
        setSelectedMembers(emptySelectedMembers);
    }

    return (
        <>
            {/* onOpenChange is called when Radix itself requests an open-state change */}
            <Dialog open={params.open} onOpenChange={(open) => {
                if (!open && !createGroupMutation.isPending) {
                    //So change the open = {true} (open property in Dialog) to open = {false} 
                    params.onCloseRequest();
                }
            }}>
                <DialogContent className="sm:max-w-md rounded-2xl gap-0" showCloseButton={false}>
                    {createGroupMutation.isPending &&
                        <div className="flex h-full w-full items-center justify-center bg-black/15 absolute z-20">
                            <Spinner className="size-8" />
                        </div>
                    }
                    {step === "title" &&
                        <GroupDetailsStep
                            groupDetails={groupDetails}
                            onNext={(groupDetails) => {
                                setGroupDetails(groupDetails);
                                setStep("members");
                            }} />
                    }
                    {step === "members" &&
                        <>
                            <GroupMemberSelector key="members"
                                selectedMembers={selectedMembers}
                                onSelectionChange={setSelectedMembers}
                            />
                            {/* Footer */}
                            <DialogFooter className="grow-0 grid grid-cols-4">
                                <Button className="col-start-3" variant="outline" onClick={handleBack}>Back</Button>
                                <Button type="submit" className="col-start-4" onClick={() => createGroup(selectedMembers)}>Create</Button>
                            </DialogFooter>
                        </>
                    }
                </DialogContent>
            </Dialog>
        </>
    );
}