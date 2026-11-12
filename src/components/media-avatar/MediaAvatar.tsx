import { useMediaUrl } from "@/hooks/useMediaUrl";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { ReactNode } from "react";

type Props = {
    // avatar uri comming from backend (mxc or http, based on backend method)
    avatarUri: string | null | undefined;
    children?: ReactNode;
    size: `size-${number}`;
    name?: string;
};

export default function MediaAvatar(props: Props) {
    const initial = props.name?.trim().at(0)?.toLocaleUpperCase() ?? "J";
    const url = useMediaUrl(props.avatarUri);
    return (
        <div className={`relative shrink-0 ${props.size ?? "size-10"}`}>
            <Avatar className="size-full rounded-full object-cover">
                <AvatarImage src={url} />
                <AvatarFallback>
                    {initial}
                </AvatarFallback>
            </Avatar>
            {props.children}
        </div>
    );
}
