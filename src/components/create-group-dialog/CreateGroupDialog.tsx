import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";
import * as backend from '@/services/backend';
import { useMutation } from "@tanstack/react-query";
import { Preset } from "matrix-js-sdk";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../ui/spinner";
import GroupDetailsStep from "./group-details-step/GroupDetailsStep";
import GroupMembersStep from "./group-members-step/GroupMembersStep";
import { normalizeError } from "@/utilities/normalized-error";
import { toast } from "sonner";
import { CHATS_ROUTE } from "@/router";

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
    const [step, setStep] = useState<Step>("title");
    const [groupDetails, setGroupDetails] = useState<GroupDetails>({ title: "", avatar: "", preset: Preset.PrivateChat });
    const navigate = useNavigate();

    const createGroupMutation = useMutation({
        mutationFn: async (params: { invitees: string[] }) => {
            if (groupDetails === undefined) {
                throw new Error("Group information should not be undefined");
            }
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
                        <GroupMembersStep key="members"
                            onBack={() => setStep("title")}
                            onNext={createGroup} />
                    }
                </DialogContent>
            </Dialog>
        </>
    );
}