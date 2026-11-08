import RoomDetailsFields from "@/components/room-details-fields/RoomDetailsFields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RoomFormDetails, RoomFormLabel } from "@/models/room-form";
import * as backend from "@/services/backend";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { useParams, useRevalidator } from "react-router-dom";
import { toast } from "sonner";

type Props = {
    open: boolean,
    onCloseRequest: () => void,
    chat: backend.Chat
}

export default function EditGroupDialog(props: Props) {
    const shouldRevalidateOnClose = useRef(false);
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
            shouldRevalidateOnClose.current = true;
            props.onCloseRequest();
        },
        onError: (err) => {
            toast(normalizeError(err).message);
        }
    });

    return (
        <Dialog open={props.open} onOpenChange={(nextOpen) => {
            if (!nextOpen && !editGroupMutation.isPending) {
                props.onCloseRequest();
            }
        }}>
            <DialogHeader />
            <DialogContent
                slot="edit-group-dialog"
                onCloseAutoFocus={() => {
                    if (!shouldRevalidateOnClose.current) return;
                    shouldRevalidateOnClose.current = false;
                    revalidator.revalidate();
                }}
                showCloseButton={false}
                className=" max-w-sm md:max-w-100!">
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
                        <Button
                            type="button"
                            disabled={editGroupMutation.isPending}
                            className="col-start-3"
                            variant="outline"
                            onClick={() => props.onCloseRequest()}>Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={editGroupMutation.isPending}
                            className="col-start-4">Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}