import { useMediaUrl } from "@/hooks/useMediaUrl";
import type { RoomFormLabel } from "@/models/room-form";
import { useState } from "react";
import AvatarPicker from "../avatar-picker/AvatarPicker";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type Props = {
    formTitle?: string;
    formLabel?: RoomFormLabel,
    initialValues?: {
        title?: string,
        description?: string,
        avatar?: string | null // string: avatar URL // null: explicitly set to no avatar // undefined: no avatar value was provided
    },
}

export default function RoomDetailsFields(props: Props) {
    const mediaUrl = useMediaUrl(props.initialValues?.avatar);
    const [description, setDescription] = useState(props.initialValues?.description ?? "");

    return (
        <FieldSet>
            <FieldLegend>{props.formTitle}</FieldLegend>
            <FieldDescription className="sr-only"></FieldDescription>
            <FieldGroup>
                {/* Group/Channel avatar */}
                <Field className="w-auto shrink-0">
                    <AvatarPicker initialAvatar={mediaUrl} sizeClassName="max-lg:size-16" />
                </Field>

                {/* Group/Channel name */}
                <Field className="min-w-0 flex-1">
                    <FieldLabel htmlFor="title" className="text-muted-foreground">{props.formLabel?.title}</FieldLabel>
                    <Input
                        id="title"
                        name="title"
                        type="text"
                        placeholder="" required
                        defaultValue={props.initialValues?.title ?? ""}
                        className="text-sm"
                    />
                </Field>
                {/* Optional description */}
                <Field>
                    <Textarea
                        id="description"
                        name="description"
                        defaultValue={props.initialValues?.description ?? ""}
                        placeholder={props.formLabel?.description}
                        maxLength={200}
                        onChange={(e) => setDescription(e.target.value)}
                        className="placeholder:text-muted-foreground max-h-40 overflow-y-auto placeholder:text-xs! text-sm placeholder:font-light"
                    />
                    <p className="w-full text-end -mt-0.5 text-xs font-light text-muted-foreground">{description.length} / 200</p>
                </Field>

            </FieldGroup>
        </FieldSet>
    );
}