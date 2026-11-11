import MediaAvatar from "@/components/media-avatar/MediaAvatar";
import {
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
type Props = {
    title: string | undefined;
    avatarUrl: string | undefined | null;
    description: string;
}

export default function ChatDetailsHeader(props: Props) {
    return (
        <DialogHeader className="flex justify-center items-center pb-2">
            <MediaAvatar avatarUrl={props.avatarUrl} size="size-20">
            </MediaAvatar>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogDescription>
                {props.description}
            </DialogDescription>
        </DialogHeader>

    );
}