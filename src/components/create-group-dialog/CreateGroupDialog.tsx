import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";
import * as backend from '@/services/backend';
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../ui/spinner";
import AddMembers from "./add-members/AddMembers";
import TitleAndAvatar from "./title-and-avatar/TitleAndAvatar";

export type Step = "title" | "members";
type GroupInfo = {
    title: string,
    avatar: string,
}

type Params = {
    // onCloseRequest is called to request closing the dialog,
    // which means, the open prop should be set to false
    onCloseRequest: () => void,
    open: boolean
}

export default function CreateGroupDialog(params: Params) {
    const [step, setStep] = useState<Step>("title");
    const [groupInfo, setGroupInfo] = useState<GroupInfo>({ title: "", avatar: "" });
    const navigate = useNavigate();

    const createGroupMutation = useMutation({
        mutationFn: async (params: { invitees: string[] }) => {
            return await backend.createRoom({ title: groupInfo.title, invitees: params.invitees })
        },
        onSuccess: (data) => {
            params.onCloseRequest();
            navigate(`/chats/${data.id}`);
            // setTimeout(() => setStep("title"), 1500);
        },
    });

    useEffect(() => {
        if (params.open) {
            setStep("title");
        }
    }, [params.open]);

    function createGroup(members: Map<string, backend.User>) {
        const userIds: string[] = [...members.values()].map((user) => user.userId);
        createGroupMutation.mutate({ invitees: userIds });
    }

    return (
        <>
            {/* onOpenChange is called when Radix itself requests an open-state change */}
            <Dialog open={params.open} onOpenChange={(open) => {
                if (!open && !createGroupMutation.isPending) {
                    //So change the open = {true} to open = {false} 
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
                        <TitleAndAvatar
                            onClose={() => setStep("title")}
                            onNext={(groupInfo) => {
                                setGroupInfo(groupInfo);
                                setStep("members");
                            }} />
                    }
                    {step === "members" &&
                        <AddMembers key="members"
                            onClose={() => { setStep("title") }}
                            onNext={createGroup} />
                    }
                </DialogContent>
            </Dialog>
        </>
    );
}