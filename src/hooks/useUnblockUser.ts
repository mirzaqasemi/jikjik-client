import { useMutation } from "@tanstack/react-query";
import * as backend from "@/services/backend";

export function useUnblockUser() {
    return useMutation({
        mutationFn: (userId: string) => backend.unblockUser(userId),
        
        onError: (err) => {
            console.error("failed to unblock this user", err.message);
        }
    });
}