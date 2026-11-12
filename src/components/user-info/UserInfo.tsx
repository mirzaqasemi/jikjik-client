import MediaAvatar from "../media-avatar/MediaAvatar";
import { Avatar, AvatarFallback } from "../ui/avatar";
import * as backend from "@/services/backend";

type Props = {
    user: backend.User;
    title: string;
    description: string
}

export default function UserInfo(props: Props) {

    return (
        <>
            <MediaAvatar avatarUrl={props.user.avatarUri} size="size-10" name={props.user.displayName}/>

            <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">
                    {props.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {props.description}
                </p>
            </div>
        </>
    );
}