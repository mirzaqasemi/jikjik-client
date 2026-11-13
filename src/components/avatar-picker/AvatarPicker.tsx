import { Camera } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";

export default function AvatarPicker(props: { initialAvatar: string | undefined }) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
    const inputId = useId();

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
        <>
            <label
                htmlFor={inputId}
                className="group relative inline-block size-20 cursor-pointer"
            >
                <Avatar className="size-full">
                    <AvatarImage src={previewUrl ?? props.initialAvatar} />
                    <AvatarFallback className="bg-chart-3" />
                </Avatar>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-6 text-white" />
                </div>
            </label>

            <Input
                id={inputId}
                type="file"
                name="avatar"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    setSelectedFile(file ?? null);
                }}
            />
        </>
    );
}