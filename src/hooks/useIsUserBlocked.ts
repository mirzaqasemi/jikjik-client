import { useQuery } from "@tanstack/react-query";
import * as backend from "@/services/backend";

export function useIsUserBlocked(userId?: string) {
    // useQuery subscribes to the Query changes
    return useQuery({
        queryKey: ["isUserBlocked", userId],
        queryFn: async () => backend.isUserBlocked(userId!),
        enabled: !!userId, // if userId != undefined run this query
    });
}