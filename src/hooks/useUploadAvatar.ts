import { useMutation } from "@tanstack/react-query";
import * as backend from "@/services/backend";

export function useUploadAvatar() {
    return useMutation({
        mutationFn: async (file: File) => {
            const avatarUrl = await backend.uploadAvatar(file);
            return backend.setUserAvatar(avatarUrl);
        },
    });
}