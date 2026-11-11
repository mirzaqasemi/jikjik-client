import { useMediaUrl } from "@/hooks/useMediaUrl";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { ReactNode } from "react";

type Props = {
    avatarUrl: string | null | undefined;
    children?: ReactNode;
    size: `size-${number}`;
    name?: string;
};

export default function MediaAvatar(props: Props) {
    const initial = props.name?.trim().at(0)?.toLocaleUpperCase() ?? "J";

    return (
        <div className={`relative shrink-0 ${props.size ?? "size-10"}`}>
            <Avatar className="size-full rounded-full object-cover">
                <AvatarImage src={useMediaUrl(props.avatarUrl)} />
                <AvatarFallback>
                    {initial}
                </AvatarFallback>
            </Avatar>
            {props.children}
        </div>
    );
}
