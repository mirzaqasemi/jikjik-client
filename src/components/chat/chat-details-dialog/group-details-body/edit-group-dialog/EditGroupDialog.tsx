import RoomDetailsFields from "@/components/room-details-fields/RoomDetailsFields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as backend from "@/services/backend";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export type RoomFormLabel = {
    title: string,
    description: string,
}

export type RoomFormDetails = {
    title: string,
    description: string,
    avatar: string,
}

type Props = {
    open: boolean,
    onCloseRequest: () => void,
}

export default function EditGroupDialog(props: Props) {
    const params = useParams<{ chatId: string }>();
    if (params.chatId === undefined) {
        throw new Error("Missing chatId");
    }
    const chatId = params.chatId;

    const roomFormLabel: RoomFormLabel = {
        title: "Group name",
        description: "Description (optional)"
    }


    function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title")).trim();
        const avatar = String(formData.get("avatar"));
        const description = String(formData.get("description"));
        editGroupMutation.mutate({ title, avatar, description });
    }

    const editGroupMutation = useMutation({
        mutationFn: (params: RoomFormDetails) => {
            return backend.updateGroupName(chatId, params.title);
        },
        onSuccess: () => {
            props.onCloseRequest();
        },
        onError: (err) => {
            toast(normalizeError(err).message);
        }
    });


    return (
        <Dialog open={props.open} onOpenChange={() => {
            if (!open && !editGroupMutation.isPending) {
                props.onCloseRequest();
            }
        }}>
            <DialogHeader>
                <DialogTitle ></DialogTitle>
                <DialogDescription />
            </DialogHeader>
            <DialogContent showCloseButton={false} className="max-w-full md:max-w-94!">
                <form className="w-full items-center" onSubmit={handleSubmit}>

                    <RoomDetailsFields formTitle="Edit group" formLabel={roomFormLabel} />

                    <DialogFooter className="grid grid-cols-4">
                        <DialogClose asChild className="col-start-3">
                            <Button variant="outline" onClick={() => props.onCloseRequest()}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" className="col-start-4">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}