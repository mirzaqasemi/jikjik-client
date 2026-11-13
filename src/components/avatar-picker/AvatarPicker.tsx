import { Camera, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function AvatarPicker(props: { initialAvatar: string | undefined }) {
    const [selectedFile, setSelectedFile] = useState<File | undefined | null>(undefined);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
    const hasAvatar = props.initialAvatar ? true : false;
    const inputRef = useRef<HTMLInputElement>(null);
    const inputId = useId();
    const removeAvatar = selectedFile === null;
    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(undefined);
            return;
        }
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        }
    }, [selectedFile]);

    return (
        <div className="flex flex-col items-center gap-2 shrink-0">
            <label
                htmlFor={inputId}
                className="group relative inline-block size-20 cursor-pointer"
            >
                <Avatar className="size-full">
                    <AvatarImage src={selectedFile === null ? undefined : previewUrl ?? props.initialAvatar} />
                    <input
                        type="hidden"
                        name="removeAvatar"
                        value={removeAvatar ? "true" : "false"}
                    />
                    <AvatarFallback className="bg-muted">
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
                    setSelectedFile(file ?? undefined);
                }}
            />
            <Button
                type="button"
                variant="ghost"
                disabled={!hasAvatar}
                size="sm"
                onClick={() => {
                    setSelectedFile(null);
                    inputRef.current!.value = "";
                }}
                className="text-xs hover:bg-transparent text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="size-3.5" />
                Remove photo
            </Button>
        </div>
    );
}