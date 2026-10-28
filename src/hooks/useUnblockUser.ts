import * as backend from "@/services/backend";
import * as session from '@/services/session.ts';
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUnblockUser() {    
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => backend.unblockUser(userId),
        onSuccess: (_data, userId) => {
            //setQueryData causes cache updates without fetching
            queryClient.setQueryData(["isUserBlocked", userId], false);
            queryClient.invalidateQueries({
                queryKey: ["blockedUsers", session.getUser()?.userId]
            })
        }
    });
}