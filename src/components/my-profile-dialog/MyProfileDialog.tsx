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
import EditUserProfile from "../user-profile-body/edit-user-profile/EditUserProfile";

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
                        <EditUserProfile user={props.user}/>
                      
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