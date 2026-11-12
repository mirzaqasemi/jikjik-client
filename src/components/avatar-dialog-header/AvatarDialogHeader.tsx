import MediaAvatar from "@/components/media-avatar/MediaAvatar";
import {
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
type Props = {
    title: string | undefined;
    avatarUri: string | undefined | null;
    description: string;
}

export default function AvatarDialogHeader(props: Props) {
    return (
        <DialogHeader className="flex justify-center items-center pb-2">
            <MediaAvatar avatarUri={props.avatarUri} size="size-20">
            </MediaAvatar>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogDescription>
                {props.description}
            </DialogDescription>
        </DialogHeader>
    );
}