import AvatarPicker from "@/components/avatar-picker/AvatarPicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import type { User } from "@/services/backend";
import * as backend from "@/services/backend";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";


export default function EditUserProfile(props: { user: User | null | undefined }) {
    const [isOpen, setIsOpen] = useState(false);
    const [nameError, setNameError] = useState("");
    const mediaUrl = useMediaUrl(props.user?.avatarUri);
    const fullName = props.user?.displayName.split(" ") ?? "";
    const firstName = fullName[0];
    const lastName = fullName[1] ?? "";

    function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const firstName = String(formData.get("firstName") ?? "").trim();
        const lastName = String(formData.get("lastName") ?? "").trim();
        const removeAvatar = String(formData.get("removeAvatar"));
        if (!firstName && !lastName) {
            setNameError("Enter a first name or a last name.");
            return;
        }
        const avatar = formData.get("avatar");

        const avatarFile: File | undefined | null = removeAvatar === "true" ? null :
            (avatar instanceof File) && avatar.name !== ""
                ? avatar
                : undefined;

        setNameError("");
        editProfileMutation.mutate({ firstName, avatar: avatarFile, lastName });
    }

    const editProfileMutation = useMutation({
        mutationFn: async (params: { firstName: string, avatar: File | undefined | null, lastName: string }) => {
            let displayName = undefined;
            let mxcUri = undefined;
            if (params.firstName != firstName || params.lastName != lastName) {
                displayName = params.firstName.concat(" " + params.lastName)
            }
            if (params.avatar !== undefined) {
                if (params.avatar != null) {
                    mxcUri = await backend.uploadAvatar(params.avatar);
                } else {
                    mxcUri = "";
                }
            }
            await backend.updateUserProfile({ displayName: displayName, avatarUrl: mxcUri });
        },
        onSuccess: () => {
            setIsOpen(false);
        },
        onError: (err) => {
            toast(normalizeError(err).message);
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={(shouldOpen) => {
            setIsOpen(shouldOpen);
        }}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you&apos;re
                        done.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Field className="items-center *:w-auto!">
                            <AvatarPicker initialAvatar={mediaUrl} />
                        </Field>
                        <Field data-invalid={!!nameError}>
                            <label htmlFor="firstName">First Name</label>
                            <Input
                                id="firstName"
                                name="firstName"
                                defaultValue={firstName}
                                aria-invalid={!!nameError}
                                aria-describedby={nameError ? "name-error" : undefined}
                            />
                            {nameError && <FieldError id="name-error">{nameError}</FieldError>}
                        </Field>
                        <Field>
                            <label htmlFor="lastName">Last Name</label>
                            <Input id="lastName" name="lastName" defaultValue={lastName} />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-5">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={editProfileMutation.isPending}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={editProfileMutation.isPending}>Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}