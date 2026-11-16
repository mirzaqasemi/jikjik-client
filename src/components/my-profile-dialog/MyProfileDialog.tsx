import * as backend from '@/services/backend.ts';
import { Pencil, X } from "lucide-react";
import { useRef, useState } from 'react';
import AvatarDialogHeader from "../avatar-dialog-header/AvatarDialogHeader";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import EditUserProfileForm from "../user-profile-body/edit-user-profile-form/EditUserProfileForm";
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
    const titleRef = useRef<HTMLHeadingElement>(null);

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
                <DialogContent
                    className="sm:max-w-sm gap-6"
                    showCloseButton={false}
                    onOpenAutoFocus={(event) => {
                        const title = titleRef.current;
                        if (!title) return;

                        event.preventDefault();
                        title.focus({ preventScroll: true });
                    }}
                >
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
                        <>
                            <DialogHeader className="mt-6">
                                <DialogTitle tabIndex={-1} className="outline-none">Edit profile</DialogTitle>
                                <DialogDescription>
                                    Make changes to your profile here. Click save when you&apos;re
                                    done.
                                </DialogDescription>
                            </DialogHeader>

                            <EditUserProfileForm user={props.user} onCloseRequest={() => setIsEditing(false)} />
                        </>
                        :
                        <>
                            <AvatarDialogHeader
                                title={props.user?.displayName || "My Profile"}
                                ref={titleRef}
                                titleTabIndex={-1}
                                description="Last seen recently"
                                avatarUri={props.user?.avatarUri}
                            />
                            <UserProfileInfo user={props.user} />
                        </>
                    }
                </DialogContent>
            </Dialog>
        </>
    );
}
