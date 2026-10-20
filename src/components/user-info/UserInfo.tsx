import { Avatar, AvatarFallback } from "../ui/avatar";
import * as backend from "@/services/backend";

type Params = {
    user: backend.User;
    title: string;
    description: string
}

export default function UserInfo(params: Params) {

    return (
        <>
            <Avatar className="size-10 shrink-0">
                <AvatarFallback>
                    {params.user.displayName?.charAt(0).toUpperCase() ||
                        params.user.userId.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">
                    {params.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {params.description}
                </p>
            </div>
        </>
    );
}