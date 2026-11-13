import { useMediaUrl } from "@/hooks/useMediaUrl";
import type { RoomFormLabel } from "@/models/room-form";
import AvatarPicker from "../avatar-picker/AvatarPicker";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "../ui/field";
import { Input } from "../ui/input";

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

    return (
        <FieldSet>
            <FieldLegend>{props.formTitle}</FieldLegend>
            <FieldDescription></FieldDescription>
            <FieldGroup className="flex flex-row">
                {/* Group/Channel avatar */}
                <Field className="w-auto shrink-0">
                    <AvatarPicker initialAvatar={mediaUrl} />
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
                    />
                </Field>
            </FieldGroup>

            {/* Optional description */}
            <FieldGroup>
                <Field>
                    <Input
                        id="description"
                        name="description"
                        type="text"
                        placeholder={props.formLabel?.description}
                        defaultValue={props.initialValues?.description ?? ""}
                        className="placeholder:text-muted-foreground placeholder:font-light"
                    />
                </Field>

            </FieldGroup>
        </FieldSet>
    );
}