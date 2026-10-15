import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
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
        <DialogHeader className="flex justify-center items-center">
            <Avatar className="size-20">
                <AvatarImage
                    src={"https://github.com/shadcn.png"}
                    alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogDescription>
                {props.description}
            </DialogDescription>
        </DialogHeader>

    );
}