import AvatarPicker from "@/components/avatar-picker/AvatarPicker";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import type { User } from "@/services/backend";
import * as backend from "@/services/backend";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
    user: User | null | undefined;
    onCloseRequest: () => void
}

export default function EditUserProfileForm(props: Props) {
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
            props.onCloseRequest();
        },
        onError: (err) => {
            toast(normalizeError(err).message);
        }
    });

    return (
        <>
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
                    <Button type="button" variant="outline" onClick={props.onCloseRequest} disabled={editProfileMutation.isPending}>Cancel</Button>
                    <Button type="submit" disabled={editProfileMutation.isPending}>Save</Button>
                </DialogFooter>
            </form>
        </>
    );

}