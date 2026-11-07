import RoomDetailsFields from "@/components/room-details-fields/RoomDetailsFields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RoomFormDetails, RoomFormLabel } from "@/models/room-form";
import * as backend from "@/services/backend";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { useParams, useRevalidator } from "react-router-dom";
import { toast } from "sonner";

type Props = {
    open: boolean,
    onCloseRequest: () => void,
    chat: backend.Chat
}

export default function EditGroupDialog(props: Props) {
    const revalidator = useRevalidator();
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
        console.log(event);

        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title")).trim();
        const avatar = formData.get("avatar");
        const avatarFile = (avatar instanceof File) ? avatar : undefined;
        const description = String(formData.get("description"));
        editGroupMutation.mutate({ title, avatar: avatarFile, description })
    }

    const editGroupMutation = useMutation({
        mutationFn: async (params: RoomFormDetails) => {
            const currentGroupName = props.chat.title;
            const currentGroupDescription = props.chat.topic ?? "";
            if (params.title != currentGroupName) {
                await backend.updateGroupName(chatId, params.title);
            }
            if (params.description !== undefined && params.description != currentGroupDescription) {
                await backend.updateGroupDescription(chatId, params.description);
            }
            if (params.avatar !== undefined) {
                const avatarUrl = await backend.uploadAvatar(params.avatar);
                await backend.setGroupAvatar(chatId, avatarUrl);
            }
        },
        onSuccess: () => {
            props.onCloseRequest();
            revalidator.revalidate();
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
            <DialogHeader />
            <DialogContent slot="edit-group-dialog" showCloseButton={false} className="max-w-full md:max-w-94!">
                <DialogTitle />
                <form className="w-full items-center" onSubmit={handleSubmit}>

                    <RoomDetailsFields
                        formTitle="Edit group"
                        formLabel={roomFormLabel}
                        initialValues={{
                            title: props.chat.title,
                            description: props.chat.topic,
                            avatar: props.chat.avatarUrl
                        }} />

                    <DialogFooter className="grid grid-cols-4 mt-5">
                        <Button className="col-start-3" variant="outline" onClick={() => props.onCloseRequest()}>Cancel</Button>
                        <Button type="submit" className="col-start-4">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}