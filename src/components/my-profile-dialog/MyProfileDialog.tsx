import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as backend from '@/services/backend.ts';
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import AvatarDialogHeader from "../avatar-dialog-header/AvatarDialogHeader";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import UserProfileInfo from "../user-profile-body/UserProfileInfo";
import { useState } from "react";

type Props = {
    // onCloseRequest is called to request closing the dialog,
    // which means, the open prop should be set to false
    onCloseRequest: () => void;
    open: boolean;
    user: backend.User | null | undefined;
}

export default function MyProfileDialog(props: Props) {
    const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
    const setProfileMutation = useMutation({
        mutationFn: async (params: { file: File | undefined }) => {
            if (params.file !== undefined && params.file.name !== '') {
                const mxcUri = await backend.uploadAvatar(params.file);
                await backend.setUserAvatar(mxcUri);
            }
        },
        onError: (err) => {
            toast(normalizeError(err).message);
        }
    });
    return (
        <>
            <Dialog
                open={props.open}
                onOpenChange={(isOpen) => {
                    if (!isOpen) props.onCloseRequest();
                }}>
                <DialogContent className="sm:max-w-sm" showCloseButton={false}>
                    <div className="flex absolute top-4 right-4 gap-3">
                        <label htmlFor="my-profile-avatar"
                            className={cn(
                                buttonVariants({
                                    variant: "ghost",
                                    size: "icon",
                                }),
                                "rounded-full cursor-pointer"
                            )}>
                            <Pencil className="size-4" />
                        </label>
                        <Input
                            id="my-profile-avatar"
                            type="file"
                            name="profile"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                                const file = e.currentTarget.files?.[0];
                                setProfileMutation.mutate({ file });
                            }}
                        />
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                aria-label="Close dialog"
                            >
                                <X className="size-4" />
                            </Button>
                        </DialogClose>
                    </div>
                    <AvatarDialogHeader title={props.user?.displayName} description="Last seen recently" avatarUri={props.user?.avatarUri} />
                    
                    <UserProfileInfo
                        user={props.user}
                        onEditDisplayName={() => setIsEditingDisplayName(true)}
                    />
                    
                </DialogContent>
            </Dialog>
        </>
    );
}