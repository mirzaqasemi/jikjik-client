import { Camera } from "lucide-react";
import type { RoomFormLabel } from "../chat/chat-details-dialog/group-details-body/edit-group-dialog/EditGroupDialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Field, FieldGroup, FieldLabel, FieldSet } from "../ui/field";
import { Input } from "../ui/input";

type Props = {
    formTitle?: string;
    formLabel?: RoomFormLabel,
}

export default function RoomDetailsFields(props: Props) {
    return (

        <FieldSet>
            <FieldGroup className="flex flex-row">
                {/* Group/Channel avatar */}
                <Field className="w-auto shrink-0">
                    <label htmlFor="group-avatar" className="cursor-pointer">
                        <Avatar className="size-18">
                            <AvatarImage />
                            <AvatarFallback className="bg-chart-3">
                                <Camera className="stroke-white" />
                            </AvatarFallback>
                        </Avatar>
                    </label>
                    <Input
                        id="group-avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                    />
                </Field>

                {/* Group/Channel name */}
                <Field className="min-w-0 flex-1">
                    <FieldLabel htmlFor="title">{props.formLabel?.title}</FieldLabel>
                    <Input id="title" name="title" type="text" placeholder="" required />
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
                        className="placeholder:text-ring placeholder:font-light border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    />
                </Field>

            </FieldGroup>
        </FieldSet>
    );
}