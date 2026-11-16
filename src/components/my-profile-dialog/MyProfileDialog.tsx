import * as backend from '@/services/backend.ts';
import { Pencil, X } from "lucide-react";
import { useState } from 'react';
import AvatarDialogHeader from "../avatar-dialog-header/AvatarDialogHeader";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent } from "../ui/dialog";
import EditUserProfile from "../user-profile-body/edit-user-profile/EditUserProfile";
import UserProfileInfo from "../user-profile-body/UserProfileInfo";

type Props = {
    // onCloseRequest is called to request closing the dialog,
    // which means, the open prop should be set to false
    onCloseRequest: () => void;
    open: boolean;
    user: backend.User | null | undefined;
}

export default function MyProfileDialog(props: Props) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <>
            <Dialog
                open={props.open}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        props.onCloseRequest();
                        setIsEditing(false);
                    }
                }}>
                <DialogContent className="sm:max-w-sm gap-6" showCloseButton={false}>
                    <div className="flex absolute top-4 right-4 gap-3 mb-4">
                        {!isEditing &&
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsEditing(true)}>
                                    <Pencil className="size-4" />
                                </Button>
                                <DialogClose asChild>
                                    <Button
                                        type='button'
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full"
                                        aria-label="Close dialog"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </DialogClose>
                            </>
                        }

                    </div>
                    {isEditing ?
                        <EditUserProfile user={props.user} onCloseRequest={() => setIsEditing(false)} />
                        :
                        <>
                            <AvatarDialogHeader title={props.user?.displayName} description="Last seen recently" avatarUri={props.user?.avatarUri} />
                            <UserProfileInfo user={props.user} />
                        </>
                    }
                </DialogContent>
            </Dialog>
        </>
    );
}