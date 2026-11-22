import RoomDetailsFields from "@/components/room-details-fields/RoomDetailsFields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RoomFormDetails, RoomFormLabel } from "@/models/room-form";
import * as backend from "@/services/backend";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

type Props = {
    open: boolean,
    onCloseRequest: () => void,
    chat: backend.Chat
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
        const description = String(formData.get("description"));
        const removeAvatar = String(formData.get("removeAvatar"));

        const avatar = formData.get("avatar");

        const avatarFile: File | undefined | null = removeAvatar === "true" ? null :
            (avatar instanceof File) && avatar.name !== ""
                ? avatar
                : undefined;

        editGroupMutation.mutate({ title, avatar: avatarFile, description })
    }

    const editGroupMutation = useMutation({
        mutationFn: async (params: RoomFormDetails) => {
            const currentGroupName = props.chat.title;
            const currentGroupDescription = props.chat.topic ?? "";
            let mxcUri = undefined;
            if (params.title != currentGroupName) {
                await backend.updateGroupName(chatId, params.title);
            }
            if (params.description !== undefined && params.description != currentGroupDescription) {
                await backend.updateGroupDescription(chatId, params.description);
            }
            if (params.avatar !== undefined) {
                if (params.avatar != null) {
                    mxcUri = await backend.uploadAvatar(params.avatar);
                } else {
                    mxcUri = "";
                }
                await backend.setGroupAvatar(chatId, mxcUri);
            }
        },
        onSuccess: () => {
            props.onCloseRequest();
        },
        onError: (err) => {
            toast(normalizeError(err).message);
        }
    });

    return (
        <Dialog open={props.open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && !editGroupMutation.isPending) {
                    props.onCloseRequest();
                }
            }}>
            <DialogHeader className="sr-only" />
            <DialogContent
                slot="edit-group-dialog"
                showCloseButton={false}
                className="max-w-xs md:max-w-100! max-lg:gap-3 max-h-[calc(100dvh-4rem)] overflow-y-auto"
            >
                <DialogTitle className="sr-only" />
                <DialogDescription className="sr-only" />
                <form className="w-full items-center" onSubmit={handleSubmit}>

                    <RoomDetailsFields
                        formTitle="Edit group"
                        formLabel={roomFormLabel}
                        initialValues={{
                            title: props.chat.title,
                            description: props.chat.topic,
                            avatar: props.chat.avatarUrl
                        }} />

                    <DialogFooter className="mt-5 flex-row justify-end">
                        <Button
                            type="button"
                            disabled={editGroupMutation.isPending}
                            variant="outline"
                            onClick={props.onCloseRequest}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={editGroupMutation.isPending}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}