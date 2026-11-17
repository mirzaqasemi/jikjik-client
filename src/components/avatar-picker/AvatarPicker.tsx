import { Camera, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

// previewUrl states:
// undefined: No new file is selected. Show the initial avatar if it exists.
// null: The user clicked "Remove photo". Hide the avatar and mark it for removal.
// string: A new file is selected. Show its object URL as the preview.

type Props = {
    initialAvatar: string | undefined;
    sizeClassName?: string;
}

export default function AvatarPicker(props: Props) {
    const [previewUrl, setPreviewUrl] = useState<string | undefined | null>(undefined);
    const hasInitialAvatar = props.initialAvatar ? true : false;
    const inputRef = useRef<HTMLInputElement>(null);
    const inputId = useId();
    const removeAvatar = previewUrl === null;

    function handleRemoveAvatar() {
        setPreviewUrl(typeof previewUrl === "string" ? undefined : null);
        inputRef.current!.value = "";
    }

    useEffect(() => {
        if (!previewUrl) return;

        return () => {
            URL.revokeObjectURL(previewUrl);
        }
    }, [previewUrl]);

    return (
        <div className="flex flex-col items-center gap-2 shrink-0">
            <label
                htmlFor={inputId}
                className={`group relative inline-block lg:size-20 cursor-pointer ${props.sizeClassName ?? "size-20"}`}
            >
                <Avatar className="size-full">
                    <AvatarImage src={previewUrl === null ? undefined : previewUrl ?? props.initialAvatar} className="size-full object-cover" />
                    <input
                        type="hidden"
                        name="removeAvatar"
                        value={removeAvatar ? "true" : "false"}
                    />
                    <AvatarFallback className="bg-muted size-full object-cover">
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-100">
                            <Camera className="size-6 text-white" />
                        </div>
                    </AvatarFallback>
                </Avatar>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-6 text-white" />
                </div>
            </label>

            <Input
                id={inputId}
                ref={inputRef}
                type="file"
                name="avatar"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    setPreviewUrl(file ? URL.createObjectURL(file) : undefined);
                }}
            />
            <Button
                type="button"
                variant="ghost"
                disabled={(previewUrl === null) || (previewUrl === undefined) && (!hasInitialAvatar)}
                size="sm"
                onClick={handleRemoveAvatar}
                className="h-fit mt-1.5 text-xs hover:bg-transparent text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="size-3.5" />
                Remove photo
            </Button>
        </div>
    );
}