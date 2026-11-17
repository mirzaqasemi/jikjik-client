import MediaAvatar from "@/components/media-avatar/MediaAvatar";
import {
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import type { Ref } from "react";

type Props = {
    title: string | undefined;
    ref?: Ref<HTMLHeadingElement>;
    titleTabIndex?: number;
    avatarUri: string | undefined | null;
    description: string;
}

export default function AvatarDialogHeader({ ref, titleTabIndex, ...props }: Props) {
    return (
        <DialogHeader className="flex justify-center items-center">
            <MediaAvatar avatarUri={props.avatarUri} size="size-20">
            </MediaAvatar>
            <DialogTitle
                ref={ref}
                tabIndex={titleTabIndex}
                className={titleTabIndex === -1 ? "outline-none" : undefined}
            >
                {props.title}
            </DialogTitle>
            <DialogDescription>
                {props.description}
            </DialogDescription>
        </DialogHeader>
    );
}
