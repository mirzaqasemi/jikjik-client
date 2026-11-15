import { useEffect, useState } from "react";
import * as backend from "@/services/backend";

export function useMediaUrl(mediaUri: string | null | undefined) {
    const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
    
    useEffect(() => {
        const loadMedia = async () => {
            if (!mediaUri) setMediaUrl(undefined);
            else setMediaUrl(await backend.resolveMediaUrl(mediaUri) ?? undefined);
        }
        loadMedia();
    },[mediaUri]);
    return mediaUrl;
}